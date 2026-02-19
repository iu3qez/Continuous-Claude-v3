# Handoff: Ralph Stress Testing & Failure Mode Discovery

**Branch:** `feature/consistent-memory-extraction`
**Date:** 2026-02-01
**Status:** Implementation complete, verification needed

---

## What Was Done

Implemented stress testing infrastructure and critical fixes for the Ralph/Maestro orchestration system.

### Priority 1: Error Learning Pipeline ✅
System now captures errors and stores them as learnings for future sessions.

| File | Purpose |
|------|---------|
| `.claude/hooks/src/agent-error-capture.ts` | PostToolUse:Task hook - captures agent failures as FAILED_APPROACH |
| `.claude/hooks/src/hook-error-pipeline.ts` | Utility module for capturing hook errors |
| `opc/scripts/core/incremental_extract.py` | Extended to extract errors from tool outputs |

### Priority 2: Cross-Session Isolation ✅
Multiple terminals no longer collide on state files.

| File | Purpose |
|------|---------|
| `.claude/hooks/src/shared/session-isolation.ts` | Session-specific state file paths |
| `.claude/hooks/src/ralph-delegation-enforcer.ts` | Updated to use session isolation |
| `.claude/hooks/src/maestro-state-manager.ts` | Updated to use session isolation |

### Priority 3: Long Session Support ✅
- TTL extended from 4h to 12h
- Heartbeat mechanism via `lastActivity` field
- Warning at 80% TTL

### Stress Test Harness ✅
Created `.claude/tests/stress/` with 6 test files covering all failure categories.

---

## Files Changed (uncommitted)

```
.claude/hooks/src/agent-error-capture.ts        NEW
.claude/hooks/src/hook-error-pipeline.ts        NEW
.claude/hooks/src/shared/session-isolation.ts   NEW
.claude/hooks/src/ralph-delegation-enforcer.ts  MODIFIED
.claude/hooks/src/maestro-state-manager.ts      MODIFIED
.claude/settings.json                           MODIFIED (added PostToolUse:Task hook)
opc/scripts/core/incremental_extract.py         MODIFIED
.claude/tests/stress/*.mjs                      NEW (6 test files)
```

---

## Verification Steps

### 1. Run Stress Tests
```bash
cd ~/.claude/tests/stress && node run-all-tests.mjs
```

**Expected results:**
- ✅ State Corruption (B) - 3/3 pass
- ✅ Error Learning (D) - 3/3 pass
- ✅ Long-Running (E) - 3/3 pass
- ❌ Agent Trust (A) - 0/3 (known gap - no verification enforcement)
- ❌ Pattern Exploits (C) - 0/3 (known gap - ambiguous patterns)
- ❌ Cross-Session (F) - 3/4 (file claims need PostgreSQL)

### 2. Verify Hooks Compile
```bash
cd ~/.claude/hooks && npm run build
```
Should complete without errors.

### 3. Test Session Isolation
Open two terminals, run `/ralph` in both. Each should have independent state.

### 4. Test Error Capture
Spawn an agent that fails, then check if error was stored:
```bash
cd $CLAUDE_OPC_DIR && uv run python scripts/core/recall_learnings.py --query "agent failure" --k 3 --text-only
```

---

## Known Gaps (Document for Future)

| Gap | Severity | Status |
|-----|----------|--------|
| Agent Trust - agents can lie about completion | 🔴 Critical | Needs verification hook |
| Pattern Exploits - "Yes but..." approves | 🔴 Critical | Needs negative patterns |
| File Claims - cross-terminal conflict detection | 🟡 Medium | Needs PostgreSQL testing |

These are documented in the stress tests for future implementation.

---

## To Commit

If verification passes:
```bash
git add .claude/hooks/src/agent-error-capture.ts \
        .claude/hooks/src/hook-error-pipeline.ts \
        .claude/hooks/src/shared/session-isolation.ts \
        .claude/hooks/src/ralph-delegation-enforcer.ts \
        .claude/hooks/src/maestro-state-manager.ts \
        .claude/settings.json \
        opc/scripts/core/incremental_extract.py \
        .claude/tests/stress/

git commit -m "feat(ralph): add stress testing and error learning pipeline

- Add agent-error-capture hook for Task tool failures
- Add hook-error-pipeline for infrastructure error capture
- Add session isolation to prevent cross-terminal collision
- Extend TTL to 12h with heartbeat mechanism
- Add comprehensive stress test suite (6 categories)
- Modify incremental_extract.py to capture tool errors

Known gaps documented in stress tests for future work."
```

---

## Next Steps (After This Commit)

1. Fix Pattern Exploits (C) - Add negative lookahead for "but", "however"
2. Implement verification enforcement for agent completion claims
3. Test file_claims table integration with PostgreSQL
