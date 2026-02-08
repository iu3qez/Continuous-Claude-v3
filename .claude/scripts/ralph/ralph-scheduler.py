#!/usr/bin/env python3
"""
Ralph Scheduler — Dependency-aware task scheduling

Reads the unified state (.ralph/state.json) and determines:
- Which tasks are ready to execute (all deps complete)
- Which tasks can run in parallel (no file overlap)
- Optimal execution batches

Usage:
  python ralph-scheduler.py -p <project_dir> ready-tasks
  python ralph-scheduler.py -p <project_dir> parallel-batch
  python ralph-scheduler.py -p <project_dir> critical-path
  python ralph-scheduler.py -p <project_dir> visualize
"""

import argparse
import json
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Set, Optional, Tuple


@dataclass
class TaskInfo:
    id: str
    name: str
    status: str
    agent: str
    depends_on: List[str] = field(default_factory=list)
    files: List[str] = field(default_factory=list)
    retries: int = 0
    last_error: Optional[str] = None


def load_state(project_dir: str) -> dict:
    state_path = Path(project_dir) / ".ralph" / "state.json"
    if not state_path.exists():
        print(json.dumps({"error": f"State file not found: {state_path}"}))
        sys.exit(1)

    with open(state_path) as f:
        return json.load(f)


def get_tasks(state: dict) -> Dict[str, TaskInfo]:
    tasks = {}
    raw_tasks = state.get("tasks", [])

    # Handle both list format (from ralph-state-v2.py) and dict format
    if isinstance(raw_tasks, list):
        for task_data in raw_tasks:
            task_id = task_data.get("id", "")
            tasks[task_id] = TaskInfo(
                id=task_id,
                name=task_data.get("name", ""),
                status=task_data.get("status", "pending"),
                agent=task_data.get("agent", ""),
                depends_on=task_data.get("depends_on", []),
                files=task_data.get("files", []),
                retries=task_data.get("retries", 0),
                last_error=task_data.get("last_error"),
            )
    else:
        for task_id, task_data in raw_tasks.items():
            tasks[task_id] = TaskInfo(
                id=task_id,
                name=task_data.get("name", ""),
                status=task_data.get("status", "pending"),
                agent=task_data.get("agent", ""),
                depends_on=task_data.get("depends_on", []),
                files=task_data.get("files", []),
                retries=task_data.get("retries", 0),
                last_error=task_data.get("last_error"),
            )
    return tasks


def get_ready_tasks(tasks: Dict[str, TaskInfo]) -> List[TaskInfo]:
    """Find tasks whose dependencies are all completed."""
    completed = {tid for tid, t in tasks.items() if t.status in ("completed", "complete")}
    ready = []

    for tid, task in tasks.items():
        if task.status != "pending":
            continue
        # All dependencies must be completed
        if all(dep in completed for dep in task.depends_on):
            ready.append(task)

    return ready


def get_parallel_batch(tasks: Dict[str, TaskInfo]) -> List[List[TaskInfo]]:
    """Find groups of tasks that can run in parallel (no file overlap).

    Returns a list of batches. Each batch contains tasks that can
    run simultaneously because their files don't overlap.
    """
    ready = get_ready_tasks(tasks)
    if not ready:
        return []

    batches: List[List[TaskInfo]] = []
    remaining = list(ready)

    while remaining:
        batch: List[TaskInfo] = []
        used_files: Set[str] = set()

        for task in remaining:
            task_files = set(task.files)
            if not task_files or not task_files.intersection(used_files):
                batch.append(task)
                used_files.update(task_files)

        if not batch:
            # Safety: if no tasks could be added (shouldn't happen), break
            break

        batches.append(batch)
        batch_ids = {t.id for t in batch}
        remaining = [t for t in remaining if t.id not in batch_ids]

    return batches


