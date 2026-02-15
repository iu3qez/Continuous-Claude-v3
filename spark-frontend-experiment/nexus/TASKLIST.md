# Workbook Demo Platform - Atomic Task List

> **Status:** Pending review
> **Execution:** /ralph workflow with TDD (arbiter writes failing tests, kraken implements)
> **Total:** 72 tasks across 14 groups

---

## Dependency Graph

```
[T01] Test Infrastructure
  |
  +--[T02-T05] CSS Foundation (parallel, no deps beyond T01)
  |
  +--[T06] Global State Module
  |    |
  |    +--[T07] Industry Data Loader
  |    |    |
  |    |    +--[T08-T10] Industry Datasets (parallel)
  |    |
  |    +--[T12] Persona State Module
  |
  +--[T09] Shared Data Utilities (parallel with T07)
  |
  +--[T13-T18] Shared Components (parallel, depend on T06)
  |
  +--[T19-T23] AI Response System (sequential)
  |
  +--[T24-T28] OAuth System (T24 first, then parallel)
  |
  +--[T29-T33] Landing Page (sequential, depend on T02-T05)
  |
  +--[T34-T39] Onboarding Wizard (sequential, depend on T24)
  |
  +--[T40-T47] Existing Page Expansion (depend on T06-T18)
  |
  +--[T48-T61] New Pages (depend on T06-T18)
  |
  +--[T62-T67] Demo System (depend on T19-T23)
  |
  +--[T68-T72] Integration & Polish (depend on all above)
```

---

## Group 0: Test Infrastructure

### T01: Set up test infrastructure
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `package.json`, `vitest.config.js`, `tests/setup.js`
- **Work:** Create package.json with vitest, jsdom, @testing-library/dom. Configure vitest for jsdom environment. Create test setup with DOM helpers, mock localStorage.
- **Verify:** `npm test` runs and reports 0 tests
- **Size:** ~50 lines
- **Deps:** None
- **TDD:** N/A (infrastructure)

---

## Group 1: CSS Foundation (parallel after T01)

### T02: Create design tokens CSS
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `styles/nexus-tokens.css`
- **Work:** Extract ALL CSS custom properties from DEMO-SPEC Section 3. Surfaces, borders, text, accent, semantic, workspace colors. Typography scale, spacing scale, radius scale. Landing page extensions. Light mode overrides.
- **Size:** ~120 lines
- **Deps:** T01
- **TDD:** N/A (pure CSS)

### T03: Create animation keyframes library
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `styles/animations.css`
- **Work:** All keyframes from DEMO-SPEC Section 11. staggerIn (4 levels), fadeIn/fadeOut, slideFromRight/Left, countUp, typewriter, shimmer, pulseGlow, springBounce. Reduced motion media query overrides.
- **Size:** ~150 lines
- **Deps:** T01
- **TDD:** N/A (pure CSS)

### T04: Create skeleton loading CSS
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `styles/skeleton.css`
- **Work:** Skeleton placeholder styles (gray rectangles with shimmer). Card, text, metric, chart skeleton variants. Shimmer gradient animation (left to right sweep, 1.5s loop).
- **Size:** ~60 lines
- **Deps:** T01
- **TDD:** N/A (pure CSS)

