# TASKS-001: Actions Kanban - Implementation Tasks

**Feature:** Actions Kanban Board
**PRD:** PRD-001-actions-kanban.md
**Created:** 2026-01-21

---

## Phase 1: Setup & Dependencies (Day 1)

### Dependencies

- [ ] **TASK-K001**: Install @dnd-kit dependencies
  - Install `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
  - Command: `pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
  - **Files**: `apps/web/package.json`
  - **Dependencies**: None
  - **Complexity**: S
  - **Acceptance**: Dependencies appear in package.json, `pnpm install` succeeds

### Type Definitions

- [ ] **TASK-K002**: Create Kanban types
  - Define `KanbanColumn`, `KanbanItem`, `DragEndEvent` types
  - Define `ColumnId` enum matching schema statuses
  - **Files**: `apps/web/lib/types/kanban.ts` (new)
  - **Dependencies**: TASK-K001
  - **Complexity**: S
  - **Acceptance**: Types compile without errors, export correctly

---

## Phase 2: Core Components (Days 2-3)

### Board Container

- [ ] **TASK-K003**: Create KanbanBoard container component
  - Implement `DndContext` provider
  - Set up collision detection strategy
  - Handle drag events (onDragStart, onDragOver, onDragEnd)
  - **Files**: `apps/web/components/kanban/KanbanBoard.tsx` (new)
  - **Dependencies**: TASK-K001, TASK-K002
  - **Complexity**: M
  - **Acceptance**: Component renders 4 columns, drag events fire

- [ ] **TASK-K004**: Create KanbanColumn component
  - Implement `SortableContext` for column
  - Add column header with count badge
  - Make header sticky on scroll
  - Handle empty state
  - **Files**: `apps/web/components/kanban/KanbanColumn.tsx` (new)
  - **Dependencies**: TASK-K003
  - **Complexity**: M
  - **Acceptance**: Column header sticks on scroll, count updates dynamically

- [ ] **TASK-K005**: Create KanbanCard component
  - Implement `useSortable` hook
  - Display title, owner avatar, due date, priority badge
  - Add hover state with elevation
  - Handle click to expand
  - **Files**: `apps/web/components/kanban/KanbanCard.tsx` (new)
  - **Dependencies**: TASK-K004
  - **Complexity**: M
  - **Acceptance**: Card displays all fields, responds to drag, click opens detail

### Card Styling

- [ ] **TASK-K006**: Implement priority visual indicators
  - Color-coded left border (green/yellow/orange/red)
  - Priority badge component
  - **Files**: `apps/web/components/kanban/PriorityBadge.tsx` (new), `KanbanCard.tsx`
  - **Dependencies**: TASK-K005
  - **Complexity**: S
  - **Acceptance**: Priority colors match spec, visible in card

- [ ] **TASK-K007**: Add overdue styling
  - Detect past-due items
  - Apply red background tint
  - **Files**: `apps/web/components/kanban/KanbanCard.tsx`
  - **Dependencies**: TASK-K005
  - **Complexity**: S
  - **Acceptance**: Overdue items show red tint, updates on date change

---

## Phase 3: Drag-and-Drop Logic (Day 3)

### State Management

- [ ] **TASK-K008**: Create useKanbanDragDrop hook
  - Handle `onDragStart` (visual feedback)
  - Handle `onDragOver` (drop zone highlighting)
  - Handle `onDragEnd` (status update, optimistic UI)
  - Implement rollback on API error
  - **Files**: `apps/web/components/kanban/hooks/useKanbanDragDrop.ts` (new)
  - **Dependencies**: TASK-K003
  - **Complexity**: L
  - **Acceptance**: Drag updates status, optimistic UI shows immediately, rollback on error

### API Integration

- [ ] **TASK-K009**: Verify PATCH /api/actions/[id] endpoint
  - Confirm endpoint supports status field update
  - Test with different statuses
  - **Files**: `apps/web/app/api/actions/[id]/route.ts`
  - **Dependencies**: None (existing endpoint)
  - **Complexity**: S
  - **Acceptance**: Endpoint accepts status updates, returns updated item

