#!/usr/bin/env python3
"""Comprehensive tests for ralph-state-v2.py — the Ralph unified state manager.

Tests cover data classes, state queries, retry queue, session management,
file I/O, and CLI command contracts. Regression tests are marked with
their severity level and a description of the bug they guard against.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent))

from importlib import import_module

mod = import_module("ralph-state-v2")

# Convenience aliases
TaskState = mod.TaskState
RetryEntry = mod.RetryEntry
Checkpoint = mod.Checkpoint
SessionState = mod.SessionState
UnifiedState = mod.UnifiedState
get_state_path = mod.get_state_path
load_state = mod.load_state
save_state = mod.save_state


# ------------------------------------------------------------------ #
#  Data classes                                                       #
# ------------------------------------------------------------------ #

class TestDataClasses:
    """Tests for TaskState, RetryEntry, SessionState, Checkpoint."""

    def test_task_state_defaults(self):
        """TaskState with only required fields has correct defaults."""
        task = TaskState(id="1", name="Test")
        assert task.status == "pending"
        assert task.retries == 0
        assert task.agent == ""
        assert task.duration_s == 0.0
        assert task.commit == ""
        assert task.depends_on == []
        assert task.files == []
        assert task.started_at is None
        assert task.completed_at is None
        assert task.last_error is None

    def test_task_state_roundtrip(self):
        """to_dict -> from_dict preserves all fields."""
        task = TaskState(
            id="2.1",
            name="Implement auth",
            status="in_progress",
            agent="kraken",
            duration_s=42.5,
            retries=2,
            commit="abc123",
            depends_on=["1.1", "1.2"],
            files=["src/auth.py", "tests/test_auth.py"],
            started_at="2026-01-15T10:00:00",
            completed_at="2026-01-15T10:01:00",
            last_error="Type error",
        )
        restored = TaskState.from_dict(task.to_dict())
        assert restored.id == task.id
        assert restored.name == task.name
        assert restored.status == task.status
        assert restored.agent == task.agent
        assert restored.duration_s == task.duration_s
        assert restored.retries == task.retries
        assert restored.commit == task.commit
        assert restored.depends_on == task.depends_on
        assert restored.files == task.files
        assert restored.started_at == task.started_at
        assert restored.completed_at == task.completed_at
        assert restored.last_error == task.last_error

    def test_task_state_from_dict_ignores_extra_keys(self):
        """from_dict silently ignores keys not in the dataclass."""
        data = {"id": "1", "name": "Test", "unknown_field": "ignored"}
        task = TaskState.from_dict(data)
        assert task.id == "1"
        assert not hasattr(task, "unknown_field") or task.id == "1"

    def test_retry_entry_has_attempt_field(self):
        """RetryEntry uses 'attempt', not 'retry_count'.
        Regression: HIGH-2 -- early drafts used retry_count which broke
        the escalation_map lookup in cmd_retry_push.
        """
        entry = RetryEntry(task_id="1.1", attempt=2, error="fail")
        assert hasattr(entry, "attempt")
        assert entry.attempt == 2
        # Ensure the old name does NOT exist
        assert not hasattr(entry, "retry_count")

    def test_retry_entry_roundtrip(self):
        """to_dict -> from_dict preserves the attempt value."""
        entry = RetryEntry(
            task_id="1.1",
            attempt=3,
            error="Type error in auth.ts",
            escalation="debug-agent",
        )
        d = entry.to_dict()
        assert d["attempt"] == 3
        restored = RetryEntry.from_dict(d)
        assert restored.attempt == 3
        assert restored.task_id == "1.1"
        assert restored.error == "Type error in auth.ts"
        assert restored.escalation == "debug-agent"

    def test_retry_entry_default_escalation(self):
        """Default escalation is 'same'."""
        entry = RetryEntry(task_id="x", attempt=1, error="e")
        assert entry.escalation == "same"

    def test_retry_entry_has_queued_at(self):
        """RetryEntry auto-generates a queued_at timestamp."""
        entry = RetryEntry(task_id="x", attempt=1, error="e")
        assert entry.queued_at is not None
        assert isinstance(entry.queued_at, str)
        assert len(entry.queued_at) > 10  # ISO format is long

    def test_session_state_defaults(self):
        """SessionState() starts inactive with None timestamps."""
        session = SessionState()
        assert session.active is False
        assert session.session_id == ""
        assert session.story_id == ""
        assert session.activated_at is None
        assert session.last_activity is None

    def test_session_state_last_activity_is_int(self):
        """last_activity must be an int (epoch ms), not a string.
        Regression: CRITICAL-2 -- hooks compare last_activity numerically.
        Storing it as a string breaks > comparisons.
        """
        session = SessionState(
            active=True,
            session_id="abc",
            activated_at=1707000000000,
            last_activity=1707000001000,
        )
        assert isinstance(session.activated_at, int)
        assert isinstance(session.last_activity, int)
        # Verify roundtrip preserves int type
        d = session.to_dict()
        assert isinstance(d["activated_at"], int)
        assert isinstance(d["last_activity"], int)
        restored = SessionState.from_dict(d)
        assert isinstance(restored.activated_at, int)
        assert isinstance(restored.last_activity, int)

    def test_checkpoint_roundtrip(self):
        """Checkpoint to_dict/from_dict roundtrip."""
        ckpt = Checkpoint(commit="abc123", task_id="1.1", message="auth done")
        restored = Checkpoint.from_dict(ckpt.to_dict())
        assert restored.commit == "abc123"
        assert restored.task_id == "1.1"
        assert restored.message == "auth done"
        assert restored.timestamp == ckpt.timestamp


# ------------------------------------------------------------------ #
#  UnifiedState                                                       #
# ------------------------------------------------------------------ #

class TestUnifiedState:
    """Tests for UnifiedState construction, serialization, queries."""

    def test_defaults(self):
        """Fresh UnifiedState has version 2.0 and empty collections."""
        state = UnifiedState()
        assert state.version == "2.0"
        assert state.tasks == []
        assert state.retry_queue == []
        assert state.checkpoints == []
        assert state.iteration == 0
        assert state.max_iterations == 30
        assert state.stage == "init"

    def test_tasks_is_list(self):
        """state.tasks must be a list, not a dict.
        Regression: MEDIUM-1 -- an early implementation stored tasks
        as a dict keyed by id, but hooks and CLI expect a list with
        an 'id' field on each item.
        """
        state = UnifiedState()
        assert isinstance(state.tasks, list)
        state.tasks.append(TaskState(id="1.1", name="Test"))
        assert isinstance(state.tasks, list)
        d = state.to_dict()
        assert isinstance(d["tasks"], list)

    def test_from_dict_roundtrip(self):
        """Full state serialization roundtrip."""
        state = UnifiedState(
            story_id="STORY-42",
            project_path="/tmp/proj",
            stage="building",
            iteration=5,
            max_iterations=50,
        )
        state.tasks.append(TaskState(id="1.1", name="Auth", status="complete", agent="kraken"))
        state.tasks.append(TaskState(id="1.2", name="Tests", depends_on=["1.1"]))
        state.retry_queue.append(RetryEntry(task_id="1.3", attempt=1, error="fail"))
        state.checkpoints.append(Checkpoint(commit="abc", task_id="1.1", message="done"))
        state.session = SessionState(active=True, session_id="sess-1", activated_at=1700000000000)

        d = state.to_dict()
        restored = UnifiedState.from_dict(d)

        assert restored.story_id == "STORY-42"
        assert restored.project_path == "/tmp/proj"
        assert restored.stage == "building"
        assert restored.iteration == 5
        assert restored.max_iterations == 50
        assert len(restored.tasks) == 2
        assert restored.tasks[0].id == "1.1"
        assert restored.tasks[0].status == "complete"
        assert restored.tasks[1].depends_on == ["1.1"]
        assert len(restored.retry_queue) == 1
        assert restored.retry_queue[0].attempt == 1
        assert len(restored.checkpoints) == 1
        assert restored.session.active is True
        assert restored.session.session_id == "sess-1"

    def test_get_task_by_id(self):
        """get_task returns the matching TaskState."""
        state = UnifiedState()
        state.tasks.append(TaskState(id="1.1", name="First"))
        state.tasks.append(TaskState(id="1.2", name="Second"))
        found = state.get_task("1.2")
        assert found is not None
        assert found.name == "Second"

    def test_get_task_missing(self):
        """get_task returns None for non-existent ID."""
        state = UnifiedState()
        state.tasks.append(TaskState(id="1.1", name="Only"))
        assert state.get_task("9.9") is None

    def test_get_task_empty_list(self):
        """get_task returns None when tasks list is empty."""
        state = UnifiedState()
        assert state.get_task("1.1") is None

    def test_summary_statistics(self):
        """summary() returns correct counts."""
        state = UnifiedState(story_id="S-1")
        state.tasks = [
            TaskState(id="1", name="A", status="complete"),
            TaskState(id="2", name="B", status="in_progress"),
            TaskState(id="3", name="C", status="pending"),
            TaskState(id="4", name="D", status="failed"),
            TaskState(id="5", name="E", status="blocked"),
        ]
        s = state.summary()
        assert s["total_tasks"] == 5
        assert s["complete"] == 1
        assert s["in_progress"] == 1
        assert s["pending"] == 1
        assert s["failed"] == 1
        assert s["blocked"] == 1
        assert s["progress_pct"] == 20.0
        assert s["story_id"] == "S-1"

    def test_summary_empty(self):
        """summary() handles zero tasks without division error."""
        state = UnifiedState()
        s = state.summary()
        assert s["total_tasks"] == 0
        assert s["progress_pct"] == 0.0

    def test_cost_default(self):
        """Default cost tracking is initialized with zeros."""
        state = UnifiedState()
        assert state.cost["total_input_tokens"] == 0
        assert state.cost["total_output_tokens"] == 0
        assert state.cost["estimated_cost_usd"] == 0.0


# ------------------------------------------------------------------ #
#  Ready tasks & dependency resolution                                #
# ------------------------------------------------------------------ #

class TestReadyTasks:
    """Tests for get_ready_tasks() dependency resolution."""

    def test_no_deps_are_ready(self):
        """Pending task with no depends_on is ready."""
        state = UnifiedState()
        state.tasks.append(TaskState(id="1.1", name="Independent", status="pending"))
        ready = state.get_ready_tasks()
        assert len(ready) == 1
        assert ready[0].id == "1.1"

    def test_blocked_by_incomplete_dep(self):
        """Pending task with in_progress dependency is not ready."""
        state = UnifiedState()
        state.tasks.append(TaskState(id="1.1", name="Dep", status="in_progress"))
        state.tasks.append(TaskState(id="1.2", name="Waiter", status="pending", depends_on=["1.1"]))
        ready = state.get_ready_tasks()
        assert len(ready) == 0

    def test_unblocked_after_dep_complete(self):
        """After dependency is marked 'complete', task becomes ready."""
        state = UnifiedState()
        state.tasks.append(TaskState(id="1.1", name="Dep", status="complete"))
        state.tasks.append(TaskState(id="1.2", name="Waiter", status="pending", depends_on=["1.1"]))
        ready = state.get_ready_tasks()
        assert len(ready) == 1
        assert ready[0].id == "1.2"

    def test_in_progress_not_ready(self):
        """Tasks already in_progress are never returned as ready."""
        state = UnifiedState()
        state.tasks.append(TaskState(id="1.1", name="Running", status="in_progress"))
        ready = state.get_ready_tasks()
        assert len(ready) == 0

    def test_complete_not_ready(self):
        """Completed tasks are not ready either."""
        state = UnifiedState()
        state.tasks.append(TaskState(id="1.1", name="Done", status="complete"))
        ready = state.get_ready_tasks()
        assert len(ready) == 0

    def test_multiple_deps_all_must_be_complete(self):
        """Task with multiple dependencies needs ALL deps complete."""
        state = UnifiedState()
        state.tasks.append(TaskState(id="1.1", name="A", status="complete"))
        state.tasks.append(TaskState(id="1.2", name="B", status="in_progress"))
        state.tasks.append(TaskState(id="1.3", name="C", status="pending", depends_on=["1.1", "1.2"]))
        ready = state.get_ready_tasks()
        assert len(ready) == 0

    def test_multiple_ready_at_once(self):
        """Multiple independent pending tasks are all ready."""
        state = UnifiedState()
        state.tasks.append(TaskState(id="1.1", name="A", status="pending"))
        state.tasks.append(TaskState(id="1.2", name="B", status="pending"))
        state.tasks.append(TaskState(id="1.3", name="C", status="pending"))
        ready = state.get_ready_tasks()
        assert len(ready) == 3

    def test_failed_dep_blocks_dependent(self):
        """Failed dependency does not count as complete -- blocks dependents."""
        state = UnifiedState()
        state.tasks.append(TaskState(id="1.1", name="Failed", status="failed"))
        state.tasks.append(TaskState(id="1.2", name="Waiter", status="pending", depends_on=["1.1"]))
        ready = state.get_ready_tasks()
        assert len(ready) == 0


# ------------------------------------------------------------------ #
#  Parallel batch                                                     #
# ------------------------------------------------------------------ #

class TestParallelBatch:
    """Tests for get_parallel_batch() file-overlap filtering."""

    def test_no_file_overlap(self):
        """Tasks with disjoint files are batched together."""
        state = UnifiedState()
        state.tasks.append(TaskState(id="1.1", name="A", status="pending", files=["a.py"]))
        state.tasks.append(TaskState(id="1.2", name="B", status="pending", files=["b.py"]))
        batch = state.get_parallel_batch()
        assert len(batch) == 2
        ids = {t.id for t in batch}
        assert ids == {"1.1", "1.2"}

    def test_file_overlap_excluded(self):
        """Tasks with overlapping files are NOT batched together."""
        state = UnifiedState()
        state.tasks.append(TaskState(id="1.1", name="A", status="pending", files=["shared.py", "a.py"]))
        state.tasks.append(TaskState(id="1.2", name="B", status="pending", files=["shared.py", "b.py"]))
        batch = state.get_parallel_batch()
        # Only first task should be in the batch since 1.2 overlaps on shared.py
        assert len(batch) == 1
        assert batch[0].id == "1.1"

    def test_empty_files_no_overlap(self):
        """Tasks with empty file lists have no overlap and can be batched."""
        state = UnifiedState()
        state.tasks.append(TaskState(id="1.1", name="A", status="pending", files=[]))
        state.tasks.append(TaskState(id="1.2", name="B", status="pending", files=[]))
        batch = state.get_parallel_batch()
        assert len(batch) == 2

    def test_no_ready_tasks_returns_empty(self):
        """get_parallel_batch returns [] when no tasks are ready."""
        state = UnifiedState()
        state.tasks.append(TaskState(id="1.1", name="A", status="in_progress"))
        batch = state.get_parallel_batch()
        assert batch == []

    def test_three_tasks_partial_overlap(self):
        """Third task with no overlap on batch gets included."""
        state = UnifiedState()
        state.tasks.append(TaskState(id="1.1", name="A", status="pending", files=["a.py"]))
        state.tasks.append(TaskState(id="1.2", name="B", status="pending", files=["a.py"]))
        state.tasks.append(TaskState(id="1.3", name="C", status="pending", files=["c.py"]))
        batch = state.get_parallel_batch()
        # 1.1 taken first, 1.2 overlaps a.py with 1.1, 1.3 has no overlap
        ids = {t.id for t in batch}
        assert "1.1" in ids
        assert "1.2" not in ids
        assert "1.3" in ids


# ------------------------------------------------------------------ #
#  Retry queue                                                        #
# ------------------------------------------------------------------ #

class TestRetryQueue:
    """Tests for retry queue push/pop and escalation."""

    def test_push_pop(self, tmp_path):
        """Push entry, pop returns it, queue empties."""
        state = UnifiedState(project_path=str(tmp_path))
        state.tasks.append(TaskState(id="1.1", name="A", status="failed"))
        entry = RetryEntry(task_id="1.1", attempt=1, error="Failed")
        state.retry_queue.append(entry)
        assert len(state.retry_queue) == 1

        popped = state.retry_queue.pop(0)
        assert popped.task_id == "1.1"
        assert popped.attempt == 1
        assert len(state.retry_queue) == 0

    def test_escalation_at_attempt_3(self, tmp_path, capsys):
        """attempt >= 3 marks task as 'blocked' via cmd_retry_push."""
        state = UnifiedState(
            story_id="TEST",
            project_path=str(tmp_path),
        )
        state.tasks.append(TaskState(id="1.1", name="Fragile", status="failed"))
        save_state(state)

        args = argparse.Namespace(
            project=str(tmp_path),
            id="1.1",
            error="Keeps failing",
            attempt=3,
        )
        mod.cmd_retry_push(args)

        # Reload state and check
        reloaded = load_state(str(tmp_path))
        task = reloaded.get_task("1.1")
        assert task.status == "blocked"
        assert len(reloaded.retry_queue) == 1
        assert reloaded.retry_queue[0].escalation == "debug-agent"

    def test_pop_resets_task_to_pending(self, tmp_path, capsys):
        """Pop resets non-blocked task back to pending."""
        state = UnifiedState(
            story_id="TEST",
            project_path=str(tmp_path),
        )
        state.tasks.append(TaskState(id="1.1", name="A", status="failed"))
        state.retry_queue.append(RetryEntry(task_id="1.1", attempt=1, error="fail"))
        save_state(state)

        args = argparse.Namespace(project=str(tmp_path))
        mod.cmd_retry_pop(args)

        reloaded = load_state(str(tmp_path))
        task = reloaded.get_task("1.1")
        assert task.status == "pending"
        assert len(reloaded.retry_queue) == 0

    def test_pop_does_not_reset_blocked_task(self, tmp_path, capsys):
        """Pop does NOT reset a blocked task to pending."""
        state = UnifiedState(
            story_id="TEST",
            project_path=str(tmp_path),
        )
        state.tasks.append(TaskState(id="1.1", name="A", status="blocked"))
        state.retry_queue.append(RetryEntry(task_id="1.1", attempt=3, error="fail", escalation="blocked"))
        save_state(state)

        args = argparse.Namespace(project=str(tmp_path))
        mod.cmd_retry_pop(args)

        reloaded = load_state(str(tmp_path))
        task = reloaded.get_task("1.1")
        assert task.status == "blocked"  # remains blocked

    def test_escalation_map(self, tmp_path, capsys):
        """Escalation follows: 1->same, 2->spark, 3->debug-agent, 4+->blocked."""
        for attempt, expected in [(1, "same"), (2, "spark"), (3, "debug-agent"), (4, "blocked"), (5, "blocked")]:
            state = UnifiedState(story_id="TEST", project_path=str(tmp_path))
            state.tasks.append(TaskState(id="1.1", name="A", status="failed"))
            save_state(state)

            args = argparse.Namespace(project=str(tmp_path), id="1.1", error="err", attempt=attempt)
            mod.cmd_retry_push(args)

            reloaded = load_state(str(tmp_path))
            assert reloaded.retry_queue[-1].escalation == expected, (
                f"attempt={attempt}: expected {expected}, got {reloaded.retry_queue[-1].escalation}"
            )

    def test_pop_empty_queue(self, tmp_path, capsys):
        """Pop from empty queue returns None entry, no crash."""
        state = UnifiedState(story_id="TEST", project_path=str(tmp_path))
        save_state(state)

        args = argparse.Namespace(project=str(tmp_path))
        mod.cmd_retry_pop(args)

        output = json.loads(capsys.readouterr().out)
        assert output["success"] is True
        assert output["entry"] is None


# ------------------------------------------------------------------ #
#  Session management                                                 #
# ------------------------------------------------------------------ #

class TestSessionManagement:
    """Tests for session activate/deactivate/heartbeat commands."""

    def test_activate_sets_epoch_ms(self, tmp_path, capsys):
        """activated_at and last_activity are epoch ms ints (13+ digits).
        Regression: CRITICAL-2 -- hooks compare these numerically.
        """
        state = UnifiedState(story_id="TEST", project_path=str(tmp_path))
        save_state(state)

        args = argparse.Namespace(
            project=str(tmp_path),
            session_id="sess-abc",
            story_id="TEST",
        )
        mod.cmd_session_activate(args)

        reloaded = load_state(str(tmp_path))
        session = reloaded.session
        assert session.active is True
        assert isinstance(session.activated_at, int)
        assert isinstance(session.last_activity, int)
        # Epoch ms should be at least 13 digits (year 2001+)
        assert session.activated_at > 1_000_000_000_000
        assert session.last_activity > 1_000_000_000_000
        assert session.session_id == "sess-abc"

    def test_heartbeat_updates_last_activity(self, tmp_path, capsys):
        """Heartbeat updates last_activity to current epoch ms."""
        state = UnifiedState(story_id="TEST", project_path=str(tmp_path))
        old_time = 1700000000000
        state.session = SessionState(
            active=True,
            session_id="sess-1",
            activated_at=old_time,
            last_activity=old_time,
        )
        save_state(state)

        # Small sleep so timestamp advances
        time.sleep(0.01)

        args = argparse.Namespace(project=str(tmp_path))
        mod.cmd_session_heartbeat(args)

        reloaded = load_state(str(tmp_path))
        assert reloaded.session.last_activity > old_time
        assert isinstance(reloaded.session.last_activity, int)

    def test_deactivate_sets_inactive(self, tmp_path, capsys):
        """Deactivate sets active=False."""
        state = UnifiedState(story_id="TEST", project_path=str(tmp_path))
        now = int(time.time() * 1000)
        state.session = SessionState(
            active=True,
            session_id="sess-1",
            activated_at=now,
            last_activity=now,
        )
        save_state(state)

        args = argparse.Namespace(project=str(tmp_path))
        mod.cmd_session_deactivate(args)

        reloaded = load_state(str(tmp_path))
        assert reloaded.session.active is False

    def test_heartbeat_inactive_session_no_update(self, tmp_path, capsys):
        """Heartbeat on an inactive session does not update state."""
        state = UnifiedState(story_id="TEST", project_path=str(tmp_path))
        state.session = SessionState(active=False)
        save_state(state)

        args = argparse.Namespace(project=str(tmp_path))
        mod.cmd_session_heartbeat(args)

        output = json.loads(capsys.readouterr().out)
        assert output["updated"] is False

    def test_activate_auto_inits_state(self, tmp_path, capsys):
        """session-activate auto-creates state if none exists."""
        args = argparse.Namespace(
            project=str(tmp_path),
            session_id="new-sess",
            story_id="NEW-1",
        )
        mod.cmd_session_activate(args)

        reloaded = load_state(str(tmp_path))
        assert reloaded is not None
        assert reloaded.session.active is True
        assert reloaded.session.session_id == "new-sess"

    def test_session_status_no_state(self, tmp_path, capsys):
        """session-status with no state file returns active=False."""
        args = argparse.Namespace(project=str(tmp_path))
        mod.cmd_session_status(args)

        output = json.loads(capsys.readouterr().out)
        assert output["success"] is True
        assert output["active"] is False


# ------------------------------------------------------------------ #
#  File I/O                                                           #
# ------------------------------------------------------------------ #

class TestFileIO:
    """Tests for save_state/load_state and get_state_path."""

    def test_get_state_path(self, tmp_path):
        """State path is <project>/.ralph/state.json."""
        path = get_state_path(str(tmp_path))
        assert path == tmp_path / ".ralph" / "state.json"

    def test_save_load_roundtrip(self, tmp_path):
        """Save state, load it back, compare key fields."""
        state = UnifiedState(
            story_id="IO-TEST",
            project_path=str(tmp_path),
            stage="building",
            iteration=3,
        )
        state.tasks.append(TaskState(id="1.1", name="Test task", status="pending"))
        save_state(state)

        loaded = load_state(str(tmp_path))
        assert loaded is not None
        assert loaded.story_id == "IO-TEST"
        assert loaded.stage == "building"
        assert loaded.iteration == 3
        assert len(loaded.tasks) == 1
        assert loaded.tasks[0].id == "1.1"

    def test_load_missing_returns_none(self, tmp_path):
        """Loading from a non-existent path returns None."""
        result = load_state(str(tmp_path / "nonexistent"))
        assert result is None

    def test_atomic_write(self, tmp_path):
        """After save, state.json exists and no .tmp file remains."""
        state = UnifiedState(project_path=str(tmp_path))
        save_state(state)

        state_path = get_state_path(str(tmp_path))
        assert state_path.exists()

        # No temp files should remain in the .ralph directory
        ralph_dir = tmp_path / ".ralph"
        tmp_files = list(ralph_dir.glob("*.tmp.*"))
        assert len(tmp_files) == 0

    def test_save_creates_ralph_directory(self, tmp_path):
        """save_state creates .ralph/ if it doesn't exist."""
        ralph_dir = tmp_path / ".ralph"
        assert not ralph_dir.exists()

        state = UnifiedState(project_path=str(tmp_path))
        save_state(state)

        assert ralph_dir.exists()
        assert ralph_dir.is_dir()

    def test_load_corrupt_json_returns_none(self, tmp_path):
        """Loading a corrupt state file returns None (doesn't crash)."""
        ralph_dir = tmp_path / ".ralph"
        ralph_dir.mkdir()
        state_file = ralph_dir / "state.json"
        state_file.write_text("{invalid json!!!}", encoding="utf-8")

        result = load_state(str(tmp_path))
        assert result is None

    def test_save_updates_updated_at(self, tmp_path):
        """save_state refreshes the updated_at timestamp."""
        state = UnifiedState(project_path=str(tmp_path), updated_at="2000-01-01T00:00:00")
        save_state(state)

        loaded = load_state(str(tmp_path))
        assert loaded.updated_at != "2000-01-01T00:00:00"
        assert "2026" in loaded.updated_at or "202" in loaded.updated_at  # current year


