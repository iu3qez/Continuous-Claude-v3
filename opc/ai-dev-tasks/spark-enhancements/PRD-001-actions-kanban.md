# PRD-001: Actions Kanban Board

**Version:** 1.0
**Created:** 2026-01-21
**Status:** Draft
**Priority:** High

---

## Executive Summary

Transform the current Actions list view into an interactive Kanban board with four columns representing action item statuses. This enhancement enables EAs and executives to visualize workflow state at a glance, drag items between columns to update status, and expand items for detailed editing without leaving the board view.

---

## Problem Statement

The current Actions page (`apps/web/app/(dashboard)/actions/page.tsx`) displays action items as a simple list. This presents several limitations:

- **No visual workflow representation** - Users cannot see the distribution of items across statuses
- **Multiple clicks to update status** - Changing status requires opening each item individually
- **Poor overview capability** - Executives cannot quickly assess workload and progress
- **No batch mental model** - List view does not support natural task progression thinking

---

## User Stories

| ID | Role | Story | Priority |
|----|------|-------|----------|
| US-1 | EA | I want to see all action items organized by status so I can quickly assess workload | Must Have |
| US-2 | EA | I want to drag an action item to a new column to update its status instantly | Must Have |
| US-3 | Executive | I want to click on an action item to see and edit its details without leaving the board | Must Have |
| US-4 | EA | I want to filter the board by owner, priority, or meeting to focus on relevant items | Should Have |
| US-5 | Executive | I want to see high-priority items visually distinguished so urgent work stands out | Should Have |
| US-6 | EA | I want the board to remember my filter preferences across sessions | Could Have |

---

## Functional Requirements

### FR-1: Kanban Board Layout

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-1.1 | Display 4 columns: To Do, In Progress, Done, Cancelled | Columns match actionItems schema statuses |
| FR-1.2 | Show item count badge per column | Updates dynamically on drag |
| FR-1.3 | Columns have sticky headers | Headers visible when scrolling |
| FR-1.4 | Responsive layout - stack on mobile | < 768px shows single column with tabs |

### FR-2: Drag-and-Drop

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-2.1 | Drag items between columns using @dnd-kit | Smooth animation, visual feedback |
| FR-2.2 | Persist status change to database on drop | Optimistic UI update, rollback on error |
| FR-2.3 | Show drop zone highlighting | Clear visual target for placement |
| FR-2.4 | Support reordering within column | Optional: persist sort order |

### FR-3: Expandable Action Items

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-3.1 | Click card to expand detail panel (slide-over or modal) | Smooth transition animation |
| FR-3.2 | Inline edit: title, description, due date, priority, owner | Changes save automatically (debounced) |
| FR-3.3 | Show meeting context link if associated | Links to source meeting |
| FR-3.4 | Display created/modified timestamps | Read-only metadata |
| FR-3.5 | Close panel with Escape key or click outside | Keyboard accessibility |

### FR-4: Filtering

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-4.1 | Filter by owner (dropdown, multi-select) | Shows all users with assigned items |
| FR-4.2 | Filter by priority (LOW, MEDIUM, HIGH, URGENT) | Checkbox group |
| FR-4.3 | Filter by meeting (dropdown) | Lists meetings with action items |
| FR-4.4 | Filter by date range (due date) | Date range picker component |
| FR-4.5 | Clear all filters button | Resets to default view |
| FR-4.6 | Persist filter preferences to localStorage | Restore on page load |

---

## Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| Performance | Initial board render | < 500ms for 100 items |
| Performance | Drag-and-drop feedback | < 16ms (60fps) |
| Accessibility | Keyboard navigation | Full board navigable without mouse |
| Accessibility | Screen reader support | ARIA labels for drag operations |
| Accessibility | Color contrast | WCAG 2.1 AA compliance |
| Reliability | Optimistic updates | Rollback with toast notification on failure |

---

## UI/UX Specifications

### Board Layout (Desktop)

