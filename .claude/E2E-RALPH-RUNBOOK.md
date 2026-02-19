# Ralph E2E Dress Rehearsal Runbook

## Pre-flight (already done)
- [x] ralph-improvements merged to main
- [x] Hooks synced and rebuilt
- [x] All 50 hook tests pass
- [x] PostgreSQL running, memory system verified

## Steps

### 1. Open a NEW terminal
```bash
cd ~/continuous-claude
```

### 2. Start Claude
```bash
claude
```

### 3. Invoke Ralph
Type:
```
/ralph
```

### 4. When Ralph asks for a PRD, provide this:

```markdown
# CLI Task Tracker

## Overview
Node.js CLI that manages tasks in a JSON file. CRUD operations via command-line arguments.

## Requirements
- FR1: Task model (id, title, status:pending/done, createdAt)
- FR2: Commands: add <title>, list, done <id>, delete <id>
- FR3: Error handling (missing file, invalid ID, empty title)

## Constraints
- Node 20+, TypeScript 5+, zero external deps (fs/path/process only), Jest for tests
```

### 5. Watch for these verification points:

| Phase | What to Verify | Pass Signal |
|-------|----------------|-------------|
| Phase 0 (Context) | Memory recall runs | "recalled N learnings" in output |
| Phase 1 (Interview) | 3-5 questions via AskUserQuestion | Questions with A/B/C options |
| Phase 1 (PRD) | PRD file created | File exists with correct structure |
| Phase 2 (Tasks) | Task breakdown | 5-7 parent tasks |
| Phase 2 (Plan) | `.ralph/IMPLEMENTATION_PLAN.md` | Checkboxes, atomic tasks |
| Phase 3 (Delegation) | `Task(kraken)` or `Task(spark)` | NO direct Edit/Write on .ts files |
| Phase 3 (Enforcement) | Delegation enforcer | "RALPH DELEGATION ENFORCER" if direct edit attempted |
| Phase 3 (Verification) | Tests run after agents | `npm test`, `tsc --noEmit` |
| Phase 4 (Review) | Final test suite passes | All green |
| Phase 4 (Learnings) | Memory store called | "stored learning" message |

### 6. Post-E2E Verification

After Ralph completes:
```bash
# Code compiles
cd <project-dir> && npx tsc --noEmit

# Tests pass
npm test

# CLI works
node dist/index.js add "test task"
node dist/index.js list
node dist/index.js done 1
node dist/index.js delete 1

# Learning stored
cd ~/continuous-claude/opc && PYTHONPATH=. uv run python scripts/core/recall_learnings.py --query "CLI task tracker" --k 3 --text-only
```

### 7. Report Results

When done, return to the testing session and report:
- Number of phases completed
- Any enforcement blocks that fired
- Final test suite status
- Any issues encountered