# ------------------------------------------------------------------ #
#  CLI: task-list contract                                            #
# ------------------------------------------------------------------ #

class TestTaskListContract:
    """Tests for cmd_task_list output format -- the primary contract
    that hooks and scripts depend on."""

    def test_task_list_output_format(self, tmp_path, capsys):
        """task-list outputs {"success": true, "tasks": [...]} where
        tasks is a LIST of dicts, each with an "id" field.
        Regression: CRITICAL-1 -- early versions returned tasks as a dict
        keyed by id, breaking hooks that iterate over the list.
        """
        state = UnifiedState(story_id="TEST-1", project_path=str(tmp_path))
        state.tasks.append(TaskState(id="1.1", name="First task", status="in_progress"))
        state.tasks.append(TaskState(id="1.2", name="Second task", status="pending"))
        save_state(state)

        args = argparse.Namespace(project=str(tmp_path), status=None)
        mod.cmd_task_list(args)

        output = json.loads(capsys.readouterr().out)
        assert output["success"] is True
        assert isinstance(output["tasks"], list)  # CRITICAL: list, not dict
        assert len(output["tasks"]) == 2
        assert output["tasks"][0]["id"] == "1.1"
        assert output["tasks"][1]["id"] == "1.2"

    def test_task_list_filter_by_status(self, tmp_path, capsys):
        """task-list --status filters correctly."""
        state = UnifiedState(story_id="TEST-1", project_path=str(tmp_path))
        state.tasks.append(TaskState(id="1.1", name="Done", status="complete"))
        state.tasks.append(TaskState(id="1.2", name="Running", status="in_progress"))
        state.tasks.append(TaskState(id="1.3", name="Waiting", status="pending"))
        save_state(state)

        args = argparse.Namespace(project=str(tmp_path), status="pending")
        mod.cmd_task_list(args)

        output = json.loads(capsys.readouterr().out)
        assert output["success"] is True
        assert len(output["tasks"]) == 1
        assert output["tasks"][0]["id"] == "1.3"

    def test_task_list_empty(self, tmp_path, capsys):
        """task-list with no tasks returns empty list, not error."""
        state = UnifiedState(story_id="TEST-1", project_path=str(tmp_path))
        save_state(state)

        args = argparse.Namespace(project=str(tmp_path), status=None)
        mod.cmd_task_list(args)

        output = json.loads(capsys.readouterr().out)
        assert output["success"] is True
        assert output["tasks"] == []

    def test_task_dicts_have_all_fields(self, tmp_path, capsys):
        """Each task dict in the output has all TaskState fields."""
        state = UnifiedState(story_id="TEST-1", project_path=str(tmp_path))
        state.tasks.append(TaskState(id="1.1", name="Full task", agent="kraken"))
        save_state(state)

        args = argparse.Namespace(project=str(tmp_path), status=None)
        mod.cmd_task_list(args)

        output = json.loads(capsys.readouterr().out)
        task_dict = output["tasks"][0]
        expected_keys = {
            "id", "name", "status", "agent", "duration_s", "retries",
            "commit", "depends_on", "files", "started_at", "completed_at",
            "last_error",
        }
        assert expected_keys.issubset(set(task_dict.keys()))


