---
name: ralph
description: Autonomous feature development - PRD-driven, Docker-sandboxed, deterministic loops
allowed-tools: [Bash, Read, Write, Edit, Task, Glob, Grep]
---

# Ralph Skill

Autonomous feature development using deterministic loops, PRD-driven planning, and Docker-sandboxed implementation.

## CRITICAL: Template Enforcement [BLOCK]

**YOU MUST USE ai-dev-tasks TEMPLATES. NO EXCEPTIONS.**

Before generating ANY PRD or task list:

```bash
# MANDATORY - Read these templates FIRST
cat ~/.claude/ai-dev-tasks/create-prd.md    # For PRDs
cat ~/.claude/ai-dev-tasks/generate-tasks.md # For tasks
```

### Workflow Requirements (Enforced by Hook)

**For PRDs:**
1. ✓ Ask 3-5 clarifying questions with A/B/C/D options
2. ✓ WAIT for user answers before generating PRD
3. ✓ Use template structure (Goals, User Stories, Requirements, Non-Goals)
4. ✓ Save to `/tasks/prd-<feature>.md`

**For Tasks:**
1. ✓ Generate parent tasks ONLY first
2. ✓ WAIT for user to say "Go"
3. ✓ Then generate sub-tasks
4. ✓ Use checkbox format: `- [ ] 1.1 Task description`
5. ✓ Save to `/tasks/tasks-<feature>.md`

**BLOCKED by prd-task-template-enforcer hook:**
- ❌ Generating PRD without clarifying questions
- ❌ Generating all tasks at once (skipping 2-phase)
- ❌ Saving to wrong location (e.g., `/docs/`)
- ❌ Using wrong format (e.g., `### T1.1` instead of `- [ ] 1.1`)

**If hook blocks your output:** Read the template, follow the workflow, try again.

---

## Triggers

- `/ralph` - Start Ralph workflow
- `/ralph plan` - Generate implementation plan only
- `/ralph build <story-id>` - Build specific story
- Natural language: "build feature", "create PRD", "new feature", "ralph mode"

## When to Use

Use Ralph when:
- Building new features from scratch
- Implementing well-defined requirements
- Need autonomous "set and forget" development
- Want deterministic, repeatable loops

Do NOT use Ralph for:
- Quick fixes (use spark)
- Debugging (use debug-agent)
- Research tasks (use oracle/scout)
- Daily Claude Code conversation

## Workflow Overview

```
1. PRD Generation (ai-dev-tasks templates)
   ↓
2. Task Breakdown (generate-tasks.md)
   ↓
3. Format Conversion (prd-to-ralph.py)
   ↓
4. Story Splitting (if needed)
   ↓
5. Ralph Loops (spawn-ralph.sh)
   ↓
6. Review & Merge (Maestro)
```

## Phase 1: Requirements Gathering

When user describes a feature:

### 1.1 Load PRD Template
Reference the ai-dev-tasks template:
```
@~/.claude/ai-dev-tasks/create-prd.md
```

### 1.2 Interview User
Ask 3-5 clarifying questions with A/B/C options:
- What's the core functionality?
- Who's the target user?
- What's out of scope?
- Technical constraints?

### 1.3 Generate PRD
Create `/tasks/prd-<feature>.md` following the template structure.

## Phase 2: Task Breakdown

### 2.1 Load Tasks Template
Reference:
```
@~/.claude/ai-dev-tasks/generate-tasks.md
```

### 2.2 Generate Parent Tasks
Present 5-7 high-level tasks. Wait for "Go" confirmation.

### 2.3 Generate Sub-Tasks
Break each parent into atomic sub-tasks (1.0 → 1.1, 1.2, etc.)

### 2.4 Save Tasks
Create `/tasks/tasks-<feature>.md`

## Phase 3: Format Conversion

Convert to Ralph format:

```bash
python ~/.claude/scripts/ralph/prd-to-ralph.py . --story-id STORY-001
```

This creates:
- `.ralph/PRD.json` - Ralph CLI format
- `.ralph/IMPLEMENTATION_PLAN.md` - Task checklist

## Phase 4: Story Evaluation

Check if story fits in single loop (~100k tokens):

**Estimation Rules:**
- Each file read ≈ 1-3k tokens
- Each file write ≈ 0.5-2k tokens
- Test runs ≈ 5-10k tokens
- Aim for 10-15 tasks max per story

**If too large:**
1. Split into multiple stories (STORY-001, STORY-002)
2. Each story = independent, shippable increment
3. Create separate IMPLEMENTATION_PLAN.md per story

## Phase 5: Spawn Ralph Loop

