# Ralph Quickstart Guide

Ralph is Maestro's autonomous development mode. It orchestrates specialized agents to build features from a PRD — Ralph **never** writes code directly. Think of it as a project manager that delegates every implementation task to the right specialist agent.

## Prerequisites

Before starting a Ralph session:

1. **Docker & PostgreSQL running** — Ralph uses the memory system for context
   ```bash
   cd ~/.claude/docker && docker compose up -d
   ```
2. **Hooks built** — Ralph's enforcement hooks must be compiled
   ```bash
   cd ~/.claude/hooks && npm run build
   ```
3. **Not on main branch** — feature work must happen on a feature branch
   ```bash
   git checkout -b feature/your-feature
   ```

## Starting a Session

Type `/ralph` in Claude Code. Ralph activates in 5 phases:

```
Phase 0: Context Loading    (memory recall, knowledge tree, ROADMAP check)
Phase 1: Requirements       (interview you, generate PRD)
Phase 2: Task Breakdown     (split PRD into atomic sub-tasks)
Phase 3: Delegation Loop    (spawn agents, verify results, iterate)
Phase 4: Review & Merge     (final verification, commit, store learnings)
```

### What Happens When You Start

1. Ralph loads context from the memory system and knowledge tree
2. Ralph asks you 3-5 clarifying questions about the feature (using prior context to ask informed questions)
3. You approve the PRD and task breakdown
4. Ralph delegates each task to agents, verifies results, and loops until done
5. Final merge to main when all tasks pass verification

## The 5 Phases

### Phase 0: Context Loading

Ralph checks memory for similar past work, loads the project's knowledge tree, and reads ROADMAP.md. You'll see a summary like:

> "I found 3 relevant learnings from past work... The project uses React/TypeScript with Express backend... Current ROADMAP goal: user dashboard improvements..."

### Phase 1: Requirements Gathering

Ralph loads the PRD template from `~/.claude/ai-dev-tasks/create-prd.md` and interviews you with A/B/C option questions:

- Core functionality?
- Target user?
- Out of scope?
- Technical constraints?

Output: `/tasks/prd-<feature>.md`

### Phase 2: Task Breakdown

Ralph breaks the PRD into parent tasks (5-7) and sub-tasks (e.g., 1.1, 1.2, 1.3). You see the task list and approve with "Go".

Output: `/tasks/tasks-<feature>.md`

### Phase 3: Delegation Loop

This is the core loop. For each task, Ralph:

1. Selects the right agent (see Agent Map below)
2. Spawns it via the Task tool with full context
3. Waits for completion
4. **Independently verifies** the result (tests, types, lint)
5. Marks task complete only if ALL checks pass
6. Handles failures via retry escalation

Independent tasks run in parallel. Dependent tasks run sequentially.

### Phase 4: Review & Merge

After all tasks complete:
1. Final test/typecheck/lint pass
2. Summary of what was built
3. Merge to main
4. Learnings stored in the memory system for future sessions

## Agent Delegation Map

| Task Type | Agent | When Used |
|-----------|-------|-----------|
| Code implementation | `kraken` | New features, multi-file changes |
| Quick fixes (<20 lines) | `spark` | Small fixes, config changes |
| Unit/integration tests | `arbiter` | Test writing and validation |
| E2E tests | `atlas` | End-to-end test scenarios |
| Code research | `scout` | Finding patterns, understanding code |
| External research | `oracle` | Docs, APIs, web research |
| Debugging | `debug-agent` | Root cause analysis |
| Code review | `critic` | Quality review |

Ralph chooses the agent based on task type. Each agent gets a fresh context window with only the information it needs — no accumulated errors from prior iterations.

## Iteration Limits & Error Recovery

Ralph has bounded execution — it never runs indefinitely.

### Iteration Limits

| Task Size | Max Iterations |
|-----------|---------------|
| Small | 10 |
| Medium (default) | 30 |
| Large/complex | 50 |

When the limit is reached, Ralph stops and reports what's done vs. remaining.

### Retry Escalation

When an agent fails a task:

| Attempt | Strategy |
|---------|----------|
| 1 | Same agent + error context |
| 2 | `spark` for a quick fix |
| 3 | `debug-agent` for root cause analysis |
| After 3 | **BLOCKED** — escalates to you |

The `ralph-retry-reminder` hook reminds Ralph about pending retries in the queue.

## Resuming / Recovering

### Resume a Session

```
/ralph resume
```

Shows failed/stalled agents with options to retry, mark resolved, or start fresh.

### Crash Recovery