# ------------------------------------------------------------------ #
#  CLI: task lifecycle                                                #
# ------------------------------------------------------------------ #

class TestTaskLifecycle:
    """Tests for task-add, task-start, task-complete, task-fail commands."""

    def test_task_add_and_start(self, tmp_path, capsys):
        """Add a task, start it, verify status transitions."""
        # Init state
        state = UnifiedState(story_id="LIFE-1", project_path=str(tmp_path))
        save_state(state)

        # Add task
        args = argparse.Namespace(
            project=str(tmp_path),
            id="1.1",
            name="Auth feature",
            agent="kraken",
            depends_on=None,
            files=None,
        )
        mod.cmd_task_add(args)
        capsys.readouterr()  # clear output

        reloaded = load_state(str(tmp_path))
        assert len(reloaded.tasks) == 1
        assert reloaded.tasks[0].status == "pending"

        # Start task
        args = argparse.Namespace(project=str(tmp_path), id="1.1", agent=None)
        mod.cmd_task_start(args)
        capsys.readouterr()

        reloaded = load_state(str(tmp_path))
        assert reloaded.tasks[0].status == "in_progress"
        assert reloaded.tasks[0].started_at is not None
        assert reloaded.iteration == 1

    def test_task_complete(self, tmp_path, capsys):
        """Complete a task with a commit hash."""
        state = UnifiedState(story_id="LIFE-1", project_path=str(tmp_path))
        state.tasks.append(TaskState(
            id="1.1", name="Auth", status="in_progress",
            started_at="2026-01-15T10:00:00",
        ))
        save_state(state)

        args = argparse.Namespace(project=str(tmp_path), id="1.1", commit="abc123")
        mod.cmd_task_complete(args)

        reloaded = load_state(str(tmp_path))
        task = reloaded.get_task("1.1")
        assert task.status == "complete"
        assert task.commit == "abc123"
        assert task.completed_at is not None
        assert task.duration_s > 0

    def test_task_fail(self, tmp_path, capsys):
        """Fail a task with an error message."""
        state = UnifiedState(story_id="LIFE-1", project_path=str(tmp_path))
        state.tasks.append(TaskState(id="1.1", name="Auth", status="in_progress"))
        save_state(state)

        args = argparse.Namespace(project=str(tmp_path), id="1.1", error="Type error")
        mod.cmd_task_fail(args)

        reloaded = load_state(str(tmp_path))
        task = reloaded.get_task("1.1")
        assert task.status == "failed"
        assert task.last_error == "Type error"
        assert task.retries == 1

    def test_task_add_duplicate_rejected(self, tmp_path, capsys):
        """Adding a task with an existing ID fails."""
        state = UnifiedState(story_id="LIFE-1", project_path=str(tmp_path))
        state.tasks.append(TaskState(id="1.1", name="Existing"))
        save_state(state)

        args = argparse.Namespace(
            project=str(tmp_path), id="1.1", name="Duplicate",
            agent=None, depends_on=None, files=None,
        )
        result = mod.cmd_task_add(args)
        assert result == 1

        output = json.loads(capsys.readouterr().out)
        assert output["success"] is False

    def test_task_start_nonexistent_fails(self, tmp_path, capsys):
        """Starting a non-existent task fails."""
        state = UnifiedState(story_id="LIFE-1", project_path=str(tmp_path))
        save_state(state)

        args = argparse.Namespace(project=str(tmp_path), id="9.9", agent=None)
        result = mod.cmd_task_start(args)
        assert result == 1


