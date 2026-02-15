# Workbook Demo Platform - Product Requirements Document

> **Date:** 2026-02-14
> **Status:** Ready for review
> **Author:** David Hayes + Claude
> **Target:** Multi-audience demo (team, investors, customers)
> **Tech:** Static HTML + Tailwind CDN + vanilla JS modules + optional Express server
> **Design benchmark:** linear.app landing page quality
> **Design directives:** frontend-design plugin, ui-ux-pro-max skill, reactbits.dev, smoothui, NO CLAUDE SLOP

---

## 1. Problem Statement

The Nexus demo frontend has 4 static HTML prototypes (~30% functional). The team needs a fully interactive, multi-audience demo platform showing the complete Workbook proposition: purchase -> setup -> use -> AI value.

## 2. Product Summary

Interactive demo platform for "Workbook" - the AI layer for SMBs. 15+ pages, 3 industry scenarios, 4 personas, 5 guided demo arcs, tiered AI response system, platform-accurate OAuth mocks.

## 3. Target Users

- **Team demos** - Sales, partnerships, internal showcases
- **Investors** - Pitch meetings, board presentations
- **Customers** - Self-serve exploration, proof of concept

## 4. Key Capabilities

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

## 5. Technical Architecture

- Static HTML + Tailwind CDN + vanilla JS modules
- Optional Express server for live Claude API proxy
- Vitest + jsdom for testing JS modules
- File-based routing, localStorage for state persistence
- Desktop-only (1440px+)

### State Management (Vanilla JS)

```javascript
window.WorkbookDemo = {
  industry: 'consulting',           // consulting | tech | hospitality
  persona: 'ceo',                   // ceo | ops | engineering | new
  demoMode: 'free',                 // free | guided
  currentArc: null,                 // 1-5 when guided
  currentStep: 0,                   // step within arc
  aiMode: 'scripted',              // scripted | live
  theme: 'dark',                    // dark | light
  data: null,                       // loaded industry dataset
};
```

## 6. Existing Assets

- 4 HTML pages: dashboard.html (677L), meetings.html (579L), meeting-detail.html (708L), actions.html (778L)
- HANDOFF.md design system reference
- DEMO-SPEC.md full specification (1811 lines)

## 7. Design System

### Color Palette

```css
/* Surfaces */
--surface:         #161618;
--surface-dark:    #0C0C0E;
--surface-ai:      #14141A;
--surface-elevated: #1C1C1F;

/* Borders */
--border:          #232326;
--border-hover:    #2E2E32;

/* Text hierarchy */
--txt-primary:     #EDEDEF;
--txt-secondary:   #8F8F94;
--txt-tertiary:    #6B6B70;

/* Accent */
--accent:          #4F46E5;
--accent-hover:    #6366F1;
--accent-subtle:   rgba(79, 70, 229, 0.08);

/* Semantic */
--danger:          #DC2626;
--warning:         #D97706;
--success:         #059669;

/* Workspace colors */
--ws-ops:          #4F46E5;
--ws-elt:          #7C3AED;
--ws-mkt:          #D97706;
--ws-eng:          #059669;
--ws-sales:        #2563EB;
--ws-finance:      #DC2626;
--ws-hr:           #EC4899;

/* Landing page */
--landing-bg:       #08080A;
--landing-gradient: linear-gradient(180deg, #08080A 0%, #0C0C0E 100%);
--landing-glow:     radial-gradient(ellipse at center, rgba(79, 70, 229, 0.15), transparent 70%);
--landing-grid-dot: rgba(255, 255, 255, 0.03);
```

### Typography

```css
--font-heading: 'Playfair Display', Georgia, serif;
--font-body:    'Inter', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', monospace;

--text-3xl: 32px;  --text-2xl: 24px;  --text-xl: 20px;
--text-lg:  18px;  --text-base: 16px; --text-sm: 14px;
--text-xs:  12px;  --text-2xs: 11px;  --text-3xs: 10px;
--text-4xs: 9px;   --text-5xs: 8px;
```

### Spacing & Radius

```css
--space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
--space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;

--radius-sm: 4px; --radius-md: 6px; --radius-lg: 8px;
--radius-xl: 12px; --radius-full: 9999px;
```

## 8. What Gets Built

### Pages (15 total)

| # | Page | Status |
|---|------|--------|
| 1 | Landing Page (index.html) | NEW |
| 2 | Onboarding Wizard (6 steps) | NEW |
| 3 | Dashboard | EXPAND |
| 4 | Meetings Overview | EXPAND |
| 5 | Meeting Detail | EXPAND |
| 6 | Actions (Kanban) | EXPAND |
| 7 | Decisions | NEW |
| 8 | Proposals Queue | NEW |
| 9 | Calendar | NEW |
| 10 | My Work | NEW |
| 11 | ELT Rollup | NEW |
| 12 | Agent Dashboard | NEW |
| 13 | Agent Marketplace | NEW |
| 14 | Connections | NEW |
| 15 | Settings | NEW |

### JS Modules

- Global state management
- Industry data loader + 3 datasets (~450 data points)
- Persona state module
- AI response engine (3 tiers, 35 responses)
- OAuth modal controller + 8 platform screens
- Demo arc controller + 5 arcs
- Shared components: sidebar, command bar, drawer, skeleton, alert banner, animations

### File Structure

```
nexus/
  index.html
  dashboard.html, meetings.html, meeting-detail.html, actions.html
  decisions.html, proposals.html, calendar.html, my-work.html
  elt-rollup.html, agents.html, marketplace.html, connections.html, settings.html
  onboarding/step-{1-6}-*.html
  styles/nexus-tokens.css, animations.css, skeleton.css, oauth-screens.css
  components/state.js, sidebar.js, command-bar.js, detail-drawer.js, skeleton.js, alert-banner.js, animations.js, persona.js, industry.js, ai-chat.js, keyboard.js
  data/shared.js, consulting.js, tech.js, hospitality.js
  ai/response-engine.js, showcase-responses.js, category-responses.js, generic-templates.js, live-mode.js
  demo/arcs.js, guided-mode.js, demo-bar.js, persona-switcher.js
  oauth/modals.js, {salesforce,slack,microsoft,google,jira,hubspot,quickbooks,notion}.html
  server/index.js, package.json, .env.example
  tests/*.test.js
  package.json, vitest.config.js
```

## 9. Testing Strategy

- **40 tasks with TDD** (vitest + jsdom): All JS modules, data validation, state management, UI controllers
- **32 tasks without TDD**: HTML pages, CSS files, visual templates (verified by human review)

## 10. Performance Targets

| Metric | Target |
|--------|--------|
| Initial page load | < 1.5s |
| Page transition | < 300ms |
| AI response (scripted) | 500ms + typing |
| OAuth simulation | 5.5s total |
| Industry switch | < 500ms |
| Persona switch | < 400ms |

## 11. Full Specification Reference

Complete details for all pages, data templates, AI responses, animations, and more: see `DEMO-SPEC.md` (1811 lines).
