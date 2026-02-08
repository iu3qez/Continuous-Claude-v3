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

    print(json.dumps({
        "success": True,
        "commit": commit_hash,
        "message": commit_msg,
        "checkpoint": ckpt_result.get("checkpoint", {}),
        "story_id": story_id,
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
