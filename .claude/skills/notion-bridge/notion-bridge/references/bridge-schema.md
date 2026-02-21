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
**Replace placeholder when first item added:** Replace `**[EMPTY — Ready for first handoff]**`

**Format for handoff item:**
```markdown
### [YYYY-MM-DD] [Short Title] — STATUS: PENDING
**From:** Eve  
**To:** Claude Code  
**Context:** [What Dave and Eve discussed / decided]  
**Action needed:** [Specific thing Code should do]  
**Priority:** [High / Mid / Low]  
**Related files/URLs:** [if any]
```

**After Code acts:** Change STATUS to `DONE` or move entry to Implementation Log

---

### 5. Handoff Queue: Claude Code → Eve
**Purpose:** What Claude Code has built or needs Eve/Dave to know  
**Update trigger:** Code completes significant work  
**Clear trigger:** After Eve has surfaced the item to Dave

**Selection string for adding item:**
```
selection_with_ellipsis: "## 🔄 Handoff Queue: Claude Code → Eve...Ready for first write-back.*"
```

**Command:** `insert_content_after` the blockquote  
**Replace placeholder when first item added:** Replace `**[EMPTY — Ready for first write-back]**`

**Format for write-back item:**
```markdown
### [YYYY-MM-DD] [Short Title] — STATUS: UNREAD
**From:** Claude Code  
**To:** Eve  
**What was built/decided:** [Summary]  
**Dave needs to know:** [Key points to surface]  
**Files/PRs/URLs:** [if any]  
**Next suggested action:** [Optional]
```

**After Eve reads and surfaces:** Change STATUS to `READ`

---

### 6. Current Sprint State
**Purpose:** Snapshot table of what's in flight  
**Update trigger:** Status changes, new items, completions

**Selection string:**
```
selection_with_ellipsis: "## ⚡ Current Sprint State...Update weekly or per sprint.*"
```

**Command:** `replace_content_range` to update the whole table

**Table format:**
```markdown
| Item | Owner | Status | Notes |
|------|-------|--------|-------|
| [Item name] | [Eve/Code/Dave] | ✅ Done / 🔄 In progress / ⏳ Next / 🚫 Blocked | [Notes] |
```

**Status emoji guide:**
- ✅ Done
- 🔄 In progress  
- ⏳ Next up
- 🚫 Blocked
- 💬 Needs decision

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

## Quick Reference: Command × Section Matrix

| What you want to do | Section | Command |
|--------------------|---------|---------|
| Update current focus | Active Context | `replace_content_range` |
| Log a decision | Key Decisions Log | `insert_content_after` (top) |
| Pass work to Code | Handoff Queue: Eve→Code | `insert_content_after` |
| Code writing back | Handoff Queue: Code→Eve | `insert_content_after` |
| Log completed work | Implementation Log | `insert_content_after` (top) |
| Update sprint table | Sprint State | `replace_content_range` |
| Add tech notes | Architecture Notes | `insert_content_after` |