- [ ] **TASK-K010**: Create API mutation for status update
  - Use React Query mutation
  - Optimistic update implementation
  - Error handling with toast notification
  - **Files**: `apps/web/lib/api/actions.ts` (or new)
  - **Dependencies**: TASK-K009
  - **Complexity**: M
  - **Acceptance**: Mutation updates status, optimistic UI, rollback on error

---

## Phase 4: Detail Panel (Days 4-5)

### Panel Component

- [ ] **TASK-K011**: Create ActionDetailPanel component
  - Use shadcn Sheet component (slide-over)
  - Display all action fields
  - 400px width from right edge
  - **Files**: `apps/web/components/kanban/ActionDetailPanel.tsx` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: Panel slides in from right, 400px wide, shows action data

### Editable Fields

- [ ] **TASK-K012**: Implement inline title editing
  - Editable text input
  - Debounced auto-save (500ms)
  - **Files**: `apps/web/components/kanban/ActionDetailPanel.tsx`
  - **Dependencies**: TASK-K011
  - **Complexity**: M
  - **Acceptance**: Title edits save automatically after 500ms pause

- [ ] **TASK-K013**: Add owner selector dropdown
  - shadcn DropdownMenu or Command component
  - List all users in organization
  - **Files**: `apps/web/components/kanban/ActionDetailPanel.tsx`
  - **Dependencies**: TASK-K011
  - **Complexity**: M
  - **Acceptance**: Dropdown shows users, selection updates owner

- [ ] **TASK-K014**: Add due date picker
  - shadcn DatePicker component
  - Calendar with date selection
  - **Files**: `apps/web/components/kanban/ActionDetailPanel.tsx`
  - **Dependencies**: TASK-K011
  - **Complexity**: S
  - **Acceptance**: Calendar picker updates due date

- [ ] **TASK-K015**: Add priority dropdown
  - Dropdown with LOW, MEDIUM, HIGH, URGENT
  - Visual indicators per priority
  - **Files**: `apps/web/components/kanban/ActionDetailPanel.tsx`
  - **Dependencies**: TASK-K011
  - **Complexity**: S
  - **Acceptance**: Dropdown shows priorities, selection updates priority

- [ ] **TASK-K016**: Add description editor
  - Tiptap mini-editor or textarea
  - Markdown support (optional)
  - Auto-save on blur
  - **Files**: `apps/web/components/kanban/ActionDetailPanel.tsx`
  - **Dependencies**: TASK-K011
  - **Complexity**: M
  - **Acceptance**: Description edits save on blur

### Panel Metadata

- [ ] **TASK-K017**: Add meeting link section
  - Link to source meeting (if associated)
  - Display meeting title and date
  - **Files**: `apps/web/components/kanban/ActionDetailPanel.tsx`
  - **Dependencies**: TASK-K011
  - **Complexity**: S
  - **Acceptance**: Meeting link displays, navigates to meeting page

- [ ] **TASK-K018**: Add metadata footer
  - Display created/modified timestamps
  - Display created by user
  - Read-only section
  - **Files**: `apps/web/components/kanban/ActionDetailPanel.tsx`
  - **Dependencies**: TASK-K011
  - **Complexity**: S
  - **Acceptance**: Timestamps display correctly, read-only

### Panel Interactions

- [ ] **TASK-K019**: Implement keyboard shortcuts
  - Escape key to close panel
  - **Files**: `apps/web/components/kanban/ActionDetailPanel.tsx`
  - **Dependencies**: TASK-K011
  - **Complexity**: S
  - **Acceptance**: Escape closes panel

- [ ] **TASK-K020**: Implement click-outside to close
  - Detect clicks outside panel
  - Close on backdrop click
  - **Files**: `apps/web/components/kanban/ActionDetailPanel.tsx`
  - **Dependencies**: TASK-K011
  - **Complexity**: S
  - **Acceptance**: Clicking backdrop closes panel

