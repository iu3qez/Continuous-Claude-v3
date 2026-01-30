#!/usr/bin/env python3
"""
prd-to-ralph.py - Convert ai-dev-tasks format to Ralph format

Reads:
  /tasks/prd-*.md - PRD document
  /tasks/tasks-*.md - Task breakdown

Outputs:
  .ralph/PRD.json - Ralph CLI format
  .ralph/IMPLEMENTATION_PLAN.md - Ralph planning format

Usage:
  python prd-to-ralph.py <project_path> [--story-id STORY-001]
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional


def find_prd_file(tasks_dir: Path) -> Optional[Path]:
    """Find the most recent PRD file."""
    prd_files = list(tasks_dir.glob("prd-*.md"))
    if not prd_files:
        return None
    return max(prd_files, key=lambda p: p.stat().st_mtime)


def find_tasks_file(tasks_dir: Path) -> Optional[Path]:
    """Find the most recent tasks file."""
    tasks_files = list(tasks_dir.glob("tasks-*.md"))
    if not tasks_files:
        return None
    return max(tasks_files, key=lambda p: p.stat().st_mtime)


def parse_prd_markdown(content: str) -> dict:
    """Parse ai-dev-tasks PRD markdown into structured format."""
    result = {
        "title": "",
        "overview": "",
        "goals": [],
        "user_stories": [],
        "requirements": [],
        "non_goals": [],
        "success_metrics": [],
        "open_questions": [],
    }

    current_section = None
    current_content = []

    for line in content.split("\n"):
        line = line.strip()

        # Detect section headers
        if line.startswith("# "):
            result["title"] = line[2:].replace(" PRD", "").strip()
        elif line.startswith("## "):
            # Save previous section
            if current_section and current_content:
                save_section(result, current_section, current_content)

            # Start new section
            header = line[3:].lower()
            if "introduction" in header or "overview" in header:
                current_section = "overview"
            elif "goal" in header:
                current_section = "goals"
            elif "user stor" in header:
                current_section = "user_stories"
            elif "functional" in header or "requirement" in header:
                current_section = "requirements"
            elif "non-goal" in header or "out of scope" in header:
                current_section = "non_goals"
            elif "success" in header or "metric" in header:
                current_section = "success_metrics"
            elif "open question" in header:
                current_section = "open_questions"
            else:
                current_section = None
            current_content = []
        elif current_section and line:
            current_content.append(line)

    # Save last section
    if current_section and current_content:
        save_section(result, current_section, current_content)

    return result


def save_section(result: dict, section: str, content: list):
    """Save parsed content to appropriate section."""
    if section == "overview":
        result["overview"] = " ".join(content)
    elif section in ["goals", "non_goals", "success_metrics", "open_questions"]:
        # Parse as list items
        items = []
        for line in content:
            if line.startswith(("- ", "* ", "• ")):
                items.append(line[2:].strip())
            elif re.match(r"^\d+\.", line):
                items.append(re.sub(r"^\d+\.\s*", "", line).strip())
            elif items:
                items[-1] += " " + line
            else:
                items.append(line)
        result[section] = items
    elif section == "user_stories":
        # Parse user story format
        current_story = {}
        for line in content:
            if line.lower().startswith("**as a"):
                current_story["as_a"] = line.replace("**As a**", "").replace("**as a**", "").strip()
            elif line.lower().startswith("**i want"):
                current_story["i_want"] = line.replace("**I want**", "").replace("**i want**", "").strip()
            elif line.lower().startswith("**so that"):
                current_story["so_that"] = line.replace("**So that**", "").replace("**so that**", "").strip()
                if current_story:
                    result["user_stories"].append(current_story)
                    current_story = {}
    elif section == "requirements":
        # Parse numbered requirements
        items = []
        for line in content:
            if re.match(r"^\d+\.", line):
                items.append(re.sub(r"^\d+\.\s*", "", line).strip())
            elif items:
                items[-1] += " " + line
        result["requirements"] = items


def parse_tasks_markdown(content: str) -> list:
    """Parse ai-dev-tasks tasks markdown into structured format."""
    tasks = []
    current_parent = None

    for line in content.split("\n"):
        # Match checkbox items
        checkbox_match = re.match(r"^(\s*)- \[([ x])\] (\d+\.\d+)\s+(.+)", line)
        if checkbox_match:
            indent, checked, task_id, description = checkbox_match.groups()
            task = {
                "id": task_id,
                "description": description.strip(),
                "completed": checked == "x",
                "subtasks": [],
            }

            # Determine if parent or subtask
            if "." in task_id:
                major, minor = task_id.split(".")
                if minor == "0":
                    # Parent task
                    current_parent = task
                    tasks.append(task)
                elif current_parent:
                    # Subtask
                    current_parent["subtasks"].append(task)

    return tasks


def generate_ralph_prd(prd_data: dict, story_id: str) -> dict:
    """Generate Ralph CLI PRD.json format."""
    stories = []

    # Convert requirements to stories
    for i, req in enumerate(prd_data.get("requirements", []), 1):
        story = {
            "id": f"{story_id}-{i:03d}",
            "title": req[:80] + "..." if len(req) > 80 else req,
            "description": req,
            "acceptance_criteria": [],
            "status": "open",
        }
        stories.append(story)

    return {
        "project": prd_data.get("title", "Unknown Project"),
        "version": "1.0.0",
        "generated": datetime.now().isoformat(),
        "overview": prd_data.get("overview", ""),
        "goals": prd_data.get("goals", []),
        "non_goals": prd_data.get("non_goals", []),
        "stories": stories,
    }


def generate_implementation_plan(tasks: list, prd_data: dict, story_id: str) -> str:
    """Generate Ralph IMPLEMENTATION_PLAN.md format."""
    lines = [
        "# Implementation Plan",
        "",
        f"**Story:** {story_id}",
        f"**Generated:** {datetime.now().isoformat()}",
        "**Status:** IN_PROGRESS",
        "",
        "## Overview",
        prd_data.get("overview", "No overview provided."),
        "",
        "## Tasks",
        "",
    ]

    for task in tasks:
        status = "[x]" if task["completed"] else "[ ]"
        lines.append(f"- {status} {task['id']} {task['description']}")
        for subtask in task.get("subtasks", []):
            sub_status = "[x]" if subtask["completed"] else "[ ]"
            lines.append(f"  - {sub_status} {subtask['id']} {subtask['description']}")

    lines.extend([
        "",
        "## Notes",
        "- Follow existing codebase patterns",
        "- Write tests for new functionality",
        "- Update documentation as needed",
        "",
        "---",
        "*Generated by prd-to-ralph.py*",
    ])

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Convert ai-dev-tasks to Ralph format")
    parser.add_argument("project_path", help="Path to project directory")
    parser.add_argument("--story-id", default="STORY-001", help="Story ID for Ralph")
    parser.add_argument("--output-dir", default=".ralph", help="Output directory")
    args = parser.parse_args()

    project_path = Path(args.project_path).resolve()
    tasks_dir = project_path / "tasks"
    output_dir = project_path / args.output_dir

    if not tasks_dir.exists():
        print(f"Error: tasks directory not found: {tasks_dir}", file=sys.stderr)
        sys.exit(1)

    # Find input files
    prd_file = find_prd_file(tasks_dir)
    tasks_file = find_tasks_file(tasks_dir)

    if not prd_file:
        print(f"Error: No prd-*.md file found in {tasks_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"Reading PRD from: {prd_file}")

    # Parse PRD
    prd_content = prd_file.read_text(encoding="utf-8")
    prd_data = parse_prd_markdown(prd_content)

    # Parse tasks if available
    tasks = []
    if tasks_file:
        print(f"Reading tasks from: {tasks_file}")
        tasks_content = tasks_file.read_text(encoding="utf-8")
        tasks = parse_tasks_markdown(tasks_content)

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)

    # Generate Ralph PRD.json
    ralph_prd = generate_ralph_prd(prd_data, args.story_id)
    prd_output = output_dir / "PRD.json"
    prd_output.write_text(json.dumps(ralph_prd, indent=2), encoding="utf-8")
    print(f"Written: {prd_output}")

    # Generate IMPLEMENTATION_PLAN.md
    impl_plan = generate_implementation_plan(tasks, prd_data, args.story_id)
    plan_output = output_dir / "IMPLEMENTATION_PLAN.md"
    plan_output.write_text(impl_plan, encoding="utf-8")
    print(f"Written: {plan_output}")

    print(f"\nRalph format generated successfully!")
    print(f"  Stories: {len(ralph_prd['stories'])}")
    print(f"  Tasks: {len(tasks)}")


if __name__ == "__main__":
    main()
