# Demo Improvements — Tasklist

**Branch:** `demo-improvements`
**Spec:** `DEMO-IMPROVEMENTS-SPEC.md`

Priority: P0 (money path) > P1 (core app) > P2 (full platform)
Complexity: S (< 1hr) | M (1-3hr) | L (3-8hr)

---

## P0 — Theme & Design System

### T01: Warm dark palette token update
- **Priority:** P0 | **Complexity:** S
- **Files:** `styles/nexus-tokens.css`
- **Description:** Shift surface/text/border tokens from cold gray to warm gray (zinc-based). Add shadow tokens.
- **Changes:**
  - `--surface: #18181B` (from #161618)
  - `--surface-dark: #0E0E11` (from #0C0C0E)
  - `--surface-elevated: #1F1F23` (from #1C1C1F)
  - `--border: #27272A` (from #232326)
  - `--border-hover: #3F3F46` (from #2E2E32)
  - `--txt-primary: #F0EFED` (from #EDEDEF)
  - `--txt-secondary: #918F8A` (from #8F8F94)
  - `--txt-tertiary: #6E6D69` (from #6B6B70)
  - Add `--shadow-sm`, `--shadow-md`, `--shadow-lg`
  - Add `--accent-glow: rgba(79, 70, 229, 0.06)`
- **Acceptance:** All pages visibly warmer. No broken contrast. Tests pass.
- **Dependencies:** None (foundation task — do this first)

### T02: Global micro-interaction CSS
- **Priority:** P0 | **Complexity:** M
- **Files:** `styles/interactions.css` (new), all pages (link new CSS)
- **Description:** Create shared CSS for hover/focus/active states on cards, buttons, nav items, form inputs.
- **Changes:**
  - Card hover: `border-color` change + `translateY(-1px)` + subtle shadow
  - Button hover/active/focus states for primary, secondary, ghost variants
  - Form input focus: purple glow ring
  - Nav item hover: background highlight
  - Transition: `150ms ease` on all interactive elements
- **Acceptance:** Every card, button, input, and nav item responds to hover/focus/active.
- **Dependencies:** T01 (uses new shadow/border tokens)

---

## P0 — Sidebar

### T03: Collapsible sidebar
- **Priority:** P0 | **Complexity:** L
- **Files:** `components/sidebar.js`, all pages with sidebar
- **Description:** Make sidebar collapse from 240px (with labels) to 56px (icon rail). Persist state in localStorage.
- **Changes:**
  - Add collapse/expand toggle button
  - Icon-only mode at 56px with tooltips on hover
  - 200ms ease-in-out animation
  - Main content area adjusts width
  - Section labels hidden when collapsed
  - User info condensed to avatar-only when collapsed
- **Acceptance:** Click toggle → sidebar smoothly collapses. Hover icon → tooltip shows label. State persists across page nav.
- **Dependencies:** T01, T02

### T04: Industry switcher prominence
- **Priority:** P0 | **Complexity:** S
- **Files:** `components/sidebar.js`
- **Description:** Move industry switcher from bottom-left to top of sidebar or header. Make it a styled dropdown.
- **Changes:**
  - Move above nav section or into header bar
  - Add industry icon/color indicator
  - Styled dropdown with industry names + descriptions
  - "Match to your prospect" tooltip for first-time use
- **Acceptance:** Industry switcher is immediately visible when page loads. Switching changes data instantly.
- **Dependencies:** T03

---

## P0 — Landing Page

### T05: Landing page hero redesign
- **Priority:** P0 | **Complexity:** L
- **Files:** `index.html`, landing-specific styles
- **Description:** Redesign hero section to Linear.app quality with gradient glow, better typography weight, and product screenshot.
- **Changes:**
  - Add radial gradient glow behind headline
  - Increase headline font size and weight
  - Add subtle animated element (gradient shift, word rotation, or typing effect)
  - Add polished product screenshot in browser frame below CTAs
  - Improve CTA button contrast and sizing
  - "Now in Public Beta" badge → more prominent animated pill
- **Acceptance:** Above-the-fold creates instant "premium product" impression. Screenshot shows actual dashboard.
- **Dependencies:** T01

### T06: Landing page scroll animations
- **Priority:** P0 | **Complexity:** M
- **Files:** `index.html`, `styles/animations.css` (new or extend)
- **Description:** Add IntersectionObserver-based fade-in animations to all landing page sections.
- **Changes:**
  - Each section fades in + slides up on scroll
  - 100ms stagger between elements within sections
  - Logo bar subtle opacity animation
  - Feature cards fade in sequentially
  - Agent cards with glass-morphism hover effect
  - Pricing cards with hover elevation
- **Acceptance:** Scrolling through landing page feels dynamic and polished. No janky/flickering animations.
- **Dependencies:** T05

### T07: Landing page content polish
- **Priority:** P0 | **Complexity:** M
- **Files:** `index.html`
- **Description:** Polish remaining landing page sections: testimonials (add avatars), pricing (hover states), footer (more links), CTA consistency.
- **Changes:**
  - Testimonials: Add avatar circles with initials or placeholder images
  - Pricing cards: Hover elevation, consistent button styling
  - CTA section: Consistent primary/secondary button styling
  - Footer: Add social links, more product/company links
  - Logo bar: Better spacing and subtle styling
- **Acceptance:** Every section feels intentional and polished. No "template" feel anywhere.
- **Dependencies:** T05, T06

---

## P0 — Onboarding

### T08: Single-page onboarding wizard
- **Priority:** P0 | **Complexity:** L
- **Files:** `onboarding.html`, `components/onboarding-wizard.js` (new or refactor)
- **Description:** Consolidate 6-step onboarding into single page with slide transitions.
- **Changes:**
  - All steps rendered on one page, only one visible at a time
  - Single progress bar at top (remove duplicate indicators)
  - 300ms slide transition between steps
  - "Quick Setup" auto-fill button that populates demo data
  - AI companion panel updates contextually per step
  - Abstract connection flow (animated "connecting..." → "Connected!")
  - "Skip to Dashboard" prominent option
- **Acceptance:** Onboarding completes in <30s with auto-fill. Transitions are smooth. No scrollbar visible.
- **Dependencies:** T01, T02

---

## P0 — Dashboard

### T09: Dashboard progressive reveal
- **Priority:** P0 | **Complexity:** M
- **Files:** `dashboard.html`, `components/page-init.js`
- **Description:** Animate dashboard elements appearing one-by-one on page load.
- **Changes:**
  - AI Morning Briefing: Typewriter text effect (word-by-word)
  - Stats cards: Count-up animation (0 → 23, 0 → 8, etc.)
  - Cards: Fade in + slide up with 100ms stagger
  - Priority Actions sidebar: Items slide in from right
  - Overdue Actions: Cards fade in sequentially
  - Option to replay animation
- **Acceptance:** Dashboard load creates a "wow" moment. AI briefing types itself out. Numbers count up.
- **Dependencies:** T01, T02

---

## P0 — AI Experience

### T10: Persistent AI floating button
- **Priority:** P0 | **Complexity:** M
- **Files:** `components/ai-floating-button.js` (new), `components/ai-chat.js`, all pages
- **Description:** Add floating AI button (bottom-right) to every page that opens a slide-in chat panel.
- **Changes:**
  - Floating button: 48px circle, accent color, AI icon, subtle pulse animation
  - Click → 400px panel slides in from right
  - Panel reuses existing ai-chat component from meeting-detail
  - Context-aware: panel knows which page user is on
  - Close button + click-outside-to-close
  - Typing indicator animation
- **Acceptance:** AI button visible on every page. Click opens chat panel. Panel provides contextual responses.
- **Dependencies:** T02, T03

### T11: Command bar AI rebrand
- **Priority:** P0 | **Complexity:** S
- **Files:** `components/command-bar.js`, all pages with search bars
- **Description:** Rebrand search bar as "Ask AI anything or search..." with AI icon prefix.
- **Changes:**
  - Placeholder text: "Ask AI anything or search..."
  - Add sparkle/AI icon prefix
  - Subtle accent glow on focus
  - Cmd+K opens command palette overlay
  - Natural language queries route to AI panel
- **Acceptance:** Search bar clearly communicates it's an AI entry point. Cmd+K works.
- **Dependencies:** T10

---

## P1 — Page Transitions

### T12: Global page transitions
- **Priority:** P1 | **Complexity:** M
- **Files:** `components/page-init.js`, `styles/transitions.css` (new), all pages
- **Description:** Add 150-200ms crossfade between page navigations.
- **Changes:**
  - On link click: fade out current content (100ms)
  - Navigate to new page
  - Fade in new content (100ms)
  - Sidebar stays persistent (no flash)
  - Use View Transitions API where supported, JS fallback elsewhere
- **Acceptance:** Navigating between any two pages feels smooth. No white flash or jarring cut.
- **Dependencies:** T01

---

## P1 — Core App Pages

### T13: Meeting pages polish
- **Priority:** P1 | **Complexity:** M
- **Files:** `meetings.html`, `meeting-detail.html`
- **Description:** Add hover states to meeting cards, improve prep indicator visibility, polish AI chat panel.
- **Changes:**
  - Meeting list cards: hover elevation + border highlight
  - Prep indicators: larger progress bars, color-coded (green/yellow/red)
  - Meeting detail: Chat input styling improvement
  - Mode chips: more visible styling
  - Filter pills: proper active state (filled vs outlined)
- **Acceptance:** Meeting cards respond to hover. Prep indicators are immediately legible. Chat input feels polished.
- **Dependencies:** T01, T02

### T14: Actions board polish
- **Priority:** P1 | **Complexity:** S
- **Files:** `actions.html`
- **Description:** Add hover states to kanban cards, improve column header visual weight, polish AI annotation styling.
- **Changes:**
  - Kanban cards: hover elevation + border highlight
  - Column headers: larger font weight, subtle background
  - Priority badges: consistent sizing and color
  - "AI: High impact..." annotation: styled as distinct AI insight
  - Board/List toggle: more visible active state
- **Acceptance:** Kanban feels interactive. Column headers have clear visual hierarchy.
- **Dependencies:** T01, T02

### T15: Decisions page polish
- **Priority:** P1 | **Complexity:** S
- **Files:** `decisions.html`
- **Description:** Add card hover states, tighten spacing, improve AI annotation visibility.
- **Changes:**
  - Decision cards: hover border highlight
  - Timeline dots: slightly larger, animation on scroll-in
  - AI annotations (green text): styled as distinct insight cards
  - Tighter vertical spacing between cards
  - Timeline/Table toggle: better active state
- **Acceptance:** Timeline feels polished. AI insights are visually distinct from user content.
- **Dependencies:** T01, T02

### T16: Proposals page polish
- **Priority:** P1 | **Complexity:** S
- **Files:** `proposals.html`
- **Description:** Add hover states, expansion animation for "Why this suggestion", button polish.
- **Changes:**
  - Proposal rows: hover background highlight
  - "Why this suggestion": smooth expand/collapse animation
  - Approve/Reject/Defer buttons: hover states, visual feedback on click
  - Priority dots: slightly larger with tooltip
- **Acceptance:** Approving/rejecting proposals feels responsive. Expansion animation is smooth.
- **Dependencies:** T01, T02

---

## P1 — Demo System

### T17: Persistent tour hint
- **Priority:** P1 | **Complexity:** S
- **Files:** `demo/guided-mode.js`, all pages
- **Description:** Add subtle "Guided Tour" pill button visible on every page.
- **Changes:**
  - Small pill/button: "Take Tour" or "Guided Tour" text
  - Position: Bottom-left area (above sidebar footer) or floating
  - Dismissible (hides after first tour or explicit dismiss)
  - Click starts guided tour with tooltip callouts on key features
  - "Demo Mode" badge shown when tour is active
- **Acceptance:** Tour hint visible but not intrusive. Tour highlights 5-7 key features across pages.
- **Dependencies:** T10

---

## P2 — Full Platform Pages

### T18: Settings page restyle
- **Priority:** P2 | **Complexity:** M
- **Files:** `settings.html`
- **Description:** Complete restyle — currently the lowest polish page in the platform.
- **Changes:**
  - Profile picture: Add initials avatar placeholder
  - Form inputs: Add borders, backgrounds, focus states
  - "Save Changes": Styled as proper primary button
  - "Change Photo / Remove": Styled as secondary/ghost buttons
  - Tab navigation: Add underline active indicator, hover states
  - Section grouping: Add card containers around form sections
  - Reduce excessive whitespace
- **Acceptance:** Settings page looks like it belongs in the same app as dashboard. All inputs have proper styling.
- **Dependencies:** T01, T02

### T19: Marketplace dark theme fix
- **Priority:** P2 | **Complexity:** M
- **Files:** `marketplace.html`
- **Description:** Fix light/white background — switch entirely to dark theme.
- **Changes:**
  - Background: Switch to `var(--surface-dark)`
  - Card backgrounds: `var(--surface-elevated)`
  - Text colors: Use `var(--txt-primary/secondary/tertiary)`
  - Search bar: Dark theme styling
  - Category filters: Pill/button styling with dark theme
  - Card hover states
  - Star ratings: Gold on dark
- **Acceptance:** Marketplace matches the dark theme of every other page. No white backgrounds anywhere.
- **Dependencies:** T01

### T20: Agents dashboard dark theme fix
- **Priority:** P2 | **Complexity:** S
- **Files:** `agents.html`
- **Description:** Fix mixed light/dark elements, standardize to dark theme.
- **Changes:**
  - Ensure all backgrounds use dark theme tokens
  - Agent avatars: Add gradient or glow effect
  - Tighten Recent Activity timeline spacing
  - Status dots: Slightly larger
  - Progress bars: Consistent styling
- **Acceptance:** Agent dashboard fully dark themed. No visual inconsistency with other pages.
- **Dependencies:** T01

### T21: Workspaces page enrichment
- **Priority:** P2 | **Complexity:** S
- **Files:** `workspaces.html`
- **Description:** Fill empty space below cards, polish workspace icons.
- **Changes:**
  - Workspace icons: Rounded corners with gradient
  - Card hover states
  - Below cards: Add "Recent Activity" feed or workspace stats section
  - Active/Inactive badge styling improvement
- **Acceptance:** Page doesn't feel empty. Cards are interactive.
- **Dependencies:** T01, T02

### T22: ELT Rollup executive polish
- **Priority:** P2 | **Complexity:** S
- **Files:** `elt-rollup.html`
- **Description:** Enhance executive presence — larger progress circles, better AI summary styling.
- **Changes:**
  - Progress circles: 20% larger
  - Department section headers: Workspace-colored accent
  - Executive Intelligence section: Larger font, card container
  - "CEO View Only" badge: More prominent styling
- **Acceptance:** Page feels appropriately executive/premium.
- **Dependencies:** T01

### T23: Calendar polish
- **Priority:** P2 | **Complexity:** S
- **Files:** `calendar.html`
- **Description:** Add hover states to events, current time indicator.
- **Changes:**
  - Event blocks: Hover highlights with slight elevation
  - Current time: Red horizontal line across the grid
  - Event click: Subtle active state feedback
- **Acceptance:** Calendar events respond to hover. Current time is visible.
- **Dependencies:** T01, T02

### T24: My Work / Connections minor polish
- **Priority:** P2 | **Complexity:** S
- **Files:** `my-work.html`, `connections.html`
- **Description:** Minor interaction polish on both pages.
- **Changes:**
  - My Work: Checkbox hover state, task row hover highlight
  - Connections: Card hover states, data flow diagram improvements
- **Acceptance:** Both pages respond to hover interactions consistently with rest of app.
- **Dependencies:** T01, T02

---

## Implementation Order

### Wave 1: Foundation (T01, T02)
Token update + micro-interaction CSS. Everything else depends on this.

### Wave 2: Money Path (T03, T04, T05, T06, T07, T08, T09, T10, T11)
Sidebar, landing page, onboarding, dashboard, AI experience. This is the demo flow.

### Wave 3: Core App (T12, T13, T14, T15, T16, T17)
Page transitions, meetings/actions/decisions/proposals polish, demo system.

### Wave 4: Full Platform (T18, T19, T20, T21, T22, T23, T24)
Settings, marketplace, agents, workspaces, ELT rollup, calendar, my-work, connections.

---

## Verification Checklist

After each wave:
- [ ] `npm test` passes (all 1,161 tests)
- [ ] Visual check via Chrome on modified pages
- [ ] No broken layouts at 1280px and 1440px viewports
- [ ] No accessibility regressions (contrast ratios maintained)
- [ ] Git commit per logical unit
