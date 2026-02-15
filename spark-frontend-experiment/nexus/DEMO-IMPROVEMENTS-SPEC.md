# Demo Improvements Spec — Nexus Platform Polish

**Branch:** `demo-improvements`
**Quality Target:** Linear.app + Notion + Stripe Dashboard
**Success Signal:** Prospect asks "How does the AI work?"
**Viewport:** Desktop only (1280px+, optimized for 1440px)

---

## Visual Audit Summary (16 Pages)

### Current State
The platform is **functionally complete** — 16 pages, 20 components, 3 industry datasets, 1,161 tests. Content quality is strong (AI briefings, cross-workspace data, realistic scenarios). But visual polish falls short of the Linear/Notion bar across every page.

### Top 5 Cross-Cutting Gaps
1. **Cold palette** — Pure gray (#161618, #0C0C0E) with no warmth. Linear/Notion use warm grays.
2. **No micro-interactions** — Cards, buttons, nav items have no hover/active/focus states.
3. **No page transitions** — Hard cuts between routes. Need 150-200ms crossfade.
4. **AI not persistent** — AI chat only on meeting-detail + dashboard briefing. Should be everywhere.
5. **Sidebar not collapsible** — Fixed 192px. Need 240px default, 56px collapsed icon rail.

---

## 1. Theme & Design System

### Current
- Surface colors: #161618 (cold gray), #0C0C0E (near black)
- Accent: #4F46E5 (indigo) — fine, keep it
- Text: #EDEDEF / #8F8F94 / #6B6B70 — cold gray hierarchy
- No ambient warmth anywhere

### Target (Notion-dark warm)
- Surface: Shift from pure gray to warm gray (add amber undertones ~2-3%)
- New tokens: `--surface: #18181B` (zinc-900), `--surface-dark: #0E0E11` (warmer near-black)
- Text warmth: `--txt-primary: #F0EFED` (warm white), `--txt-secondary: #918F8A` (warm gray)
- Accent glow: Add subtle `--accent-glow: rgba(79, 70, 229, 0.06)` for card backgrounds
- Border warmth: `--border: #27272A` (zinc-800), `--border-hover: #3F3F46` (zinc-700)

### User Story
> As a CEO evaluating the product, I want the interface to feel premium and inviting (like Notion's dark mode), not cold and developer-tool-like.

### Files
- `styles/nexus-tokens.css` — All token updates
- Every page inherits changes automatically

---

## 2. Sidebar Overhaul

### Current
- Fixed ~192px width, not collapsible
- Nav items have active state (purple highlight) but no hover state
- Section labels (WORKSPACE, AI, ADMIN) are plain uppercase text
- Industry switcher at bottom-left is small and easy to miss
- AI Agent status + Toggle Theme + User info at bottom

### Target
- **Default open:** 240px with text labels
- **Collapsed:** 56px icon rail (icons only, tooltip on hover)
- **Toggle:** Collapse button at top or bottom of sidebar
- **Hover states:** Every nav item gets `background: var(--surface-elevated)` on hover
- **Section dividers:** Subtle 1px border between WORKSPACE / AI / ADMIN sections
- **Industry switcher:** Move to top of sidebar or header — more prominent with dropdown
- **Smooth animation:** 200ms ease-in-out for collapse/expand

### User Story
> As a demo presenter, I want to collapse the sidebar to give more screen real estate to the dashboard content during presentations.

### Files
- `components/sidebar.js` — Collapse logic, state persistence (localStorage)
- All pages that include sidebar — update container layout

---

## 3. Landing Page Redesign

### Current Issues (from audit)
- Generic hero: just text + 2 buttons on dark background
- No product screenshots or visual proof
- Logo bar is text-only (no actual brand logos)
- Dashboard mockup section is a static image with no animation
- "Connect Everything" hub-spoke diagram is basic SVG circles
- "AI That Actually Does Things" agent cards are okay but lack polish
- Pricing cards lack hover states
- Testimonial section has no photos/avatars
- CTA section uses purple gradient — fine but buttons are inconsistent
- No scroll animations anywhere
- Footer is sparse

### Target (Linear.app quality)
1. **Hero:** Add subtle gradient glow behind headline, animated typing effect or word rotation for key value prop
2. **Product screenshot:** Replace static mockup with a polished, slightly tilted browser frame showing the actual dashboard
3. **Logo bar:** Use SVG logos (or keep text but add subtle opacity animation on scroll-in)
4. **Feature sections:** Add scroll-triggered fade-in animations (IntersectionObserver, 150ms stagger)
5. **Agent cards:** Add glass-morphism card effect, subtle float animation
6. **Pricing:** Hover elevation on cards, "Most Popular" card slightly raised
7. **Testimonials:** Add avatar circles, subtle quote styling
8. **CTA:** Consistent button styling (primary = filled purple, secondary = outlined)
9. **Footer:** Add more links, social icons, newsletter signup

### User Story
> As a prospect visiting the landing page, I should immediately feel this is a premium, well-funded product — not a side project. The page should make me want to click "Start Free Trial" within 30 seconds.

### Files
- `index.html` — Full page markup restructure
- `styles/` — Landing-specific styles (may need new `landing.css`)

---

## 4. Onboarding Wizard

### Current Issues (from audit)
- 6 separate step pages with full-page navigation
- Duplicate step indicators (progress bar AND "STEP 1 OF 6" text AND dot indicators)
- Scrollbar visible in content area
- AI Assistant panel is basic
- Form fields lack focus/hover states
- No auto-fill capability
- No transitions between steps

### Target (Single-page wizard)
1. **Single page:** All 6 steps on one page, slide transition between them
2. **Progress:** One clean progress bar at top (remove duplicate indicators)
3. **Auto-fill:** "Quick Setup" button that populates demo data instantly
4. **AI companion:** Right-side panel with contextual guidance that updates per step
5. **Smooth transitions:** 300ms slide-left/right between steps
6. **Abstract connections:** Step for connecting tools should show animated "connecting..." → "Connected!" flow (no real OAuth)
7. **Skip to dashboard:** Prominent "Skip" that fills everything with defaults

### User Story
> As a demo attendee, I want to see the onboarding complete in under 30 seconds with auto-fill, showing how frictionless setup is.

### Files
- `onboarding.html` — Consolidate to single-page wizard
- `onboarding/step-*.html` — May be deprecated (logic moves to onboarding.html)
- `components/onboarding-wizard.js` — New step management component

---

## 5. AI Experience

### Current State
- AI chat panel only appears on `meeting-detail.html`
- Dashboard has "AI Morning Briefing" text section
- AI agent status shown in sidebar bottom ("AI Agent: Online")
- Proposals page shows AI-generated suggestions
- No persistent AI on other pages

### Target (AI as star feature)
1. **Persistent floating button:** Bottom-right of every page — expandable side panel
2. **"Ask AI anything" command bar:** Visible input at top of every page (exists as search bar — rebrand it)
3. **Cmd+K shortcut:** Opens command bar with AI focus
4. **Side panel:** 400px slide-in from right with chat interface
5. **Context-aware:** AI knows which page you're on and offers relevant insights
6. **Typing indicator:** Animated dots when AI is "thinking"
7. **Source citations:** Show which data sources AI used (already done well in meeting-detail)

### User Story
> As a CEO watching a demo, I want to be able to ask the AI a question on ANY page and get an intelligent, contextual response that makes me think "This is real AI, not a chatbot."

### Files
- `components/ai-chat.js` — Extract from meeting-detail, make persistent
- `components/ai-floating-button.js` — New component
- All pages — Include AI panel and floating button
- `ai/live-mode.js` — Serverless Claude proxy (future)

---

## 6. Command Bar (AI Entry Point)

### Current State
- Search bar exists on most pages: "Type a command or search..." / "Search meetings, attendees..."
- Cmd+K badge shown next to search
- Functions as search only — no AI integration visible

### Target
- **Rebrand:** "Ask AI anything or search..." as placeholder
- **Visual:** Add sparkle/AI icon prefix
- **Behavior:** Typing a question → routes to AI panel; typing a page name → navigates
- **Cmd+K:** Opens command palette overlay with recent commands, AI suggestions, navigation
- **Design:** Slightly more prominent — subtle glow border, increase from current minimal styling

### User Story
> As a user, I want one single input that does everything — search, navigate, and ask AI — like Notion's or Linear's command palette.

### Files
- `components/command-bar.js` — Rebrand + AI routing
- All pages with search bars

---

## 7. Dashboard Progressive Reveal

### Current
- All dashboard content loads at once — no animation
- AI Morning Briefing text appears instantly
- Stats cards appear instantly
- Priority Actions sidebar appears instantly

### Target
1. **Staggered reveal:** Elements appear one by one with 100ms stagger
2. **AI narration:** Morning briefing text types out word-by-word (typewriter effect)
3. **Stats counters:** Numbers count up from 0 (count-up animation)
4. **Cards:** Fade in + slight upward slide (translateY(8px) → 0)
5. **Priority sidebar:** Items slide in from right with stagger
6. **Trigger:** On page load, auto-play. Option to replay.

### User Story
> As a demo presenter showing the dashboard, I want the AI briefing to "type itself out" while stats animate in, creating a "wow" moment.

### Files
- `dashboard.html` — Add animation classes
- `components/page-init.js` — Progressive reveal logic
- `styles/animations.css` — New animation keyframes

---

## 8. Page Transitions

### Current
- Hard page-to-page navigation (full reload between HTML files)
- No transition effects

### Target
- **Crossfade:** 150-200ms opacity fade on page transitions
- **Implementation:** CSS `View Transitions API` or JS-based fade overlay
- **Sidebar persistence:** Sidebar should not re-render/flash during transitions
- **Fallback:** Instant navigation if View Transitions not supported

### User Story
> As a demo viewer, page changes should feel smooth and connected, not jarring.

### Files
- `components/page-init.js` — Add transition orchestration
- All pages — Include transition CSS
- `styles/transitions.css` — New file for transition keyframes

---

## 9. Micro-interactions

### Current
- Almost no hover states on cards (actions, meetings, decisions, proposals)
- No focus ring styling on form inputs
- No button press feedback
- No tooltip on sidebar items
- No card elevation on hover
- Checkboxes (My Work) have no visible hover state

### Target (every interactive element polished)

**Cards:**
- Hover: `border-color: var(--border-hover)`, `transform: translateY(-1px)`, subtle shadow
- Active: `transform: translateY(0)`, pressed feel
- Transition: `150ms ease`

**Buttons:**
- Primary: Hover brightens, active darkens, focus ring
- Secondary/Ghost: Hover shows background, active presses down
- Icon buttons: Hover shows circular background highlight

**Nav items:**
- Hover: Background highlight, slight text color brighten
- Active: Purple accent left border + background

**Form inputs:**
- Focus: Purple border glow (`box-shadow: 0 0 0 2px var(--accent-subtle)`)
- Hover: Border brightens

**Tooltips:**
- Sidebar collapsed: Tooltip shows label on hover
- Truncated text: Tooltip shows full text

### User Story
> As a detail-oriented buyer, I want every click, hover, and interaction to feel responsive and polished — this signals engineering quality.

### Files
- `styles/interactions.css` — New file for all hover/focus/active states
- `styles/nexus-tokens.css` — Add `--shadow-sm`, `--shadow-md` tokens
- All component files — Add hover/focus classes

---

## 10. Demo System

### Current
- Guided demo mode exists (`demo/guided-mode.js`)
- No persistent "Take a Tour" hint visible on pages

### Target
1. **Persistent hint:** Small "Guided Tour" pill/button fixed bottom-left (above sidebar footer)
2. **Tour steps:** Highlight key features with tooltip callouts
3. **Demo mode indicator:** Subtle "Demo Mode" badge when active
4. **Reset:** Quick "Reset Demo" option in settings or via command bar

### User Story
> As a prospect exploring on their own, I want a gentle "Take the Tour" hint that shows me the best features without being pushy.

### Files
- `demo/guided-mode.js` — Add persistent hint button
- All pages — Include tour hint component

---

## 11. Industry Switching

### Current
- Industry indicator at bottom of sidebar: "Industry: Consulting" with small dropdown
- Changing industry swaps demo data

### Target
1. **More prominent:** Move to header area or top of sidebar
2. **Visual:** Dropdown with industry icons and preview of what changes
3. **Instant switch:** Data swaps immediately with brief loading animation
4. **Industries:** Consulting (default), Restaurant, Technology
5. **Presenter tip:** "Match to your prospect" tooltip on first visit

### User Story
> As a sales rep doing a demo, I want to instantly switch the industry dataset to match my prospect so the demo feels personalized.

### Files
- `components/sidebar.js` — Move industry switcher
- `data/` — Industry datasets (already exist)

---

## 12. Page-Specific Fixes

### Settings (settings.html) — Lowest polish page
- Add proper form input styling (borders, focus states)
- Add profile picture placeholder (initials circle)
- Style "Save Changes" as proper button
- Style "Change Photo / Remove" as proper buttons
- Add section cards/containers for grouping
- Reduce excessive whitespace

### Marketplace (marketplace.html) — Theme inconsistency
- Currently uses light/white background — switch to dark theme to match platform
- Card grid needs dark theme styling
- Search bar needs dark theme styling
- Category filter needs pill/button styling

### Agents Dashboard (agents.html) — Theme inconsistency
- Mixed light/dark elements — standardize to dark theme
- Agent avatar letters need more distinctive styling
- Recent Activity timeline needs tighter spacing

### Workspaces (workspaces.html) — Sparse
- Large empty space below 6 cards — add activity feed or stats section
- Workspace icons (colored squares) could be more distinctive (rounded, gradient)
- Card hover states needed

### ELT Rollup (elt-rollup.html) — Needs executive presence
- Progress circles are clean but small — make them larger
- Add workspace-colored section headers
- Executive Intelligence text needs more visual weight (larger font, card container)

### Calendar (calendar.html) — Minor polish
- Event blocks need hover states
- Current time indicator line would help
- Month view needs implementation if toggle exists

---

## Verification Criteria

### After Phase 2-3 (Spec + Tasklist)
- [ ] Spec covers all 16 pages with specific issues
- [ ] Tasklist has prioritized items (P0/P1/P2)
- [ ] Every claim verified by visual inspection

### After Implementation
- [ ] All 1,161 existing tests pass (`npm test`)
- [ ] Visual check via Chrome on each modified page
- [ ] Money path flows: Landing → Onboarding → Dashboard (smooth, under 60s)
- [ ] AI chat responds on every page
- [ ] Sidebar collapses and expands smoothly
- [ ] Progressive reveal plays on dashboard load
- [ ] Page transitions are smooth (no flashes)
- [ ] Every interactive element has hover + focus states
