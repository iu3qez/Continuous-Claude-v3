# TASKS-002: Decisions Filter System - Implementation Tasks

**Feature:** Decisions Filter System
**PRD:** PRD-002-decisions-filter.md
**Created:** 2026-01-21

---

## Phase 1: Backend Preparation (Days 1-2)

### Database Optimization

- [ ] **TASK-F001**: Add database indexes for filtering
  - Index on `decisions.date` (time-based filtering)
  - Index on `decisions.meeting_id` (meeting filter)
  - Index on `decisions.decided_by` (person filter)
  - Composite index on `(organization_id, date)` for common queries
  - **Files**: Migration file `packages/db/migrations/YYYYMMDD_add_decision_indexes.sql` (new)
  - **Dependencies**: None
  - **Complexity**: S
  - **Acceptance**: Indexes created, query plan shows index usage

- [ ] **TASK-F002**: Enable PostgreSQL full-text search
  - Add `search_vector` tsvector column to decisions table
  - Create GIN index on `search_vector`
  - Add trigger to auto-update search_vector on insert/update
  - **Files**: Migration file `packages/db/migrations/YYYYMMDD_add_fulltext_search.sql` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: Full-text search functional, query returns ranked results

- [ ] **TASK-F003**: Verify pg_trgm extension for fuzzy search
  - Install pg_trgm extension (if not present)
  - Test fuzzy matching on decision title/description
  - **Files**: Migration file (if needed)
  - **Dependencies**: None
  - **Complexity**: S
  - **Acceptance**: Fuzzy search returns partial matches

### API Route

- [ ] **TASK-F004**: Update GET /api/decisions endpoint
  - Add query params: `search`, `from`, `to`, `meetingIds`, `meetingSeries`, `decidedBy`, `involvedUsers`, `limit`, `cursor`
  - Build dynamic WHERE clause from active filters
  - Implement cursor-based pagination
  - **Files**: `apps/web/app/api/decisions/route.ts`
  - **Dependencies**: TASK-F001, TASK-F002
  - **Complexity**: L
  - **Acceptance**: Endpoint accepts all filter params, returns filtered results

- [ ] **TASK-F005**: Create TypeScript types for filter params
  - Define `DecisionFilterParams` interface
  - Zod schema for validation
  - **Files**: `apps/web/lib/types/filters.ts` (new)
  - **Dependencies**: None
  - **Complexity**: S
  - **Acceptance**: Types compile, schema validates requests

---

## Phase 2: Search Component (Day 3)

### Search Input

- [ ] **TASK-F006**: Create SearchInput component
  - Text input with search icon
  - Clear button (X)
  - **Files**: `apps/web/components/decisions/SearchInput.tsx` (new)
  - **Dependencies**: None
  - **Complexity**: S
  - **Acceptance**: Input renders, clear button works

- [ ] **TASK-F007**: Implement debounced search
  - Debounce input changes (300ms)
  - Trigger API query on debounce
  - **Files**: `apps/web/components/decisions/hooks/useSearchDebounce.ts` (new)
  - **Dependencies**: TASK-F006
  - **Complexity**: M
  - **Acceptance**: API calls only after 300ms pause, no excessive requests

- [ ] **TASK-F008**: Add search result highlighting
  - Highlight matched terms in decision title/description
  - Use mark or span with CSS highlight
  - **Files**: `apps/web/components/decisions/DecisionCard.tsx` (modify)
  - **Dependencies**: TASK-F007
  - **Complexity**: M
  - **Acceptance**: Matched terms highlighted in results

---

## Phase 3: Time-Based Filters (Day 4)

### Date Range Picker

- [ ] **TASK-F009**: Create TimeFilter component
  - shadcn Popover with Calendar (range mode)
  - Quick preset buttons (This week, This month, This quarter, This year)
  - Custom range option
  - **Files**: `apps/web/components/decisions/TimeFilter.tsx` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: Presets work, custom range selectable, popover closes on selection

- [ ] **TASK-F010**: Implement "Last X days" input
  - Numeric input for rolling window
  - Convert to date range (today - X days to today)
  - **Files**: `apps/web/components/decisions/TimeFilter.tsx`
  - **Dependencies**: TASK-F009
  - **Complexity**: S
  - **Acceptance**: Input converts to date range, filters correctly

