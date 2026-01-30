# PRD-002: Decisions Filter System

**Version:** 1.0
**Created:** 2026-01-21
**Status:** Draft
**Priority:** High

---

## Executive Summary

Implement a comprehensive filtering system for the Decisions page that enables users to search, filter, and retrieve historical decisions across multiple dimensions: time periods, meetings, and people involved. This addresses the critical need for executives to recall past decisions and understand decision patterns over time.

---

## Problem Statement

The current Decisions page (`apps/web/app/(dashboard)/decisions/page.tsx`) displays decisions as a simple chronological list. This creates significant challenges:

- **Cannot find specific decisions** - No search capability to locate decisions by topic or keyword
- **No temporal navigation** - Users cannot filter to see decisions from specific time periods
- **Meeting context lost** - Cannot easily view all decisions from a particular meeting or meeting series
- **Ownership unclear** - Difficult to find decisions made by or involving specific people
- **Audit trail gaps** - Hard to answer "what did we decide about X?"

---

## User Personas

### Shannon (Executive Assistant)
**Goals:** Prepare briefing materials, track decision follow-through, maintain organizational memory
**Pain Points:** Spends excessive time scrolling to find past decisions, cannot quickly compile decision summaries

### Alex (CEO)
**Goals:** Quick context before meetings, verify past commitments, strategic pattern recognition
**Pain Points:** Cannot recall specific decisions without asking Shannon, lacks visibility into decision velocity

### Jordan (CFO)
**Goals:** Track budget-related decisions, understand financial commitments, audit trail for governance
**Pain Points:** Cannot filter to financial topics, no way to see their own decision history

---

## User Stories

| ID | Role | Story | Priority |
|----|------|-------|----------|
| US-1 | CEO | As Alex, I want to search "budget" to find all budget-related decisions so I can review our financial commitments | Must Have |
| US-2 | EA | As Shannon, I want to filter decisions from "this quarter" to compile a quarterly decision summary | Must Have |
| US-3 | CFO | As Jordan, I want to see all decisions I made so I can review my decision history | Must Have |
| US-4 | EA | As Shannon, I want to filter by meeting series (e.g., "ELT Weekly") to see patterns across recurring meetings | Must Have |
| US-5 | CEO | As Alex, I want to combine filters (Q1 + ELT + budget) to narrow down to specific decisions | Should Have |
| US-6 | EA | As Shannon, I want to save frequently-used filter combinations as presets | Should Have |
| US-7 | CFO | As Jordan, I want to export filtered decisions to share with the board | Could Have |

---

## Functional Requirements

### FR-1: Full-Text Search

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-1.1 | Search across decision title | Matches partial words, case-insensitive |
| FR-1.2 | Search across decision description/rationale | Searches full text content |
| FR-1.3 | Debounced search input (300ms) | No excessive API calls while typing |
| FR-1.4 | Highlight matched terms in results | Visual indication of matches |
| FR-1.5 | Search results sorted by relevance | Most relevant matches first |

### FR-2: Time-Based Filters

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-2.1 | Date range picker (start/end dates) | Calendar component with range selection |
| FR-2.2 | Quick presets: This week, This month, This quarter, This year | Single-click selection |
| FR-2.3 | Custom range option | Arbitrary date selection |
| FR-2.4 | "Last X days" input | Numeric input for rolling window |
| FR-2.5 | Clear visual indication of active time filter | Badge or highlighted state |

### FR-3: Meeting-Based Filters

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-3.1 | Filter by meeting series (recurring meeting pattern) | Dropdown with all meeting series |
| FR-3.2 | Filter by specific meeting instance | Search/select specific meeting date |
| FR-3.3 | Show meeting count per series in dropdown | "(12 decisions)" indicator |
| FR-3.4 | Support multiple meeting series selection | Multi-select capability |

### FR-4: Person-Based Filters

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-4.1 | Filter by "Decided by" (decision owner/maker) | User selector with avatars |
| FR-4.2 | Filter by "Involved in" (participants in decision discussion) | Multi-select participant filter |
| FR-4.3 | "My decisions" quick toggle | Filter to current users decisions |
| FR-4.4 | Show decision count per person | "(8 decisions)" indicator |

### FR-5: Filter Combination & Presets

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-5.1 | All filters combine with AND logic | Results match ALL active filters |
| FR-5.2 | Visual filter summary bar | Shows all active filters as removable chips |
| FR-5.3 | Save current filter combination as named preset | "Save as..." action |
| FR-5.4 | Load saved preset from dropdown | Quick access to saved filters |
| FR-5.5 | Delete saved presets | Manage preset list |
| FR-5.6 | "Clear all filters" button | Reset to unfiltered view |

### FR-6: Export

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-6.1 | Export filtered results to CSV | Download button on results |
| FR-6.2 | Export to PDF (formatted report) | Optional: styled document output |
| FR-6.3 | Include filter criteria in export header | Document what filters produced the export |

---

## Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| Performance | Search response time | < 200ms for queries |
| Performance | Filter application | < 100ms perceived latency |
| Performance | Support large datasets | Handle 10,000+ decisions |
| Usability | Filter discoverability | All filters visible without scrolling |
| Usability | Mobile responsive | Filters collapse to sheet on mobile |
| Accessibility | Keyboard navigation | All filters operable via keyboard |
| Accessibility | Screen reader support | ARIA labels for filter controls |

---

## UI/UX Specifications

### Filter Bar Layout

```
+--------------------------------------------------------------------------------+
| [Search: "budget..."]  [Time: This Quarter v]  [Meeting: ELT Weekly v]        |
|                        [Person: Jordan (CFO) v] [Save Preset]  [Clear All]    |
+--------------------------------------------------------------------------------+
| Active Filters: [This Quarter x] [ELT Weekly x] [Jordan x]     12 results     |
+--------------------------------------------------------------------------------+
```

### Filter Components

- **Search:** Input field with search icon, clear button, debounced
- **Time:** Popover with calendar range picker + preset buttons
- **Meeting:** Searchable dropdown with meeting series grouped
- **Person:** Avatar-enhanced user selector
- **Presets:** Dropdown with saved presets + "Save current" option

### Results Display

- Maintain existing decision card design
- Add subtle highlight on matched search terms
- Show total count of filtered results
- Empty state: "No decisions match your filters" with suggestion to broaden

---

## Technical Approach

### Component Structure

```
apps/web/app/(dashboard)/decisions/
├── page.tsx                      # Layout wrapper
├── components/
│   ├── DecisionFilters.tsx       # Filter bar container
│   ├── SearchInput.tsx           # Debounced search component
│   ├── TimeFilter.tsx            # Date range picker + presets
│   ├── MeetingFilter.tsx         # Meeting series selector
│   ├── PersonFilter.tsx          # User filter selector
│   ├── FilterPresets.tsx         # Save/load filter presets
│   ├── FilterChips.tsx           # Active filter display
│   ├── DecisionList.tsx          # Filtered results list
│   └── hooks/
│       ├── useDecisionFilters.ts # Filter state management
│       ├── useSearchDebounce.ts  # Debounced search logic
│       └── useFilterPresets.ts   # Preset CRUD operations
```

### Query Optimization

- **Database indexes:** Add indexes on decision date, meeting_id, decided_by
- **Full-text search:** Use PostgreSQL full-text search or pg_trgm for fuzzy matching
- **Query structure:** Build dynamic WHERE clause from active filters
- **Pagination:** Implement cursor-based pagination for large result sets

### State Management

- URL-based filter state (shareable filtered views)
- React Query for server state with filter params as query keys
- localStorage for filter presets (later: sync to user profile)

### API Changes

```typescript
// GET /api/decisions?search=budget&from=2026-01-01&to=2026-03-31&meeting=abc&decidedBy=xyz
interface DecisionFilterParams {
  search?: string;
  from?: string;       // ISO date
  to?: string;         // ISO date
  meetingIds?: string[];
  meetingSeries?: string[];
  decidedBy?: string[];
  involvedUsers?: string[];
  limit?: number;
  cursor?: string;
}
```

---

## Frontend Design Stack

### Required Tools
- **shadcn MCP:** Component discovery (Input, DatePicker, Popover, Command, Badge)
- **shadcn-create Skill:** Load `~/.claude/skills/shadcn-create/SKILL.md` for theme consistency

### Component Requirements
- `Input` - Search field
- `DatePicker` / `Calendar` - Date range selection
- `Popover` - Filter dropdowns
- `Command` - Searchable select lists
- `Badge` - Active filter chips
- `Button` - Filter actions
- `Avatar` - User display in person filter
- `DropdownMenu` - Preset management

---

## Acceptance Criteria

- [ ] Search finds decisions by title, description, and rationale content
- [ ] Time filter presets (week, month, quarter, year) work correctly
- [ ] Custom date range picker selects arbitrary ranges
- [ ] Meeting filter shows all meeting series with decision counts
- [ ] Person filter allows filtering by decision maker
- [ ] Multiple filters combine with AND logic
- [ ] Active filters display as removable chips
- [ ] Filter presets can be saved, loaded, and deleted
- [ ] Clear All button resets all filters
- [ ] Search is debounced (no query until 300ms pause)
- [ ] Results return in under 200ms for typical queries
- [ ] Empty state shows helpful message when no matches
- [ ] Filters persist in URL (shareable links)
- [ ] CSV export includes filtered results with filter criteria

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Time to find specific decision | 2+ minutes | < 30 seconds | User testing |
| Decision recall success rate | ~60% | > 90% | Task completion testing |
| Filter feature adoption | 0% | 70% of users using filters weekly | Analytics |
| Support tickets for "find decision" | Baseline TBD | -50% | Support metrics |

---

## Open Questions

- [ ] Should search include meeting transcript content (broader scope)?
- [ ] Implement relevance scoring or keep chronological order within filtered results?
- [ ] Tag/category system for decisions (future enhancement)?
- [ ] Sync filter presets across devices via user profile?
