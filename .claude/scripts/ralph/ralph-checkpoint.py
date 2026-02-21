#!/usr/bin/env python3
"""
Ralph Checkpoint Manager

Auto-commits after verified task completion and records in unified state.
Called by Ralph SKILL.md after Phase 3.4 verification passes.

USAGE:
    # Checkpoint after task completion
    python ralph-checkpoint.py commit --task-id 1.1 --message "auth middleware done"

    # Checkpoint with custom project path
    python ralph-checkpoint.py commit --task-id 1.1 --message "done" --project /path

    # List checkpoints
    python ralph-checkpoint.py list

    # Get last checkpoint info
    python ralph-checkpoint.py last
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


def get_state_script() -> str:
    """Get path to ralph-state-v2.py."""
    home = os.environ.get("HOME") or os.environ.get("USERPROFILE") or ""
    script = os.path.join(home, ".claude", "scripts", "ralph", "ralph-state-v2.py")
    if not os.path.exists(script):
        # Try relative path from this script
        script = os.path.join(os.path.dirname(__file__), "ralph-state-v2.py")
    return script


def run_state_cmd(project: str, *args: str) -> dict:
    """Run ralph-state-v2.py command and return parsed JSON output."""
    script = get_state_script()
    cmd = ["python", script, "-p", project] + list(args)
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
    if result.returncode != 0:
        return {"success": False, "error": result.stderr or "Command failed"}
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"success": False, "error": f"Invalid JSON: {result.stdout}"}


def git_add_commit(project: str, message: str) -> tuple[bool, str]:
    """Stage all changes and commit. Returns (success, commit_hash)."""
    try:
        # Stage all changes
        add_result = subprocess.run(
            ["git", "add", "-A"],
            capture_output=True, text=True, cwd=project, timeout=30
        )
        if add_result.returncode != 0:
            return False, f"git add failed: {add_result.stderr}"

        # Check if there are changes to commit
        status = subprocess.run(
            ["git", "diff", "--cached", "--quiet"],
            capture_output=True, text=True, cwd=project, timeout=10
        )
        if status.returncode == 0:
            # No staged changes — get current HEAD hash
            head = subprocess.run(
                ["git", "rev-parse", "--short", "HEAD"],
                capture_output=True, text=True, cwd=project, timeout=5
            )
            return True, head.stdout.strip()

        # Commit
        commit_result = subprocess.run(
            ["git", "commit", "-m", message],
            capture_output=True, text=True, cwd=project, timeout=30
        )
        if commit_result.returncode != 0:
            return False, f"git commit failed: {commit_result.stderr}"

        # Get commit hash
        hash_result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, cwd=project, timeout=5
        )
        return True, hash_result.stdout.strip()

    except subprocess.TimeoutExpired:
        return False, "Git operation timed out"
    except FileNotFoundError:
        return False, "Git not found on PATH"


def write_handoff_yaml(project: str, story_id: str, status: dict) -> str | None:
    """Write a minimal YAML handoff to the standard continuity directory.

    This bridges Ralph state into the handoff scanner so session-start-continuity.ts
    can find Ralph progress through the standard handoff mechanism.
    Returns the handoff path on success, None on failure.
    """
    try:
        handoff_dir = os.path.join(project, "thoughts", "shared", "handoffs", f"ralph-{story_id}")
        os.makedirs(handoff_dir, exist_ok=True)

        # Collect state info
        tasks = status.get("tasks", [])
        completed = [t for t in tasks if t.get("status") in ("complete", "completed")]
        in_progress = [t for t in tasks if t.get("status") in ("in_progress", "in-progress")]
        pending = [t for t in tasks if t.get("status") == "pending"]
        total = len(tasks)

        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        current_task = in_progress[0] if in_progress else (pending[0] if pending else None)

        lines = [
            "---",
            f"session: ralph-{story_id}",
            f"date: {datetime.now(timezone.utc).strftime('%Y-%m-%d')}",
            f"status: {'active' if status.get('session', {}).get('active') else 'paused'}",
            "outcome: IN_PROGRESS",
            "---",
            "",
            f"goal: Ralph orchestration for story {story_id}",
            f"now: {current_task.get('name', 'awaiting next task') if current_task else 'all tasks complete'}",
            "",
            f"progress: {len(completed)}/{total} tasks complete",
            f"stage: {status.get('stage', 'unknown')}",
            f"iteration: {status.get('iteration', 0)}/{status.get('max_iterations', 30)}",
            "",
            "done_this_session:",
        ]

        for t in completed[-5:]:  # Last 5 completed tasks
            lines.append(f"  - task: \"{t.get('name', t.get('id', '?'))}\"")
            if t.get("commit"):
                lines.append(f"    commit: {t['commit']}")

        if pending:
            lines.append("")
            lines.append("next:")
            for t in pending[:5]:  # Next 5 pending
                deps = t.get("depends_on", [])
                dep_str = f" (blocked by: {', '.join(deps)})" if deps else ""
                lines.append(f"  - {t.get('name', t.get('id', '?'))}{dep_str}")

        retry_queue = status.get("retry_queue", [])
        if retry_queue:
            lines.append("")
            lines.append("blockers:")
            for r in retry_queue[:3]:
                lines.append(f"  - \"{r}\"")

        content = "\n".join(lines) + "\n"

        # Write as current handoff (overwrite — only latest matters)
        handoff_path = os.path.join(handoff_dir, f"{datetime.now(timezone.utc).strftime('%Y-%m-%d')}_current.yaml")
        with open(handoff_path, "w", encoding="utf-8") as f:
            f.write(content)

        return handoff_path
    except Exception:
        return None  # Fail open


def cmd_commit(args) -> int:
    """Checkpoint: git commit + state update."""
    project = os.path.abspath(args.project or os.getcwd())

    # Get story ID from state
    status = run_state_cmd(project, "status")
    story_id = status.get("story_id", "UNKNOWN")

    # Build commit message
    task_id = args.task_id or ""
    task_desc = args.message or "checkpoint"
    commit_msg = f"ralph: {story_id} task {task_id} - {task_desc}"

    # Git commit
    success, commit_hash = git_add_commit(project, commit_msg)

    if not success:
        print(json.dumps({
            "success": False,
            "error": f"Git commit failed: {commit_hash}"
        }))
        return 1

    # Record checkpoint in state
    ckpt_result = run_state_cmd(
        project, "checkpoint",
        "--commit", commit_hash,
        "--task-id", task_id,
        "--message", task_desc
    )

    # Also mark task as complete with commit hash if task-id provided
    if task_id:
        run_state_cmd(project, "task-complete", "--id", task_id, "--commit", commit_hash)

    # Write handoff YAML for continuity system integration
    handoff_path = write_handoff_yaml(project, story_id, status)

    print(json.dumps({
        "success": True,
        "commit": commit_hash,
        "message": commit_msg,
        "checkpoint": ckpt_result.get("checkpoint", {}),
        "story_id": story_id,
        "handoff": handoff_path,
    }))
    return 0


def cmd_list(args) -> int:
    """List all checkpoints."""
    project = os.path.abspath(args.project or os.getcwd())
    status = run_state_cmd(project, "status")

    checkpoints = status.get("checkpoints", [])
    if not checkpoints:
        print(json.dumps({"success": True, "checkpoints": [], "message": "No checkpoints yet"}))
        return 0

    print(json.dumps({"success": True, "checkpoints": checkpoints, "total": len(checkpoints)}))
    return 0


def cmd_last(args) -> int:
    """Get last checkpoint info."""
    project = os.path.abspath(args.project or os.getcwd())
    status = run_state_cmd(project, "status")

    checkpoints = status.get("checkpoints", [])
    if not checkpoints:
        print(json.dumps({"success": True, "checkpoint": None, "message": "No checkpoints yet"}))
        return 0

    last = checkpoints[-1]
    print(json.dumps({"success": True, "checkpoint": last}))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Ralph Checkpoint Manager")
    parser.add_argument("--project", "-p", help="Project path (default: cwd)")
    subparsers = parser.add_subparsers(dest="command")

    # commit
    commit_p = subparsers.add_parser("commit", help="Create checkpoint commit")
    commit_p.add_argument("--task-id", help="Task ID being checkpointed")
    commit_p.add_argument("--message", "-m", help="Checkpoint description")

    # list
    subparsers.add_parser("list", help="List all checkpoints")

    # last
    subparsers.add_parser("last", help="Get last checkpoint")

    args = parser.parse_args()

    commands = {
        "commit": cmd_commit,
        "list": cmd_list,
        "last": cmd_last,
    }

    handler = commands.get(args.command)
    if handler:
        return handler(args)
    else:
        parser.print_help()
        return 1


if __name__ == "__main__":
    sys.exit(main())