- [ ] **TASK-F011**: Add visual indication of active time filter
  - Badge or highlighted state on TimeFilter button
  - Display selected range as text
  - **Files**: `apps/web/components/decisions/TimeFilter.tsx`
  - **Dependencies**: TASK-F009
  - **Complexity**: S
  - **Acceptance**: Active filter shows badge, displays range

---

## Phase 4: Meeting-Based Filters (Day 5)

### Meeting Filter

- [ ] **TASK-F012**: Create MeetingFilter component
  - shadcn DropdownMenu or Command component
  - List all meeting series with decision counts
  - Multi-select capability
  - **Files**: `apps/web/components/decisions/MeetingFilter.tsx` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: Dropdown shows meeting series, multi-select works, shows counts

- [ ] **TASK-F013**: Add specific meeting instance filter
  - Search/select specific meeting by date
  - Show meeting title and date
  - **Files**: `apps/web/components/decisions/MeetingFilter.tsx`
  - **Dependencies**: TASK-F012
  - **Complexity**: M
  - **Acceptance**: Can filter by specific meeting instance

- [ ] **TASK-F014**: Display meeting count per series
  - Query decision counts grouped by meeting series
  - Show count in dropdown "(12 decisions)"
  - **Files**: `apps/web/components/decisions/MeetingFilter.tsx`, API route
  - **Dependencies**: TASK-F012
  - **Complexity**: S
  - **Acceptance**: Counts display correctly, update on filter change

---

## Phase 5: Person-Based Filters (Day 6)

### Person Filter

- [ ] **TASK-F015**: Create PersonFilter component
  - User selector with avatars
  - Filter by "Decided by" (decision maker)
  - **Files**: `apps/web/components/decisions/PersonFilter.tsx` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: Dropdown shows users with avatars, filters by decidedBy

- [ ] **TASK-F016**: Add "Involved in" filter
  - Multi-select for decision participants
  - Filter decisions where user was involved
  - **Files**: `apps/web/components/decisions/PersonFilter.tsx`
  - **Dependencies**: TASK-F015
  - **Complexity**: M
  - **Acceptance**: Multi-select participants, filters correctly

- [ ] **TASK-F017**: Add "My decisions" quick toggle
  - Single-click toggle for current user's decisions
  - **Files**: `apps/web/components/decisions/PersonFilter.tsx`
  - **Dependencies**: TASK-F015
  - **Complexity**: S
  - **Acceptance**: Toggle filters to current user's decisions

- [ ] **TASK-F018**: Display decision count per person
  - Show count next to each person "(8 decisions)"
  - **Files**: `apps/web/components/decisions/PersonFilter.tsx`, API route
  - **Dependencies**: TASK-F015
  - **Complexity**: S
  - **Acceptance**: Counts display, update on filter change

---

## Phase 6: Filter Combination & State (Day 7)

### Filter State Management

- [ ] **TASK-F019**: Create useDecisionFilters hook
  - Manage filter state (search, time, meeting, person)
  - Combine filters with AND logic
  - Build query params object
  - **Files**: `apps/web/components/decisions/hooks/useDecisionFilters.ts` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: Hook manages all filter state, combines filters correctly

- [ ] **TASK-F020**: Implement URL-based filter state
  - Sync filters to URL query params (shareable links)
  - Parse URL on page load
  - **Files**: `apps/web/components/decisions/hooks/useDecisionFilters.ts`
  - **Dependencies**: TASK-F019
  - **Complexity**: M
  - **Acceptance**: Filters sync to URL, shareable links work

### Filter Display

- [ ] **TASK-F021**: Create FilterChips component
  - Display active filters as removable chips
  - Click X to remove individual filter
  - **Files**: `apps/web/components/decisions/FilterChips.tsx` (new)
  - **Dependencies**: TASK-F019
  - **Complexity**: S
  - **Acceptance**: Chips show for active filters, removal works

- [ ] **TASK-F022**: Add results count display
  - Show total filtered results count
  - Update dynamically as filters change
  - **Files**: `apps/web/components/decisions/FilterChips.tsx` or DecisionFilters
  - **Dependencies**: TASK-F019
  - **Complexity**: S
  - **Acceptance**: Count displays, updates on filter change