```
+------------------+------------------+------------------+------------------+
| TO DO (12)       | IN PROGRESS (5)  | DONE (23)        | CANCELLED (2)    |
+------------------+------------------+------------------+------------------+
| [Card]           | [Card]           | [Card]           | [Card]           |
| - Title          | - Title          | - Title          | - Title          |
| - Owner avatar   | - Owner avatar   | - Owner avatar   | - Owner avatar   |
| - Due date       | - Due date       | - Due date       | - Due date       |
| - Priority badge | - Priority badge | - Priority badge | - Priority badge |
+------------------+------------------+------------------+------------------+
```

### Card Design

- **Compact mode (default):** Title, owner avatar, due date pill, priority indicator
- **Priority indicators:** Color-coded left border (green/yellow/orange/red)
- **Overdue styling:** Red background tint for past-due items
- **Hover state:** Subtle elevation + cursor grab icon

### Detail Panel (Slide-over)

- Width: 400px from right edge
- Sections: Header (title editable), Owner selector, Due date picker, Priority dropdown, Description (Tiptap mini-editor), Meeting link, Metadata footer

---

## Technical Approach

### Component Structure

```
apps/web/app/(dashboard)/actions/
├── page.tsx                    # Layout wrapper
├── components/
│   ├── KanbanBoard.tsx         # Main board container
│   ├── KanbanColumn.tsx        # Individual column
│   ├── KanbanCard.tsx          # Draggable card
│   ├── ActionDetailPanel.tsx   # Slide-over detail view
│   ├── ActionFilters.tsx       # Filter bar component
│   └── hooks/
│       ├── useKanbanDragDrop.ts  # @dnd-kit integration
│       └── useActionFilters.ts   # Filter state management
```

### State Management

- **Server state:** React Query for action items CRUD
- **Local state:** useState for filter selections, panel open/close
- **Persistence:** localStorage for filter preferences

### Dependencies

| Package | Purpose |
|---------|---------|
| @dnd-kit/core | Drag-and-drop framework |
| @dnd-kit/sortable | Sortable list support |
| @dnd-kit/utilities | Helper functions |

### API Routes

- `GET /api/actions` - Fetch action items (existing)
- `PATCH /api/actions/[id]` - Update action item (existing, verify status update)
- `PATCH /api/actions/[id]/reorder` - New: update sort order within column

---

## Frontend Design Stack

### Required Tools
- **shadcn MCP:** Component discovery (Card, Badge, Sheet, DropdownMenu, DatePicker)
- **shadcn-create Skill:** Load `~/.claude/skills/shadcn-create/SKILL.md` for theme consistency

### Component Requirements
- `Card` - Action item cards
- `Badge` - Priority and count indicators
- `Sheet` - Detail panel slide-over
- `DropdownMenu` - Owner and priority selectors
- `DatePicker` - Due date selection
- `Avatar` - Owner display
- `Button` - Actions and filters

---

## Acceptance Criteria

- [ ] Board displays 4 columns matching schema statuses
- [ ] Dragging item to new column updates status in database
- [ ] Clicking card opens detail panel with all editable fields
- [ ] All filter types (owner, priority, meeting, date) function correctly
- [ ] Filters can be combined (AND logic)
- [ ] Board renders 100 items in under 500ms
- [ ] Keyboard users can navigate and move items
- [ ] Optimistic updates show immediately, rollback on error with toast
- [ ] Filter preferences persist across browser sessions
- [ ] Mobile view provides usable alternative to drag-drop

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Time to update action status | ~5 clicks | 1 drag | User testing |
| Actions overview time | N/A | < 3 seconds to assess board | User testing |
| Feature adoption | 0% | 80% of EAs using Kanban view | Analytics |
| Status update frequency | Baseline TBD | +30% | Database metrics |

---

## Open Questions

- [ ] Should "Cancelled" column be collapsible/hidden by default?
- [ ] Archive policy for completed items (auto-hide after X days)?
- [ ] Support for custom columns/statuses in future?
