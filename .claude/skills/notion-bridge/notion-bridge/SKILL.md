---
name: notion-bridge
description: This skill governs the two-layer Bridge communication system between Claude.ai (Eve) and Claude Code for Dave Hayes. Use when reading or writing to the Bridge HQ page, updating handoff queues between AI instances, logging decisions or implementation notes, syncing sprint state, or performing any operation on the Bridge Life Bucket, its Projects, or Tasks. Triggers on phrases like "update the bridge", "handoff to Code", "what did Code build", "bridge sync", "log this to the bridge", "pass this to Code", or "what's in the queue".
---

# Notion Claude Bridge Skill
## v1.2 | 2026-02-21 | Eve ↔ Claude Code Communication Layer

This skill governs all read/write operations on the Claude Bridge system — the shared knowledge and communication layer between Claude.ai (Eve) and Claude Code. Always load `references/bridge-schema.md` before any write operation.

---

## System Architecture

```
Claude.ai (Eve) ←──── Notion Claude Bridge ────→ Claude Code
     ↓                         ↓                       ↓
Strategic layer          HQ Knowledge Page        Execution layer
Ideas, decisions,        (shared memory)          Builds, implements,
project direction              ↕                  writes back results
                    Claude Bridge Bucket
                    (Projects + Tasks)
                           ↓
                    Claude Bridge Archive
                    (completed sprints, swept on bridge sync)
```

---

## ⚠️ Hardcoded IDs — Never Deviate

| Resource | ID / URL |
|----------|----------|
| **Claude Bridge Bucket** | Page ID: `30e76fd7-ac82-81e1-b30e-d170600896a7` |
| **Claude Bridge HQ Page** | `https://www.notion.so/30e76fd7ac8281e99fe1c0b257088b34` |
| **Claude Bridge Archive** | `https://www.notion.so/30e76fd7ac8281258cd9d281aa873298` |
| **Life Buckets DB** | `9ec76fd7-ac82-8342-8bc3-87129f7cf1dc` |
| **Projects DB** | `33b76fd7-ac82-8234-a202-8719384ac5b1` |
| **Tasks DB** | `c3176fd7-ac82-825c-a03c-073837e5493c` |

---

## The Two-Layer System

### Layer 1: Claude Bridge Bucket (Action Layer)
Standard Notion Projects + Tasks, scoped to the Claude Bridge bucket.
- **Projects** = active inter-Claude initiatives
- **Tasks** = discrete handoffs, action items, things one Claude passes to the other

Follow all standard notion-task-manager API rules:
- Relations set in separate update call (never on creation)
- Priority: `High` / `Mid` / `Low` — never `Medium`
- Task title field: `Task` | Project title field: `Project`

### Layer 2: Claude Bridge HQ Page (Knowledge Layer)
Rich Notion page at the URL above. This is where context, decisions, and implementation notes live. Always reference `references/bridge-schema.md` for the exact section structure before writing.

---

## Core Workflows

### 🔵 Eve Writing a Handoff to Claude Code
```
1. notion-fetch: Claude Bridge HQ page (read current state)
2. Identify appropriate section:
   - Tactical work item → Handoff Queue: Eve → Code
   - Strategic decision → Key Decisions Log
   - Context shift → Active Context
3. notion-update-page (insert_content_after or replace_content_range)
4. Optionally: create a Task in Claude Bridge Bucket as action trigger
5. Report back to Dave with HQ page URL
```

### 🟠 Claude Code Reading Eve's Context
```
1. notion-fetch: Claude Bridge HQ page
2. Read: Active Context + Handoff Queue: Eve → Code
3. If items in queue: execute, then write back to Handoff Queue: Code → Eve
4. Add to Implementation Log after completion
5. Update Sprint State callout if status changed
```

### 🟠 Claude Code Writing Back to Eve
```
1. notion-fetch: Claude Bridge HQ page (read current)
2. notion-update-page: insert into Handoff Queue: Code → Eve
3. notion-update-page: add entry to Implementation Log
4. Update Sprint State callout(s) if applicable
```

### 🔵 Eve Reading Claude Code's Work
```
1. notion-fetch: Claude Bridge HQ page
2. Read: Handoff Queue: Code → Eve + Implementation Log
3. Surface relevant items naturally in Dave conversation
4. Clear/archive queue items after surfacing (or mark as read)
```

### Bridge Sync (Dave types "bridge sync")
```
1. notion-fetch: Claude Bridge HQ page (full read)
2. Audit all sections for staleness
3. Auto-sweep completed items:
   - Move DONE handoff queue items → Archive subpage
   - Sweep ✅ Done sprint callouts + detail lines → Archive subpage
   - Archive uses reverse-chronological sprint blocks (narrative + Lessons field)
4. Update Active Context to reflect current reality
5. Update Sprint State (remove swept callouts)
6. Report summary to Dave: what's current, what's stale, what needs action
```

### Archive Lookup (looking for past work)
```
1. notion-fetch: Claude Bridge Archive page
2. Search for the relevant sprint block or handoff
3. Archive URL: https://www.notion.so/30e76fd7ac8281258cd9d281aa873298
```

---

## Writing Rules for HQ Page

### Always:
- Fetch the page first before writing — never write blind
- Add new Decision Log entries at the **top** of the section (newest first)
- Add new Implementation Log entries at the **top** (newest first)
- Include date stamps on all log entries (YYYY-MM-DD format)
- Keep Handoff Queue items actionable and specific

### Never:
- Overwrite the other Claude's entries without reason
- Delete Implementation Log history
- Edit Dave's manual additions without his instruction
- Write to Active Context without confirming it's actually still current

