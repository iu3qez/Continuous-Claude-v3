# Workbook Demo Platform - Complete Specification

> **Date:** 2026-02-14
> **Status:** Approved specification - ready for implementation
> **Author:** David Hayes + Claude
> **Target:** Multi-audience demo (team, investors, customers)
> **Tech:** Static HTML + optional Node.js server for live AI
> **Design benchmark:** linear.app landing page quality
> **Design directives:** frontend-design plugin, ui-ux-pro-max skill, reactbits.dev, smoothui, NO CLAUDE SLOP

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Design System](#3-design-system)
4. [Complete Page Inventory](#4-complete-page-inventory)
5. [Demo Flow System](#5-demo-flow-system)
6. [Industry Data Templates](#6-industry-data-templates)
7. [AI Response System](#7-ai-response-system)
8. [Navigation Architecture](#8-navigation-architecture)
9. [OAuth Simulation System](#9-oauth-simulation-system)
10. [Persona Switching System](#10-persona-switching-system)
11. [Animation & Motion Design](#11-animation--motion-design)
12. [Connections & Integration UX](#12-connections--integration-ux)
13. [Agent Dashboard & Marketplace](#13-agent-dashboard--marketplace)
14. [ROI & Value Metrics](#14-roi--value-metrics)
15. [Landing Page Design](#15-landing-page-design)
16. [File Structure](#16-file-structure)
17. [Technical Architecture](#17-technical-architecture)
18. [Implementation Phases](#18-implementation-phases)

---

## 1. Project Overview

### What We're Building

A **complete, interactive demo platform** for Workbook - the AI layer for SMBs. The demo showcases the full customer journey from first contact through daily use, demonstrating how Workbook connects to business tools and provides AI-powered department intelligence.

### The Demo Story

1. Business owner discovers Workbook (landing page)
2. Selects a pricing tier and starts free trial
3. Guided wizard discovers their tech stack and departments
4. OAuth connections to their tools (CRM, comms, docs, PM, accounting)
5. AI scans connected data, auto-creates department workspaces with fitted agents
6. Within 5 minutes: AI answers a real business question from their actual data
7. Over time: AI "employees" handle meetings, actions, decisions, follow-ups

### Key Capabilities

| Capability | Implementation |
|------------|---------------|
| Multi-audience | Configurable for team, investors, customers |
| 3 industry scenarios | Professional services, tech startup, hospitality |
| Full OAuth simulation | Platform-accurate mock consent screens |
| Persona switching | CEO, OPS Director, Engineering Lead, New Employee |
| 5 guided demo arcs | Pre-scripted pathways with narrator controls |
| Free explore mode | All pages fully navigable without guided mode |
| Hybrid AI | Scripted responses + live Claude API (toggle) |
| Production-grade motion | Page transitions, skeleton states, counting animations |
| Desktop-optimized | 1440px+ target, no responsive breakpoints |

### What Exists Today

4 HTML prototype pages in `nexus/`:
- `dashboard.html` (677 lines) - Executive dashboard
- `meetings.html` (579 lines) - Meeting overview
- `meeting-detail.html` (708 lines) - Split-pane meeting view
- `actions.html` (778 lines) - 4-column Kanban board

~30% functional (navigation, theme toggle, filter states, multi-select). All data is static.

---

## 2. Architecture Decisions

### Decision Record

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | **Static HTML** (stay) | Fastest to expand, no build step, works offline for demos |
| AI responses | **Hybrid: scripted + live Claude** | Scripted for reliability, live for off-script moments |
| Industry support | **Preset URLs** (/demo/consulting, /demo/tech, /demo/hospitality) | Quick to switch, no state management needed |
| Demo mode | **Guided + free explore** with bottom bar controls | Presenter flexibility with script support |
| OAuth screens | **Platform-accurate mocks** | Maximum realism for each connector |
| Navigation | **Section-based sidebar** | Context-aware nav groups reduce cognitive load |
| Decisions page | **Hybrid: timeline + table toggle** | Editorial default matches Nexus, table for power users |
| Connections page | **Tiles + detail drawer** | Overview grid with slide-out for full details |
| AI autonomy | **Agent dashboard** | Dedicated page showing AI agents as team members |
| Landing page | **linear.app benchmark** | Product-in-action hero with animated elements |
| Calendar | **Full calendar page** | Week/month view with AI annotations |
| Personal view | **Dedicated My Work page** | Cross-workspace personal productivity hub |
| Proposals | **Inline + dedicated queue** | Contextual proposals + aggregate review page |
| Settings | **Full settings suite** | Profile, team, workspaces, billing, AI prefs |
| Responsive | **Desktop-only** (1440px+) | Demo always presented on laptop/projector |
| Deployment | **Static + optional server** | Works offline, server adds live Claude API |
| Polish level | **Production-grade motion** | Every animation serves the narrative |

---

## 3. Design System

### Nexus Theme (from HANDOFF.md, extended)

#### Color Palette

```css
/* Surfaces */
--surface:         #161618;   /* Card backgrounds */
--surface-dark:    #0C0C0E;   /* Page background, sidebar */
--surface-ai:      #14141A;   /* AI panel, chat inputs */
--surface-elevated: #1C1C1F;  /* Modals, drawers, elevated cards */

/* Borders */
--border:          #232326;   /* All borders, dividers */
--border-hover:    #2E2E32;   /* Hover state borders */

/* Text hierarchy */
--txt-primary:     #EDEDEF;   /* Headings, body text */
--txt-secondary:   #8F8F94;   /* Metadata, secondary labels */
--txt-tertiary:    #6B6B70;   /* Timestamps, hints */

/* Accent */
--accent:          #4F46E5;   /* Indigo - primary, AI elements */
--accent-hover:    #6366F1;   /* Hover state */
--accent-subtle:   rgba(79, 70, 229, 0.08);  /* Tint backgrounds */

/* Semantic */
--danger:          #DC2626;   /* Critical, overdue */
--warning:         #D97706;   /* High priority, pending */
--success:         #059669;   /* Completed, online */

/* Workspace colors */
--ws-ops:          #4F46E5;   /* Indigo */
--ws-elt:          #7C3AED;   /* Purple */
--ws-mkt:          #D97706;   /* Amber */
--ws-eng:          #059669;   /* Green */
--ws-sales:        #2563EB;   /* Blue */
--ws-finance:      #DC2626;   /* Red */
--ws-hr:           #EC4899;   /* Pink */
```

#### Typography

```css
/* Fonts */
--font-heading: 'Playfair Display', Georgia, serif;
--font-body:    'Inter', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', monospace;

/* Scale */
--text-3xl:    32px;    /* Landing page hero */
--text-2xl:    24px;    /* Page headings */
--text-xl:     20px;    /* Section headings */
--text-lg:     18px;    /* Card titles */
--text-base:   16px;    /* Timeline headings */
--text-sm:     14px;    /* Body text */
--text-xs:     12px;    /* Card content */
--text-2xs:    11px;    /* Timestamps, filters */
--text-3xs:    10px;    /* Badges, metadata */
--text-4xs:    9px;     /* Keyboard hints */
--text-5xs:    8px;     /* Avatar initials */
```

#### Spacing & Radius

```css
/* Spacing scale */
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;

/* Border radius */
--radius-sm:   4px;     /* Cards, chips, buttons */
--radius-md:   6px;     /* Command bar, nav items */
--radius-lg:   8px;     /* Sidebar logo, panels */
--radius-xl:   12px;    /* Modals, drawers */
--radius-full: 9999px;  /* Avatars, dots, badges */
```

---

## 4. Complete Page Inventory

### 15 Pages Total

| # | Page | URL Path | Status | Priority |
|---|------|----------|--------|----------|
| 1 | Landing Page | `/` | NEW | P0 |
| 2 | Pricing | `/pricing` (or section of landing) | NEW | P0 |
| 3 | Onboarding Wizard | `/onboarding` | NEW | P0 |
| 4 | Dashboard | `/dashboard` | EXISTS - expand | P0 |
| 5 | Meetings Overview | `/meetings` | EXISTS - expand | P1 |
| 6 | Meeting Detail | `/meeting/:id` | EXISTS - expand | P1 |
| 7 | Actions (Kanban) | `/actions` | EXISTS - expand | P1 |
| 8 | Decisions | `/decisions` | NEW | P1 |
| 9 | Proposals Queue | `/proposals` | NEW | P1 |
| 10 | Calendar | `/calendar` | NEW | P2 |
| 11 | My Work | `/my-work` | NEW | P2 |
| 12 | ELT Rollup | `/elt-rollup` | NEW | P2 |
| 13 | Agent Dashboard | `/agents` | NEW | P2 |
| 14 | Agent Marketplace | `/marketplace` | NEW | P2 |
| 15 | Connections | `/connections` | NEW | P2 |
| 16 | Settings | `/settings` | NEW | P3 |

---

### Page 1: Landing Page

**Benchmark:** linear.app
**Purpose:** First impression. Convert visitors to trial signups.

#### Structure (top to bottom)

1. **Nav Bar** (sticky)
   - Left: Workbook logo (serif wordmark)
   - Center: Product / Features / Pricing / About
   - Right: "Sign In" text link + "Start Free Trial" accent button
   - Backdrop blur on scroll

2. **Hero Section**
   - Large Playfair headline: "Your business, understood in 5 minutes"
   - Subtext (Inter): "Workbook connects to your tools, creates AI employees for every department, and delivers actionable intelligence from day one."
   - Two CTAs: "Start Free Trial" (accent, prominent) + "Watch Demo" (ghost/outline)
   - Below: Animated product screenshot
     - Dashboard mockup floating on subtle gradient
     - UI elements animate in: metrics count up, AI briefing text types, meeting cards slide in
     - Subtle parallax depth on mouse movement (like Linear)
     - Grid-dot background animation (Linear-style stepped keyframe grid)

3. **Social Proof Bar**
   - "Trusted by teams at..." with 5 grayscale company logos
   - Can be placeholder logos for demo

4. **Value Proposition (3 sections)**

   **Section A: "Connect Everything"**
   - Left: Text block with heading + 3 bullet points
   - Right: Animated illustration of 8 connector logos flowing into a central hub
   - Logos: Salesforce, Slack, M365, Google, Jira, HubSpot, QuickBooks, Notion

   **Section B: "AI That Actually Does Things"**
   - Left: Animated illustration of AI agent cards performing actions
   - Right: Text block explaining autonomous agents
   - Show: "Meeting Agent scheduled 3 follow-ups" type notifications

   **Section C: "Every Department, One Brain"**
   - Full-width: Cross-department visualization
   - Department nodes (OPS, Sales, Engineering, Finance) connected to central "Workbook Intelligence" node
   - Data flows animate between nodes
   - Highlight: "Sales flagged a churn risk. Support agent already opened a ticket."

5. **Feature Grid** (2x3 or 3x2)
   - AI Meeting Intelligence
   - Action & Decision Tracking
   - Cross-Department Rollup
   - Agent Marketplace
   - Smart Connections
   - ROI Analytics

6. **Pricing Section** (embedded, or link to separate page)
   - See Pricing spec below

7. **Testimonial Cards** (3)
   - Mock testimonials from target personas
   - Photo avatars, name, title, company, quote
   - Carousel or horizontal scroll

8. **Bottom CTA**
   - "Ready to give your business a brain?"
   - "Start Free Trial" + "Book a Demo" buttons
   - Gradient background transitioning to dark

9. **Footer**
   - Product, Company, Resources, Legal columns
   - Social links
   - "Built with AI, for businesses that want AI"

#### Pricing Table (within landing or separate section)

3 tiers from scaling roadmap:

| | Starter | Growth | Enterprise |
|--|---------|--------|-----------|
| Price | $12/user/mo | $25/user/mo | Custom |
| Min seats | 3 | 5 | 25 |
| Workspaces | 3 | 10 | Unlimited |
| AI queries/user/mo | 200 | 1,000 | Unlimited |
| Agent modes | 3 | All 6 + custom | All + marketplace |
| Connectors included | 2 | 5 | Unlimited |
| Additional connectors | $10/mo | $10/mo | Included |
| Support | Email | Priority | Dedicated CSM |
| SSO | -- | $125/connection | Included |
| Most popular | | HIGHLIGHTED | |

- "Start Free Trial" CTA on each tier
- 14-day free trial of Growth plan messaging
- Feature comparison toggle (collapsed by default, "Compare all features")

---

### Page 2: Onboarding Wizard

**Type:** Hybrid forms + AI narration
**Critical moment:** The "first insight" split reveal

#### Step Flow

**Step 1: Company Profile** (form + AI narration)
- Company name input
- Industry dropdown (Professional Services, Technology, Hospitality/Restaurant, Retail, Healthcare, Other)
- Company size radio (1-10, 11-50, 51-200, 201-500)
- AI narration panel (right side): "Great! I'm setting up your workspace based on [industry] best practices. Companies like yours typically benefit from [X] departments..."
- Progress indicator: Step 1 of 6

**Step 2: Department Discovery** (AI-suggested, user confirms)
- AI suggests 3-5 departments based on industry selection
  - Professional services: Client Services, Operations, Business Development, Finance, Executive
  - Tech startup: Engineering, Product, Sales, Marketing, Executive
  - Hospitality: Operations, Kitchen/Menu, Front-of-House, Events, Management
- Each department shown as a card with icon, name, description
- User can toggle departments on/off, add custom ones
- AI narration: "Based on [industry], I recommend these departments. Each will get a specialized AI assistant."

**Step 3: Tool Discovery** (form with smart suggestions)
- Categories: CRM, Communications, Documents, Project Management, Accounting, Calendar
- Per category: dropdown with available tools + "None" + "Other"
- Smart defaults based on industry:
  - Prof services: HubSpot, Slack, SharePoint, Asana, QuickBooks, Outlook
  - Tech: HubSpot, Slack, Google Drive, Jira, Xero, Google Calendar
  - Hospitality: None, Slack, Google Drive, None, QuickBooks, Google Calendar
- AI narration: "I see you use [tools]. I'll set up connections to pull in your data automatically."

**Step 4: Connect Your Tools** (OAuth simulation)
- Grid of selected tools with "Connect" buttons
- Each triggers the platform-accurate OAuth simulation (see Section 9)
- Connected tools show green check + "Connected" status
- "Skip for now" option on each
- AI narration: "Connecting to [tool]... I can see [N] records. This will help me understand your [department] workflow."
- Minimum 1 connection required to proceed (or "Skip all - use sample data")

**Step 5: AI Scanning** (animation)
- Full-width animated scanning visualization
- Left column: Data categories appearing as they're "discovered"
  - "Found 342 contacts in Salesforce"
  - "Found 28 open deals worth $1.2M"
  - "Found 15 upcoming meetings this week"
  - "Found 47 unresolved action items"
  - "Found 12 pending decisions"
- Right column: Department workspaces materializing
  - Each department card appears with its AI agent avatar
  - Agent name + role + "Ready" status
- Scanning progress bar at bottom
- Duration: ~8 seconds of animation (or skip button)

**Step 6: First Insight Moment** (THE CLIMAX - split reveal)

**Left side (55%):** AI delivers insights conversationally
- Typing animation reveals insights one by one:
  1. Operational insight: "I noticed 3 action items from last week's OPS meeting haven't been assigned yet."
  2. Financial risk: "Your Q2 pipeline has a $180K gap compared to target. Two deals marked 'likely' haven't been updated in 14 days."
  3. Strategic opportunity: "Cross-referencing your calendar and CRM: you have a meeting with Acme Corp tomorrow, but their last support ticket (unresolved) hasn't been flagged to Sales."
- Each insight has an icon (lightbulb, alert-triangle, sparkles) and links to the relevant workspace area
- Follow-up input: "Ask me anything about your business..."

**Right side (45%):** Workspace assembles itself
- Dashboard skeleton appears
- Metrics animate in (numbers count up from 0)
- Meeting cards slide in from right
- Action items populate
- AI briefing text types itself
- Department sidebar icons appear one by one
- Final state: fully populated dashboard
- Subtle particle animation during assembly

**Transition:** "Your workspace is ready" button -> transitions to full dashboard

---

### Page 3: Dashboard (EXPAND existing)

**Existing:** 13 components, 677 lines
**Additions:**

- **ROI Widget** (new): "AI saved 12 hours this week" + trend sparkline
- **Persona-aware greeting**: Changes based on active persona (Jay/Sarah/Marcus/Lisa)
- **Industry-specific data**: Metrics, meetings, actions swap per industry template
- **Guided mode highlights**: Key areas pulse subtly when guided mode is active
- **Notification bell**: Shows unread AI proposals and agent activity
- **My Work shortcut**: Quick link to personal task view

All 13 existing components remain. Mock data becomes dynamic (swaps per industry/persona).

---

### Page 4: Meetings Overview (EXPAND existing)

**Existing:** 9 components, 579 lines
**Additions:**

- Filter chips now functional (actually filter the meeting list)
- Meeting cards link to meeting-detail page
- Industry-specific meeting names and attendees
- Persona-aware: "My meetings" filter option

---

### Page 5: Meeting Detail (EXPAND existing)

**Existing:** 9 components, 708 lines
**Additions:**

- AI chat becomes interactive (scripted responses or live Claude)
- "Prep me" button triggers full scripted sequence
- Proposed action cards have functional Approve/Reject (updates action count, shows confirmation)
- Mode selector switches AI context (meeting-prep vs action-tracker vs research)
- Tool-use chips animate as "queries" execute

---

### Page 6: Actions (EXPAND existing)

**Existing:** 7 components, 778 lines
**Additions:**

- Filter chips functional
- Cards draggable between columns (lightweight drag simulation)
- Bulk actions bar triggers confirmation modals
- "From: Meeting Name" tags are clickable (navigate to meeting detail)
- Industry-specific action items

---

### Page 7: Decisions (NEW)

**Default view:** Editorial timeline
**Toggle:** Table view

#### Editorial Timeline View
- Vertical timeline (matches meeting-detail pattern)
- Each decision entry:
  - Date node on timeline
  - Playfair heading (decision title)
  - Context paragraph (what prompted this decision)
  - Rationale block (purple-tinted, why this was chosen)
  - Outcome tracking (if available): "Result: [outcome]"
  - Linked meeting tag: "Decided in: [meeting name]"
  - Linked actions: "Triggered: [N] actions"
  - Status badge: Approved / Pending / Under Review
  - AI annotation: insight about the decision's impact

#### Table View
- Sortable columns: Date, Title, Status, Workspace, Owner, Linked Actions
- Click row to expand inline detail (or side drawer)
- Filter bar: status, workspace, date range, owner
- Bulk operations: change status, reassign

#### Shared Elements
- AI summary card at top: "3 decisions pending review. 2 decisions from last week have unresolved actions."
- Quick stats: Total decisions (month), Avg time to decide, Decisions with outcomes tracked

---

### Page 8: Proposals Queue (NEW)

**Purpose:** AI-generated proposals awaiting human review

#### Layout
- Notion-style inbox: list of pending proposals
- Each proposal card:
  - AI sparkles icon + "AI Proposal" label
  - Proposal title (what AI wants to do)
  - AI reasoning (collapsed, expand to read)
  - Source: "Generated from [meeting/conversation/analysis]"
  - Type badge: Action / Decision / Follow-up / Escalation
  - Urgency indicator: Immediate / This Week / When Convenient
  - Action buttons: Approve / Reject / Edit / Defer
  - Approve triggers: confirmation animation, item moves to relevant page (actions/decisions)
  - Reject triggers: brief feedback input ("Why? [optional]")
- Batch operations: Approve All / Reject All / Review Selected
- Filter: By type, workspace, urgency, date
- AI summary: "7 proposals pending. 3 are high-urgency from yesterday's OPS meeting."
- Notification badge in sidebar shows pending count

---

### Page 9: Calendar (NEW)

**Views:** Week (default) + Month toggle

#### Week View
- 7-column grid with hourly rows
- Meeting blocks with workspace color coding
- AI annotations overlay on meetings:
  - "3 unresolved actions from last time" (amber dot)
  - "Prep materials ready" (green dot)
  - "Conflicts with 2:00 PM Sales call" (red dot)
- Action deadlines shown as markers on date headers
- Decision review dates shown as purple markers
- Today column highlighted

#### Month View
- Calendar grid with meeting counts per day
- Color-coded dots showing workspace distribution
- Click day to expand day detail

#### Shared Elements
- AI scheduling suggestions: "Suggested: Block 2 hours Thursday for Q2 planning based on pending decisions"
- Connected calendar indicator: "Synced with Outlook" with last-sync time

---

### Page 10: My Work (NEW)

**Purpose:** Personal productivity hub across all workspaces

#### Layout
- **My Actions**: Grouped by workspace, sorted by due date
  - Overdue (red section)
  - Due Today (amber section)
  - This Week (default section)
  - Each action shows: title, workspace chip, due date, source meeting
- **My Meetings**: Today + this week
  - Compact meeting cards with prep status sparkbar
  - "Next meeting in 45 minutes" countdown
- **Decisions Awaiting My Input**: Cards requiring my review/approval
- **AI Suggestions for Me**: Personalized recommendations
  - "You have a meeting with [person] tomorrow. Their last 3 requests are unresolved."
  - "Action [X] is 2 days overdue. Consider delegating to [person]."
- **My Stats** (small card): Actions completed this week, meetings attended, decisions made

---

### Page 11: ELT Rollup (NEW)

**Purpose:** Cross-department executive intelligence
**Access:** ELT persona only (Jay CEO view)

#### Layout (5-section)

1. **Executive Summary Card**
   - AI-generated narrative: "This week across 4 departments: 3 critical blockers, 12 actions completed, 2 decisions pending board input. Operations is tracking well. Marketing has a budget concern."
   - Generated timestamp + "Refresh" button

2. **Department Health Scores** (4-column grid)
   - Each department card:
     - Department name + color dot
     - Health score: 0-100 with circular progress indicator
     - Status: On Track / At Risk / Critical
     - Key metric: "5 actions overdue" or "All clear"
     - Trend arrow: up/down/flat vs last week
   - Click to drill into department dashboard

3. **Cross-Department Dependency Map**
   - Visual node graph (simplified)
   - Department nodes connected by dependency lines
   - Active blockers shown as red connections: "Marketing blocked by Legal (contract review)"
   - Hover node to see: active items, health score, key contact

4. **Risk Heat Map** (2x2 or 3x3 grid)
   - Axes: Impact (low/high) x Likelihood (low/high)
   - Items plotted as dots with labels
   - Red quadrant (high impact + high likelihood): "Q2 campaign delay", "Budget overrun risk"
   - AI annotation: "3 items moved to high-risk since last week"

5. **Strategic Decisions Pending**
   - List of decisions requiring executive input
   - Each with: title, requesting department, deadline, AI recommendation
   - "Decide Now" CTA buttons

---

### Page 12: Agent Dashboard (NEW)

**Purpose:** AI agents as team members - show autonomous work

#### Layout

1. **Agent Team Overview** (header area)
   - "Your AI Team" heading
   - Stats: 6 agents active, 23 tasks completed today, 4 currently working
   - "Create Agent" button (links to builder)

2. **Active Agents Grid** (main content)
   - Each agent card:
     - Avatar (AI-style icon with workspace color)
     - Agent name: "Sales Assistant", "Meeting Prep Agent", "Finance Analyst"
     - Status indicator: Idle / Working / Completed / Error
     - Current task: "Analyzing Q2 pipeline data..." (if working)
     - Recent actions (last 3):
       - "Scheduled follow-up with Acme Corp" + timestamp
       - "Created action item: Review contract" + timestamp
       - "Flagged: Budget variance in Marketing" + timestamp
     - Performance: "47 tasks completed, 2 overrides, 98% accuracy"
     - Workspace assignment chip
     - "View Activity" link (expands full activity log)

3. **Activity Feed** (right panel or bottom section)
   - Real-time-looking log (timestamps within last few hours)
   - Each entry: agent avatar + action description + timestamp + workspace chip
   - Filter by: agent, workspace, action type
   - Examples:
     - "10:32 AM - Meeting Agent: Prepared briefing for 2:00 PM client call"
     - "10:15 AM - Action Tracker: Moved 'Review contract' to overdue (3 days past due)"
     - "9:45 AM - Sales Assistant: Updated pipeline forecast based on CRM data"
     - "9:30 AM - Finance Analyst: Flagged Q2 budget variance of $12,400"

4. **Agent Scheduled Tasks** (bottom section)
   - Timeline of upcoming automated tasks
   - "11:00 AM - Meeting Agent will prep for Sales standup"
   - "2:00 PM - Action Tracker will send overdue reminders"
   - "5:00 PM - Finance Analyst will generate daily P&L summary"

---

### Page 13: Agent Marketplace (NEW)

**Purpose:** Browse and preview available agents (catalog + preview, not full install)

#### Layout

1. **Marketplace Header**
   - "Agent Marketplace" + search input
   - Category filters: All / Role-Based / Workflow / Data-Source / Custom
   - Sort: Popular / New / Rating

2. **Agent Catalog Grid** (3-column)
   - Each agent card:
     - Icon/avatar with category color
     - Agent name: "Client Success Manager", "Sprint Planner", "Invoice Processor"
     - Short description (2 lines)
     - Category badge
     - Rating: 4.8/5 with star icon
     - "Used by 234 workspaces"
     - "Preview" button + "Install" button (disabled/coming-soon for install)

3. **Agent Detail Preview** (modal or slide-out)
   - Triggered by "Preview" click
   - Full description
   - Capabilities list: "Can do: query CRM, create actions, send notifications"
   - Sample conversation (3-4 exchanges showing the agent in action)
   - Required connections: "Needs: Salesforce or HubSpot"
   - Configuration options preview
   - "Install" CTA (shows "Coming Soon" toast)

4. **Custom Agent Builder Link**
   - Banner at bottom: "Don't see what you need? Build a custom agent."
   - Links to agent builder (separate page or modal)

---

### Page 14: Connections (NEW)

**Purpose:** Manage tool connections with detail drawers

#### Layout

1. **Connections Header**
   - "Connected Tools" + count: "5 of 8 connected"
   - "Add Connection" button
   - Connection health status: "All healthy" (green) or "1 issue" (amber)

2. **Connection Tiles Grid** (3-4 column)
   - Each tile:
     - Platform logo (large, recognizable)
     - Platform name
     - Connection status dot: green (connected), gray (not connected), red (error)
     - Key metric: "342 contacts synced" or "Not connected"
     - Last sync: "2 min ago" or "--"
     - "Manage" button (connected) or "Connect" button (not connected)
   - Tiles for all 8 platforms:
     - Salesforce, Slack, Microsoft 365, Google Workspace, Jira, HubSpot, QuickBooks, Notion

3. **Detail Drawer** (slide-out from right, 400px)
   - Triggered by "Manage" click
   - Drawer contents:
     - Platform header: logo + name + status badge
     - **Data Preview**: "What Workbook can see"
       - Contacts: 342 records
       - Deals: 28 open, $1.2M pipeline
       - Activities: 156 this month
     - **Sync History**: Last 5 syncs with status, record count, duration
     - **Permission Scope**: Read/Write toggles per data type
     - **AI Access**: Which agents use this connection
     - **Usage Stats**: "AI queried 47 times this week"
     - **Actions**: Re-authorize / Sync Now / Disconnect
   - Drawer has close button and Escape to dismiss

4. **Available Connections** (section below)
   - Grayed-out tiles for unconnected platforms
   - "Connect" button triggers OAuth simulation

---

### Page 15: Settings (NEW)

**Purpose:** Admin configuration - adds "real product" credibility

#### Tab Structure

1. **Profile**
   - User avatar, name, email, role
   - Edit profile form
   - Theme toggle (dark/light)

2. **Team & Roles**
   - Team member list with role badges (Admin, Member, Viewer)
   - Invite member form
   - Role permission matrix

3. **Workspaces**
   - List of department workspaces
   - Create/rename/archive workspace
   - Agent assignment per workspace

4. **Billing & Plan**
   - Current plan: "Growth" with usage bar
   - AI queries used: 423 / 1,000 this month
   - Connectors: 5 / 5 included
   - Upgrade/downgrade buttons
   - Invoice history table

5. **Integrations** (links to Connections page)
   - Summary of connected tools
   - Quick link to full connections page

6. **AI Preferences**
   - Agent autonomy level: Suggest Only / Confirm Each / Auto Low-Risk / Full Auto
   - Notification frequency: Real-time / Hourly Digest / Daily Summary
   - Agent working hours: toggles per agent
   - Data privacy: "Don't use my data for model improvement" toggle

---

## 5. Demo Flow System

### 5 Guided Demo Arcs

Each arc is a pre-set pathway through specific pages with narration text and step indicators.

#### Arc 1: "New Customer Journey" (~7 minutes)
**Audience:** Investors, potential customers
**Story:** From first contact to first value

| Step | Page | Narration | Highlight |
|------|------|-----------|-----------|
| 1 | Landing | "This is how a business owner first discovers Workbook." | Hero section, pricing |
| 2 | Pricing | "They choose a plan that fits their team size." | Growth tier highlighted |
| 3 | Onboarding Step 1 | "The wizard asks about their business." | Industry selector |
| 4 | Onboarding Step 2 | "AI suggests departments automatically." | Department cards |
| 5 | Onboarding Step 3 | "They tell us what tools they already use." | Tool dropdowns |
| 6 | Onboarding Step 4 | "One-click OAuth connects their tools." | OAuth simulation |
| 7 | Onboarding Step 5 | "AI scans their data in real-time." | Scanning animation |
| 8 | Onboarding Step 6 | "Within 5 minutes: AI delivers real insights from THEIR data." | Split insight reveal |
| 9 | Dashboard | "Their workspace is ready. AI has already organized everything." | Full dashboard |

#### Arc 2: "Day in the Life" (~5 minutes)
**Audience:** Team demos, potential customers
**Story:** How an executive uses Workbook daily

| Step | Page | Narration | Highlight |
|------|------|-----------|-----------|
| 1 | Dashboard | "David starts his day. AI has already briefed him on critical items." | AI Briefing Card |
| 2 | Dashboard | "3 overdue actions surfaced ABOVE the metrics - can't miss them." | Overdue Actions |
| 3 | Meeting Detail | "He opens the emergency meeting. AI has prepped a full brief." | Quick Prep + Timeline |
| 4 | Meeting Detail | "He asks the AI a question. It queries 3 databases and responds." | AI chat interaction |
| 5 | Meeting Detail | "AI proposes an action. David approves it with one click." | Proposed Action card |
| 6 | Actions | "The action appears in the kanban board, assigned and tracked." | New card in board |
| 7 | Proposals | "3 more AI proposals are waiting. David reviews and approves." | Proposal queue |
| 8 | My Work | "His personal view shows everything he needs to focus on today." | My Work page |

#### Arc 3: "Executive Rollup" (~5 minutes)
**Audience:** C-suite, investors
**Story:** How executives see across the entire organization

| Step | Page | Narration | Highlight |
|------|------|-----------|-----------|
| 1 | Dashboard (ELT) | "The CEO sees a cross-department view, not just one team." | ELT dashboard |
| 2 | ELT Rollup | "AI synthesizes data from all departments into one executive brief." | Executive Summary |
| 3 | ELT Rollup | "Department health scores show who's on track and who needs attention." | Health Scores |
| 4 | ELT Rollup | "Cross-department dependencies are visualized - no more silos." | Dependency Map |
| 5 | ELT Rollup | "The risk heat map flags issues before they become crises." | Risk Heat Map |
| 6 | Decisions | "All strategic decisions are tracked with rationale and outcomes." | Decision timeline |

#### Arc 4: "AI Agent Showcase" (~5 minutes)
**Audience:** Tech-savvy buyers, investors
**Story:** AI agents as autonomous team members

| Step | Page | Narration | Highlight |
|------|------|-----------|-----------|
| 1 | Agent Dashboard | "6 AI agents are actively working right now." | Agent team overview |
| 2 | Agent Dashboard | "The Meeting Agent just prepped briefings for 3 upcoming meetings." | Activity feed |
| 3 | Agent Dashboard | "The Finance Analyst flagged a $12K budget variance at 9:30 AM." | Specific activity |
| 4 | Marketplace | "Browse 20+ pre-built agents, or build your own." | Agent catalog |
| 5 | Marketplace | "Preview how the Client Success Manager works." | Agent detail preview |
| 6 | Agent Dashboard | "Scheduled tasks show what agents will do automatically." | Scheduled tasks |

#### Arc 5: "Integration Story" (~3 minutes)
**Audience:** Technical evaluators
**Story:** How Workbook connects to and uses business data

| Step | Page | Narration | Highlight |
|------|------|-----------|-----------|
| 1 | Connections | "5 tools connected. All healthy, syncing in real-time." | Connection tiles |
| 2 | Connections | "Each connection shows exactly what data Workbook accesses." | Detail drawer |
| 3 | Meeting Detail | "AI pulls data from Salesforce and Slack to answer a question." | Tool-use chips |
| 4 | Dashboard | "Connected data powers every insight on the dashboard." | AI Briefing with sources |
| 5 | Settings/AI | "Customers control exactly how autonomous their AI agents are." | Autonomy settings |

### Demo Control Bar (Bottom Bar)

**Position:** Fixed bottom center, 56px height, backdrop-blur
**Visibility:** Toggle with `Ctrl+D` (hidden by default in free explore)

#### Elements (left to right)
- **Scene title**: "Arc 2: Day in the Life" (Playfair, small)
- **Step indicator**: 5 progress dots, active dot filled
- **Step number**: "Step 3 of 8"
- **Prev button**: Left arrow (or left arrow key)
- **Next button**: Right arrow + "Next" label (or right arrow key, or Space)
- **Narration text area**: Current step's narration text (max 2 lines)
- **Scene selector**: Dropdown to jump between arcs
- **Hide button**: X to minimize to a tiny dot in corner

#### Keyboard Shortcuts (Demo Mode)
- `Space` or `Right Arrow`: Next step
- `Left Arrow`: Previous step
- `Ctrl+D`: Toggle demo bar visibility
- `1-5`: Jump to Arc 1-5
- `Escape`: Exit guided mode to free explore
- `F`: Toggle fullscreen

---

## 6. Industry Data Templates

### 3 Fully Distinct Datasets

Each industry gets its own company identity, team members, meetings, actions, decisions, financial data, and AI insights. Accessed via preset URLs.

### Template A: Professional Services ("Meridian Consulting")

**URL:** `/demo/consulting`
**Company:** Meridian Consulting Group
**Size:** 48 employees
**Industry:** Management consulting
**Departments:** Client Services, Operations, Business Development, Finance, Executive

**Team Members:**
| Name | Role | Department | Avatar Color |
|------|------|------------|-------------|
| Jay Altizer | CEO | Executive | Purple |
| Sarah Chen | COO / OPS Director | Operations | Indigo |
| Marcus Johnson | VP Engineering | Client Services | Green |
| Lisa Park | BD Director | Business Development | Blue |
| David Hayes | Senior Consultant | Client Services | Amber |
| Priya Sharma | Finance Director | Finance | Red |
| Tom Wilson | HR Manager | Operations | Pink |
| Anna Rodriguez | Client Manager | Client Services | Teal |

**Meetings (10):**
- OPS Weekly Standup (recurring, Mon 10AM)
- Client Services Review (recurring, Tue 2PM)
- Emergency: Campaign Blocker Resolution (ad-hoc, today 11AM)
- BD Pipeline Review (recurring, Wed 9AM)
- Q2 Planning Workshop (one-time, Thu 1PM)
- Finance Monthly Close (recurring, Fri 10AM)
- All-Hands (recurring, Fri 4PM)
- Client: Acme Corp Check-in (external, today 3PM)
- Hiring Committee (ad-hoc, Wed 11AM)
- ELT Strategic Review (recurring, Mon 8AM)

**Actions (23):**
- 5 overdue (contract reviews, client deliverables)
- 5 in progress (proposals, hiring, planning)
- 4 blocked (legal review, budget approval, client response)
- 9 completed (reports, meetings, follow-ups)

**Decisions (8):**
- "Approved: Switch to hybrid client engagement model" (rationale: cost reduction)
- "Pending: Q2 hiring freeze" (awaiting revenue forecast)
- "Approved: Acme Corp contract extension at revised rate"
- etc.

**Financial Mock Data:**
- Pipeline: $2.4M (28 deals)
- Q2 target: $1.8M (gap: $180K)
- Monthly revenue: $320K
- Client retention: 94%

**AI Insights (specific to this industry):**
- "3 client deliverables are past due. Risk: Acme Corp SLA violation in 48 hours."
- "BD pipeline has a $180K gap to Q2 target. 2 'likely' deals haven't been updated in 14 days."
- "Cross-referencing calendar and CRM: meeting with Acme Corp tomorrow, but their unresolved support ticket hasn't been flagged to the account team."

### Template B: Tech Startup ("ByteForge Labs")

**URL:** `/demo/tech`
**Company:** ByteForge Labs
**Size:** 32 employees
**Industry:** B2B SaaS startup
**Departments:** Engineering, Product, Sales, Marketing, Executive

**Team Members:**
| Name | Role | Department |
|------|------|------------|
| Alex Rivera | CEO/Founder | Executive |
| Jordan Kim | CTO | Engineering |
| Sam Patel | VP Product | Product |
| Maya Chen | Head of Sales | Sales |
| Chris Taylor | Marketing Director | Marketing |
| Dev Nguyen | Lead Engineer | Engineering |
| Rachel Stone | Sales Rep | Sales |
| Kai Yamamoto | Designer | Product |

**Meetings:** Sprint planning, product demos, sales pipeline, investor update, etc.

**Actions:** Bug fixes, feature tickets, deal follow-ups, content deadlines

**Financial Mock Data:**
- MRR: $42K
- Pipeline: $180K (12 deals)
- Burn rate: $95K/month
- Runway: 14 months

**AI Insights:**
- "Sprint velocity dropped 23% this week. 3 engineers pulled into customer escalation."
- "Two enterprise deals in pipeline haven't had activity in 10 days. Suggested: schedule check-in calls."
- "Marketing campaign ROI: blog posts generating 3x more leads than paid ads."

### Template C: Hospitality ("Harbor Restaurant Group")

**URL:** `/demo/hospitality`
**Company:** Harbor Restaurant Group
**Size:** 95 employees across 3 locations
**Industry:** Restaurant group
**Departments:** Operations, Kitchen/Menu, Front-of-House, Events, Management

**Multi-location twist:** 3 locations as sub-workspaces:
- Harbor Downtown (45 staff)
- Harbor Waterfront (30 staff)
- Harbor Catering (20 staff)

**Team Members:**
| Name | Role | Department |
|------|------|------------|
| Maria Santos | Owner/GM | Management |
| James O'Brien | Head Chef | Kitchen/Menu |
| Sophie Laurent | FOH Manager (Downtown) | Front-of-House |
| Carlos Mendez | Events Director | Events |
| Aisha Williams | Operations Manager | Operations |
| Ryan Park | FOH Manager (Waterfront) | Front-of-House |
| Nina Petrov | Catering Lead | Events |
| Ben Thompson | Sous Chef | Kitchen/Menu |

**Meetings:** Menu review, staff scheduling, event planning, supplier calls, P&L review

**Actions:** Inventory orders, menu updates, event preparations, maintenance requests

**Financial Mock Data:**
- Monthly revenue: $285K across locations
- Food cost: 31% (target: 30%)
- Labor cost: 28%
- Event bookings: 12 upcoming ($68K revenue)

**AI Insights:**
- "Food cost at Waterfront location is 33% - 3 points above target. Suggested: review supplier pricing for seafood items."
- "3 staff scheduling conflicts next week across locations. Suggested: swap Tuesday shifts between Downtown and Waterfront."
- "Event inquiry from corporate client for 200-person dinner. Cross-referencing availability: only Catering has capacity on the requested date."

---

## 7. AI Response System

### Tiered Architecture

#### Tier 1: Showcase Responses (10 responses)
**Used in:** Guided demo mode, specific trigger buttons
**Quality:** Perfectly crafted, impressive, predictable

| # | Trigger | Context | Response Summary |
|---|---------|---------|------------------|
| 1 | "Prep me for this meeting" | Meeting detail | Full briefing with 4 risks, financial data, 3 action items |
| 2 | "What's the status of Q2?" | Dashboard AI | Cross-dept summary with metrics, risks, recommendations |
| 3 | "Show me cross-department blockers" | ELT Rollup | 3 blockers with impact analysis and suggested resolutions |
| 4 | "What should I focus on today?" | My Work | Prioritized list with time estimates and context |
| 5 | "Analyze this pipeline" | Sales context | Pipeline analysis with risk scoring and next-best-actions |
| 6 | "Why is this deal stalled?" | CRM context | Deal history, stakeholder analysis, re-engagement strategy |
| 7 | "Generate a summary for the board" | ELT context | Executive summary with KPIs, risks, strategic recommendations |
| 8 | "What happened in yesterday's meetings?" | Next-day context | Summary of decisions, actions, follow-ups from all meetings |
| 9 | "Compare department performance" | ELT Rollup | Department comparison with benchmarks and trends |
| 10 | "Draft a follow-up email" | Post-meeting | Professional email with action items, decisions, next steps |

#### Tier 2: Category Responses (20 categories)
**Used in:** Free explore mode, keyword-matched
**Quality:** Good quality, relevant, may not perfectly match the question

| Category | Keywords | Response Pattern |
|----------|----------|-----------------|
| Budget/Finance | budget, cost, spend, revenue, P&L | Financial analysis with numbers |
| Timeline/Deadline | when, deadline, due, schedule, timeline | Date-based analysis with urgency |
| Risk/Issue | risk, problem, issue, concern, blocker | Risk assessment with mitigation |
| Team/People | who, team, assign, delegate, hire | People-based recommendations |
| Performance | metrics, KPI, performance, tracking | Metric dashboard with trends |
| Client/Customer | client, customer, account, deal | Customer intelligence summary |
| Meeting | meeting, agenda, prep, follow-up | Meeting context and recommendations |
| Action | action, task, to-do, next steps | Action item generation/review |
| Decision | decide, decision, approve, choose | Decision framework with options |
| Strategy | strategy, plan, roadmap, vision | Strategic analysis |
| Comparison | compare, vs, difference, better | Side-by-side analysis |
| Trend | trend, pattern, change, growth | Trend analysis with charts |
| Forecast | predict, forecast, expect, project | Forward-looking analysis |
| Summary | summary, recap, overview, brief | Synthesized overview |
| Search | find, look for, search, where | Data retrieval results |
| Create | create, make, draft, write | Content generation |
| Update | update, change, modify, edit | Modification confirmation |
| Report | report, analysis, deep dive | Detailed analytical report |
| Notify | notify, alert, tell, remind | Notification/reminder setup |
| Help | help, how, explain, what is | Educational explanation |

#### Tier 3: Generic Templates (5 fallbacks)
**Used in:** When no keyword match, graceful degradation
**Quality:** Impressive but generic

1. **Data Table Template**: "I found relevant data across your workspaces..." + mock table with 5 rows
2. **Chart Template**: "Here's what the data shows..." + described trend with key metrics
3. **Action List Template**: "Based on my analysis, here are recommended next steps..." + 3 prioritized actions
4. **Risk Assessment Template**: "I've identified several factors to consider..." + 3 risk items with ratings
5. **Executive Summary Template**: "Here's a synthesized view..." + 4-bullet summary with conclusion

### Response Rendering

All AI responses render with:
- Typing animation (40ms per character for text, instant for structured blocks)
- Tool-use indicator chips appear during "thinking" phase
- Structured blocks (tables, action cards, risk items) render with stagger animation
- Follow-up suggestions appear after response completes (3 suggested next questions)

### Live Claude API Mode

**Toggle:** Hidden keyboard shortcut `Ctrl+Shift+L` switches between scripted and live
**Indicator:** Small "LIVE" badge appears next to AI status dot when active

**Implementation:**
- Requires optional server running (`npm start`)
- Server proxies requests to Claude API with injected context:
  - Current industry dataset (company, people, meetings, actions, decisions)
  - Current page context (what the user is looking at)
  - Persona context (who they're logged in as)
- System prompt instructs Claude to respond as "Workbook AI" using only the provided mock data
- API key via environment variable (`ANTHROPIC_API_KEY`)

---

## 8. Navigation Architecture

### Section-Based Sidebar

The 56px icon-rail sidebar shows different nav items based on the active context section.

#### Sidebar Structure

```
[Logo - 32px] (click -> dashboard)
[Cmd+K icon] (focus command bar)
---
[Section icons - context-dependent]
---
[AI Status indicator]
[Notification bell + count]
[Theme toggle]
[Persona avatar + switcher]
[Keyboard hints]
```

#### Navigation Sections

**Section: Workspace** (default)
| Icon | Label | Target |
|------|-------|--------|
| Home | Dashboard | `/dashboard` |
| Calendar | Calendar | `/calendar` |
| Users | Meetings | `/meetings` |
| CheckSquare | Actions | `/actions` |
| GitBranch | Decisions | `/decisions` |
| Sparkles | Proposals | `/proposals` |
| User | My Work | `/my-work` |

**Section: AI** (expanded sidebar hover reveals label)
| Icon | Label | Target |
|------|-------|--------|
| Bot | Agent Dashboard | `/agents` |
| Store | Marketplace | `/marketplace` |
| BarChart3 | ELT Rollup | `/elt-rollup` |

**Section: Admin**
| Icon | Label | Target |
|------|-------|--------|
| Plug | Connections | `/connections` |
| Settings | Settings | `/settings` |

#### Sidebar Behavior
- Default: 56px icon rail with tooltips on hover
- Section separators: 1px border lines
- Active page: accent background tint + accent icon color
- Hover: expand to ~200px showing labels (smooth transition)
- Notification badges on: Proposals (pending count), Meetings (today count), Actions (overdue count)
- Section switching is automatic based on URL path

---

## 9. OAuth Simulation System

### 8 Platform-Accurate Mock Consent Screens

Each connector gets a custom modal that mimics the real platform's OAuth authorization screen.

#### Flow Pattern (all platforms)

1. User clicks "Connect [Platform]" on connections page or onboarding wizard
2. Brief loading spinner (500ms)
3. Modal appears with platform-accurate consent screen
4. User clicks "Authorize" / "Allow" / "Accept"
5. Progress animation: "Connecting..." (2 seconds)
6. Data scanning animation: "Discovering data..." with categories appearing (3 seconds)
7. "Connected!" confirmation with green check
8. Tile updates to connected state with data metrics

#### Platform-Specific Mocks

**1. Salesforce**
- Background: #1798C1 (Salesforce blue)
- Logo: Salesforce cloud mark
- Title: "Authorize Workbook"
- Permissions list:
  - "Access your contacts and accounts"
  - "Read your opportunities and pipeline"
  - "View your activities and tasks"
  - "Access reports and dashboards"
- Buttons: "Allow" (blue) / "Deny" (text)
- "Logged in as: user@company.com"

**2. Slack**
- Background: White with Slack purple header
- Logo: Slack logo
- Title: "Workbook is requesting permission to access [Workspace]"
- Permissions:
  - "View messages and files in channels"
  - "View people in the workspace"
  - "Post messages as Workbook"
  - "View workspace activity"
- Buttons: "Allow" (green) / "Cancel" (gray)

**3. Microsoft 365**
- Background: White with Microsoft header
- Logo: Microsoft logo
- Title: "Permissions requested"
- Subtitle: "Workbook wants to access your organization's data"
- Permissions (checkbox-style):
  - "Read your calendar"
  - "Read your email"
  - "Access files in SharePoint"
  - "Read Teams messages"
- "Consent on behalf of your organization" checkbox
- Buttons: "Accept" (blue) / "Cancel" (text)

**4. Google Workspace**
- Background: White, Google style
- Logo: Google "G" logo
- Title: "Sign in to Workbook with Google"
- Account selector: "user@company.com" with avatar
- Permissions:
  - "View your Google Calendar"
  - "View your Google Drive files"
  - "View your Gmail messages"
  - "View your contacts"
- "Workbook will be able to:" list
- Buttons: "Allow" (blue) / "Cancel" (text)

**5. Jira**
- Background: White with Atlassian header
- Logo: Jira logo
- Title: "Authorize Workbook for [Site]"
- Permissions:
  - "Read your Jira projects and issues"
  - "Read your sprints and boards"
  - "Create and update issues"
- Buttons: "Accept" (blue) / "Cancel" (text)

**6. HubSpot**
- Background: White with HubSpot orange header
- Logo: HubSpot sprocket
- Title: "Connect Workbook to HubSpot"
- Permissions:
  - "Access contacts and companies"
  - "Read deals and pipeline"
  - "View marketing analytics"
  - "Read tickets and conversations"
- Buttons: "Grant access" (orange) / "Deny" (text)

**7. QuickBooks**
- Background: White with Intuit green header
- Logo: QuickBooks logo
- Title: "Connect to QuickBooks"
- Company selector: "[Company Name]"
- Permissions:
  - "View your financial reports"
  - "Read invoices and expenses"
  - "Access P&L and balance sheet"
- Buttons: "Connect" (green) / "Cancel" (text)

**8. Notion**
- Background: White, minimal
- Logo: Notion logo
- Title: "Connect Workbook to your Notion workspace"
- Workspace selector: "[Workspace Name]"
- Permissions:
  - "Read pages and databases"
  - "Search your workspace content"
- Buttons: "Allow access" (black) / "Cancel" (text)

---

## 10. Persona Switching System

### 4 Switchable Personas

Accessed via avatar dropdown in sidebar bottom.

| Persona | Name | Role | Department | View |
|---------|------|------|------------|------|
| CEO | Jay Altizer | Chief Executive | Executive / ELT | Cross-department, ELT rollup, all workspaces |
| OPS Director | Sarah Chen | COO | Operations | OPS workspace focus, operational metrics |
| Engineering Lead | Marcus Johnson | VP Engineering | Engineering (or Client Services) | Engineering/delivery workspace, technical actions |
| New Employee | Lisa Park | BD Associate (day 1) | Business Development | Onboarding prompts, limited view, guided tips |

### What Changes Per Persona

| Element | Jay (CEO) | Sarah (OPS) | Marcus (Eng) | Lisa (New) |
|---------|-----------|-------------|--------------|------------|
| Dashboard greeting | "Good morning, Jay" | "Good morning, Sarah" | "Good morning, Marcus" | "Welcome, Lisa!" |
| Dashboard metrics | All departments | OPS-focused | Engineering-focused | Personal onboarding |
| AI Briefing | Executive summary | Operational triage | Technical status | Getting started guide |
| Sidebar sections | All (including ELT Rollup) | Workspace only | Workspace only | Workspace + Tutorial |
| ELT Rollup | Full access | "Not authorized" (or hidden) | Hidden | Hidden |
| Actions view | All workspaces | OPS workspace | Engineering workspace | Assigned to me only |
| Meetings view | All meetings | OPS meetings | Engineering meetings | My meetings only |
| Agent Dashboard | All agents | OPS agents | Engineering agents | "Meet your AI assistant" |
| AI context | Cross-department | Department-specific | Department-specific | Onboarding-specific |
| Proposals | All proposals | OPS proposals | Engineering proposals | None (too new) |
| Settings access | Full admin | Limited admin | View only | Profile only |

### Switching UX
- Click avatar in sidebar bottom
- Dropdown with 4 persona options + avatars
- Switch animation: brief fade-out (200ms) -> data swap -> fade-in (200ms)
- Current persona shown by highlighted avatar in dropdown
- Keyboard shortcut: `Ctrl+1/2/3/4` to quick-switch

---

## 11. Animation & Motion Design

### Production-Grade Motion Specification

#### Page Transitions
- **Between pages:** Fade out current (150ms) -> Fade in new (200ms)
- **Content stagger:** Cards/sections appear in sequence (50ms intervals, 4 levels)
- **Data population:** Numbers count up from 0, text types character by character for AI content

#### Landing Page Animations
- **Hero product screenshot:** Elements animate in over 2 seconds (metrics, cards, text)
- **Grid-dot background:** Linear-style stepped keyframe grid animation (3200ms loop)
- **Connector logos:** Float in from edges, orbit central hub
- **Value prop sections:** Scroll-triggered reveal (intersection observer)
- **Pricing cards:** Stagger in on scroll, popular tier has subtle glow pulse

#### Onboarding Wizard
- **Step transitions:** Slide left (exiting step) + slide in from right (entering step), 300ms
- **Department cards:** Stagger appearance, toggle with scale bounce
- **OAuth flow:** Loading spinner -> progress bar -> green check with scale bounce
- **Data scanning:** Categories appear line by line with typing animation, numbers count up
- **First insight reveal:** Dual-panel animation (see Section 4, Page 2, Step 6)

#### Dashboard
- **Metrics:** Number count-up animation on page load (1.5 seconds)
- **AI Briefing:** Text appears with subtle typing effect (not character-by-character, but sentence-by-sentence fade-in)
- **Meeting cards:** Slide in from right in stagger
- **Alert banner:** Slide down from top with spring ease

#### AI Chat Interactions
- **User message:** Slide in from right, accent background
- **Thinking state:** 3-dot typing indicator with staggered opacity pulse (already exists)
- **Tool-use chips:** Appear one by one with fade-in, check marks animate after 500ms
- **AI response:** Text appears with typing animation (40ms/char)
- **Proposed action card:** Scale up from 0.95 to 1.0 with spring ease
- **Approve/Reject:** Card slides up and fades out, success/error notification slides in

#### Kanban Board
- **Card drag:** Shadow deepens, slight rotation (2deg), drop zone highlights
- **Column transitions:** Cards slide between columns with 200ms ease
- **Multi-select:** Selected cards get accent outline with 150ms transition

#### Skeleton Loading States
- **All pages:** Show skeleton placeholders (gray rectangles with shimmer animation) for 300-500ms before content appears
- **Skeleton shimmer:** Linear gradient sweep from left to right, 1.5s loop
- **Pattern:** Match exact layout of final content (same heights, widths, positions)

#### Micro-interactions
- **All buttons:** Scale 0.98 on press, 1.0 on release (50ms)
- **Card hover:** Translate Y -2px, border-color lightens (150ms)
- **Filter chip active:** Background and text color transition (100ms)
- **Notification badge:** Scale bounce when count changes (spring ease)
- **Sidebar expand:** Width transition 200ms ease-out with label fade-in
- **Drawer open:** Slide from right 300ms with backdrop fade
- **Modal open:** Fade in backdrop (200ms) + scale up modal from 0.95 (200ms, spring)

#### Reduced Motion
All animations respect `prefers-reduced-motion: reduce`:
- Disable all transforms and opacity animations
- Keep color transitions (instant)
- Keep layout changes (instant)
- Typing animations become instant text appearance

---

## 12. Connections & Integration UX

See Page 14 (Connections) in Section 4 for full layout specification.

### Data Flow Visualization

On the connections page, show a "Data Flow" diagram:
- Central Workbook logo
- Connector logos arranged in a circle
- Animated lines showing data flowing from connectors to center
- Line thickness indicates data volume
- Line color: green (healthy), amber (slow), red (error)
- Pulse animation on active sync

### Connection States

| State | Visual | Tile Appearance |
|-------|--------|-----------------|
| Not Connected | Gray logo, gray dot | "Connect" button, no metrics |
| Connecting | Animated spinner | "Connecting..." text |
| Connected (Healthy) | Color logo, green dot | Metrics, last sync time |
| Connected (Syncing) | Color logo, blue dot + spinner | "Syncing..." + progress |
| Connected (Error) | Color logo, red dot | Error message, "Reconnect" button |
| Connected (Stale) | Color logo, amber dot | "Last sync: 2 hours ago", "Sync Now" button |

---

## 13. Agent Dashboard & Marketplace

See Pages 12 and 13 in Section 4 for full layout specifications.

### Pre-built Agent Catalog (for marketplace)

| Agent | Category | Description | Required Connectors |
|-------|----------|-------------|-------------------|
| Sales Assistant | Role | Tracks pipeline, suggests follow-ups, forecasts revenue | Salesforce or HubSpot |
| Meeting Prep Agent | Workflow | Prepares briefings, surfaces relevant context, tracks follow-ups | Calendar + any CRM |
| Action Tracker | Workflow | Monitors deadlines, sends reminders, escalates overdue items | None (internal) |
| Finance Analyst | Role | Monitors budgets, flags variances, generates P&L summaries | QuickBooks or Xero |
| Client Success Manager | Role | Tracks client health, flags churn risk, suggests engagement | CRM + Comms |
| Sprint Planner | Workflow | Analyzes velocity, suggests capacity, identifies blockers | Jira or Asana |
| HR Coordinator | Role | Tracks onboarding, manages scheduling, monitors sentiment | Calendar + Comms |
| Marketing Strategist | Role | Analyzes campaign ROI, suggests content, tracks leads | HubSpot + Analytics |
| Operations Director | Role | Cross-functional monitoring, resource allocation, risk tracking | Multiple |
| Document Analyst | Data-Source | Searches docs, summarizes findings, tracks changes | Google Drive or SharePoint |
| Email Summarizer | Workflow | Summarizes email threads, extracts action items | M365 or Google |
| Risk Assessor | Workflow | Monitors risks across departments, generates risk reports | None (cross-workspace) |

---

## 14. ROI & Value Metrics

### Persistent ROI Indicators

Throughout the demo, ROI metrics are displayed contextually:

#### Dashboard ROI Widget
- "AI saved 12 hours this week" with trend sparkline (up arrow)
- "23 follow-ups automated this month"
- "3 risks identified before impact"
- "$42K risk identified and mitigated"

#### In-Context ROI Callouts
- Meeting detail: "AI prep saved ~30 min for this meeting"
- Actions page: "AI auto-assigned 8 actions this week (saved ~2 hours)"
- Proposals queue: "AI generated 15 proposals this week (12 approved, 0 errors)"
- Agent dashboard: "Agents completed 47 tasks autonomously (98% accuracy)"
- ELT Rollup: "Cross-department intelligence reduced escalation time by 65%"

#### Settings > AI Preferences > ROI Report
- Monthly summary of AI value delivered
- Hours saved estimate
- Automated actions count
- Risk identification count
- Decision support contributions
- Comparison: "Without Workbook, these tasks would take ~40 additional hours/month"

---

## 15. Landing Page Design

### Linear.app Design Principles to Emulate

Based on analysis of linear.app:

1. **Precision spacing** with CSS custom properties (consistent rhythm)
2. **Responsive sophistication** with distinct breakpoints (but we're desktop-only)
3. **Grid-dot background animation** with stepped keyframe sequences
4. **Hardware-aware rendering** (detect capabilities)
5. **Minimal color palette** with strategic accent use
6. **Developer-grade typography** (monospace for technical elements)
7. **Scroll-triggered reveals** (intersection observer patterns)
8. **Adaptive CTA** based on auth state

### Landing Page Color Extension

For the landing page specifically, extend the Nexus palette:

```css
/* Landing page specific */
--landing-bg:       #08080A;   /* Slightly darker than surface-dark */
--landing-gradient: linear-gradient(180deg, #08080A 0%, #0C0C0E 100%);
--landing-glow:     radial-gradient(ellipse at center, rgba(79, 70, 229, 0.15), transparent 70%);
--landing-grid-dot: rgba(255, 255, 255, 0.03);  /* Subtle dot grid */
```

### Key Visual Techniques

1. **Product screenshot float:** Dashboard screenshot rendered at slight angle with shadow, floating above gradient. Elements within the screenshot animate independently.

2. **Connector orbit:** 8 platform logos orbit a central Workbook logo. Orbits are elliptical with slight depth perspective. Logos fade in/out as they pass behind the center.

3. **Department graph:** Animated node graph with pulsing connections. Nodes represent departments, connections show data flow. A "data packet" animation travels along connections periodically.

4. **Pricing hover:** Hovering a pricing tier subtly elevates it and adds the accent glow. The "Most Popular" tier has a permanent subtle glow.

---

## 16. File Structure

```
nexus/
  index.html                    # Landing page (entry point)

  # Core pages
  dashboard.html                # Executive dashboard (expand existing)
  meetings.html                 # Meetings overview (expand existing)
  meeting-detail.html           # Meeting detail (expand existing)
  actions.html                  # Actions kanban (expand existing)
  decisions.html                # Decisions timeline + table
  proposals.html                # AI proposals queue
  calendar.html                 # Week/month calendar view
  my-work.html                  # Personal productivity hub
  elt-rollup.html               # Cross-department executive view
  agents.html                   # Agent dashboard
  marketplace.html              # Agent marketplace catalog
  connections.html              # Tool connections management
  settings.html                 # Admin settings

  # Onboarding flow
  onboarding/
    step-1-company.html         # Company profile
    step-2-departments.html     # Department discovery
    step-3-tools.html           # Tool selection
    step-4-connect.html         # OAuth connection
    step-5-scanning.html        # AI data scan animation
    step-6-insight.html         # First insight reveal

  # Industry datasets
  data/
    consulting.js               # Meridian Consulting dataset
    tech.js                     # ByteForge Labs dataset
    hospitality.js              # Harbor Restaurant Group dataset
    shared.js                   # Shared utilities and templates

  # AI response system
  ai/
    showcase-responses.js       # Tier 1: 10 perfectly crafted responses
    category-responses.js       # Tier 2: 20 category-matched responses
    generic-templates.js        # Tier 3: 5 fallback templates
    response-engine.js          # Keyword matching + response selection
    live-mode.js                # Claude API integration (optional)

  # Demo system
  demo/
    guided-mode.js              # Demo arc controller
    arcs.js                     # 5 arc definitions with steps/narration
    demo-bar.js                 # Bottom bar UI controller
    persona-switcher.js         # Persona switching logic

  # OAuth simulation
  oauth/
    modals.js                   # Generic modal controller
    salesforce.html             # Salesforce consent screen
    slack.html                  # Slack consent screen
    microsoft.html              # M365 consent screen
    google.html                 # Google consent screen
    jira.html                   # Jira consent screen
    hubspot.html                # HubSpot consent screen
    quickbooks.html             # QuickBooks consent screen
    notion.html                 # Notion consent screen

  # Shared components
  components/
    sidebar.js                  # Section-based sidebar
    command-bar.js              # Cmd+K command bar
    alert-banner.js             # Dismissible alerts
    ai-chat.js                  # AI chat panel controller
    detail-drawer.js            # Slide-out detail drawer
    skeleton.js                 # Skeleton loading states
    animations.js               # Shared animation utilities
    persona.js                  # Persona state management
    industry.js                 # Industry template loader

  # Styles
  styles/
    nexus-tokens.css            # Design tokens as CSS variables
    landing.css                 # Landing page specific styles
    animations.css              # All animation keyframes
    oauth-screens.css           # OAuth modal styling
    skeleton.css                # Skeleton loading styles

  # Assets
  assets/
    logos/                      # Platform logos (SVG)
    avatars/                    # Team member avatars
    icons/                      # Custom icons beyond Lucide

  # Optional server
  server/
    index.js                    # Express server for Claude API proxy
    package.json                # Server dependencies
    .env.example                # API key template

  # Documentation
  DEMO-SPEC.md                  # This file
  HANDOFF.md                    # Original design spec (existing)
```

---

## 17. Technical Architecture

### Static-First with Optional Server

```
┌──────────────────────────────────────────────────┐
│                    Browser                        │
│                                                   │
│  index.html ──> onboarding/ ──> dashboard.html    │
│                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐│
│  │ Industry     │  │ AI Response  │  │ Demo     ││
│  │ Data Loader  │  │ Engine       │  │ Control  ││
│  │ (JS modules) │  │ (keyword     │  │ (arcs,   ││
│  │              │  │  matching)   │  │  steps)  ││
│  └─────────────┘  └──────┬───────┘  └──────────┘│
│                          │                        │
│              ┌───────────┴───────────┐            │
│              │  Live Mode Toggle     │            │
│              │  (Ctrl+Shift+L)       │            │
│              └───────────┬───────────┘            │
│                          │                        │
└──────────────────────────┼────────────────────────┘
                           │ (only when live mode on)
                           ▼
              ┌────────────────────────┐
              │  Optional Express      │
              │  Server (port 3456)    │
              │                        │
              │  POST /api/chat        │
              │  -> Claude API proxy   │
              │  -> Injects mock data  │
              │     context per        │
              │     industry/persona   │
              └────────────────────────┘
```

### URL Routing (Static)

Since we're using static HTML, routing is file-based:

```
/                        -> index.html (landing page)
/demo/consulting/        -> Loads consulting dataset, redirects to dashboard
/demo/tech/              -> Loads tech dataset, redirects to dashboard
/demo/hospitality/       -> Loads hospitality dataset, redirects to dashboard
/dashboard               -> dashboard.html
/meetings                -> meetings.html
/meeting/emergency       -> meeting-detail.html
/actions                 -> actions.html
... etc
```

**Industry selection:** URL parameter or localStorage:
- `?industry=consulting` on any page loads that dataset
- `localStorage.setItem('workbook-industry', 'consulting')` persists
- Preset URLs set the localStorage and redirect

### State Management (Vanilla JS)

```javascript
// Global state object
window.WorkbookDemo = {
  industry: 'consulting',           // consulting | tech | hospitality
  persona: 'ceo',                   // ceo | ops | engineering | new
  demoMode: 'free',                 // free | guided
  currentArc: null,                 // 1-5 when guided
  currentStep: 0,                   // step within arc
  aiMode: 'scripted',              // scripted | live
  theme: 'dark',                    // dark | light
  data: null,                       // loaded industry dataset

  // Methods
  switchIndustry(id) {},
  switchPersona(id) {},
  startArc(arcId) {},
  nextStep() {},
  prevStep() {},
  toggleAiMode() {},
  toggleTheme() {},
};
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Initial page load | < 1.5s (static HTML) |
| Page transition | < 300ms (fade + stagger) |
| AI response (scripted) | 500ms delay + typing animation |
| AI response (live) | Real Claude latency (~2-5s) |
| OAuth simulation | 5.5s total (0.5 load + 2 auth + 3 scan) |
| Industry switch | < 500ms (data swap + re-render) |
| Persona switch | < 400ms (fade + data swap + fade-in) |

---

## 18. Implementation Phases

### Phase 0: Foundation (Days 1-2)
**Focus:** Design system, shared components, state management

- [ ] Create CSS design tokens file (`nexus-tokens.css`)
- [ ] Build animation keyframes library (`animations.css`)
- [ ] Build skeleton loading component
- [ ] Build sidebar component (section-based navigation)
- [ ] Build command bar component
- [ ] Build detail drawer component
- [ ] Build persona switcher
- [ ] Build industry data loader
- [ ] Create 3 industry datasets (JS modules)
- [ ] Set up demo control system (arcs, steps, narrator)
- [ ] Set up global state management

### Phase 1: Landing + Onboarding (Days 3-5)
**Focus:** First-touch experience

- [ ] Build landing page (Linear-quality, full sections)
- [ ] Build pricing section/page
- [ ] Build onboarding wizard (6 steps)
- [ ] Build 8 OAuth mock consent screens
- [ ] Build data scanning animation
- [ ] Build first insight split reveal
- [ ] Wire landing -> onboarding -> dashboard flow

### Phase 2: Expand Existing Pages (Days 6-8)
**Focus:** Make existing pages dynamic and interactive

- [ ] Expand dashboard with ROI widget, persona awareness, industry data
- [ ] Expand meetings with functional filters, industry data
- [ ] Expand meeting detail with interactive AI chat (scripted responses)
- [ ] Expand actions with functional filters, drag simulation, industry data
- [ ] Wire all cross-page navigation

### Phase 3: New Core Pages (Days 9-12)
**Focus:** Decisions, proposals, calendar, my work

- [ ] Build decisions page (timeline + table toggle)
- [ ] Build proposals queue page
- [ ] Build calendar page (week + month views)
- [ ] Build My Work page
- [ ] Connect all proposal interactions (approve/reject flows)

### Phase 4: Executive & AI Pages (Days 13-15)
**Focus:** ELT rollup, agent dashboard, marketplace

- [ ] Build ELT rollup page (5 sections)
- [ ] Build agent dashboard page
- [ ] Build agent marketplace page
- [ ] Build connections page with detail drawers
- [ ] Build settings page (6 tabs)

### Phase 5: Demo System + Polish (Days 16-18)
**Focus:** Guided mode, polish, live AI

- [ ] Implement 5 demo arcs with narration text
- [ ] Build demo control bar (bottom bar + hotkeys)
- [ ] Implement all Tier 1 showcase responses
- [ ] Implement Tier 2 + 3 response matching
- [ ] Set up optional Express server for live Claude
- [ ] Production-grade animation polish pass
- [ ] Cross-page consistency review
- [ ] Keyboard shortcut audit
- [ ] Skeleton loading state audit

### Phase 6: Multi-Industry + Persona (Days 19-20)
**Focus:** Complete the data dimension

- [ ] Finalize all 3 industry datasets (every page, every component)
- [ ] Test industry switching on every page
- [ ] Finalize 4 persona views (every page, every component)
- [ ] Test persona switching on every page
- [ ] Create preset URL landing pages (/demo/consulting, /demo/tech, /demo/hospitality)

### Phase 7: Final QA + Documentation (Day 21+)
**Focus:** Polish and prepare for presentation

- [ ] Full walkthrough of all 5 demo arcs
- [ ] Edge case testing (rapid switching, keyboard shortcuts)
- [ ] Animation performance audit (no jank at 60fps)
- [ ] Screenshot/recording of key moments for backup
- [ ] Presenter guide: which arc for which audience
- [ ] Backup plan: static screenshots if demo fails live

---

## Appendix A: Keyboard Shortcuts (Complete)

### Global
| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Focus command bar |
| `Cmd+1` | Navigate to Dashboard |
| `Cmd+2` | Navigate to Meetings |
| `Cmd+3` | Navigate to Actions |
| `Cmd+4` | Navigate to Decisions |
| `Escape` | Dismiss alert/modal/drawer |
| `Ctrl+1/2/3/4` | Quick-switch persona |
| `Ctrl+D` | Toggle demo control bar |
| `Ctrl+Shift+L` | Toggle live AI mode |

### Demo Mode
| Shortcut | Action |
|----------|--------|
| `Space` / `Right Arrow` | Next step |
| `Left Arrow` | Previous step |
| `1-5` | Jump to Arc 1-5 |
| `F` | Toggle fullscreen |
| `Escape` | Exit guided mode |

### Meeting Detail
| Shortcut | Action |
|----------|--------|
| `Tab` | Cycle AI mode |
| `Cmd+Enter` | Send AI message |

---

## Appendix B: Design Resource Links

- **Frontend design plugin:** `C:\Users\david.hayes\.claude\plugins\frontend-design`
- **UI/UX skill:** `C:\Users\david.hayes\.claude\skills\ui-ux-pro-max`
- **Animations:** https://reactbits.dev/
- **Smooth UI:** https://github.com/educlopez/smoothui/
- **Landing benchmark:** https://linear.app/
- **Existing handoff:** `nexus/HANDOFF.md`
- **Scaling roadmap:** `C:\Users\david.hayes\spark-platform\docs\scaling-roadmap.md`

---

## Appendix C: Mock Data Volume Summary

| Data Type | Per Industry | Total |
|-----------|-------------|-------|
| Team members | 8 | 24 |
| Meetings | 10 | 30 |
| Actions | 23 | 69 |
| Decisions | 8 | 24 |
| Proposals | 7 | 21 |
| AI insights | 10 | 30 |
| Agents (marketplace) | 12 | 12 (shared) |
| OAuth screens | 8 | 8 (shared) |
| AI showcase responses | 10 | 10 (industry-adaptive) |
| AI category responses | 20 | 20 (industry-adaptive) |
| AI generic templates | 5 | 5 (shared) |
| Calendar events | 15 | 45 |
| Notifications | 8 | 24 |
| Financial metrics | 6 | 18 |

**Total unique data points:** ~450+ across all industries

---

*Specification complete. Ready for implementation.*