---

## Phase 5: Filtering (Days 6-7)

### Filter Components

- [ ] **TASK-K021**: Create ActionFilters container component
  - Filter bar layout above board
  - Display active filters as chips
  - **Files**: `apps/web/components/kanban/ActionFilters.tsx` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: Filter bar renders above board

- [ ] **TASK-K022**: Implement owner filter dropdown
  - Multi-select dropdown
  - List all users with assigned items
  - **Files**: `apps/web/components/kanban/ActionFilters.tsx`
  - **Dependencies**: TASK-K021
  - **Complexity**: M
  - **Acceptance**: Dropdown shows users, multi-select works, filters board

- [ ] **TASK-K023**: Implement priority filter
  - Checkbox group (LOW, MEDIUM, HIGH, URGENT)
  - Multi-select capability
  - **Files**: `apps/web/components/kanban/ActionFilters.tsx`
  - **Dependencies**: TASK-K021
  - **Complexity**: S
  - **Acceptance**: Checkboxes filter by priority

- [ ] **TASK-K024**: Implement meeting filter dropdown
  - Dropdown listing meetings with action items
  - Show meeting count
  - **Files**: `apps/web/components/kanban/ActionFilters.tsx`
  - **Dependencies**: TASK-K021
  - **Complexity**: M
  - **Acceptance**: Dropdown shows meetings, filters by meeting

- [ ] **TASK-K025**: Implement date range filter
  - DatePicker range component
  - Filter by due date range
  - **Files**: `apps/web/components/kanban/ActionFilters.tsx`
  - **Dependencies**: TASK-K021
  - **Complexity**: M
  - **Acceptance**: Date range picker filters by due date

### Filter State

- [ ] **TASK-K026**: Create useActionFilters hook
  - Manage filter state (owner, priority, meeting, date)
  - Combine filters with AND logic
  - **Files**: `apps/web/components/kanban/hooks/useActionFilters.ts` (new)
  - **Dependencies**: TASK-K021
  - **Complexity**: M
  - **Acceptance**: Hook manages filter state, combines filters correctly

- [ ] **TASK-K027**: Implement filter persistence (localStorage)
  - Save filter preferences to localStorage
  - Restore on page load
  - Key: `kanban-filters-${userId}`
  - **Files**: `apps/web/components/kanban/hooks/useActionFilters.ts`
  - **Dependencies**: TASK-K026
  - **Complexity**: S
  - **Acceptance**: Filters persist across sessions

### Filter Actions

- [ ] **TASK-K028**: Add Clear All Filters button
  - Reset all filters to default
  - Clear localStorage
  - **Files**: `apps/web/components/kanban/ActionFilters.tsx`
  - **Dependencies**: TASK-K026
  - **Complexity**: S
  - **Acceptance**: Button clears all filters, resets to unfiltered view

- [ ] **TASK-K029**: Display active filters as chips
  - Removable chips for each active filter
  - Click chip X to remove filter
  - **Files**: `apps/web/components/kanban/ActionFilters.tsx`
  - **Dependencies**: TASK-K026
  - **Complexity**: S
  - **Acceptance**: Chips display for active filters, clicking X removes filter

---

## Phase 6: Responsive & Mobile (Day 8)

### Responsive Layout

- [ ] **TASK-K030**: Implement mobile layout
  - Stack columns on < 768px
  - Tab navigation between columns
  - **Files**: `apps/web/components/kanban/KanbanBoard.tsx`
  - **Dependencies**: TASK-K003
  - **Complexity**: M
  - **Acceptance**: Mobile shows single column with tabs

- [ ] **TASK-K031**: Adapt filters for mobile
  - Collapse filters to sheet/drawer
  - Filter button to open sheet
  - **Files**: `apps/web/components/kanban/ActionFilters.tsx`
  - **Dependencies**: TASK-K021
  - **Complexity**: M
  - **Acceptance**: Mobile shows filter button, opens sheet

---

