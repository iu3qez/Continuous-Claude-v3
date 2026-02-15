# Nexus Design System - Production Handoff

**Date:** February 11, 2026
**Status:** Design Complete - Ready for Production Implementation
**Prototypes:** 4 HTML files, 2,742 lines total
**Theme:** Nexus (Catalyst architecture + Meridian editorial design)

---

## 1. Executive Summary

Nexus is the production-selected theme for the executive workbook platform. It combines:

- **Catalyst's architecture:** 56px icon-rail sidebar, command bar (Cmd+K), collapsible AI chat panel, stagger animations, keyboard shortcuts
- **Meridian's editorial design:** Playfair Display serif headings, Inter body text, JetBrains Mono data, editorial timeline, sparkbar indicators, inline decision/action blocks

**4 pages prototyped:**

| Page | File | Lines | Major Components |
|------|------|-------|-----------------|
| Dashboard | `nexus/dashboard.html` | 677 | 13 |
| Meetings Overview | `nexus/meetings.html` | 579 | 9 |
| Meeting Detail | `nexus/meeting-detail.html` | 708 | 9 |
| Actions | `nexus/actions.html` | 778 | 7 |

---

## 2. Design System Tokens

### Colors

```css
/* Surfaces */
surface:         #161618   /* Card backgrounds */
surface-dark:    #0C0C0E   /* Page background, sidebar */
surface-ai:      #14141A   /* AI panel background, follow-up inputs */

/* Borders */
border:          #232326   /* All borders, dividers, metadata chips */

/* Text hierarchy */
txt-primary:     #EDEDEF   /* Headings, body text */
txt-secondary:   #8F8F94   /* Metadata, secondary labels */
txt-tertiary:    #6B6B70   /* Timestamps, hints, muted text */

/* Accent */
accent:          #4F46E5   /* Indigo - primary action, AI elements, active nav */
accent-hover:    #6366F1   /* Hover state for accent */

/* Semantic */
danger:          #DC2626   /* Critical, overdue, blockers */
warning:         #D97706   /* High priority, pending */
success:         #059669   /* Completed, online status */
gold:            #B45309   /* Reserved for premium indicators */

/* Workspace dots */
OPS:             #4F46E5   /* Indigo */
ELT:             #7C3AED   /* Purple */
MKT:             #D97706   /* Amber */
ENG:             #059669   /* Green */
```

### Light Mode Override Map

```css
/* Surface mapping */
#0C0C0E  -> #F8F8FA   /* Page background */
#161618  -> #FFFFFF   /* Card backgrounds */
#14141A  -> #F5F3FF   /* AI panel (light purple) */
#232326  -> #E5E5E8   /* Borders */

/* Text mapping */
#EDEDEF  -> #1a1a1e   /* Primary text */
#8F8F94  -> #6B6B70   /* Secondary text */
#6B6B70  -> #9C9CA0   /* Tertiary text */

/* Component mapping */
metadata-chip bg:  #F0F0F3
filter-chip hover: #F0F0F3
sparkbar track:    #E5E5E8
scrollbar thumb:   #D4D4D8
```

### Typography

```css
/* Font families */
font-heading: 'Playfair Display', Georgia, serif      /* h1-h6, card titles, metric numbers */
font-body:    'Inter', system-ui, sans-serif           /* Body text, labels, inputs */
font-mono:    'JetBrains Mono', monospace              /* Data values, timestamps, badges, KBD hints */

/* Size scale (from prototypes) */
text-2xl:     ~24px    /* Page headings ("Good morning, David") */
text-xl:      ~20px    /* Meeting detail heading */
text-base:    ~16px    /* Timeline section headings */
text-sm:      ~14px    /* Card section headings, body paragraphs */
text-xs:      ~12px    /* Card content, action items, chat messages */
text-[11px]:  11px     /* Timestamps, filter chips */
text-[10px]:  10px     /* Badges, metadata, AI footnotes, mono data */
text-[9px]:   9px      /* Keyboard shortcut hints */
text-[8px]:   8px      /* Avatar initials, notification badge numbers */

/* Weight patterns */
font-semibold (600): Headings (Playfair Display)
font-medium (500):   Card titles, badge text, emphasis
font-normal (400):   Body text, descriptions
font-bold (700):     Notification badge numbers
```

### Spacing Patterns