### T05: Create OAuth screens CSS
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `styles/oauth-screens.css`
- **Work:** Modal overlay, consent screen container. Platform-specific header colors (Salesforce #1798C1, HubSpot orange, etc). Permission list styling, button styling per platform. Loading/progress/success states.
- **Size:** ~120 lines
- **Deps:** T01
- **TDD:** N/A (pure CSS)

---

## Group 2: Core JS Modules

### T06: Build global state management module
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `components/state.js`, `tests/state.test.js`
- **Work:** `WorkbookDemo` global state object with all properties from DEMO-SPEC Section 17. Methods: switchIndustry, switchPersona, startArc, nextStep, prevStep, toggleAiMode, toggleTheme. localStorage persistence. Event emitter pattern (subscribe/notify).
- **Size:** ~150 lines code + ~120 lines tests
- **Deps:** T01
- **TDD:** YES

### T07: Build industry data loader module
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `components/industry.js`, `tests/industry.test.js`
- **Work:** `loadIndustryData(industryId)`, `getCurrentIndustry()`. URL parameter parsing (`?industry=consulting`). Validation: dataset must match expected schema.
- **Size:** ~80 lines code + ~60 lines tests
- **Deps:** T06
- **TDD:** YES

### T08: Create consulting industry dataset
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `data/consulting.js`, `tests/data-consulting.test.js`
- **Work:** Meridian Consulting Group dataset from DEMO-SPEC Section 6 Template A. 8 team members, 10 meetings, 23 actions, 8 decisions. Financial mock data. 10 AI insights.
- **Size:** ~250 lines code + ~40 lines tests
- **Deps:** T07, T09
- **TDD:** YES (schema validation)

### T09: Create shared data utilities and schema
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `data/shared.js`, `tests/data-shared.test.js`
- **Work:** Data schema definitions (team member, meeting, action shapes). `validateDataset(data)`. Shared formatters: date, currency, percentage, time-relative. Shared constants: status values, priority levels, workspace colors.
- **Size:** ~120 lines code + ~80 lines tests
- **Deps:** T06
- **TDD:** YES

### T10: Create tech industry dataset
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `data/tech.js`, `tests/data-tech.test.js`
- **Work:** ByteForge Labs dataset from DEMO-SPEC Section 6 Template B. 8 team members, meetings, actions, decisions. SaaS-specific financial data. Tech-specific AI insights.
- **Size:** ~250 lines code + ~40 lines tests
- **Deps:** T07, T09
- **TDD:** YES (schema validation)

### T11: Create hospitality industry dataset
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `data/hospitality.js`, `tests/data-hospitality.test.js`
- **Work:** Harbor Restaurant Group dataset from DEMO-SPEC Section 6 Template C. 8 team members, multi-location data, meetings, actions. Restaurant-specific financial data.
- **Size:** ~250 lines code + ~40 lines tests
- **Deps:** T07, T09
- **TDD:** YES (schema validation)

### T12: Build persona state module
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `components/persona.js`, `tests/persona.test.js`
- **Work:** 4 persona definitions (CEO, OPS, Engineering, New Employee) from DEMO-SPEC Section 10. `switchPersona(id)`, `getPersonaConfig()`. Persona-aware data filtering. Keyboard shortcut mapping (Ctrl+1/2/3/4).
- **Size:** ~120 lines code + ~80 lines tests
- **Deps:** T06
- **TDD:** YES

---

## Group 3: Shared UI Components

### T13: Build sidebar component
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `components/sidebar.js`, `tests/sidebar.test.js`
- **Work:** Section-based navigation from DEMO-SPEC Section 8. 3 sections: Workspace (7 items), AI (3 items), Admin (2 items). Icon-rail (56px) with hover expand. Active page detection. Notification badges. Persona avatar trigger.
- **Size:** ~200 lines code + ~100 lines tests
- **Deps:** T06, T12
- **TDD:** YES

### T14: Build command bar component
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `components/command-bar.js`, `tests/command-bar.test.js`
- **Work:** Cmd+K activation, search input, results list. Page and action commands. Fuzzy matching. Keyboard navigation (up/down/Enter/Esc).
- **Size:** ~150 lines code + ~80 lines tests
- **Deps:** T06
- **TDD:** YES

### T15: Build detail drawer component
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `components/detail-drawer.js`, `tests/detail-drawer.test.js`
- **Work:** Slide-out panel from right (400px). Generic container with title, close, content slot. Backdrop overlay with click-to-close. Escape key dismiss. Open/close animation.
- **Size:** ~100 lines code + ~60 lines tests
- **Deps:** T06
- **TDD:** YES

### T16: Build skeleton loading controller
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `components/skeleton.js`, `tests/skeleton.test.js`
- **Work:** `showSkeleton(containerId)`, `hideSkeleton(containerId)`. Skeleton templates: card, metric, text, table row, timeline. Auto-hide after configurable delay.
- **Size:** ~80 lines code + ~50 lines tests
- **Deps:** T06
- **TDD:** YES

### T17: Build alert banner component
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `components/alert-banner.js`, `tests/alert-banner.test.js`
- **Work:** Dismissible alert banner. Variants: info, warning, danger, success. Dismiss button, auto-dismiss option. Persist dismissed state in session.
- **Size:** ~70 lines code + ~50 lines tests
- **Deps:** T06
- **TDD:** YES

### T18: Build shared animation utilities
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `components/animations.js`, `tests/animations.test.js`
- **Work:** `countUp(element, target, duration)`, `typeText(element, text, speed)`, `staggerIn(elements, delay)`, `fadeTransition(outEl, inEl, duration)`. Reduced motion detection.
- **Size:** ~100 lines code + ~60 lines tests
- **Deps:** T01
- **TDD:** YES

---

## Group 4: AI Response System

### T19: Build AI response engine core
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `ai/response-engine.js`, `tests/ai-response-engine.test.js`
- **Work:** `getResponse(query, context)`. Keyword matching against Tier 2 categories. Tier selection logic. Response rendering config. Industry-aware adaptation.
- **Size:** ~150 lines code + ~100 lines tests
- **Deps:** T06
- **TDD:** YES

### T20: Create Tier 1 showcase responses
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `ai/showcase-responses.js`, `tests/ai-showcase.test.js`
- **Work:** 10 perfectly crafted responses from DEMO-SPEC Section 7, Tier 1 table. Industry-adaptive with `{{company}}`, `{{metric}}` placeholders. Tool-use chip definitions.
- **Size:** ~300 lines code + ~50 lines tests
- **Deps:** T19
- **TDD:** YES

### T21: Create Tier 2 category responses
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `ai/category-responses.js`, `tests/ai-category.test.js`
- **Work:** 20 category-matched response templates from DEMO-SPEC Section 7, Tier 2. Keywords arrays, response pattern templates, industry variations.
- **Size:** ~250 lines code + ~50 lines tests
- **Deps:** T19
- **TDD:** YES

### T22: Create Tier 3 generic templates
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `ai/generic-templates.js`, `tests/ai-generic.test.js`
- **Work:** 5 fallback templates from DEMO-SPEC Section 7, Tier 3. Data table, chart, action list, risk assessment, executive summary.
- **Size:** ~120 lines code + ~30 lines tests
- **Deps:** T19
- **TDD:** YES

### T23: Build AI chat panel controller
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `components/ai-chat.js`, `tests/ai-chat.test.js`
- **Work:** Chat message rendering. Input handling (Cmd+Enter). AI response flow: thinking dots -> tool-use chips -> typing response -> follow-up suggestions. Mode selector. Scripted vs live switching.
- **Size:** ~180 lines code + ~80 lines tests
- **Deps:** T19, T06
- **TDD:** YES

---

## Group 5: OAuth Simulation System

### T24: Build OAuth modal controller
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `oauth/modals.js`, `tests/oauth-modals.test.js`
- **Work:** `showOAuth(platform)`. Flow: loading (500ms) -> consent -> authorize -> connecting (2s) -> scanning (3s) -> connected. State management. Event emission. Generic modal open/close.
- **Size:** ~150 lines code + ~80 lines tests
- **Deps:** T06
- **TDD:** YES

### T25: Create Salesforce + Slack OAuth screens
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `oauth/salesforce.html`, `oauth/slack.html`
- **Work:** Platform-accurate consent screens from DEMO-SPEC Section 9. Salesforce: #1798C1 blue, cloud mark, permissions, Allow/Deny. Slack: white bg, purple header, permissions, Allow/Cancel.
- **Size:** ~80 lines per file
- **Deps:** T24, T05
- **TDD:** N/A

### T26: Create Microsoft + Google OAuth screens
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `oauth/microsoft.html`, `oauth/google.html`
- **Work:** Microsoft: white bg, MS logo, checkbox permissions, Accept/Cancel. Google: white bg, G logo, account selector, Allow/Cancel.
- **Size:** ~80 lines per file
- **Deps:** T24, T05
- **TDD:** N/A

### T27: Create Jira + HubSpot OAuth screens
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `oauth/jira.html`, `oauth/hubspot.html`
- **Work:** Jira: white bg, Atlassian header, Accept/Cancel. HubSpot: white bg, orange header, Grant access/Deny.
- **Size:** ~80 lines per file
- **Deps:** T24, T05
- **TDD:** N/A

### T28: Create QuickBooks + Notion OAuth screens
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `oauth/quickbooks.html`, `oauth/notion.html`
- **Work:** QuickBooks: green header, company selector, Connect/Cancel. Notion: minimal, workspace selector, Allow access/Cancel.
- **Size:** ~80 lines per file
- **Deps:** T24, T05
- **TDD:** N/A

---

## Group 6: Landing Page

### T29: Build landing page - nav + hero section
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `index.html`
- **Work:** Full HTML setup with nexus-tokens.css, animations.css. Sticky nav: logo, links, Sign In + Start Free Trial. Backdrop blur on scroll. Hero: Playfair headline, Inter subtext, 2 CTAs. Grid-dot background animation.
- **Size:** ~200 lines
- **Deps:** T02, T03
- **TDD:** N/A
- **Design:** frontend-design plugin, reference linear.app, reactbits.dev

### T30: Build landing page - animated product screenshot
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `index.html` (modify), `components/landing-hero.js`
- **Work:** Dashboard mockup floating on gradient. Elements animate in. Subtle parallax depth on mouse movement. Hardware-aware rendering.
- **Size:** ~150 lines JS + ~100 lines HTML
- **Deps:** T29, T18
- **TDD:** Partial (parallax calc, hardware detection)

### T31: Build landing page - value propositions + feature grid
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `index.html` (modify)
- **Work:** Social proof bar. 3 value prop sections (Connect Everything, AI That Does Things, One Brain). Feature grid (2x3). Scroll-triggered reveal.
- **Size:** ~300 lines HTML/CSS
- **Deps:** T29
- **TDD:** N/A

### T32: Build landing page - pricing section
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `index.html` (modify)
- **Work:** 3-tier pricing table (Starter $12, Growth $25, Enterprise). Growth highlighted. Feature rows. CTAs. Hover elevation. Collapsible compare.
- **Size:** ~200 lines
- **Deps:** T29
- **TDD:** N/A

### T33: Build landing page - testimonials, bottom CTA, footer
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `index.html` (modify)
- **Work:** 3 testimonial cards. Bottom CTA with gradient. Footer: 4-column layout, social links.
- **Size:** ~200 lines
- **Deps:** T29
- **TDD:** N/A

---

## Group 7: Onboarding Wizard

### T34: Build onboarding step 1 - company profile
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `onboarding/step-1-company.html`
- **Work:** Full page, progress indicator (1/6). Form: company name, industry dropdown, company size. AI narration panel with typing animation. Step transition.
- **Size:** ~200 lines
- **Deps:** T02, T03, T06, T18

### T35: Build onboarding step 2 - department discovery
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `onboarding/step-2-departments.html`
- **Work:** AI-suggested departments based on industry. Department cards with toggle. Stagger animation. Custom department option.
- **Size:** ~250 lines
- **Deps:** T34, T07

### T36: Build onboarding step 3 - tool discovery
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `onboarding/step-3-tools.html`
- **Work:** 6 tool categories with dropdowns. Smart defaults based on industry. AI narration.
- **Size:** ~200 lines
- **Deps:** T34

### T37: Build onboarding step 4 - connect tools
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `onboarding/step-4-connect.html`
- **Work:** Grid of selected tools with Connect buttons. OAuth modal triggers. Connected status tracking. Skip options.
- **Size:** ~200 lines
- **Deps:** T24-T28

### T38: Build onboarding step 5 - AI scanning animation
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `onboarding/step-5-scanning.html`
- **Work:** Full-width scanning visualization. Data categories with typing animation. Department workspace cards materializing. Progress bar. 8-second animation.
- **Size:** ~250 lines
- **Deps:** T07, T18

### T39: Build onboarding step 6 - first insight reveal
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `onboarding/step-6-insight.html`
- **Work:** THE CLIMAX - split reveal. Left (55%): AI delivers 3 insights with typing. Right (45%): dashboard skeleton assembles. Follow-up input. Transition to dashboard.
- **Size:** ~300 lines
- **Deps:** T18, T07, T19

---

## Group 8: Existing Page Expansion

### T40: Expand dashboard - integrate shared components
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `dashboard.html` (modify)
- **Work:** Replace inline sidebar/command bar with shared components. Add nexus-tokens.css. Global state init. Skeleton loading.
- **Size:** ~100 lines modified
- **Deps:** T02, T06, T13, T14, T16

### T41: Expand dashboard - ROI widget + persona greeting
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `dashboard.html` (modify)
- **Work:** ROI widget card. Persona-aware greeting. Notification bell. My Work shortcut. Wire metrics to industry data.
- **Size:** ~120 lines
- **Deps:** T40, T07, T12

### T42: Expand dashboard - industry data binding + guided mode
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `dashboard.html` (modify), `tests/dashboard-data.test.js`
- **Work:** 13 components bind to active industry dataset. Guided mode highlights. Data binding functions per section.
- **Size:** ~150 lines + ~60 lines tests
- **Deps:** T41, T08-T11
- **TDD:** YES

### T43: Expand meetings page
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `meetings.html` (modify), `tests/meetings-data.test.js`
- **Work:** Integrate shared components. Functional filter chips. Industry-specific meetings. Persona-aware filtering.
- **Size:** ~120 lines + ~40 lines tests
- **Deps:** T06, T07, T12, T13
- **TDD:** YES

### T44: Expand meeting detail - AI chat integration
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `meeting-detail.html` (modify)
- **Work:** Integrate shared components. AI chat uses ai-chat.js. "Prep me" triggers Tier 1. Mode selector. Tool-use chips.
- **Size:** ~150 lines
- **Deps:** T23, T19, T20

### T45: Expand meeting detail - interactive actions
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `meeting-detail.html` (modify), `tests/meeting-actions.test.js`
- **Work:** Functional Approve/Reject buttons. Card animations. Action count updates. Industry data binding.
- **Size:** ~100 lines + ~50 lines tests
- **Deps:** T44
- **TDD:** YES

### T46: Expand actions page - functional filters
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `actions.html` (modify), `tests/actions-filters.test.js`
- **Work:** Integrate shared components. Functional filter chips. Industry-specific actions. Clickable meeting links.
- **Size:** ~120 lines + ~50 lines tests
- **Deps:** T06, T07, T13
- **TDD:** YES

### T47: Expand actions page - drag simulation + bulk actions
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `actions.html` (modify), `tests/actions-drag.test.js`
- **Work:** Lightweight drag simulation. Card shadow/rotation during drag. Drop zone highlights. Bulk actions confirmation.
- **Size:** ~120 lines + ~40 lines tests
- **Deps:** T46
- **TDD:** YES

---

## Group 9: New Core Pages

### T48: Build decisions page - editorial timeline view
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `decisions.html`, `tests/decisions-timeline.test.js`
- **Work:** Full page with shared components. Vertical editorial timeline. Decision entries with Playfair headings, rationale blocks, linked meetings/actions, AI annotations. AI summary card. Quick stats.
- **Size:** ~350 lines + ~40 lines tests
- **Deps:** T06, T07, T13
- **TDD:** YES

### T49: Build decisions page - table view + toggle
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `decisions.html` (modify), `tests/decisions-table.test.js`
- **Work:** Table view alternate. Toggle button. Sortable columns. Click row to expand. Filter bar.
- **Size:** ~200 lines + ~40 lines tests
- **Deps:** T48
- **TDD:** YES

### T50: Build proposals queue page
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `proposals.html`, `tests/proposals.test.js`
- **Work:** Notion-style inbox. Proposal cards with AI reasoning, urgency, Approve/Reject/Edit/Defer. Batch operations. Filters. AI summary.
- **Size:** ~350 lines + ~60 lines tests
- **Deps:** T06, T07, T13, T17
- **TDD:** YES

### T51: Build calendar page - week view
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `calendar.html`, `tests/calendar-week.test.js`
- **Work:** 7-column grid with hourly rows. Meeting blocks with workspace colors. AI annotation overlays. Action deadline markers. Today highlight.
- **Size:** ~300 lines + ~50 lines tests
- **Deps:** T06, T07, T13
- **TDD:** YES

### T52: Build calendar page - month view + shared elements
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `calendar.html` (modify), `tests/calendar-month.test.js`
- **Work:** Month grid. Color-coded dots. Click day to expand. Week/Month toggle. AI scheduling suggestions. Connected calendar indicator.
- **Size:** ~200 lines + ~40 lines tests
- **Deps:** T51
- **TDD:** YES

### T53: Build My Work page
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `my-work.html`, `tests/my-work.test.js`
- **Work:** My Actions grouped by workspace/due date. My Meetings with countdown. Decisions awaiting input. AI suggestions. My Stats card.
- **Size:** ~350 lines + ~50 lines tests
- **Deps:** T06, T07, T12, T13
- **TDD:** YES

---

## Group 10: Executive & AI Pages

### T54: Build ELT rollup - executive summary + department health
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `elt-rollup.html`, `tests/elt-rollup.test.js`
- **Work:** Executive summary card. Department health scores (4-column grid). CEO persona restriction.
- **Size:** ~300 lines + ~40 lines tests
- **Deps:** T06, T07, T12, T13
- **TDD:** YES

### T55: Build ELT rollup - dependency map + risk heat map
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `elt-rollup.html` (modify)
- **Work:** Cross-department dependency map. Risk heat map (2x2). Strategic decisions pending.
- **Size:** ~250 lines
- **Deps:** T54

### T56: Build agent dashboard page
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `agents.html`, `tests/agents.test.js`
- **Work:** Agent team overview. Active agents grid. Activity feed. Scheduled tasks.
- **Size:** ~400 lines + ~40 lines tests
- **Deps:** T06, T07, T13
- **TDD:** YES

### T57: Build agent marketplace page
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `marketplace.html`
- **Work:** Marketplace header with search/filters. 12 agent cards (3-column grid). Preview modal. Install shows "Coming Soon". Custom agent builder banner.
- **Size:** ~350 lines
- **Deps:** T06, T13, T15

### T58: Build connections page - tiles grid
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `connections.html`, `tests/connections.test.js`
- **Work:** Connections header. 8 connection tiles. Manage/Connect buttons. Connection state from OAuth module. Data flow visualization.
- **Size:** ~300 lines + ~40 lines tests
- **Deps:** T06, T13, T24
- **TDD:** YES

### T59: Build connections page - detail drawer
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `connections.html` (modify)
- **Work:** Manage click triggers detail drawer. Data preview, sync history, permission toggles, AI access, usage stats, actions.
- **Size:** ~200 lines
- **Deps:** T58, T15

### T60: Build settings page - profile + team + workspaces tabs
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `settings.html`
- **Work:** Tab navigation (6 tabs). Profile tab. Team & Roles tab. Workspaces tab.
- **Size:** ~350 lines
- **Deps:** T06, T13

### T61: Build settings page - billing + integrations + AI prefs tabs
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `settings.html` (modify)
- **Work:** Billing tab with usage bars. Integrations tab. AI Preferences tab (autonomy, notifications, privacy).
- **Size:** ~300 lines
- **Deps:** T60

---

## Group 11: Demo System

### T62: Create demo arc definitions
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `demo/arcs.js`, `tests/demo-arcs.test.js`
- **Work:** 5 arc definitions from DEMO-SPEC Section 5. Each: id, title, audience, story, steps array. Steps: page URL, narration, highlight selector, duration.
- **Size:** ~200 lines + ~40 lines tests
- **Deps:** T06
- **TDD:** YES

### T63: Build guided mode controller
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `demo/guided-mode.js`, `tests/guided-mode.test.js`
- **Work:** `startArc(arcId)`, `nextStep()`, `prevStep()`, `exitGuided()`. Step execution. Event emission. Keyboard shortcuts.
- **Size:** ~150 lines + ~80 lines tests
- **Deps:** T62, T06
- **TDD:** YES

### T64: Build demo control bar UI
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `demo/demo-bar.js`, `tests/demo-bar.test.js`
- **Work:** Fixed bottom bar (56px, backdrop-blur). Scene title, progress dots, prev/next, narration, scene selector, hide button. Ctrl+D toggle. Minimize to dot.
- **Size:** ~150 lines + ~60 lines tests
- **Deps:** T63
- **TDD:** YES

### T65: Build persona switcher UI
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `demo/persona-switcher.js`, `tests/persona-switcher.test.js`
- **Work:** Avatar dropdown in sidebar. 4 persona options. Switch animation. Ctrl+1/2/3/4. Integrates with persona.js.
- **Size:** ~100 lines + ~50 lines tests
- **Deps:** T12, T13
- **TDD:** YES

---

## Group 12: Server & Live AI

### T66: Build optional Express server
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `server/index.js`, `server/package.json`, `server/.env.example`
- **Work:** Express on port 3456. POST /api/chat proxying to Claude API. System prompt. CORS. API key via env var.
- **Size:** ~100 lines
- **Deps:** T06
- **TDD:** N/A

### T67: Build live mode client module
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `ai/live-mode.js`, `tests/live-mode.test.js`
- **Work:** `sendLiveQuery(message, context)`. Ctrl+Shift+L toggle. "LIVE" badge. Fallback to scripted. Timeout handling.
- **Size:** ~80 lines + ~40 lines tests
- **Deps:** T19, T66
- **TDD:** YES

---

## Group 13: Integration & Polish

### T68: Wire cross-page navigation
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** All HTML pages (modify)
- **Work:** Every page uses shared sidebar with correct active state. Consistent URL paths. Page transitions. Industry/persona persistence.
- **Size:** ~200 lines total
- **Deps:** T13, T06, all pages

### T69: Implement keyboard shortcut system
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** `components/keyboard.js`, `tests/keyboard.test.js`
- **Work:** Global shortcuts from DEMO-SPEC Appendix A. Demo mode shortcuts. Page-specific shortcuts. Conflict prevention in inputs.
- **Size:** ~100 lines + ~60 lines tests
- **Deps:** T14, T63, T65
- **TDD:** YES

### T70: Wire demo arcs end-to-end
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** `demo/guided-mode.js` (modify), all pages (minor)
- **Work:** All 5 arcs with correct highlights, narration, page transitions.
- **Size:** ~200 lines
- **Deps:** T62-T64, all pages

### T71: Industry switching integration
- **Status:** [ ] pending
- **Agent:** kraken
- **Files:** Multiple pages, `tests/industry-integration.test.js`
- **Work:** Verify all pages swap data correctly. Test preset URLs. Industry indicator in UI.
- **Size:** ~100 lines + ~80 lines tests
- **Deps:** T08-T11, all pages
- **TDD:** YES

### T72: Final animation polish + reduced motion
- **Status:** [ ] pending
- **Agent:** spark
- **Files:** Multiple pages (modify)
- **Work:** Verify all animations from DEMO-SPEC Section 11. Skeleton loading on every page. Number count-up. Stagger animations. Reduced motion compliance. Performance audit.
- **Size:** ~150 lines
- **Deps:** All pages

---

## Task Summary

| Group | Tasks | Description | TDD |
|-------|-------|-------------|-----|
| 0 | T01 | Test infrastructure | N/A |
| 1 | T02-T05 | CSS foundation (4 files) | N/A |
| 2 | T06-T12 | Core JS modules (7 modules) | YES |
| 3 | T13-T18 | Shared UI components (6 components) | YES |
| 4 | T19-T23 | AI response system (5 modules) | YES |
| 5 | T24-T28 | OAuth simulation (1 controller + 8 screens) | Partial |
| 6 | T29-T33 | Landing page (5 sections) | N/A |
| 7 | T34-T39 | Onboarding wizard (6 steps) | N/A |
| 8 | T40-T47 | Existing page expansion (8 tasks) | Partial |
| 9 | T48-T53 | New core pages (6 pages) | YES |
| 10 | T54-T61 | Executive & AI pages (8 tasks) | Partial |
| 11 | T62-T65 | Demo system (4 modules) | YES |
| 12 | T66-T67 | Server & live AI (2 tasks) | Partial |
| 13 | T68-T72 | Integration & polish (5 tasks) | Partial |
| **Total** | **72** | | **40 TDD** |

## Recommended Batch Order

1. **Batch 1:** T01
2. **Batch 2 (parallel):** T02, T03, T04, T05, T06, T09
3. **Batch 3 (parallel):** T07, T12, T13, T14, T15, T16, T17, T18
4. **Batch 4 (parallel):** T08, T10, T11, T19, T24
5. **Batch 5 (parallel):** T20, T21, T22, T23, T25, T26, T27, T28
6. **Batch 6 (parallel):** T29, T34, T40, T48, T54, T56, T62
7. **Batch 7 (parallel):** T30, T31, T35, T36, T41, T43, T44, T49, T50, T51, T53, T55, T57, T58, T60, T63
8. **Batch 8 (parallel):** T32, T33, T37, T38, T42, T45, T46, T47, T52, T59, T61, T64, T65, T66
9. **Batch 9 (parallel):** T39, T67
10. **Batch 10 (sequential):** T68, T69, T70, T71, T72

## Verification Checklist

After all tasks:
- [ ] `npm test` in nexus/ - all JS module tests pass
- [ ] Manual walkthrough of all 5 demo arcs
- [ ] Industry switching on every page
- [ ] Persona switching on every page
- [ ] Keyboard shortcut audit
- [ ] Reduced motion verification
- [ ] Animation performance (60fps target)
