#!/usr/bin/env python3
"""Ralph Skill Query - Helper for Ralph iterations to query skill-router.

Called from within Ralph iterations to get skill/agent recommendations
for the current task being worked on.

USAGE (from within Ralph iteration):
    # Query skills for current task
    uv run python ~/.claude/scripts/ralph/ralph-skill-query.py \
        --task "implement user authentication" \
        --files src/auth.ts src/middleware.ts

    # JSON input mode
    echo '{"task": "fix database error", "files": []}' | \
        uv run python ~/.claude/scripts/ralph/ralph-skill-query.py

OUTPUT:
    JSON with recommended skills and whether to load them.

This script wraps the core skill_router.py to provide Ralph-specific
formatting and integration.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

# Add scripts/core/core to path for import
scripts_path = Path(__file__).parent.parent / "core" / "core"
sys.path.insert(0, str(scripts_path))

from skill_router import route, RouterOutput


def format_for_ralph(result: RouterOutput) -> dict:
    """Format skill-router output for Ralph consumption."""
    # Extract mandatory skills that should be loaded
    mandatory_skills = [
        s for s in result.skills
        if s.enforcement in ('mandatory', 'block')
    ]

    # Get skill content paths
    home = Path.home()
    skill_contents = {}
    for skill in mandatory_skills:
        skill_path = home / ".claude" / "skills" / skill.name / "SKILL.md"
        if skill_path.exists():
            skill_contents[skill.name] = str(skill_path)

    return {
        "success": True,
        "complexity_score": round(result.complexity_score, 3),
        "recommended_pattern": result.recommended_pattern,
        "mandatory_skills": [
            {
                "name": s.name,
                "priority": s.priority,
                "confidence": round(s.confidence, 3),
                "reason": s.reason,
                "skill_path": skill_contents.get(s.name),
            }
            for s in mandatory_skills
        ],
        "suggested_skills": [
            {
                "name": s.name,
                "priority": s.priority,
                "confidence": round(s.confidence, 3),
                "reason": s.reason,
            }
            for s in result.skills
            if s.enforcement not in ('mandatory', 'block')
        ],
        "recommended_agents": [
            {
                "name": a.name,
                "type": a.type,
                "confidence": round(a.confidence, 3),
                "reason": a.reason,
            }
            for a in result.agents[:3]  # Top 3 agents
        ],
        "ralph_instructions": generate_ralph_instructions(result, mandatory_skills),
    }


def generate_ralph_instructions(result: RouterOutput, mandatory: list) -> str:
    """Generate instruction text for Ralph iteration."""
    lines = []

    if mandatory:
        lines.append("## MANDATORY SKILLS FOR THIS TASK")
        lines.append("")
        for skill in mandatory:
            lines.append(f"Load and apply: {skill.name}")
            lines.append(f"  Reason: {skill.reason}")
            lines.append(f"  Path: ~/.claude/skills/{skill.name}/SKILL.md")
            lines.append("")

    if result.recommended_pattern:
        lines.append(f"## RECOMMENDED APPROACH: {result.recommended_pattern}")
        lines.append("")

    if result.agents:
        lines.append("## SUGGESTED AGENTS (if sub-tasks needed)")
        for agent in result.agents[:3]:
            lines.append(f"  - {agent.name} ({agent.type})")
        lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Ralph Skill Query")
    parser.add_argument("--task", type=str, help="Task description")
    parser.add_argument("--context", type=str, default="", help="Context")
    parser.add_argument("--files", nargs="*", default=[], help="Files involved")
    parser.add_argument("--cwd", type=str, default="", help="Working directory")
    parser.add_argument("--raw", action="store_true", help="Return raw router output")

    args = parser.parse_args()

    # Try stdin JSON first
    if not sys.stdin.isatty():
        try:
            input_data = json.load(sys.stdin)
            task = input_data.get("task", "")
            context = input_data.get("context", "")
            files = input_data.get("files", [])
            cwd = input_data.get("cwd", "")
        except json.JSONDecodeError:
            print(json.dumps({"success": False, "error": "Invalid JSON input"}))
            sys.exit(1)
    elif args.task:
        task = args.task
        context = args.context
        files = args.files
        cwd = args.cwd
    else:
        parser.print_help()
        sys.exit(1)

    # Route
    result = route(
        task=task,
        context=context,
        files=files,
        cwd=cwd,
    )

    # Output
    if args.raw:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        output = format_for_ralph(result)
        print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
