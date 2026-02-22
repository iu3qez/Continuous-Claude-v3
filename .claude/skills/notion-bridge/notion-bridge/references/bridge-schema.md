# Claude Bridge HQ — Section Schema & Selection Strings

## Page URL
https://www.notion.so/30e76fd7ac8281e99fe1c0b257088b34

---

## Section Map

Use these section identifiers for `notion-update-page` operations.

---

### 1. Active Context
**Purpose:** Current sprint focus, overall state, last-updated date
**Update trigger:** Project focus changes, major milestone, weekly sync

**Selection string for replace:**
```
selection_with_ellipsis: "## 📋 Active Context...Active Projects:"
```

**Format when writing:**
```markdown
**Last Updated:** YYYY-MM-DD
**Current Sprint Focus:** [one sentence description]
**Active Projects:** [comma-separated list]
```

**Command:** `replace_content_range` to update the whole section body

---

### 2. Key Decisions Log
**Purpose:** Architectural decisions, strategic choices, rationale
**Update trigger:** Any significant decision made with Dave
**Order:** Newest first — always insert at TOP of log

**Selection string for insert (add new entry at top):**
```
selection_with_ellipsis: "## 📌 Key Decisions Log...at the top.*"
```

**Command:** `insert_content_after` the blockquote intro line

**Format for new entry:**
```markdown
### YYYY-MM-DD — [Decision Title]
- **Decision:** [What was decided]
- **Rationale:** [Why]
- **Decided by:** [Dave / Eve / Claude Code / Dave + Eve]
```

---

### 3. Architecture & Technical Notes
**Purpose:** System design, technical context, integration details — evergreen
**Update trigger:** New integration, changed system design, technical constraint discovered

**Selection string:**
```
selection_with_ellipsis: "## 🧠 Architecture & Technical Notes...Keep this evergreen.*"
```

**Command:** `insert_content_after` for new subsections; `replace_content_range` for updating existing subsections

**Format for new subsection:**
```markdown
### [Component or Topic Name]
- [Bullet point technical note]
- [Bullet point technical note]
```

---

### 4. Handoff Queue: Eve → Claude Code
**Purpose:** Work, context, or instructions Eve is passing to Claude Code
**Update trigger:** Eve needs Code to do something
**Clear trigger:** After Claude Code has acknowledged/acted on the item

**Selection string for adding item:**
```
selection_with_ellipsis: "## 🔄 Handoff Queue: Eve → Claude Code...move to Implementation Log.*"
```

**Command:** `insert_content_after` the blockquote
**Empty queue state:** Queue shows `*Queue clear — no pending items.*` with an Archive page link. Add new items after the blockquote intro (target the selection string above), not after the "Queue clear" text (which contains a page mention that breaks selection strings in Claude Code).

**Format for handoff item:**
```markdown
**[HANDOFF] YYYY-MM-DD — [Short Title]** [status emoji] [STATUS]
**From:** Eve | **To:** Claude Code | **Status:** [status emoji] [Status]
**Context:** [What Dave and Eve discussed / decided]
**Action needed:** [Specific thing Code should do]
**Priority:** [High / Mid / Low]
**Related files/URLs:** [if any]
**Write back:** [What Code should confirm when done]
```

