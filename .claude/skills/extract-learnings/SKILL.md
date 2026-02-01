# Extract Learnings Skill

Manual memory extraction from current or past sessions.

## Usage

```
/extract-learnings              # Extract from current session
/extract-learnings --preview    # Preview what would be extracted
/extract-learnings --session <id>  # Extract from specific session
```

## What It Does

1. Finds the session JSONL transcript
2. Extracts thinking blocks with perception signals (realizations, insights)
3. Classifies learnings by type (WORKING_SOLUTION, ERROR_FIX, etc.)
4. Stores learnings in the memory database

## Extraction Criteria

Thinking blocks are extracted if they contain perception change signals:
- "actually", "realized", "the issue", "that's why"
- "turns out", "I was wrong", "works because"
- "now I see", "unexpected", "wait,"

## Learning Types

| Type | Description |
|------|-------------|
| WORKING_SOLUTION | Fixes and solutions that worked |
| ERROR_FIX | How specific errors were resolved |
| FAILED_APPROACH | What didn't work (avoid repeating) |
| CODEBASE_PATTERN | Patterns discovered in code |
| ARCHITECTURAL_DECISION | Design choices and rationale |

## Commands

### Preview extraction
```bash
cd $CLAUDE_OPC_DIR && PYTHONPATH=. uv run python scripts/core/lazy_memory.py preview \
  --session-id "<session_id>" \
  --project "."
```

### Extract and store
```bash
cd $CLAUDE_OPC_DIR && PYTHONPATH=. uv run python scripts/core/lazy_memory.py extract \
  --session-id "<session_id>" \
  --project "." \
  --max-learnings 10
```

### Check if session has enough content
```bash
cd $CLAUDE_OPC_DIR && PYTHONPATH=. uv run python scripts/core/lazy_memory.py check \
  --session-id "<session_id>" \
  --project "." \
  --min-turns 10
```

## Automatic Extraction

Memory extraction also runs automatically via the SessionEnd hook when:
- Session ends normally
- Session has >= 10 conversation turns
- Thinking blocks contain perception signals

## Notes

- Extraction runs in background to not block session end
- Max 10 learnings per session by default
- Duplicate content is filtered by the memory system
