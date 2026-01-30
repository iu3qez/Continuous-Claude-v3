# PRD-003: Dark Mode Theme Support

**Version:** 1.0
**Created:** 2026-01-21
**Status:** Draft
**Priority:** Medium

---

## Executive Summary

Enable platform-wide dark mode support by implementing a theme toggle mechanism. The CSS foundation already exists (CSS variables in globals.css, Tailwind darkMode: ["class"]), requiring only the toggle UI component, preference persistence, and system preference detection to complete the feature.

---

## Problem Statement

Despite having CSS variables configured for dark mode theming, users cannot switch to dark mode because:

- **No toggle mechanism** - No UI element to switch between light and dark themes
- **No preference persistence** - Even if toggled, preference would not survive page reload
- **No system integration** - Does not respect users OS-level dark mode preference
- **User discomfort** - Users working in low-light environments experience eye strain

---

## User Stories

| ID | Role | Story | Priority |
|----|------|-------|----------|
| US-1 | Any User | I want to toggle between light and dark mode so I can use the app comfortably in any lighting | Must Have |
| US-2 | Any User | I want my theme preference to be remembered so I do not have to set it each visit | Must Have |
| US-3 | Any User | I want the app to default to my system preference so it matches my other applications | Must Have |
| US-4 | Any User | I want a smooth transition when switching themes so the change is not jarring | Should Have |
| US-5 | Any User | I want all components to be properly styled in dark mode without visual glitches | Must Have |

---

## Functional Requirements

### FR-1: Theme Toggle

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-1.1 | Theme toggle button in header | Visible on all authenticated pages |
| FR-1.2 | Three states: Light, Dark, System | Dropdown or segmented control |
| FR-1.3 | Immediate visual feedback on toggle | Theme changes without page reload |
| FR-1.4 | Icon indicates current/selected mode | Sun, Moon, or Monitor icons |

### FR-2: Preference Persistence

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-2.1 | Store preference in localStorage | Key: "theme", Values: "light" "dark" "system" |
| FR-2.2 | Load preference on app initialization | Before first paint to avoid flash |
| FR-2.3 | Sync preference to user profile (optional) | Preference follows user across devices |
| FR-2.4 | Default to "system" for new users | Respects OS preference out of the box |

### FR-3: System Preference Detection

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-3.1 | Detect prefers-color-scheme media query | Match OS dark mode setting |
| FR-3.2 | Listen for system preference changes | Update theme if system changes while app open |
| FR-3.3 | "System" option follows OS changes | Real-time response to OS toggle |

### FR-4: Theme Application

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|---------------------|
| FR-4.1 | Add "dark" class to html element for dark mode | Tailwind dark: prefix activates |
| FR-4.2 | Smooth transition animation (150-300ms) | CSS transition on color properties |
| FR-4.3 | No flash of unstyled content (FOUC) | Script in head blocks render until theme set |
| FR-4.4 | All shadcn components properly themed | Audit for dark mode support |

---

## Non-Functional Requirements

| Category | Requirement | Target |
|----------|-------------|--------|
| Accessibility | Color contrast in dark mode | WCAG 2.1 AA (4.5:1 text, 3:1 UI) |
| Performance | Theme switch latency | < 100ms perceived |
| Performance | No FOUC on page load | Theme applied before paint |
| UX | Transition smoothness | No jarring color jumps |
| Compatibility | Browser support | All modern browsers (Chrome, Firefox, Safari, Edge) |

---

## UI/UX Specifications

### Toggle Location Options

**Option A: Header Icon Button (Recommended)**
```
+------------------------------------------------------------------+
| SPARK          [Meetings] [Actions] [Decisions]     [Theme] [User]|
+------------------------------------------------------------------+
```
- Click cycles: Light -> Dark -> System -> Light
- Hold/hover shows dropdown for direct selection

**Option B: Settings Page Only**
- Theme selector in user settings
- Less discoverable but cleaner header