### Clear Filters

- [ ] **TASK-F023**: Add "Clear All Filters" button
  - Reset all filters to default
  - Clear URL params
  - **Files**: `apps/web/components/decisions/DecisionFilters.tsx` (new)
  - **Dependencies**: TASK-F019
  - **Complexity**: S
  - **Acceptance**: Button clears all filters, resets view

---

## Phase 7: Filter Presets (Day 8)

### Preset Management

- [ ] **TASK-F024**: Create FilterPresets component
  - Dropdown with saved presets
  - "Save current" option
  - **Files**: `apps/web/components/decisions/FilterPresets.tsx` (new)
  - **Dependencies**: TASK-F019
  - **Complexity**: M
  - **Acceptance**: Dropdown shows presets, "Save current" works

- [ ] **TASK-F025**: Implement preset save to localStorage
  - Save filter combination with custom name
  - Store as JSON in localStorage
  - Key: `decision-filter-presets-${userId}`
  - **Files**: `apps/web/components/decisions/hooks/useFilterPresets.ts` (new)
  - **Dependencies**: TASK-F024
  - **Complexity**: M
  - **Acceptance**: Presets save to localStorage, persist across sessions

- [ ] **TASK-F026**: Implement preset load
  - Load preset from dropdown
  - Apply all filters from preset
  - **Files**: `apps/web/components/decisions/hooks/useFilterPresets.ts`
  - **Dependencies**: TASK-F025
  - **Complexity**: S
  - **Acceptance**: Loading preset applies all filters

- [ ] **TASK-F027**: Add preset delete
  - Delete preset from localStorage
  - Update dropdown list
  - **Files**: `apps/web/components/decisions/FilterPresets.tsx`
  - **Dependencies**: TASK-F025
  - **Complexity**: S
  - **Acceptance**: Delete removes preset from localStorage

---

## Phase 8: Export (Day 9)

### CSV Export

- [ ] **TASK-F028**: Create CSV export function
  - Convert filtered results to CSV format
  - Include: title, description, decidedBy, meeting, date
  - **Files**: `apps/web/lib/export/csv.ts` (new or existing)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: CSV export downloads with correct data

- [ ] **TASK-F029**: Add export button to filter bar
  - Download button
  - Trigger CSV export of current filtered results
  - **Files**: `apps/web/components/decisions/DecisionFilters.tsx`
  - **Dependencies**: TASK-F028
  - **Complexity**: S
  - **Acceptance**: Button downloads CSV with filtered results

- [ ] **TASK-F030**: Include filter criteria in export header
  - Add comment/header row with active filters
  - Document what filters produced the export
  - **Files**: `apps/web/lib/export/csv.ts`
  - **Dependencies**: TASK-F028
  - **Complexity**: S
  - **Acceptance**: CSV header shows applied filters

### PDF Export (Optional)

- [ ] **TASK-F031**: Create PDF export function (optional)
  - Use library (e.g., pdfmake, react-pdf)
  - Styled report output
  - Include filter criteria
  - **Files**: `apps/web/lib/export/pdf.ts` (new)
  - **Dependencies**: None
  - **Complexity**: L
  - **Acceptance**: PDF downloads with formatted decisions

---

## Phase 9: Integration & Polish (Day 10)

### Page Integration

- [ ] **TASK-F032**: Create DecisionFilters container component
  - Combine all filter components
  - Filter bar layout
  - **Files**: `apps/web/components/decisions/DecisionFilters.tsx` (new)
  - **Dependencies**: TASK-F006, TASK-F009, TASK-F012, TASK-F015, TASK-F024
  - **Complexity**: M
  - **Acceptance**: Filter bar displays all filters in layout

- [ ] **TASK-F033**: Integrate filters into Decisions page
  - Add DecisionFilters above decision list
  - Connect filter state to query
  - **Files**: `apps/web/app/(dashboard)/decisions/page.tsx`
  - **Dependencies**: TASK-F032, TASK-F004
  - **Complexity**: M
  - **Acceptance**: Filters display on page, filter results correctly

