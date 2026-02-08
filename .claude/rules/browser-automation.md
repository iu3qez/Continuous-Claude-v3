# Browser Automation Rules

## Prerequisites [C:10]
- ALWAYS call `tabs_context_mcp` first
- ALWAYS create new tab for each conversation
- NEVER reuse tabs from previous sessions
- NEVER use stale refs without re-reading page

## Timing Rules [H:8]

| After | Wait | Action |
|-------|------|--------|
| `navigate` (React) | 2s | `wait(2)` then `read_page` |
| `navigate` (static) | 0.5s | `wait(0.5)` or immediate |
| SPA route change | Re-read | Always `read_page` again |
| `left_click` | 1s | Before verifying result |
| "Detached" error | 1s | Then retry (succeeds) |

## Error Recovery [H:9]

| Error Message | Recovery |
|---------------|----------|
| "No element found with reference" | Re-read page, find element again |
| "No tabs available" | `tabs_context_mcp`, create new tab |
| "not a supported form input" | Use `computer({ action: "left_click" })` |
| "Detached while handling" | `wait(1)`, retry action |
| "OAuth token has expired" | Use refs from `read_page` instead |

## Form Widget Rules [H:8]

| Widget | Tool | Pattern |
|--------|------|---------|
| Text input | `form_input` | Standard |
| Native checkbox | `form_input` | `value: true/false` |
| Custom checkbox | `computer` | Click - NOT form_input |
| Date picker | `form_input` | ISO: `"2026-01-15"` |

## Anti-Patterns [C:10]
- NEVER retry same failed action 3+ times without recovery
- NEVER use stale refs without re-reading page
- NEVER skip waits for React/SPA content
- NEVER use `find()` for critical paths (OAuth errors)
- NEVER use `form_input` on custom checkboxes

## SPA Navigation [H:9]
After any sidebar/menu click that changes route:
1. `wait(1)`
2. `read_page` (refs completely change)
3. Find element again by text/role

## Console Debugging [M:6]
Call `read_console_messages` BEFORE triggering action to capture logs.

## Database Isolation [H:9]

When a project uses PostgreSQL alongside other projects on the same host:
- ALWAYS pass `DATABASE_URL` explicitly: `DATABASE_URL="..." npx command`
- In Playwright config, use `webServer.env` to pin the correct `DATABASE_URL`
- Never rely on `.env.local` being loaded — `drizzle-kit` and other tools may not load it
- Shell env `DATABASE_URL` overrides `.env.local` — if another project (e.g., continuous-claude on port 5432) set it, your commands connect to the wrong database

**Pattern for Playwright config:**
```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: true,
  env: {
    DATABASE_URL: 'postgresql://user:pass@localhost:5433/mydb',  // pin explicitly
  },
},
```

## Playwright Config Defaults for DB-Backed Apps [H:8]

- `workers: process.env.CI ? 1 : 4` — limit local parallelism; 8 workers exhaust DB connection pools
- `retries: process.env.CI ? 2 : 1` — 1 retry locally catches transient DB flakes
- Always use `reuseExistingServer: true` in webServer config
- Auth pattern: `storageState` per role (`admin.json`, `member.json`, `viewer.json`)
- Use setup projects with `dependencies` for auth state generation
- Add `/e2e/` to Jest `testPathIgnorePatterns` so Jest doesn't pick up Playwright specs

---
*Generated from stress tests 2026-01-13, updated with E2E patterns 2026-02-08*