# ------------------------------------------------------------------ #
#  CLI: ready-tasks command                                           #
# ------------------------------------------------------------------ #

class TestReadyTasksCommand:
    """Tests for the cmd_ready_tasks CLI command."""

    def test_ready_tasks_output(self, tmp_path, capsys):
        """ready-tasks outputs ready tasks as a list."""
        state = UnifiedState(story_id="RT-1", project_path=str(tmp_path))
        state.tasks.append(TaskState(id="1.1", name="A", status="complete"))
        state.tasks.append(TaskState(id="1.2", name="B", status="pending", depends_on=["1.1"]))
        save_state(state)

        args = argparse.Namespace(project=str(tmp_path), parallel=False)
        mod.cmd_ready_tasks(args)

        output = json.loads(capsys.readouterr().out)
        assert output["success"] is True
        assert len(output["ready"]) == 1
        assert output["ready"][0]["id"] == "1.2"

    def test_ready_tasks_parallel_flag(self, tmp_path, capsys):
        """ready-tasks --parallel returns parallel batch."""
        state = UnifiedState(story_id="RT-1", project_path=str(tmp_path))
        state.tasks.append(TaskState(id="1.1", name="A", status="pending", files=["a.py"]))
        state.tasks.append(TaskState(id="1.2", name="B", status="pending", files=["a.py"]))
        state.tasks.append(TaskState(id="1.3", name="C", status="pending", files=["c.py"]))
        save_state(state)

        args = argparse.Namespace(project=str(tmp_path), parallel=True)
        mod.cmd_ready_tasks(args)

        output = json.loads(capsys.readouterr().out)
        ids = [t["id"] for t in output["ready"]]
        assert "1.1" in ids
        assert "1.2" not in ids  # overlaps with 1.1
        assert "1.3" in ids


