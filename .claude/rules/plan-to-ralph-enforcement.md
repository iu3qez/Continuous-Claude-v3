# Plan-to-Ralph Enforcement

After a plan is approved via ExitPlanMode, direct code edits (Edit/Write on code files) are **blocked** unless Ralph is active.

## How It Works

Two hooks work together:

1. **plan-exit-tracker** (PostToolUse on ExitPlanMode) -- writes a state file marking plan approval
2. **plan-to-ralph-enforcer** (PreToolUse on Edit|Write) -- reads that state and blocks code edits

## Decision Flow

| Condition | Result |
|-----------|--------|
| No plan approved | ALLOW |
| Plan approved + Ralph active | ALLOW |
| Plan approved + config/doc file (.json, .md, .yaml, .env) | ALLOW |
| Plan approved + code file (.ts, .py, .go, etc.) | **DENY** |

## Bypass Methods

- **Use /ralph** -- the intended workflow. Ralph delegates to agents who can edit freely.
- **Delete the state file** -- removes plan-approved state:
  ```bash
  rm $TEMP/claude-plan-approved-*.json
  ```
- **Disable the hook** -- remove plan-to-ralph-enforcer from settings.json

## Allowed File Types (always pass through)

Config/doc files are never blocked: `.json`, `.yaml`, `.yml`, `.md`, `.env`, `.gitignore`, `.ralph/*`, `IMPLEMENTATION_PLAN.md`, `tasks/*.md`

## Fail-Open Design

Both hooks fail open on any error -- if state can't be read, enforcement is skipped. This prevents the hooks from breaking normal workflows.