- The `ralph-watchdog` hook detects sessions idle >30 minutes and warns you
- State persists in `.ralph/state.json` — surviving session restarts
- The `session-start-recovery` hook checks for orphaned state on new sessions

### Checking Status

```
/ralph status
```

Shows current agent statuses, failed agents, and retry queue.

## State Files

All Ralph state lives in the `.ralph/` directory at your project root:

| File | Purpose |
|------|---------|
| `.ralph/state.json` | Unified state (v2) — tasks, retries, checkpoints, session info |
| `.ralph/IMPLEMENTATION_PLAN.md` | Human-readable task checklist with `[x]` marks |
| `.ralph/agent-output.json` | Latest agent task results |

### State Management CLI

The `ralph-state-v2.py` script manages all state:

```bash
# View overall status
python ~/.claude/scripts/ralph/ralph-state-v2.py -p . status

# View progress (completion %)
python ~/.claude/scripts/ralph/ralph-state-v2.py -p . progress

# List all tasks
python ~/.claude/scripts/ralph/ralph-state-v2.py -p . task-list

# See ready tasks (dependencies met)
python ~/.claude/scripts/ralph/ralph-state-v2.py -p . ready-tasks

# View retry queue
python ~/.claude/scripts/ralph/ralph-state-v2.py -p . retry-list
```

### Scheduler CLI

The `ralph-scheduler.py` script handles dependency-aware scheduling:

```bash
# Tasks ready to execute (all deps complete)
python ~/.claude/scripts/ralph/ralph-scheduler.py -p . ready-tasks

# Tasks that can run in parallel (no file overlap)
python ~/.claude/scripts/ralph/ralph-scheduler.py -p . parallel-batch

# Critical path through the task graph
python ~/.claude/scripts/ralph/ralph-scheduler.py -p . critical-path
```

### Checkpoint CLI

The `ralph-checkpoint.py` script manages git checkpoints:

```bash
# Commit after verified task completion
python ~/.claude/scripts/ralph/ralph-checkpoint.py commit --task-id 1.1 --message "auth done"

# List all checkpoints
python ~/.claude/scripts/ralph/ralph-checkpoint.py list

# Get last checkpoint
python ~/.claude/scripts/ralph/ralph-checkpoint.py last
```

## Common Commands

| Command | What It Does |
|---------|-------------|
| `/ralph` | Start a new Ralph session |
| `/ralph plan` | Generate implementation plan only (no build) |
| `/ralph build STORY-001` | Build a specific story |
| `/ralph resume` | Resume or retry failed agents |
| `/ralph status` | View current agent status |

## Hooks That Power Ralph

These hooks run automatically — you don't invoke them directly:

| Hook | Trigger | Purpose |
|------|---------|---------|
| `ralph-delegation-enforcer` | PreToolUse (Edit/Write/Bash) | Blocks direct code edits during Ralph mode |
| `ralph-task-monitor` | PostToolUse (Task) | Tracks agent completion/failure |
| `ralph-watchdog` | UserPromptSubmit | Warns if workflow idle >30 min |
| `ralph-progress-inject` | UserPromptSubmit | Shows progress bar: `[====------] 4/10 (40%)` |
| `ralph-retry-reminder` | UserPromptSubmit | Reminds about pending retries |

## Tips & Gotchas

1. **Ralph never writes code.** If you see Ralph using Edit/Write/Bash for implementation, something is wrong — the delegation enforcer hook should block this.

2. **Fresh context per agent.** Each agent spawned via Task gets a clean context window. This prevents "context rot" where accumulated errors degrade quality.

3. **Verification is independent.** Ralph doesn't trust agent claims of "done" — it runs tests, type checks, and linting independently before marking a task complete.

4. **State survives sessions.** Everything persists in `.ralph/state.json` and git. If your session crashes, `/ralph resume` picks up where you left off.

5. **Parallel when possible.** Ralph spawns agents in parallel when tasks don't share files. Sequential when they do.

6. **Windows users:** Python scripts use ASCII only (no unicode arrows or checkboxes) to avoid cp1252 encoding errors.

7. **Sync gotcha:** The sync script doesn't copy `hooks/dist/*.mjs` or `scripts/ralph/*.py` — if you update these, copy them manually to `~/.claude/`.

8. **12-hour TTL.** Ralph session state expires after 12 hours of inactivity. Long-running features should checkpoint regularly.

9. **Don't use Ralph for quick fixes.** For <20 line changes, use `spark` directly. Ralph's overhead (PRD, task breakdown, verification loop) isn't worth it for small tasks.

10. **Memory feedback loop.** Ralph stores learnings after each session. Future sessions recall what worked and what failed, making agents smarter over time.