```css
/* Page padding */
px-6:          24px    /* Main content horizontal padding */
px-4:          16px    /* Card internal padding, meeting detail content */
py-3:          12px    /* Sidebar vertical padding, command bar area */
py-2.5:        10px    /* Row items, alert banners */

/* Gap values */
gap-4:         16px    /* Major grid gaps, column spacing */
gap-3:         12px    /* Card grid gaps, section spacing */
gap-2:         8px     /* Inline element spacing, chip groups */
gap-1:         4px     /* Avatar stacks, tight groupings */
gap-0.5:       2px     /* Keyboard hint spacing */

/* Section spacing */
pb-4:          16px    /* Between major content sections */
pb-2:          8px     /* Between header and content */
mb-3:          12px    /* Between section heading and content */
```

### Border Radius

```css
rounded (4px):       Cards, metadata chips, buttons (editorial style)
rounded-md (6px):    Command bar, AI chat bubbles, sidebar nav items
rounded-lg (8px):    Sidebar logo, expanded panels
rounded-full:        Status dots, avatars, notification badges, filter pills
```

### Effects & Animations

```css
/* Stagger animation - 4 levels, 200ms total */
@keyframes staggerIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.1s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.2s; }

/* Spring focus - command bar scale bounce */
@keyframes springFocus {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

/* Critical glow - red danger shadow */
.critical-glow { box-shadow: 0 0 20px rgba(220, 38, 38, 0.08); }

/* Pulse danger - breathing opacity */
@keyframes pulseDanger {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Typing indicator dots */
@keyframes typingDot {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}

/* Reduced motion - CRITICAL for accessibility */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Scrollbar

```css
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: #0C0C0E; }
::-webkit-scrollbar-thumb { background: #232326; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #3a3a3f; }
```

---

## 3. Page-by-Page Component Layout

### Dashboard (678 lines, 13 components)

The dashboard is an urgency-first executive overview. Overdue items appear ABOVE metrics to force attention.

| # | Component | Description | Key Details |
|---|-----------|-------------|-------------|
| 1 | **56px Icon-Rail Sidebar** | Fixed left navigation with logo, Cmd+K trigger, nav icons (Dashboard/Meetings/Actions/Decisions/Settings), AI agent status indicator, theme toggle, user avatar, keyboard shortcut hints | Active nav: `bg-accent/10 text-accent`. Critical alert dot on dashboard icon. Notification badge counts on meetings/actions icons. |
| 2 | **Critical Alert Banner** | Full-width red banner below top edge | `bg-danger/8 border-b border-danger/20`. Pulsing red dot + "CRITICAL" mono badge + description + "View Meeting" CTA button + "Esc to dismiss" hint. Dismissible via Escape key. |
| 3 | **Command Bar** | Centered search/command input | `max-w-2xl mx-auto`. Spring focus animation on focus-within. `Cmd+K` kbd badge. Border turns accent on focus with 2px ring. |
| 4 | **Header** | Greeting + date + workspace indicator | Playfair "Good morning, David" (text-2xl). Date in body font. Workspace indicator: accent dot + workspace name + workstream count. |
| 5 | **Overdue Actions Card** | Full-width card ABOVE metrics | 3-column grid of overdue items. Each with red left border (`border-l-2 border-l-danger`), red background tint, title, priority badge (CRITICAL/HIGH), status, owner, due date in red. |
| 6 | **Metrics Row** | 4 metric cards in equal grid | `grid-cols-4 gap-3`. Each card: 10px uppercase tracking-widest label, Playfair 2xl number, mono 10px detail. Cross-Dept Blockers card has red left border + critical-glow + danger exclamation circle. |
| 7 | **AI Briefing Card** | 2-column card with indigo left border | `border-l-2 border-l-accent/60`. LEFT (col-span-2): Playfair summary headline + 4 triage bullets with colored dots (red/amber/indigo/gray). RIGHT: CTA panel with `bg-surface-ai`, action count, "Review Now" button. AI footnote at bottom with sparkles icon. |
| 8 | **Follow-Up Input** | Chat input inside AI Briefing Card | `bg-surface-ai border border-border`. Message circle icon + text input + indigo send button. |
| 9 | **Today's Schedule** | Timeline of 4 meetings | Card with header + "View all meetings" link. Divider-separated rows: time (mono), workspace dot, Playfair title, workspace chip, attendee count, status badge. Emergency meeting: red left border + critical-glow + URGENT badge. |
| 10 | **Priority Actions** | 5-item action list | Card with flame icon header + "View all" link. Divider-separated rows with priority badges (CRITICAL/HIGH/MEDIUM), title, status, owner, due date. Critical/High items have colored left borders. |
| 11 | **Recent Decisions** | 3 editorial decision entries | Card with git-branch icon. Each entry: date + workspace chip + status badge, then decision text, then rationale in tertiary text. |
| 12 | **Cross-Dept Blockers** | 3 blocker items with arrow notation | Card with red left border + critical-glow. shield-alert icon + red title + count badge. Each item: "Department A -> Department B" arrow pattern, description, overdue status, workspace chip. |
| 13 | **AI Tool Activity Cards** | 3 cards in bottom grid | `grid-cols-3`. Each: indigo left border, CPU/shield-check/calendar-check icon, tool name in Playfair, mono status lines. Tools: Resource Analyzer, Risk Assessment, Meeting Prep. |

**Layout structure:** Single column with `grid-cols-5` split for AI Briefing + Schedule (col-span-3) vs Priority Actions + Decisions + Blockers (col-span-2).

---

### Meetings Overview (579 lines, 9 components)

The meetings page organizes meetings by temporal proximity: Today (full detail cards) > This Week (compact rows) > Recent (muted, with decision/action counts).

| # | Component | Description | Key Details |
|---|-----------|-------------|-------------|
| 1 | **Sidebar** | Same 56px icon rail | Meetings nav highlighted. Notification badge with count on meetings icon. |
| 2 | **Command Bar** | Centered search | Placeholder: "Search meetings, attendees, or type a command..." |
| 3 | **Header** | "Meetings" in Playfair + date | Simple header, no workspace indicator. |
| 4 | **Filter Chips** | Toggle filter bar | All / Today / This Week / Upcoming. Active chip: `bg-accent/10 text-accent border-accent/20`. Count label on right ("10 meetings"). |
| 5 | **Today's Meetings** | 3 full-detail meeting cards | Each card: time column (mono, 14px wide) + workspace dot, Playfair title + status badge, workspace chip + attendee count + duration, avatar row (20x20 circles with colored backgrounds + initials), prep sparkbar + AI one-liner summary. Critical meeting: red left border + critical-glow + URGENT badge + action count badge. |
| 6 | **Prep Sparkbar** | Gradient progress bar | Track: `bg-border`, fill: `bg-gradient-to-r from-warning to-accent` (amber to indigo), percentage label. Colors: green=100%, amber=45-73%, red for critical. |
| 7 | **This Week Section** | 4 compact row cards | Single-line rows: date + time (mono), workspace dot, Playfair title, workspace chip, attendee count, AI one-liner (truncated to w-44). |
| 8 | **Recent Section** | 3 muted past meeting rows | `opacity-70 hover:opacity-100`. Smaller dots (w-1.5), body font titles (not Playfair), decision count + action count with git-branch and check-square icons. |
| 9 | **Meeting-to-Action Count Badges** | Inline count on meeting cards | `font-mono text-[10px] px-1.5 py-0.5 rounded bg-danger/10 text-danger` showing "3 actions". |

---

### Meeting Detail (708 lines, 9 components, 2-panel layout)

The meeting detail uses a 60/40 split-pane layout. The left panel contains the editorial meeting timeline; the right panel is the AI assistant.

#### Left Panel (60%)

| # | Component | Description | Key Details |
|---|-----------|-------------|-------------|
| 1 | **Critical Alert Banner** | Full-width red banner | "BLOCKER" label (not "CRITICAL"). Pulsing dot + meeting-specific description + Esc hint. |
| 2 | **Command Bar** | Narrower variant | `rounded-md` (not `rounded`). Placeholder: "Search in meeting or type /command..." |
| 3 | **Meeting Header** | Title + metadata + attendees + prep bar | Back arrow link to meetings.html. Playfair title (text-xl). Metadata chips: date, workspace, duration, attendee count. Emergency + Ad-hoc rounded-full badges. Quick Prep toggle button (lightning icon). Escalate button (danger). Attendee list: names separated by middot. Prep sparkbar with gradient fill (73%). |
| 4 | **Quick Prep Toggle** | Hidden summary panel | Lightning icon button reveals panel with: AI Brief (accent dot), Pending Decisions (danger dot), My Actions (warning dot). Each with title + detail text. `hidden` class toggled by button click. |
| 5 | **Editorial Timeline** | Vertical timeline with 5 time sections | `pl-12` offset. Vertical line (1px, `bg-border`). Time nodes: 12x12 circles with 2px borders. Active node: `border-accent`. Sections at 11:00, 11:10, 11:20, 11:30, 11:40. Playfair section headings (text-base). Narrative paragraphs in secondary text. |
| 6 | **Inline Decision Blocks** | Purple-tinted embedded blocks within timeline | `bg-accent/4 border border-accent/10 rounded-[4px]`. Git-branch icon + "Decision" label in accent. Decision text + rationale in tertiary text. 3 decisions total across timeline. |
| 7 | **Inline Action Blocks** | Green-tinted embedded blocks within timeline | `bg-success/4 border border-success/10 rounded-[4px]`. Check-square icon + "Action" label in success. Action text + owner + due date. 4 actions total across timeline. |
| 8 | **AI Editorial Annotations** | Inline italic footnotes within timeline paragraphs | Lightbulb SVG icon (opacity-60) + italic text in accent color at text-[10px]. Examples: "AI: This aligns with Q3 board directive on EU market compliance", "AI: Similar delay cost Q2 '25 campaign $92K -- pattern flagged". 3 annotations total. |

#### Right Panel (40%, collapsible)

| # | Component | Description | Key Details |
|---|-----------|-------------|-------------|
| 9 | **AI Chat Panel** | Full-height collapsible assistant | `bg-surface-ai`. Collapses to 56px icon strip via CSS class toggle. Header: sparkles icon button (toggle), "Workbook AI" title, "meeting-prep" mode badge, "online" status. **Content:** (a) "Prep me for this meeting" trigger button - reveals summary with blocker/risk/actions badges. (b) AI context analysis message with numbered concerns + dollar amounts in mono. (c) Tool-use indicator chips: 3 database query badges ("Queried MKT workspace", "Queried Legal decisions", "Queried Finance data") each with database icon + check mark. (d) User question bubble (right-aligned, accent-tinted). (e) AI impact analysis with cost breakdown table (dark bg, 4 rows + total). (f) Proposed Action card with Approve/Reject/Edit buttons. (g) Another user message. (h) Typing indicator (3 dots with staggered animation). **Input area:** Mode selector (meeting-prep / action-tracker / research - pill toggles), text input with send button, Cmd+Enter and Tab hints. |

---

### Actions (778 lines, 7 components)

The actions page uses a 4-column Kanban board with multi-select and bulk operations.

| # | Component | Description | Key Details |
|---|-----------|-------------|-------------|
| 1 | **Command Bar** | Centered search | Placeholder: "Search actions, owners, or type a command..." |
| 2 | **Header** | "Actions" in Playfair + stats | Subtitle: "23 active across 4 workspaces". Workspace indicator: accent dot + "All Workspaces". View toggle: List / Board (Board active with accent styling). |
| 3 | **Filter Bar** | Status filters + workspace pills + sort | Status: All / Overdue / Critical / This Week / Blocked. Divider. Workspace pills: OPS / ELT / MKT / ENG (each with colored dot). Sort label. |
| 4 | **4-Column Kanban Board** | Scrollable horizontal board | Each column: 288px wide (`w-72`), colored header dot + title + count badge, scrollable card area (`max-height: calc(100vh - 220px)`). **Overdue** (red, 5 cards): red border-l + critical-glow on critical items. **In Progress** (indigo, 5 cards): indigo border-l on AI-annotated items. **Blocked** (red, 4 cards): octagon SVG icon + blocker note. **Completed** (green, 4 cards): muted opacity-60, check-circle icon, strikethrough text. |
| 5 | **Action Card Anatomy** | Individual kanban cards | Priority badge (CRITICAL/HIGH/MEDIUM), title, owner avatar (16x16) + name + due date, workspace chip with colored dot, divider, "From: Meeting Name" source tag. Critical cards: red left border + critical-glow. AI cards: indigo left border + AI annotation block (`bg-accent/5 border border-accent/20`). Blocked cards: octagon icon + red italic blocker note (`bg-danger/6 border border-danger/10`). Cards are selectable (click toggles `selected` class with accent outline). |
| 6 | **AI Risk Banner** | Inline alert above bulk bar | `bg-accent/5 border border-accent/15`. Sparkles icon + "AI flagged 3 items at risk of missing deadline" + "View details" link. |
| 7 | **Floating Bulk Actions Bar** | Fixed bottom center bar | Hidden by default, appears when cards are selected. `backdrop-filter: blur(12px)`. Actions: selected count, Reassign, Change Priority, Mark Complete, Clear. |

---

## 4. Novel Components Inventory

These components represent new design patterns not found in typical executive dashboard platforms. Each should be evaluated for inclusion in the production build.

| # | Component | Page | Complexity | Backend Required? |
|---|-----------|------|-----------|------------------|
| 1 | AI Briefing Card with Follow-Up Chat Input | Dashboard | Medium | Yes - AI summarization API |
| 2 | Overdue-First Layout Hierarchy (overdue ABOVE metrics) | Dashboard | Low | No - layout decision |
| 3 | Cross-Dept Blockers with Arrow Notation ("Marketing -> Legal") | Dashboard | Low | Yes - cross-workspace query |
| 4 | Editorial Decision Log with Rationale | Dashboard | Low | Yes - decision data model |
| 5 | AI Tool Activity/Transparency Cards | Dashboard | Medium | Yes - AI agent status API |
| 6 | Prep Sparkbar on Meeting Cards | Meetings | Low | Yes - prep score calculation |
| 7 | AI One-Liner Summaries per Meeting | Meetings | Medium | Yes - AI summarization |
| 8 | Meeting-to-Action Count Badges | Meetings | Low | Yes - relational query |
| 9 | Meeting Source Tagging on Action Cards ("From: OPS Weekly") | Actions | Low | Yes - meeting-action linkage |
| 10 | AI Impact Annotations on Individual Cards | Actions | Medium | Yes - AI risk scoring |
| 11 | Inline Blocker Notes with Octagon Icon | Actions | Low | Yes - blocker data model |
| 12 | AI Risk Detection Banner | Actions | Medium | Yes - AI deadline analysis |
| 13 | Editorial Timeline with Inline Decision/Action Blocks | Meeting Detail | High | Yes - structured meeting notes |
| 14 | AI Editorial Annotations (inline italic footnotes in timeline) | Meeting Detail | High | Yes - AI contextual analysis |
| 15 | AI Chat with Tool-Use Indicator Chips | Meeting Detail | High | Yes - AI tool orchestration |
| 16 | AI Proposed Action Cards (Approve/Reject/Edit) | Meeting Detail | High | Yes - action creation API |
| 17 | AI Mode Selector (meeting-prep / action-tracker / research) | Meeting Detail | Medium | Yes - multi-mode AI |
| 18 | Quick Prep Toggle View | Meeting Detail | Low | Yes - AI prep summary |
| 19 | Floating Bulk Actions Bar with Multi-Select | Actions | Medium | Yes - bulk update API |

---

## 5. Production Architecture

### Stack

- **Framework:** Next.js 14+ with App Router
- **Styling:** Tailwind CSS v4 with Nexus theme config
- **Icons:** Lucide React
- **Fonts:** Google Fonts (Playfair Display, Inter, JetBrains Mono)
- **State:** React Server Components for data, client context for theme/UI state
- **No theme switching needed** - Nexus is the single production theme (dark/light mode only)

### Component Mapping (HTML -> React)

| HTML Pattern | React Component | Notes |
|-------------|-----------------|-------|
| 56px sidebar `<aside>` | `<Sidebar />` | Shared across all pages, server component wrapper |
| `.cmd-bar` div | `<CommandBar />` | Client component with keyboard listener |
| `.card` div | `<Card />` | Base card with variant props |
| `.metric-card` div | `<MetricCard />` | Extends Card with label/value/detail |
| `.meeting-card` div | `<MeetingCard />` | Full and compact variants |
| `.action-card` div | `<ActionCard />` | Priority, AI, blocked variants |
| `.sparkbar` div | `<SparkBar />` | value prop (0-100), color auto-calculated |
| `.metadata-chip` span | `<Chip />` | Workspace, status, priority variants |
| `.filter-chip` button | `<FilterChip />` | Toggle active state |
| `.decision-block` div | `<DecisionBlock />` | For meeting timeline |
| `.action-block` div | `<ActionBlock />` | For meeting timeline |
| `.alert-banner-bg` div | `<AlertBanner />` | Dismissible with Escape |
| `.ai-panel` aside | `<AIPanel />` | Collapsible client component |
| `#bulkBar` div | `<BulkActionsBar />` | Fixed position, selection-driven |
| Timeline structure | `<Timeline />` + `<TimelineSection />` | Vertical line + nodes |

### File Structure

```
app/
  layout.tsx              # Root layout with fonts, Sidebar
  dashboard/
    page.tsx              # Dashboard (server component)
  meetings/
    page.tsx              # Meetings overview
    [id]/
      page.tsx            # Meeting detail (split pane)
  actions/
    page.tsx              # Actions kanban board

components/
  layout/
    Sidebar.tsx           # 56px icon rail
    CommandBar.tsx         # Cmd+K search/command
    AlertBanner.tsx       # Dismissible critical alert
  ui/
    Card.tsx              # Base card
    MetricCard.tsx        # Metric display
    Chip.tsx              # Metadata/workspace/status chips
    FilterChip.tsx        # Toggle filter
    SparkBar.tsx          # Progress indicator
    Avatar.tsx            # User avatar (initials)
    Badge.tsx             # Priority/status badges
  features/
    dashboard/
      OverdueActions.tsx
      AIBriefingCard.tsx
      TodaysSchedule.tsx
      PriorityActions.tsx
      RecentDecisions.tsx
      CrossDeptBlockers.tsx
      AIToolCards.tsx
    meetings/
      MeetingCard.tsx     # Full + compact variants
      MeetingFilters.tsx
    meeting-detail/
      MeetingHeader.tsx
      QuickPrep.tsx
      Timeline.tsx
      TimelineSection.tsx
      DecisionBlock.tsx
      ActionBlock.tsx
      AIAnnotation.tsx
      AIPanel.tsx
      AIModeSelector.tsx
      ProposedActionCard.tsx
      ToolUseChip.tsx
    actions/
      KanbanBoard.tsx
      KanbanColumn.tsx
      ActionCard.tsx
      BlockerNote.tsx
      AIRiskBanner.tsx
      BulkActionsBar.tsx

lib/
  tokens.ts               # Design token constants
  types.ts                # TypeScript interfaces
  utils.ts                # Shared utilities
```

---

## 6. Implementation Prompt

Copy the following prompt into a new Claude Code session to begin production implementation:

---

```
You are building the production React implementation of the Nexus executive workbook.

## Context

Nexus is a design system that combines:
- Catalyst's command-first architecture (56px sidebar, Cmd+K bar, collapsible AI panel)
- Meridian's editorial design (Playfair Display serif, sparkbar indicators, editorial timeline)

The complete design specification is in `spark-frontend-experiment/HANDOFF.md`.
The 4 HTML prototypes are in `spark-frontend-experiment/nexus/`:
- dashboard.html (678 lines)
- meetings.html (579 lines)
- meeting-detail.html (708 lines)
- actions.html (778 lines)

## Phase 1: Interview (REQUIRED before implementation)

Before writing any code, interview me about which novel components to include. The prototypes contain 19 novel UI patterns not found in typical dashboards:

### Novel Components to Evaluate

**Dashboard innovations:**
1. AI Briefing Card with Follow-Up Chat Input
2. Overdue-First Layout Hierarchy (overdue ABOVE metrics)
3. Cross-Dept Blockers with Arrow Notation
4. Editorial Decision Log with Rationale
5. AI Tool Activity/Transparency Cards

**Meetings innovations:**
6. Prep Sparkbar on Meeting Cards
7. AI One-Liner Summaries per Meeting
8. Meeting-to-Action Count Badges

**Actions innovations:**
9. Meeting Source Tagging on Action Cards ("From: OPS Weekly")
10. AI Impact Annotations on Individual Cards
11. Inline Blocker Notes with Octagon Icon
12. AI Risk Detection Banner
13. Floating Bulk Actions Bar with Multi-Select

**Meeting Detail innovations:**
14. Editorial Timeline with Inline Decision/Action Blocks
15. AI Editorial Annotations (inline italic footnotes)
16. AI Chat Panel with Tool-Use Indicator Chips
17. AI Proposed Action Cards (Approve/Reject/Edit)
18. AI Mode Selector (meeting-prep/action-tracker/research)
19. Quick Prep Toggle View

### Interview Questions

Ask me these questions BEFORE creating an implementation plan:

1. "Which of these 19 novel components should we build for V1? You can say 'all', list numbers, or describe what to cut."

2. "What's the priority order? Should we build all pages simultaneously or focus on one page first?"

3. "Which components need real backend API support vs. can use mock data for now?"

4. "Are there any components you want to modify before building? (e.g., different layout, added features, removed elements)"

5. "Do you have an existing Next.js project to integrate into, or should I scaffold a new one?"

6. "Any specific deployment target? (Vercel, Azure, self-hosted)"

## Phase 2: Implementation Plan

After the interview, create an implementation plan that:
1. Sets up Next.js 14+ with App Router and Tailwind v4
2. Configures the Nexus design tokens from HANDOFF.md Section 2
3. Builds shared components first (Sidebar, CommandBar, Card, Chip, SparkBar, etc.)
4. Implements pages in the priority order from the interview
5. Adds dark/light mode toggle
6. Includes accessibility features (keyboard nav, ARIA, reduced motion)

## Phase 3: Build

Implement the components by referencing the HTML prototypes directly.
For each component:
1. Read the relevant HTML section from the prototype
2. Convert to React/TypeScript with proper types
3. Extract Tailwind classes into the component
4. Add keyboard shortcuts where specified
5. Test responsive behavior

## Key Design Decisions (already made)

- Single theme (Nexus) - no theme switching infrastructure needed
- Dark mode is default, light mode via class toggle on <html>
- 56px sidebar is FIXED, main content has ml-14
- Command bar is centered with max-w-2xl
- Cards use 4px border-radius (editorial, not rounded)
- Stagger animations: 4 levels, 50ms intervals, 300ms duration
- AI panel on meeting detail: 40% width, collapses to 56px
```

---

## 7. Accessibility & Responsive Guidance

### WCAG AA Requirements

| Element | Contrast Requirement | Measured |
|---------|---------------------|----------|
| Body text (#EDEDEF on #0C0C0E) | 4.5:1 minimum | 15.2:1 |
| Secondary text (#8F8F94 on #161618) | 4.5:1 minimum | 4.7:1 |
| Tertiary text (#6B6B70 on #161618) | 3:1 for UI components | 3.2:1 |
| Accent on dark (#4F46E5 on #0C0C0E) | 3:1 for large text | 3.8:1 |
| Danger on dark (#DC2626 on #161618) | 3:1 for UI components | 4.1:1 |
| Light mode text (#1a1a1e on #F8F8FA) | 4.5:1 minimum | 14.8:1 |

### Keyboard Navigation Map

| Shortcut | Action | Page |
|----------|--------|------|
| `Cmd+K` | Focus command bar | All |
| `Cmd+1` | Navigate to Dashboard | All |
| `Cmd+2` | Navigate to Meetings | All |
| `Cmd+3` | Navigate to Actions | All |
| `Escape` | Dismiss alert banner | Dashboard, Meeting Detail |
| `Tab` | Switch AI mode | Meeting Detail |
| `Cmd+Enter` | Send AI message | Meeting Detail |

### Responsive Breakpoints

| Breakpoint | Layout Changes |
|-----------|----------------|
| Desktop (1280px+) | Full layout as prototyped |
| Tablet (768-1279px) | Sidebar collapses to icons only (already 56px). Kanban columns scroll horizontally. Meeting detail: AI panel becomes bottom drawer. Dashboard: 2-column grid instead of 5-column. |
| Mobile (< 768px) | Sidebar becomes bottom tab bar. Single-column layout. AI panel becomes full-screen overlay. Kanban: single column with horizontal swipe. |

### ARIA Requirements

- Sidebar nav items need `aria-current="page"` on active item
- Alert banner needs `role="alert"` and `aria-live="polite"`
- Command bar needs `role="combobox"` with `aria-expanded`
- Filter chips need `role="radio"` in `role="radiogroup"`
- Kanban columns need `role="list"` with `aria-label`
- Action cards need `role="listitem"` with `aria-selected` for multi-select
- AI chat needs `role="log"` with `aria-live="polite"`
- Proposed Action buttons need clear `aria-label` ("Approve action: [title]")
- SparkBar needs `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`

### Reduced Motion

All prototypes include `@media (prefers-reduced-motion: reduce)` support. In production:
- Disable stagger animations
- Disable spring-focus scale
- Disable pulse-danger breathing
- Disable typing indicator animation
- Keep color transitions (instant instead of animated)