# ------------------------------------------------------------------ #
#  CLI: checkpoint command                                            #
# ------------------------------------------------------------------ #

class TestCheckpointCommand:
    """Tests for the cmd_checkpoint CLI command."""

    def test_checkpoint_added(self, tmp_path, capsys):
        """Checkpoint is persisted and counted."""
        state = UnifiedState(story_id="CK-1", project_path=str(tmp_path))
        save_state(state)

        args = argparse.Namespace(
            project=str(tmp_path),
            commit="abc123",
            task_id="1.1",
            message="auth implemented",
        )
        mod.cmd_checkpoint(args)

        output = json.loads(capsys.readouterr().out)
        assert output["success"] is True
        assert output["total"] == 1
        assert output["checkpoint"]["commit"] == "abc123"

        reloaded = load_state(str(tmp_path))
        assert len(reloaded.checkpoints) == 1
        assert reloaded.checkpoints[0].message == "auth implemented"


# ------------------------------------------------------------------ #
#  CLI: init command                                                  #
# ------------------------------------------------------------------ #

class TestInitCommand:
    """Tests for the cmd_init CLI command."""

    def test_init_creates_state(self, tmp_path, capsys):
        """init creates a new state file."""
        args = argparse.Namespace(
            project=str(tmp_path),
            story="INIT-1",
            force=False,
            max_iterations=50,
        )
        result = mod.cmd_init(args)
        assert result == 0

        loaded = load_state(str(tmp_path))
        assert loaded is not None
        assert loaded.story_id == "INIT-1"
        assert loaded.max_iterations == 50

    def test_init_refuses_overwrite_without_force(self, tmp_path, capsys):
        """init fails if state exists and --force not set."""
        state = UnifiedState(story_id="OLD", project_path=str(tmp_path))
        save_state(state)

        args = argparse.Namespace(
            project=str(tmp_path),
            story="NEW",
            force=False,
            max_iterations=30,
        )
        result = mod.cmd_init(args)
        assert result == 1

        output = json.loads(capsys.readouterr().out)
        assert output["success"] is False

    def test_init_force_overwrites(self, tmp_path, capsys):
        """init --force overwrites existing state."""
        state = UnifiedState(story_id="OLD", project_path=str(tmp_path))
        save_state(state)

        args = argparse.Namespace(
            project=str(tmp_path),
            story="NEW",
            force=True,
            max_iterations=30,
        )
        result = mod.cmd_init(args)
        assert result == 0

        loaded = load_state(str(tmp_path))
        assert loaded.story_id == "NEW"