For each story:

```bash
~/.claude/scripts/ralph/spawn-ralph.sh \
  <project_path> \
  <story-id> \
  <worktree-name>
```

### Spawn Options
- `--dry-run` - Preview without executing
- `--keep-worktree` - Don't cleanup on completion
- `--verbose` - Detailed output

### Monitor Progress
Ralph outputs:
- `<TASK_COMPLETE/>` - Task done, loop continues
- `<COMPLETE/>` - All tasks done
- `<BLOCKED/>` - Needs intervention

## Phase 6: Review & Merge

After Ralph completes:

### 6.1 Review Changes
```bash
cd <worktree>
git log --oneline -10
git diff main...HEAD
```

### 6.2 Run Tests
```bash
npm test  # or pytest, go test, etc.
```

### 6.3 Decide Next Action
| Outcome | Action |
|---------|--------|
| Tests pass | Merge to main |
| Tests fail | Spawn fix loop |
| More work needed | Add tasks, spawn new loop |
| Quality issues | Spawn review agent |

### 6.4 Merge
```bash
git checkout main
git merge ralph/<worktree>
git branch -d ralph/<worktree>
```

## Commands Reference

### /ralph
Full workflow: PRD → Tasks → Build → Review

### /ralph plan
Generate PRD and tasks only, no build.

### /ralph build <story-id>
Build specific story from existing .ralph/ state.

### /ralph status
Show current Ralph state:
- Active worktrees
- Story progress
- Recent completions

### /ralph cleanup
Remove orphaned worktrees and branches.

## Files Reference

| Path | Purpose |
|------|---------|
| `~/.claude/templates/ralph/PROMPT_BUILD.md` | Build loop prompt |
| `~/.claude/templates/ralph/PROMPT_PLAN.md` | Planning loop prompt |
| `~/.claude/scripts/ralph/spawn-ralph.sh` | Loop spawner |
| `~/.claude/scripts/ralph/prd-to-ralph.py` | Format converter |
| `~/.claude/docker/ralph/Dockerfile` | Container image |
| `/tasks/prd-*.md` | Human-readable PRD |
| `/tasks/tasks-*.md` | Task breakdown |
| `.ralph/PRD.json` | Ralph CLI format |
| `.ralph/IMPLEMENTATION_PLAN.md` | Implementation checklist |
| `.ralph/runs/*.md` | Loop completion reports |

## Integration with Continuous Claude

### Memory
- Ralph queries learnings at loop start
- Ralph stores learnings during implementation
- Learnings namespace: `ralph-<story-id>`

### Hooks
- Hooks mounted read-only in container
- Backpressure via test/lint hooks
- File claims prevent conflicts

### Maestro
- Maestro is single source of truth
- Maestro spawns/monitors Ralph
- Maestro reviews/merges/escalates

### Skill-Router Integration

Each Ralph iteration should query the skill-router for appropriate skills:

```bash
# Query skills for current task
uv run python ~/.claude/scripts/ralph/ralph-skill-query.py \
  --task "implement authentication middleware" \
  --files src/auth.ts src/middleware.ts
```

Or with JSON input:
```bash
echo '{"task": "fix database connection", "files": ["src/db/pool.ts"]}' | \
  uv run python ~/.claude/scripts/ralph/ralph-skill-query.py
```

**Output includes:**
- `mandatory_skills` - Skills that MUST be loaded for this task
- `suggested_skills` - Optional helpful skills
- `recommended_agents` - If sub-tasks need agent dispatch
- `ralph_instructions` - Pre-formatted instruction text

**Example iteration flow:**
```
1. Read next task from IMPLEMENTATION_PLAN.md
2. Query skill-router: ralph-skill-query.py --task "<task desc>" --files <affected files>
3. Load mandatory skills from output
4. Apply skill guidance during implementation
5. Commit and continue
```

This ensures each Ralph iteration uses the appropriate skills for its task, improving consistency and outcomes.

## Example Session

```
User: Build a contact form with email validation

Claude (Maestro):
1. "Let me gather requirements using the ai-dev-tasks template..."
2. [Asks clarifying questions]
3. "Generating PRD to /tasks/prd-contact-form.md..."
4. "Breaking into tasks..."
5. "Converting to Ralph format..."
6. "Story size looks good (~12 tasks). Spawning Ralph loop..."
7. [Spawns Docker container]
8. [Ralph implements, tests, commits]
9. "Ralph completed! Reviewing changes..."
10. "All tests pass. Merging to main."
```

---

*Ralph Skill v1.0*
*Autonomous Feature Development for Continuous Claude*