def get_critical_path(tasks: Dict[str, TaskInfo]) -> List[str]:
    """Find the longest dependency chain (critical path)."""
    memo: Dict[str, int] = {}

    def chain_length(task_id: str) -> int:
        if task_id in memo:
            return memo[task_id]
        task = tasks.get(task_id)
        if not task or not task.depends_on:
            memo[task_id] = 1
            return 1
        max_dep = max(chain_length(d) for d in task.depends_on if d in tasks)
        memo[task_id] = max_dep + 1
        return memo[task_id]

    # Find the task with the longest chain
    if not tasks:
        return []

    for tid in tasks:
        chain_length(tid)

    if not memo:
        return []

    # Reconstruct path from longest chain
    longest_id = max(memo, key=lambda k: memo[k])
    path = []
    current = longest_id

    while current:
        path.append(current)
        task = tasks.get(current)
        if not task or not task.depends_on:
            break
        # Find the dependency with the longest chain
        deps_in_tasks = [d for d in task.depends_on if d in tasks]
        if not deps_in_tasks:
            break
        current = max(deps_in_tasks, key=lambda d: memo.get(d, 0))

    path.reverse()
    return path


def visualize(tasks: Dict[str, TaskInfo]) -> str:
    """Create a simple text visualization of the dependency graph."""
    lines = []
    lines.append("Task Dependency Graph:")
    lines.append("=" * 50)

    # Group by status
    statuses = {"completed": "[x]", "complete": "[x]", "in_progress": "[>]", "pending": "[ ]", "failed": "[!]", "blocked": "[#]"}

    for tid in sorted(tasks.keys()):
        task = tasks[tid]
        icon = statuses.get(task.status, "?")
        deps = ", ".join(task.depends_on) if task.depends_on else "none"
        files = ", ".join(task.files[:3]) if task.files else "-"
        if len(task.files) > 3:
            files += f" (+{len(task.files) - 3} more)"

        lines.append(f"  {icon} {tid}: {task.name}")
        lines.append(f"      agent: {task.agent} | deps: {deps} | files: {files}")

    lines.append("=" * 50)

    # Show ready tasks
    ready = get_ready_tasks(tasks)
    if ready:
        lines.append(f"\nReady to execute ({len(ready)}):")
        for t in ready:
            lines.append(f"  >{t.id}: {t.name} [{t.agent}]")

    # Show parallel batches
    batches = get_parallel_batch(tasks)
    if batches:
        lines.append(f"\nParallel batches ({len(batches)}):")
        for i, batch in enumerate(batches):
            ids = ", ".join(t.id for t in batch)
            lines.append(f"  Batch {i + 1}: {ids}")

    # Show critical path
    path = get_critical_path(tasks)
    if path:
        lines.append(f"\nCritical path ({len(path)} tasks):")
        lines.append(f"  {' -> '.join(path)}")

    return "\n".join(lines)


def cmd_ready_tasks(args):
    state = load_state(args.project)
    tasks = get_tasks(state)
    ready = get_ready_tasks(tasks)
    result = [{"id": t.id, "name": t.name, "agent": t.agent, "files": t.files} for t in ready]
    print(json.dumps(result, indent=2))


def cmd_parallel_batch(args):
    state = load_state(args.project)
    tasks = get_tasks(state)
    batches = get_parallel_batch(tasks)
    result = [
        [{"id": t.id, "name": t.name, "agent": t.agent, "files": t.files} for t in batch]
        for batch in batches
    ]
    print(json.dumps(result, indent=2))


def cmd_critical_path(args):
    state = load_state(args.project)
    tasks = get_tasks(state)
    path = get_critical_path(tasks)
    print(json.dumps({"critical_path": path, "length": len(path)}))


def cmd_visualize(args):
    state = load_state(args.project)
    tasks = get_tasks(state)
    print(visualize(tasks))


def main():
    parser = argparse.ArgumentParser(description="Ralph Task Scheduler")
    parser.add_argument("-p", "--project", default=".", help="Project directory")

    sub = parser.add_subparsers(dest="command")

    sub.add_parser("ready-tasks", help="List tasks ready to execute")
    sub.add_parser("parallel-batch", help="Get parallelizable task batches")
    sub.add_parser("critical-path", help="Find the critical path")
    sub.add_parser("visualize", help="Text visualization of dependency graph")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    commands = {
        "ready-tasks": cmd_ready_tasks,
        "parallel-batch": cmd_parallel_batch,
        "critical-path": cmd_critical_path,
        "visualize": cmd_visualize,
    }

    commands[args.command](args)


if __name__ == "__main__":
    main()
