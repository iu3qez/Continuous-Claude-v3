"""Integration tests for ralph-state-v2.py — CLI subprocess contract tests.

Runs the script as hooks do: subprocess.run() + JSON stdout parsing.
Each test class isolates state in its own tmp_path directory.
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

import pytest

# Path to the script under test
SCRIPT = str(Path(__file__).parent / "ralph-state-v2.py")


def run(tmp_path: Path, *args: str) -> dict:
    """Run ralph-state-v2.py with given args, return parsed JSON stdout.

    The script occasionally emits multiple JSON lines (e.g., init copies TDD
    contract and prints an info line before the success line). We take the last
    non-empty JSON line — that's the command result hooks care about.
    """
    cmd = [sys.executable, SCRIPT, "-p", str(tmp_path)] + list(args)
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    assert result.stdout.strip(), (
        f"No stdout from: {' '.join(args)}\n"
        f"stderr: {result.stderr}\n"
        f"returncode: {result.returncode}"
    )
    lines = [ln.strip() for ln in result.stdout.strip().splitlines() if ln.strip()]
    # Take the last line — the authoritative command result
    last_line = lines[-1]
    try:
        return json.loads(last_line)
    except json.JSONDecodeError as exc:
        raise AssertionError(
            f"stdout last line is not valid JSON for cmd: {' '.join(args)}\n"
            f"last line: {last_line!r}\n"
            f"full stdout: {result.stdout!r}\n"
            f"stderr: {result.stderr}"
        ) from exc


def init(tmp_path: Path, story: str = "TEST-1") -> dict:
    """Convenience: init state with --force to allow idempotent test setup."""
    return run(tmp_path, "init", "--story", story, "--force")


# ─── TestInitCommand ──────────────────────────────────────────────────────────


class TestInitCommand:
    """Tests for the 'init' subcommand."""

    def test_init_creates_state(self, tmp_path):
        """init --story TEST-1 must create .ralph/state.json on disk."""
        result = init(tmp_path, "TEST-1")
        assert result.get("success") is True

        state_file = tmp_path / ".ralph" / "state.json"
        assert state_file.exists(), f"state.json not found at {state_file}"

    def test_init_output_format(self, tmp_path):
        """Output must have success=true and a state_path string."""
        result = init(tmp_path, "TEST-1")
        assert result.get("success") is True
        assert "state_path" in result, f"'state_path' missing from: {result}"
        assert isinstance(result["state_path"], str)
        assert result["state_path"].endswith("state.json")

    def test_init_force_overwrites_existing(self, tmp_path):
        """--force must allow re-init over existing state without error."""
        init(tmp_path, "TEST-1")
        result = run(tmp_path, "init", "--story", "TEST-2", "--force")
        assert result.get("success") is True

    def test_init_without_force_fails_if_exists(self, tmp_path):
        """Second init without --force must fail gracefully."""
        init(tmp_path, "TEST-1")
        result = run(tmp_path, "init", "--story", "TEST-1")
        assert result.get("success") is False
        assert "force" in result.get("error", "").lower()


# ─── TestTaskLifecycle ────────────────────────────────────────────────────────


class TestTaskLifecycle:
    """Tests for task-add → task-start → task-complete lifecycle."""

    def test_add_start_complete(self, tmp_path):
        """Full lifecycle: add a task, start it, complete it."""
        init(tmp_path, "TEST-LIFECYCLE")

        # Add
        add_result = run(tmp_path, "task-add", "--id", "1.1", "--name", "Implement auth", "--agent", "kraken")
        assert add_result.get("success") is True
        assert add_result["task"]["id"] == "1.1"
        assert add_result["task"]["status"] == "pending"

        # Start
        start_result = run(tmp_path, "task-start", "--id", "1.1")
        assert start_result.get("success") is True
        assert start_result["task"]["status"] == "in_progress"
        assert start_result["task"]["started_at"] is not None

        # Complete
        complete_result = run(tmp_path, "task-complete", "--id", "1.1", "--commit", "abc123")
        assert complete_result.get("success") is True
        assert complete_result["task"]["status"] == "complete"
        assert complete_result["task"]["commit"] == "abc123"
        assert complete_result["task"]["completed_at"] is not None

    def test_task_list_returns_list(self, tmp_path):
        """
        CRITICAL-1 regression: task-list output must have parsed['tasks'] as a list
        with items that each have an 'id' field.
        """
        init(tmp_path, "TEST-LIST")

        run(tmp_path, "task-add", "--id", "1.1", "--name", "Task one", "--agent", "kraken")
        run(tmp_path, "task-add", "--id", "1.2", "--name", "Task two", "--agent", "spark")

        result = run(tmp_path, "task-list")
        assert result.get("success") is True

        tasks = result.get("tasks")
        assert isinstance(tasks, list), f"'tasks' must be a list, got {type(tasks).__name__}"
        assert len(tasks) == 2, f"Expected 2 tasks, got {len(tasks)}"

        for item in tasks:
            assert "id" in item, f"Task entry missing 'id' field: {item}"

        ids = {t["id"] for t in tasks}
        assert "1.1" in ids
        assert "1.2" in ids

    def test_task_list_filter_by_status(self, tmp_path):
        """task-list --status pending must filter correctly."""
        init(tmp_path, "TEST-FILTER")
        run(tmp_path, "task-add", "--id", "1.1", "--name", "Task one", "--agent", "kraken")
        run(tmp_path, "task-add", "--id", "1.2", "--name", "Task two", "--agent", "spark")
        run(tmp_path, "task-start", "--id", "1.1")

        result = run(tmp_path, "task-list", "--status", "pending")
        assert result.get("success") is True
        tasks = result["tasks"]
        assert all(t["status"] == "pending" for t in tasks)
        ids = {t["id"] for t in tasks}
        assert "1.2" in ids
        assert "1.1" not in ids

    def test_duplicate_task_id_rejected(self, tmp_path):
        """Adding a task with an existing ID must fail with error."""
        init(tmp_path, "TEST-DUP")
        run(tmp_path, "task-add", "--id", "1.1", "--name", "Task one", "--agent", "kraken")
        result = run(tmp_path, "task-add", "--id", "1.1", "--name", "Duplicate", "--agent", "spark")
        assert result.get("success") is False


# ─── TestSessionContract ──────────────────────────────────────────────────────


class TestSessionContract:
    """Tests for session management — CRITICAL-2 regression: epoch ms timestamps."""

    def test_session_activate_epoch_ms(self, tmp_path):
        """
        CRITICAL-2 regression: After session-activate, last_activity must be
        an epoch milliseconds integer (13+ digits, magnitude around 1.7e12).
        """
        init(tmp_path, "TEST-SESSION")

        result = run(tmp_path, "session-activate", "--session-id", "sess-abc", "--story-id", "TEST-SESSION")
        assert result.get("success") is True

        session = result.get("session")
        assert session is not None, "Output must include 'session' key"

        last_activity = session.get("last_activity")
        assert last_activity is not None, "'last_activity' must not be None after activation"
        assert isinstance(last_activity, int), (
            f"'last_activity' must be int (epoch ms), got {type(last_activity).__name__}: {last_activity}"
        )

        # Epoch ms: Jan 2020 = 1577836800000 (13 digits), must be in plausible range
        assert last_activity > 1_577_836_800_000, (
            f"'last_activity' too small: {last_activity} (expected epoch ms ~1.7e12+)"
        )
        assert len(str(last_activity)) >= 13, (
            f"'last_activity' has {len(str(last_activity))} digits, expected 13+ for epoch ms"
        )

    def test_session_activated_at_epoch_ms(self, tmp_path):
        """activated_at must also be epoch ms (not ISO string)."""
        init(tmp_path, "TEST-SESSION-AT")
        result = run(tmp_path, "session-activate", "--session-id", "sess-xyz")
        session = result["session"]

        activated_at = session.get("activated_at")
        assert isinstance(activated_at, int), (
            f"'activated_at' must be int epoch ms, got {type(activated_at).__name__}: {activated_at}"
        )
        assert activated_at > 1_577_836_800_000

    def test_session_heartbeat_updates(self, tmp_path):
        """After heartbeat, last_activity must change to a newer or equal value."""
        init(tmp_path, "TEST-HEARTBEAT")
        run(tmp_path, "session-activate", "--session-id", "sess-hb")

        # Read initial last_activity
        status1 = run(tmp_path, "session-status")
        initial_activity = status1.get("last_activity")

        # Small sleep to ensure timestamp advances
        time.sleep(0.05)

        hb_result = run(tmp_path, "session-heartbeat")
        assert hb_result.get("success") is True
        assert hb_result.get("updated") is True

        # Read updated last_activity
        status2 = run(tmp_path, "session-status")
        updated_activity = status2.get("last_activity")

        assert updated_activity is not None
        assert isinstance(updated_activity, int)
        assert updated_activity >= initial_activity, (
            f"last_activity did not advance: {initial_activity} -> {updated_activity}"
        )

    def test_session_deactivate_sets_active_false(self, tmp_path):
        """Deactivate must set active=False."""
        init(tmp_path, "TEST-DEACTIVATE")
        run(tmp_path, "session-activate", "--session-id", "sess-da")

        result = run(tmp_path, "session-deactivate")
        assert result.get("success") is True
        assert result["session"]["active"] is False


# ─── TestRetryContract ────────────────────────────────────────────────────────


class TestRetryContract:
    """Tests for retry queue — HIGH-2 regression: attempt field name."""

    def test_retry_push_uses_attempt(self, tmp_path):
        """
        HIGH-2 regression: After retry-push --id 1.1 --error 'fail' --attempt 2,
        output entry must have 'attempt': 2 (not 'retry_count' or similar).
        """
        init(tmp_path, "TEST-RETRY")
        run(tmp_path, "task-add", "--id", "1.1", "--name", "Task", "--agent", "kraken")

        result = run(tmp_path, "retry-push", "--id", "1.1", "--error", "fail", "--attempt", "2")
        assert result.get("success") is True

        entry = result.get("entry")
        assert entry is not None, "Output must include 'entry' key"
        assert "attempt" in entry, (
            f"'attempt' field missing from entry. Got keys: {list(entry.keys())}"
        )
        assert entry["attempt"] == 2, f"Expected attempt=2, got {entry['attempt']}"

    def test_retry_push_attempt_1_escalation_same(self, tmp_path):
        """Attempt 1 must have escalation='same'."""
        init(tmp_path, "TEST-RETRY-ESC1")
        run(tmp_path, "task-add", "--id", "1.1", "--name", "Task", "--agent", "kraken")
        result = run(tmp_path, "retry-push", "--id", "1.1", "--error", "fail", "--attempt", "1")
        assert result["entry"]["escalation"] == "same"

    def test_retry_push_attempt_2_escalation_spark(self, tmp_path):
        """Attempt 2 must have escalation='spark'."""
        init(tmp_path, "TEST-RETRY-ESC2")
        run(tmp_path, "task-add", "--id", "1.1", "--name", "Task", "--agent", "kraken")
        result = run(tmp_path, "retry-push", "--id", "1.1", "--error", "fail", "--attempt", "2")
        assert result["entry"]["escalation"] == "spark"

    def test_retry_push_attempt_3_escalation_debug_agent(self, tmp_path):
        """Attempt 3 must have escalation='debug-agent'."""
        init(tmp_path, "TEST-RETRY-ESC3")
        run(tmp_path, "task-add", "--id", "1.1", "--name", "Task", "--agent", "kraken")
        result = run(tmp_path, "retry-push", "--id", "1.1", "--error", "fail", "--attempt", "3")
        assert result["entry"]["escalation"] == "debug-agent"

    def test_retry_push_attempt_3_marks_task_blocked(self, tmp_path):
        """Attempt >= 3 must set task status to 'blocked'."""
        init(tmp_path, "TEST-RETRY-BLOCK")
        run(tmp_path, "task-add", "--id", "1.1", "--name", "Task", "--agent", "kraken")
        run(tmp_path, "retry-push", "--id", "1.1", "--error", "fail", "--attempt", "3")

        list_result = run(tmp_path, "task-list", "--status", "blocked")
        blocked_ids = [t["id"] for t in list_result["tasks"]]
        assert "1.1" in blocked_ids, f"Task 1.1 should be blocked. Blocked tasks: {blocked_ids}"

    def test_retry_pop_removes_from_queue(self, tmp_path):
        """retry-pop must remove the first entry and return it."""
        init(tmp_path, "TEST-RETRY-POP")
        run(tmp_path, "task-add", "--id", "1.1", "--name", "Task", "--agent", "kraken")
        run(tmp_path, "retry-push", "--id", "1.1", "--error", "fail", "--attempt", "1")

        pop_result = run(tmp_path, "retry-pop")
        assert pop_result.get("success") is True
        assert pop_result["entry"] is not None
        assert pop_result["entry"]["task_id"] == "1.1"
        assert pop_result["remaining"] == 0

    def test_retry_push_increments_queue_size(self, tmp_path):
        """queue_size must reflect number of entries in queue."""
        init(tmp_path, "TEST-RETRY-SIZE")
        run(tmp_path, "task-add", "--id", "1.1", "--name", "Task A", "--agent", "kraken")
        run(tmp_path, "task-add", "--id", "1.2", "--name", "Task B", "--agent", "spark")

        r1 = run(tmp_path, "retry-push", "--id", "1.1", "--error", "fail", "--attempt", "1")
        assert r1["queue_size"] == 1

        r2 = run(tmp_path, "retry-push", "--id", "1.2", "--error", "fail", "--attempt", "1")
        assert r2["queue_size"] == 2


# ─── TestCheckpoint ───────────────────────────────────────────────────────────


class TestCheckpoint:
    """Tests for checkpoint recording."""

    def test_checkpoint_records(self, tmp_path):
        """
        After checkpoint --commit abc123 --task-id 1.1 --message done,
        output must have checkpoint with those exact fields.
        """
        init(tmp_path, "TEST-CKPT")
        run(tmp_path, "task-add", "--id", "1.1", "--name", "Task", "--agent", "kraken")

        result = run(
            tmp_path,
            "checkpoint",
            "--commit", "abc123",
            "--task-id", "1.1",
            "--message", "done",
        )
        assert result.get("success") is True

        ckpt = result.get("checkpoint")
        assert ckpt is not None, "Output must include 'checkpoint' key"
        assert ckpt["commit"] == "abc123", f"commit mismatch: {ckpt['commit']}"
        assert ckpt["task_id"] == "1.1", f"task_id mismatch: {ckpt['task_id']}"
        assert ckpt["message"] == "done", f"message mismatch: {ckpt['message']}"
        assert "timestamp" in ckpt, "checkpoint must have 'timestamp' field"

    def test_checkpoint_total_increments(self, tmp_path):
        """total checkpoints must increment with each call."""
        init(tmp_path, "TEST-CKPT-COUNT")

        r1 = run(tmp_path, "checkpoint", "--commit", "aaa111", "--task-id", "1.1", "--message", "first")
        assert r1["total"] == 1

        r2 = run(tmp_path, "checkpoint", "--commit", "bbb222", "--task-id", "1.1", "--message", "second")
        assert r2["total"] == 2

    def test_checkpoint_timestamp_is_iso_string(self, tmp_path):
        """Checkpoint timestamp must be a non-empty ISO-format string."""
        init(tmp_path, "TEST-CKPT-TS")
        result = run(tmp_path, "checkpoint", "--commit", "ccc333", "--task-id", "1.1", "--message", "ts-test")
        ckpt = result["checkpoint"]
        ts = ckpt.get("timestamp")
        assert isinstance(ts, str) and len(ts) > 0, f"timestamp must be non-empty string, got: {ts!r}"
        # Must look like an ISO timestamp (starts with year)
        assert ts[:4].isdigit(), f"timestamp doesn't look like ISO: {ts}"
