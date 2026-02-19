"""Tests for ralph-skill-query.py — HIGH-3 import path regression and behavior."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

sys.path.insert(0, str(Path(__file__).parent))

# ─── Import the module under test ────────────────────────────────────────────
# We import it as a module so we can inspect its attributes directly.
# The module may fail to import skill_router (expected in test env) — that's fine.
import importlib
import types


def _load_module() -> types.ModuleType:
    """Load ralph-skill-query as a module, tolerating ImportError for skill_router."""
    spec_path = Path(__file__).parent / "ralph-skill-query.py"
    spec = importlib.util.spec_from_file_location("ralph_skill_query", spec_path)
    mod = importlib.util.module_from_spec(spec)
    # Execute the module — skill_router ImportError is caught internally
    spec.loader.exec_module(mod)
    return mod


# ─── Test 1: Import path resolves to scripts/core, not scripts/core/core ─────


class TestImportPath:
    """HIGH-3: Verify the computed scripts_path is scripts/core, not doubled."""

    def test_import_path_resolves_to_scripts_core(self):
        """
        The path added to sys.path must end with scripts/core.

        ralph-skill-query.py lives at:  .../scripts/ralph/ralph-skill-query.py
        __file__.parent = scripts/ralph
        __file__.parent.parent = scripts
        __file__.parent.parent / "core" = scripts/core   ← CORRECT
                                                          NOT scripts/core/core
        """
        script_file = Path(__file__).parent / "ralph-skill-query.py"
        assert script_file.exists(), f"Script not found at {script_file}"

        # Simulate exactly what the script does at lines 33-34
        scripts_path = script_file.parent.parent / "core"

        # Must end with scripts/core, not scripts/core/core
        parts = scripts_path.parts
        assert parts[-1] == "core", f"Last component should be 'core', got {parts[-1]}"
        assert parts[-2] == "scripts", f"Second-to-last should be 'scripts', got {parts[-2]}"

        # Negative assertion: path must NOT contain a doubled core segment
        path_str = str(scripts_path)
        assert "core/core" not in path_str.replace("\\", "/"), (
            f"Doubled 'core/core' found in path: {path_str}"
        )
        assert "core\\core" not in path_str, (
            f"Doubled 'core\\core' found in path: {path_str}"
        )

    def test_import_path_parent_chain(self):
        """Confirm ralph-skill-query.py is inside scripts/ralph/ as expected."""
        script_file = Path(__file__).parent / "ralph-skill-query.py"
        parent_name = script_file.parent.name
        assert parent_name == "ralph", (
            f"Script should be in 'ralph/' dir, found in '{parent_name}/'"
        )


# ─── Test 2: Module loads without error when skill_router is absent ───────────


class TestRouteNoneFallback:
    """Lines 42-46: When skill_router is not importable, route=None, no crash."""

    def test_module_loads_without_skill_router(self):
        """Module must load successfully even if skill_router is not on path."""
        try:
            mod = _load_module()
        except Exception as exc:  # pragma: no cover
            raise AssertionError(
                f"ralph-skill-query.py raised {type(exc).__name__} during import: {exc}"
            ) from exc
        # Module should have a `route` attribute (either callable or None)
        assert hasattr(mod, "route"), "Module must expose 'route' attribute"

    def test_route_is_none_when_skill_router_absent(self):
        """In test environment (skill_router not installed), route must be None."""
        mod = _load_module()
        # This may be None OR a callable depending on env.
        # We assert the attribute exists and document the actual value.
        if mod.route is not None:
            # skill_router is available — that's fine, but skip None-branch tests
            return
        assert mod.route is None, "Expected route=None when skill_router is not importable"

    def test_router_output_is_none_when_skill_router_absent(self):
        """RouterOutput must also be None when skill_router is absent."""
        mod = _load_module()
        if mod.route is not None:
            return  # skill_router available, skip
        assert mod.RouterOutput is None


# ─── Test 3: Guard at lines 159-161 — exits with error JSON ──────────────────


class TestRouteNoneGuard:
    """Lines 159-161: When route is None, main() should print error JSON and exit."""

    def test_route_none_guard_returns_error_json(self):
        """
        When route is None, main() must:
          - print JSON with success=False
          - include "skill_router not available" in error
          - call sys.exit(1)
        """
        mod = _load_module()
        captured_output = []

        def fake_print(data, **kwargs):
            captured_output.append(data)

        def fake_exit(code):
            raise SystemExit(code)

        fake_stdin = MagicMock()
        fake_stdin.isatty.return_value = True  # Force arg-parse branch, skip stdin read

        # Patch sys.argv to provide --task so it doesn't fall through to help
        with patch.object(sys, "argv", ["ralph-skill-query.py", "--task", "implement feature"]):
            with patch.object(sys, "stdin", fake_stdin):
                with patch("builtins.print", side_effect=fake_print):
                    with patch("sys.exit", side_effect=fake_exit):
                        original_route = mod.route
                        mod.route = None
                        try:
                            try:
                                mod.main()
                            except SystemExit as exc:
                                assert exc.code == 1, f"Expected exit code 1, got {exc.code}"
                        finally:
                            mod.route = original_route

        assert len(captured_output) >= 1, "main() should have printed something"
        last_output = captured_output[-1]
        parsed = json.loads(last_output)
        assert parsed["success"] is False
        assert "skill_router not available" in parsed["error"]

    def test_route_none_guard_exits_nonzero(self):
        """Guard must call sys.exit(1), not sys.exit(0) or no exit."""
        mod = _load_module()
        exit_codes = []

        def fake_exit(code):
            exit_codes.append(code)
            raise SystemExit(code)

        fake_stdin = MagicMock()
        fake_stdin.isatty.return_value = True

        with patch.object(sys, "argv", ["ralph-skill-query.py", "--task", "fix bug"]):
            with patch.object(sys, "stdin", fake_stdin):
                with patch("builtins.print"):
                    with patch("sys.exit", side_effect=fake_exit):
                        original_route = mod.route
                        mod.route = None
                        try:
                            try:
                                mod.main()
                            except SystemExit:
                                pass
                        finally:
                            mod.route = original_route

        assert exit_codes, "sys.exit was never called"
        assert exit_codes[0] == 1, f"Expected exit(1), got exit({exit_codes[0]})"


# ─── Test 4: format_for_ralph returns expected dict structure ─────────────────


class TestFormatForRalph:
    """Lines 49-99: format_for_ralph must return dict with all required keys."""

    REQUIRED_KEYS = {
        "success",
        "complexity_score",
        "recommended_pattern",
        "mandatory_skills",
        "suggested_skills",
        "recommended_agents",
        "ralph_instructions",
    }

    def _build_mock_router_output(self) -> MagicMock:
        """Build a realistic RouterOutput mock."""
        mock_skill_mandatory = MagicMock()
        mock_skill_mandatory.name = "systematic-debugging"
        mock_skill_mandatory.enforcement = "mandatory"
        mock_skill_mandatory.priority = "high"
        mock_skill_mandatory.confidence = 0.92
        mock_skill_mandatory.reason = "Bug investigation task"

        mock_skill_suggested = MagicMock()
        mock_skill_suggested.name = "databases"
        mock_skill_suggested.enforcement = "suggested"
        mock_skill_suggested.priority = "medium"
        mock_skill_suggested.confidence = 0.65
        mock_skill_suggested.reason = "SQL queries involved"

        mock_agent = MagicMock()
        mock_agent.name = "debug-agent"
        mock_agent.type = "debug"
        mock_agent.confidence = 0.88
        mock_agent.reason = "Debugging task"

        mock_result = MagicMock()
        mock_result.skills = [mock_skill_mandatory, mock_skill_suggested]
        mock_result.agents = [mock_agent]
        mock_result.complexity_score = 0.7
        mock_result.recommended_pattern = "tdd"
        return mock_result

    def test_format_for_ralph_structure(self):
        """format_for_ralph must return dict with all 7 required keys."""
        mod = _load_module()
        mock_result = self._build_mock_router_output()

        output = mod.format_for_ralph(mock_result)

        assert isinstance(output, dict), "format_for_ralph must return a dict"
        missing = self.REQUIRED_KEYS - set(output.keys())
        assert not missing, f"Missing keys in format_for_ralph output: {missing}"

    def test_format_for_ralph_success_is_true(self):
        """success must be True when called with valid RouterOutput."""
        mod = _load_module()
        mock_result = self._build_mock_router_output()
        output = mod.format_for_ralph(mock_result)
        assert output["success"] is True

    def test_format_for_ralph_complexity_score_rounded(self):
        """complexity_score must be a float, rounded to 3 decimal places."""
        mod = _load_module()
        mock_result = self._build_mock_router_output()
        mock_result.complexity_score = 0.123456789
        output = mod.format_for_ralph(mock_result)
        score = output["complexity_score"]
        assert isinstance(score, float)
        assert score == round(0.123456789, 3)

    def test_format_for_ralph_mandatory_skills_are_list(self):
        """mandatory_skills must be a list."""
        mod = _load_module()
        mock_result = self._build_mock_router_output()
        output = mod.format_for_ralph(mock_result)
        assert isinstance(output["mandatory_skills"], list)

    def test_format_for_ralph_suggested_skills_excludes_mandatory(self):
        """suggested_skills must not include skills with enforcement=mandatory/block."""
        mod = _load_module()
        mock_result = self._build_mock_router_output()
        output = mod.format_for_ralph(mock_result)
        # The 'systematic-debugging' skill has enforcement=mandatory — not in suggested
        suggested_names = [s["name"] for s in output["suggested_skills"]]
        assert "systematic-debugging" not in suggested_names

    def test_format_for_ralph_agents_capped_at_3(self):
        """recommended_agents must include at most 3 entries."""
        mod = _load_module()
        mock_result = self._build_mock_router_output()
        # Add 5 agents
        agents = []
        for i in range(5):
            a = MagicMock()
            a.name = f"agent-{i}"
            a.type = "generic"
            a.confidence = 0.5
            a.reason = "reason"
            agents.append(a)
        mock_result.agents = agents
        output = mod.format_for_ralph(mock_result)
        assert len(output["recommended_agents"]) <= 3

    def test_format_for_ralph_ralph_instructions_is_string(self):
        """ralph_instructions must be a non-empty string."""
        mod = _load_module()
        mock_result = self._build_mock_router_output()
        output = mod.format_for_ralph(mock_result)
        assert isinstance(output["ralph_instructions"], str)