## Phase 7: Accessibility (Day 9)

### Keyboard Navigation

- [ ] **TASK-K032**: Implement keyboard navigation for board
  - Tab through cards
  - Arrow keys to move between columns
  - Enter to select/expand card
  - **Files**: `apps/web/components/kanban/KanbanBoard.tsx`, `KanbanCard.tsx`
  - **Dependencies**: TASK-K003, TASK-K005
  - **Complexity**: L
  - **Acceptance**: Full board navigable with keyboard, screen reader announces moves

### ARIA Labels

- [ ] **TASK-K033**: Add ARIA labels for drag operations
  - Label draggable cards
  - Label drop zones
  - Announce drag state changes
  - **Files**: `apps/web/components/kanban/KanbanCard.tsx`, `KanbanColumn.tsx`
  - **Dependencies**: TASK-K005, TASK-K004
  - **Complexity**: M
  - **Acceptance**: Screen reader announces drag operations

---

## Phase 8: Integration & Testing (Day 10)

### Page Integration

- [ ] **TASK-K034**: Integrate KanbanBoard into Actions page
  - Replace existing list view
  - Fetch action items with React Query
  - **Files**: `apps/web/app/(dashboard)/actions/page.tsx`
  - **Dependencies**: TASK-K003, TASK-K021
  - **Complexity**: M
  - **Acceptance**: Kanban board displays on Actions page, data loads

- [ ] **TASK-K035**: Add view toggle (optional)
  - Toggle between list and kanban view
  - Save preference to localStorage
  - **Files**: `apps/web/app/(dashboard)/actions/page.tsx`
  - **Dependencies**: TASK-K034
  - **Complexity**: M
  - **Acceptance**: Toggle switches views, preference persists

### Performance Testing

- [ ] **TASK-K036**: Test with 100+ action items
  - Verify render time < 500ms
  - Check drag performance (60fps)
  - **Files**: N/A (testing task)
  - **Dependencies**: TASK-K034
  - **Complexity**: S
  - **Acceptance**: Board renders 100 items in < 500ms, drag is smooth

### Error Handling

- [ ] **TASK-K037**: Add error boundary for board
  - Catch rendering errors
  - Display fallback UI
  - **Files**: `apps/web/components/kanban/KanbanErrorBoundary.tsx` (new)
  - **Dependencies**: TASK-K034
  - **Complexity**: S
  - **Acceptance**: Error boundary catches errors, shows fallback

---

## Summary

### Total Task Count: 37

### Breakdown by Complexity
- **S (Small)**: 16 tasks
- **M (Medium)**: 18 tasks
- **L (Large)**: 3 tasks
- **XL (Extra Large)**: 0 tasks

### Estimated Timeline
- **Phase 1 (Setup)**: Day 1 (2 tasks)
- **Phase 2 (Components)**: Days 2-3 (5 tasks)
- **Phase 3 (Drag-Drop)**: Day 3 (3 tasks)
- **Phase 4 (Detail Panel)**: Days 4-5 (10 tasks)
- **Phase 5 (Filtering)**: Days 6-7 (9 tasks)
- **Phase 6 (Responsive)**: Day 8 (2 tasks)
- **Phase 7 (Accessibility)**: Day 9 (2 tasks)
- **Phase 8 (Integration)**: Day 10 (4 tasks)

**Total Duration**: 10 days (2 weeks)

### Suggested Priority Order
1. Phase 1 (setup dependencies)
2. Phase 2 (core components)
3. Phase 3 (drag-drop functionality)
4. Phase 4 (detail panel)
5. Phase 5 (filtering)
6. Phase 8 (integration first, then responsive/a11y)
7. Phase 6, 7 (polish)

### Critical Path
```
TASK-K001 → TASK-K002 → TASK-K003 → TASK-K004 → TASK-K005 → TASK-K008 → TASK-K034
```

Tasks on critical path must be completed in sequence. Other tasks can be parallelized.

---

**Ready for implementation**: Begin with Phase 1.