### Section Update Triggers:
| Event | Section to Update |
|-------|-----------------|
| Dave makes architectural decision | Key Decisions Log |
| Eve passing work to Code | Handoff Queue: Eve → Code |
| Code completing a build | Handoff Queue: Code → Eve + Implementation Log |
| Overall project focus shifts | Active Context |
| Sprint milestone hit | Current Sprint State |
| Bridge sync requested | Auto-sweep completed items to Archive, then audit all sections |
| Looking for past work | Fetch Archive page (not HQ) |

---

## HQ Page Section Reference

Load `references/bridge-schema.md` for the full section map with exact selection strings for `replace_content_range` and `insert_content_after` operations.

---

## Safety Rules

1. Always fetch HQ page before writing — read current state first
2. Never delete Implementation Log entries
3. Never create a new Life Bucket without Dave's explicit instruction
4. Always return the HQ page URL after any write operation
5. If HQ page content is ambiguous or conflicting — ask Dave before writing
6. Handoff Queue items should be cleared/marked after the receiving Claude has acted on them
7. When queues are empty, they show: `*Queue clear — no pending items. Completed handoffs in Claude Bridge Archive.*`
8. To add to an empty queue, use `insert_content_after` targeting the "Queue clear" italic text

---

## Claude Code-Specific API Notes

Claude Code uses the `claude.ai Notion` cloud MCP server (streamable-http). The rendering behavior differs from Claude.ai's native Notion integration. These rules apply ONLY to Claude Code sessions.

### 1. Selection Strings Must Avoid Link/Mention Syntax

`notion-fetch` renders page links as markdown: `[Page Title]({{url}})`. But Notion internally stores them as `<mention-page url="..."/>` XML tags. **Selection strings that include rendered link text will fail.**

| What you see in fetch output | What Notion stores internally |
|------------------------------|-------------------------------|
| `[Claude Bridge Archive]({{url}})` | `<mention-page url="..."/>` |
| `*Completed handoffs in [Archive](...).*` | `*Completed handoffs in <mention-page .../>.*` |

**Rule:** End selection strings BEFORE any link/mention text. Use the surrounding plain text instead.

```
WRONG: selection_with_ellipsis: "Queue clear...in Claude Bridge Archive.*"
RIGHT: selection_with_ellipsis: "Queue clear...no pending items.*"
   OR: Target the section header/blockquote instead
```

### 2. Prefer `insert_content_after` Over `replace_content_range`

When a section contains page mentions or links, `replace_content_range` selection strings are fragile. Use `insert_content_after` targeting the section header or blockquote intro instead.

| Scenario | Preferred Command | Target |
|----------|-------------------|--------|
| Add to empty queue | `insert_content_after` | Section blockquote intro line |
| Add log entry | `insert_content_after` | Section blockquote intro line |
| Update sprint callout | `replace_content_range` | Safe -- callouts have no mentions |
| Update Active Context | `replace_content_range` | Safe -- plain text section |

### 3. Sprint State Uses Callout Blocks, Not Tables

Tables are dead. Notion silently strips Markdown pipe tables and HTML table replacements are fragile. **Sprint State uses callout blocks instead.**

Each sprint item is a callout block + a plain text detail line:
```
::: callout
[emoji] **[Task name]** | Owner: [name] | Status: [status]
:::
[One line of supporting detail]
```

**Color-coded emoji status system:**
- 🔴 Blocked — cannot proceed, needs intervention
- 🟡 Pending — queued, not yet started
- 🔵 In progress — actively being worked on
- ✅ Done — sweep to Archive on next `bridge sync`

**Rules:**
- ALWAYS use callout blocks for Sprint State — never tables, never Markdown pipes, never raw HTML
- Status emoji goes FIRST in the callout headline, before the task name
- Detail line sits OUTSIDE the callout as a plain text line immediately below
- To add a new sprint item: `insert_content_after` targeting the last detail line in the section
- To update status: `replace_content_range` targeting the callout headline (safe — no links/mentions in callouts)
- On `bridge sync`: sweep ✅ Done callouts + their detail lines to Archive

### 4. Handoff Queue Hygiene

Handoff queue entries must be self-contained and well-structured:

- Each entry includes status emoji in both the title line AND the Status field
- **Status values (Eve → Code):** 🟡 Pending | 🔵 In Progress | ✅ Done
- **Status values (Code → Eve):** 🟡 Unread | ✅ Read (surfaced to Dave)
- Every entry MUST have a `**Write back:**` field telling the receiver what to confirm when done
- No orphaned lines — each entry is a complete block from `**[HANDOFF]**` to `**Write back:**`
- When marking an entry done, update the status emoji in BOTH the title line and the Status field
- Don't delete completed entries — leave them for the receiving Claude to sweep on `bridge sync`
- Empty queue state: `*Queue clear — no pending items. Completed handoffs in Claude Bridge Archive.*`

### 5. Practical Workflow for Claude Code

```
1. notion-fetch: Read HQ page (always first)
2. Identify target section from bridge-schema.md
3. For sections WITH links/mentions:
   -> Use insert_content_after targeting header or blockquote
4. For sections WITHOUT links (Active Context, sprint callouts):
   -> replace_content_range is safe
5. After ANY write: verify by re-fetching if critical
```

### 6. Error Recovery

If a `notion-update-page` call fails with selection mismatch:
1. Re-fetch the page to see current rendered content
2. Shorten the selection string -- end BEFORE any `[link](url)` text
3. Switch to `insert_content_after` if `replace_content_range` keeps failing
4. Target a broader anchor (section header) rather than specific content

---

*notion-bridge v1.2 | 2026-02-21 | Works alongside notion-task-manager skill*
*Reference: bridge-schema.md for HQ page section map*