**Status values:** 🟡 Pending | 🔵 In Progress | ✅ Done
**After Code acts:** Update status to ✅ Done IN the queue entry (don't delete — Eve sweeps on `bridge sync`)

---

### 5. Handoff Queue: Claude Code → Eve
**Purpose:** What Claude Code has built or needs Eve/Dave to know
**Update trigger:** Code completes significant work
**Clear trigger:** After Eve has surfaced the item to Dave

**Selection string for adding item:**
```
selection_with_ellipsis: "## 🔄 Handoff Queue: Claude Code → Eve...conversations with Dave.*"
```

**Command:** `insert_content_after` the blockquote
**Empty queue state:** Queue shows `*Queue clear — no pending items.*` with an Archive page link. Add new items after the blockquote intro (target the selection string above), not after the "Queue clear" text (which contains a page mention that breaks selection strings in Claude Code).

**Format for write-back item:**
```markdown
**[HANDOFF] YYYY-MM-DD — [Short Title]** [status emoji] [STATUS]
**From:** Claude Code | **To:** Eve | **Status:** 🟡 Unread
**What was built/decided:** [Summary]
**Dave needs to know:** [Key points to surface]
**Files/PRs/URLs:** [if any]
**Write back:** [What Eve should do with this — surface to Dave, review, etc.]
```

**Status values:** 🟡 Unread | ✅ Read (surfaced to Dave)
**After Eve reads and surfaces:** Update status to ✅ Read

---

### 6. Current Sprint State
**Purpose:** Snapshot of what's in flight — uses callout blocks (NOT tables)
**Update trigger:** Status changes, new items, completions

**Selection string:**
```
selection_with_ellipsis: "## ⚡ Current Sprint State...Update weekly or per sprint.*"
```

**Format: Callout blocks with detail lines**

Tables are dead — Notion silently strips Markdown pipe tables and HTML table replacements are fragile. Sprint State uses callout blocks instead.

Each sprint item is a callout block + a plain text detail line:
```
::: callout
[emoji] **[Task name]** | Owner: [name] | Status: [status]
:::
[One line of supporting detail]
```

**Worked example — a full two-item Sprint State block:**
```
::: callout
🔵 **Fix auth token refresh** | Owner: Claude Code | Status: In progress
:::
Implementing retry logic in middleware — PR draft open

::: callout
🟡 **Design new onboarding flow** | Owner: Eve | Status: Pending
:::
Waiting for Dave's feedback on wireframes from last session
```

**Color-coded emoji status system:**
- 🔴 Blocked — cannot proceed, needs intervention
- 🟡 Pending — queued, not yet started
- 🔵 In progress — actively being worked on
- ✅ Done — sweep to Archive on next `bridge sync`

**Rules:**
- ALWAYS use callout blocks for Sprint State items — never tables, never Markdown pipes, never raw HTML
- Status emoji goes FIRST in the callout headline, before the task name
- Format: `[emoji] **[Task]** | Owner: [X] | Status: [Y]`
- Detail line sits OUTSIDE the callout as a plain text line immediately below
- To add a new sprint item: `insert_content_after` targeting the last detail line in the section
- To update status: `replace_content_range` targeting the callout headline (safe — no links/mentions in callouts)
- On `bridge sync`: sweep ✅ Done callouts + their detail lines to Archive

---

### 7. Implementation Log
**Purpose:** Completed work history — never delete entries
**Update trigger:** After any significant build/completion
**Order:** Newest first — always insert at TOP

**Selection string for insert:**
```
selection_with_ellipsis: "## 📚 Implementation Log...Most recent at top.*"
```

**Command:** `insert_content_after` the blockquote

**Format for new entry:**
```markdown
### YYYY-MM-DD — [What Was Built/Done]
- [Key thing completed]
- [Technical note if relevant]
- [Link to PR/file/page if applicable]
```

---

### 8. Bridge Protocol (reference only)
**Purpose:** Instructions for both Claude instances — do not modify without Dave's instruction
**Update trigger:** Only when the protocol itself changes (Eve or Dave decision)

---

### 9. Claude Bridge Archive
**Purpose:** Completed work swept from HQ on `bridge sync` — full history preserved
**URL:** `https://www.notion.so/30e76fd7ac8281258cd9d281aa873298`
**Update trigger:** `bridge sync` sweeps completed items here automatically
**Read trigger:** Looking up past sprints, old handoffs, historical decisions

**Format:** Reverse-chronological sprint blocks. Each block contains:
- Sprint name and date range
- Narrative summary of what was accomplished
- Key decisions made during the sprint
- **Lessons** field — what worked, what didn't, patterns discovered

**Adding a new sprint block:**
Always `notion-fetch` the Archive page first, then use `insert_content_after` targeting the intro section to place the newest sprint block at the top.

**Read/Write Rules:**
- **Read:** `notion-fetch` the Archive page URL directly — not the HQ page
- **Write:** Only during `bridge sync` — never write individual items directly to Archive
- **Order:** Newest sprint blocks at top (reverse chronological)
- **Never delete** archive entries — this is the permanent record

---

## Quick Reference: Command × Section Matrix

| What you want to do | Section | Command |
|--------------------|---------|---------|
| Update current focus | Active Context | `replace_content_range` |
| Log a decision | Key Decisions Log | `insert_content_after` (top) |
| Pass work to Code | Handoff Queue: Eve→Code | `insert_content_after` |
| Code writing back | Handoff Queue: Code→Eve | `insert_content_after` |
| Log completed work | Implementation Log | `insert_content_after` (top) |
| Update sprint item status | Sprint State | `replace_content_range` (callout headline — no tables) |
| Add sprint item | Sprint State | `insert_content_after` (last detail line) |
| Add tech notes | Architecture Notes | `insert_content_after` |
| Look up past work | Archive | `notion-fetch` Archive page |
| Sweep completed items | Archive | `insert_content_after` (top of Archive) |