- [ ] **TASK-F034**: Update DecisionList to handle filtered results
  - Display filtered results
  - Show empty state when no matches
  - **Files**: `apps/web/components/decisions/DecisionList.tsx`
  - **Dependencies**: TASK-F033
  - **Complexity**: S
  - **Acceptance**: List shows filtered results, empty state appears when no matches

### Empty State

- [ ] **TASK-F035**: Create empty state component
  - Message: "No decisions match your filters"
  - Suggestion to broaden filters
  - **Files**: `apps/web/components/decisions/DecisionList.tsx` or EmptyState component
  - **Dependencies**: TASK-F034
  - **Complexity**: S
  - **Acceptance**: Empty state shows when no matches, helpful message

### Mobile Responsive

- [ ] **TASK-F036**: Make filters mobile responsive
  - Collapse filter bar to sheet/drawer on mobile
  - Filter button to open sheet
  - **Files**: `apps/web/components/decisions/DecisionFilters.tsx`
  - **Dependencies**: TASK-F032
  - **Complexity**: M
  - **Acceptance**: Mobile shows filter button, opens sheet with filters

---

## Phase 10: Performance & Testing (Day 11)

### Performance

- [ ] **TASK-F037**: Test with 10,000+ decisions
  - Verify query response time < 200ms
  - Check filter application latency < 100ms
  - **Files**: N/A (testing task)
  - **Dependencies**: TASK-F033
  - **Complexity**: S
  - **Acceptance**: Queries return in < 200ms, filters apply quickly

- [ ] **TASK-F038**: Implement pagination for large result sets
  - Cursor-based pagination (already in API)
  - Infinite scroll or "Load More" button
  - **Files**: `apps/web/components/decisions/DecisionList.tsx`
  - **Dependencies**: TASK-F004
  - **Complexity**: M
  - **Acceptance**: Large result sets paginate, load more works

### Accessibility

- [ ] **TASK-F039**: Add keyboard navigation for filters
  - All filters operable via keyboard
  - Tab order logical
  - **Files**: All filter components
  - **Dependencies**: TASK-F032
  - **Complexity**: S
  - **Acceptance**: Full keyboard navigation works

- [ ] **TASK-F040**: Add ARIA labels for filter controls
  - Label all dropdowns, inputs, buttons
  - Screen reader announces filter changes
  - **Files**: All filter components
  - **Dependencies**: TASK-F032
  - **Complexity**: S
  - **Acceptance**: Screen reader announces all filter actions

---

## Summary

### Total Task Count: 40

### Breakdown by Complexity
- **S (Small)**: 19 tasks
- **M (Medium)**: 19 tasks
- **L (Large)**: 2 tasks
- **XL (Extra Large)**: 0 tasks

### Estimated Timeline
- **Phase 1 (Backend)**: Days 1-2 (5 tasks)
- **Phase 2 (Search)**: Day 3 (3 tasks)
- **Phase 3 (Time Filter)**: Day 4 (3 tasks)
- **Phase 4 (Meeting Filter)**: Day 5 (3 tasks)
- **Phase 5 (Person Filter)**: Day 6 (4 tasks)
- **Phase 6 (State)**: Day 7 (5 tasks)
- **Phase 7 (Presets)**: Day 8 (4 tasks)
- **Phase 8 (Export)**: Day 9 (4 tasks)
- **Phase 9 (Integration)**: Day 10 (5 tasks)
- **Phase 10 (Performance)**: Day 11 (4 tasks)

**Total Duration**: 11 days (~2.5 weeks)

### Suggested Priority Order
1. Phase 1 (backend foundation)
2. Phase 2 (search - high user value)
3. Phase 3, 4, 5 (core filters)
4. Phase 6 (state management - needed for all filters)
5. Phase 9 (integration)
6. Phase 7 (presets - nice-to-have)
7. Phase 8 (export - optional)
8. Phase 10 (polish)

### Critical Path
```
TASK-F001/F002 → TASK-F004 → TASK-F019 → TASK-F032 → TASK-F033
```

Backend optimization and API must be done first. Filter state management is critical for combining filters. Integration is final step.

---

**Ready for implementation**: Begin with Phase 1 (backend prep).
