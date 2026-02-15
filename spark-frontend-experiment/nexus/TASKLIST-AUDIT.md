# Nexus Workbook - Audit Task List

Generated from AUDIT-REPORT.md findings on February 14, 2026.

---

## P0 - Critical

### TASK-001: Redesign sidebar to full-width with labeled sections
**Status:** DONE (Feb 14, 2026)
**Effort:** Medium (4-6 hours)
**Files:** All 14 HTML pages + components/sidebar.js + tests/sidebar.test.js + tests/navigation-compliance.test.js

**Description:**
The sidebar is currently a ~56px icon rail with only icons visible. User explicitly requested a full-width sidebar with visible section labels, similar to the Railway deployment (https://web-production-2c64.up.railway.app/).

**Requirements:**
- Sidebar width: 240-280px (expanded), 56px (collapsed, optional)
- Three section groups per DEMO-SPEC Section 8:
  - **Workspace** (7 items): Dashboard, Meetings, Calendar, Actions, Decisions, My Work, Proposals
  - **AI** (3 items): Agents, Marketplace, AI Proposals
  - **Admin** (2 items): Settings, ELT Rollup
- Section headers visible (e.g., "WORKSPACE", "AI", "ADMIN")
- Active page highlighted
- Notification badges on relevant items
- Keyboard shortcut hints (Cmd+1, Cmd+2, etc.)
- Responsive: collapse to rail on narrow viewports
- Update sidebar.test.js assertions for new width

**Acceptance Criteria:**
- [ ] Sidebar shows labeled sections on all 14 pages
- [ ] Active page is visually highlighted
- [ ] Navigation works between all pages
- [ ] Keyboard shortcuts still function
- [ ] Passes existing sidebar.test.js (with updated width assertions)

---

## P1 - High

### TASK-002: Add missing connection states (Syncing/Error/Paused/Pending)
**Status:** DONE (Feb 14, 2026)
**Effort:** Small (2-3 hours)
**Files:** connections.html, components/connections.js (if exists), tests/connections.test.js

**Description:**
DEMO-SPEC Section 12 specifies 6 connection states but only 2 are implemented (Connected, Not Connected).

**Requirements:**
- **Syncing:** Animated spinner, "Syncing..." text, progress indicator
- **Error:** Red status badge, error message, "Retry" button
- **Paused:** Gray status badge, "Paused" text, "Resume" button
- **Pending:** Yellow status badge, "Pending setup..." text, "Cancel" button
- At least 1 connection in each state for demo purposes
- Update connections.test.js to cover new states

**Acceptance Criteria:**
- [ ] All 6 states visible on connections page
- [ ] Each state has appropriate visual treatment
- [ ] Action buttons work (Retry, Resume, Cancel)
- [ ] Tests cover all 6 states

### TASK-003: Create onboarding.html
**Status:** DONE (Feb 14, 2026)
**Effort:** Large (6-8 hours)
**Files:** onboarding.html (new), components/onboarding.js (new)

**Description:**
The 6-step onboarding flow exists as test stubs (68 tests in tests/onboarding.test.js) but no actual page exists.

**Requirements per DEMO-SPEC:**
1. Company info form (name, size, industry)
2. Department toggle selection
3. Tool discovery (suggest integrations based on departments)
4. OAuth connection simulation (connect tools)
5. Scanning animation (processing connected data)
6. Insight reveal (first AI insights from scanned data)

**Each step needs:**
- Progress indicator (step X of 6)
- Navigation (Back/Next/Skip)
- Data persistence between steps
- AI narration text

**Acceptance Criteria:**
- [ ] onboarding.html loads at /onboarding
- [ ] All 6 steps navigable
- [ ] Progress indicator updates
- [ ] Form data persists between steps
- [ ] OAuth simulation works
- [ ] Scanning animation plays
- [ ] Tests pass against real page

---

## P2 - Medium

### TASK-004: Create workspaces.html
**Status:** DONE (Feb 14, 2026)
**Effort:** Medium (3-4 hours)
**Files:** workspaces.html (new)

**Description:**
Settings page references a "Workspaces" tab and sidebar has a "Workspaces" link, but no standalone page exists.

**Requirements:**
- List of department workspaces (Operations, Engineering, Sales, Marketing, Finance, HR)
- Member count and agent count per workspace
- Active/Inactive status
- Workspace settings (name, description, members, agents)
- Create Workspace button

### TASK-005: Implement calendar month view
**Status:** DONE (Feb 14, 2026)
**Effort:** Small (2-3 hours)
**Files:** calendar.html, components/calendar-month.js

**Description:**
Calendar page has Week/Month toggle buttons but only week view shows content. Month view needs a grid with meeting indicators.

**Requirements:**
- Month grid (5-6 rows x 7 columns)
- Meeting dots/counts per day
- Click day to see meetings
- Current day highlighted
- Navigation (previous/next month)

---

## P3 - Low

### TASK-006: Enforce persona page restrictions
**Status:** DONE (Feb 14, 2026)
**Effort:** Small (1-2 hours)
**Files:** All page HTML files

**Description:**
`persona.js` has `canAccessPage()` function but pages don't actually restrict access. Restricted personas can still navigate to any page.

**Requirements:**
- On page load, check `canAccessPage(currentPage)`
- If restricted, show "Access Restricted" message with link to dashboard
- Or redirect to dashboard automatically

### TASK-007: Add visible industry data switching
**Status:** DONE (previously implemented)
**Effort:** Medium (4-6 hours)
**Files:** Multiple page HTML files

**Description:**
Industry selector exists and `industry.js` has datasets for consulting/tech/hospitality, but most page content is hardcoded and doesn't change when industry switches.

**Requirements:**
- Dashboard stats change per industry
- Meeting names and attendees change per industry
- Action items reflect industry context
- Company names in proposals change per industry

### TASK-008: Add notification badges to sidebar
**Status:** DONE (Feb 14, 2026)
**Effort:** Small (1-2 hours)
**Files:** components/sidebar.js, all page HTML files

**Description:**
Sidebar navigation items don't show notification badges (e.g., "3 overdue" on Actions, "2 pending" on Decisions).

**Requirements:**
- Badge on Actions showing overdue count
- Badge on Proposals showing new count
- Badge on Meetings showing urgent count
- Badges update based on data

### TASK-009: Add detail drawer to connections page
**Status:** DONE (previously implemented)
**Effort:** Small (2-3 hours)
**Files:** connections.html

**Description:**
DEMO-SPEC mentions a detail drawer for connections showing data flow, sync history, and configuration. Currently only Manage/Connect buttons exist.

**Requirements:**
- Click "Manage" opens detail drawer
- Drawer shows: connection health, sync history, data flow visualization, configuration options
- Uses existing detail-drawer.js component

### TASK-010: Add preview modal to marketplace
**Status:** DONE (Feb 14, 2026)
**Effort:** Small (2-3 hours)
**Files:** marketplace.html

**Description:**
Marketplace agents have "Preview" buttons but clicking them doesn't open a modal (or the modal wasn't visible in audit).

**Requirements:**
- Click "Preview" opens modal with: agent description, capabilities, example outputs, install requirements
- Modal has Install/Close buttons
- Smooth animation

---

## Summary

| Priority | Tasks | Total Effort |
|----------|-------|-------------|
| P0 (Critical) | 1 | 4-6 hours |
| P1 (High) | 2 | 8-11 hours |
| P2 (Medium) | 2 | 5-7 hours |
| P3 (Low) | 5 | 10-16 hours |
| **Total** | **10** | **27-40 hours** |

**Recommended order:** TASK-001 (sidebar) > TASK-002 (connection states) > TASK-003 (onboarding) > TASK-005 (calendar month) > TASK-004 (workspaces) > remaining P3 tasks.

---

*Generated from Nexus Workbook Audit Report, February 14, 2026.*
