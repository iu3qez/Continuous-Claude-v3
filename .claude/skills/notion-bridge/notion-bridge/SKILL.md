---
name: notion-bridge
description: This skill governs the two-layer Bridge communication system between Claude.ai (Eve) and Claude Code for Dave Hayes. Use when reading or writing to the Bridge HQ page, updating handoff queues between AI instances, logging decisions or implementation notes, syncing sprint state, or performing any operation on the Bridge Life Bucket, its Projects, or Tasks. Triggers on phrases like "update the bridge", "handoff to Code", "what did Code build", "bridge sync", "log this to the bridge", "pass this to Code", or "what's in the queue".
---

# Notion Claude Bridge Skill
## v1.0 | 2026-02-20 | Eve ↔ Claude Code Communication Layer

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
```

---

## ⚠️ Hardcoded IDs — Never Deviate

| Resource | ID / URL |
|----------|----------|
| **Claude Bridge Bucket** | Page ID: `30e76fd7-ac82-81e1-b30e-d170600896a7` |
| **Claude Bridge HQ Page** | `https://www.notion.so/30e76fd7ac8281e99fe1c0b257088b34` |
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
5. Update Sprint State table if status changed
```

### 🟠 Claude Code Writing Back to Eve
```
1. notion-fetch: Claude Bridge HQ page (read current)
2. notion-update-page: insert into Handoff Queue: Code → Eve
3. notion-update-page: add entry to Implementation Log
4. Update Sprint State table row(s) if applicable
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
3. Update Active Context to reflect current reality
4. Update Sprint State table
5. Report summary to Dave: what's current, what's stale, what needs action
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

---

*notion-bridge v1.0 | 2026-02-20 | Works alongside notion-task-manager skill*
*Reference: bridge-schema.md for HQ page section map*