# ------------------------------------------------------------------ #
#  Migration                                                          #
# ------------------------------------------------------------------ #

class TestMigration:
    """Tests for v1 -> v2 migration."""

    def test_migrate_from_v1(self, tmp_path):
        """Migrates old .ralph-state.json into new format."""
        old_state = {
            "project_path": str(tmp_path),
            "stage": "building",
            "created_at": "2026-01-01T00:00:00",
            "stories": [
                {"id": "STORY-1", "tasks_total": 3, "tasks_completed": 2}
            ],
        }
        old_file = tmp_path / ".ralph-state.json"
        old_file.write_text(json.dumps(old_state), encoding="utf-8")

        migrated = mod.migrate_from_v1(str(tmp_path))
        assert migrated is not None
        assert migrated.story_id == "STORY-1"
        assert len(migrated.tasks) == 3
        # 2 complete, 1 pending
        complete_count = sum(1 for t in migrated.tasks if t.status == "complete")
        pending_count = sum(1 for t in migrated.tasks if t.status == "pending")
        assert complete_count == 2
        assert pending_count == 1

    def test_migrate_no_v1_returns_none(self, tmp_path):
        """migrate_from_v1 returns None when no old state exists."""
        result = mod.migrate_from_v1(str(tmp_path))
        assert result is None


# ------------------------------------------------------------------ #
#  Progress bar (smoke test)                                          #
# ------------------------------------------------------------------ #

class TestProgressBar:
    """Smoke tests for progress_bar output."""

    def test_progress_bar_format(self):
        """Progress bar contains story ID and fraction."""
        state = UnifiedState(story_id="PB-1")
        state.tasks = [
            TaskState(id="1", name="A", status="complete"),
            TaskState(id="2", name="B", status="pending"),
        ]
        bar = state.progress_bar()
        assert "PB-1" in bar
        assert "1/2" in bar
        assert "50%" in bar

    def test_progress_bar_empty(self):
        """Progress bar handles zero tasks."""
        state = UnifiedState(story_id="EMPTY")
        bar = state.progress_bar()
        assert "EMPTY" in bar
        assert "0/0" in bar


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
