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

---
*Generated from stress tests 2026-01-13*