**Option C: Header Dropdown**
- Explicit dropdown with three options
- Clearer but takes more space

### Transition Animation

- **Duration:** 200ms
- **Properties:** background-color, color, border-color
- **Easing:** ease-in-out
- **Scope:** Apply transition to root element, components inherit

### Icons

- **Light mode:** Sun icon
- **Dark mode:** Moon icon
- **System mode:** Monitor/desktop icon

---

## Technical Approach

### Implementation Options

**Option 1: next-themes Library (Recommended)**

Pros:
- Battle-tested, handles edge cases
- SSR-safe, prevents FOUC
- System preference detection built-in
- 2KB gzipped

Implementation:
```typescript
// app/providers.tsx
import { ThemeProvider } from 'next-themes'

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

**Option 2: Manual Implementation**

Pros:
- No additional dependency
- Full control

Cons:
- Must handle FOUC prevention manually
- More code to maintain

### Component Structure

```
apps/web/
├── app/
│   ├── providers.tsx            # ThemeProvider wrapper
│   └── layout.tsx               # Import providers
├── components/
│   └── ui/
│       └── theme-toggle.tsx     # Toggle button component
```

### CSS Considerations

**Existing Setup (verified in recon):**
- `globals.css` has CSS variables for colors
- `tailwind.config.ts` has `darkMode: ["class"]`
- shadcn components support dark mode via CSS variables

**Required:**
- Audit all custom components for dark mode support
- Add `dark:` variants where CSS variables are not used
- Test Tiptap editor dark mode styling

### FOUC Prevention

```html
<\!-- In app/layout.tsx or _document.tsx -->
<script>
  (function() {
    const theme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === 'dark' || (theme === 'system' && systemDark) || (\!theme && systemDark)) {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```

---

## Frontend Design Stack

### Required Tools
- **shadcn MCP:** Component discovery (DropdownMenu, Button)
- **shadcn-create Skill:** Ensure theme-aware component styling

### Component Requirements
- `Button` - Toggle trigger
- `DropdownMenu` - Theme selection (if using dropdown approach)
- Icons from Lucide: Sun, Moon, Monitor

### Dependencies

| Package | Purpose |
|---------|---------|
| next-themes | Theme management (recommended) |
| lucide-react | Icons (already installed) |

---

## Acceptance Criteria

- [ ] Theme toggle visible in header on all authenticated pages
- [ ] Clicking toggle switches between light, dark, and system modes
- [ ] Theme preference persists in localStorage
- [ ] New users default to system preference
- [ ] "System" mode follows OS dark mode setting
- [ ] Theme changes when OS preference changes (system mode)
- [ ] No flash of wrong theme on page load
- [ ] Transition animation is smooth (200ms)
- [ ] All pages render correctly in dark mode
- [ ] All shadcn components properly themed
- [ ] Tiptap editor readable in dark mode
- [ ] Color contrast meets WCAG AA standards
- [ ] Toggle works on mobile viewport

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Dark mode adoption | 0% | 30% of users | Analytics (track theme preference) |
| User satisfaction | N/A | 4+ rating | In-app feedback |
| Accessibility complaints | Baseline TBD | -50% | Support tickets |

---

## Implementation Checklist

1. [ ] Install next-themes (or implement manual solution)
2. [ ] Create ThemeProvider wrapper
3. [ ] Add FOUC prevention script
4. [ ] Create ThemeToggle component
5. [ ] Add toggle to header/nav
6. [ ] Audit all pages for dark mode styling
7. [ ] Fix any components with hardcoded colors
8. [ ] Test Tiptap/editor dark mode
9. [ ] Verify WCAG contrast ratios
10. [ ] Test across browsers

---

## Open Questions

- [ ] Should theme preference sync to user profile (cross-device)?
- [ ] Add theme to public marketing pages or authenticated only?
- [ ] Consider "auto" vs explicit "system" naming for clarity?
