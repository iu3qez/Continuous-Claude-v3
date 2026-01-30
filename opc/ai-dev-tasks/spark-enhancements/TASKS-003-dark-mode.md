# TASKS-003: Dark Mode Theme Support - Implementation Tasks

**Feature:** Dark Mode Theme Support
**PRD:** PRD-003-dark-mode.md
**Created:** 2026-01-21

---

## Phase 1: Setup & Dependencies (Day 1)

### Dependencies

- [ ] **TASK-D001**: Install next-themes library
  - Install `next-themes` package
  - Command: `pnpm add next-themes`
  - **Files**: `apps/web/package.json`
  - **Dependencies**: None
  - **Complexity**: S
  - **Acceptance**: Package appears in package.json, installs successfully

### Provider Setup

- [ ] **TASK-D002**: Create Providers component
  - Create ThemeProvider wrapper
  - Configure attribute="class", defaultTheme="system", enableSystem
  - **Files**: `apps/web/app/providers.tsx` (new)
  - **Dependencies**: TASK-D001
  - **Complexity**: S
  - **Acceptance**: ThemeProvider wraps children correctly

- [ ] **TASK-D003**: Integrate Providers into root layout
  - Import Providers in app/layout.tsx
  - Wrap {children} with Providers
  - **Files**: `apps/web/app/layout.tsx`
  - **Dependencies**: TASK-D002
  - **Complexity**: S
  - **Acceptance**: Providers wraps entire app, no errors

---

## Phase 2: FOUC Prevention (Day 1)

### Script Injection

- [ ] **TASK-D004**: Add FOUC prevention script
  - Inject inline script in head to check localStorage theme
  - Add "dark" class to html before first paint if needed
  - Handle "system" preference detection
  - **Files**: `apps/web/app/layout.tsx` or custom _document if needed
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: No flash of wrong theme on page load

- [ ] **TASK-D005**: Test FOUC prevention across scenarios
  - Test with light preference set
  - Test with dark preference set
  - Test with system preference (both OS modes)
  - Test with no preference (should default to system)
  - **Files**: N/A (testing task)
  - **Dependencies**: TASK-D004
  - **Complexity**: S
  - **Acceptance**: No FOUC in any scenario

---

## Phase 3: Theme Toggle Component (Days 2-3)

### Component Creation

- [ ] **TASK-D006**: Create ThemeToggle component
  - Button or dropdown for theme selection
  - Three options: Light, Dark, System
  - Icons: Sun (light), Moon (dark), Monitor (system)
  - **Files**: `apps/web/components/ui/theme-toggle.tsx` (new)
  - **Dependencies**: TASK-D001
  - **Complexity**: M
  - **Acceptance**: Component renders, shows current theme

- [ ] **TASK-D007**: Implement theme switching logic
  - Use `useTheme` hook from next-themes
  - Handle theme change on selection
  - Update icon to reflect current theme
  - **Files**: `apps/web/components/ui/theme-toggle.tsx`
  - **Dependencies**: TASK-D006
  - **Complexity**: S
  - **Acceptance**: Clicking changes theme immediately

### Toggle UI Options

- [ ] **TASK-D008**: Implement toggle UI (choose one approach)
  - **Option A**: Icon button that cycles Light → Dark → System
  - **Option B**: Dropdown with explicit three options
  - **Option C**: Segmented control (three buttons)
  - **Files**: `apps/web/components/ui/theme-toggle.tsx`
  - **Dependencies**: TASK-D006
  - **Complexity**: M
  - **Acceptance**: Chosen approach works, theme changes correctly

### Header Integration

- [ ] **TASK-D009**: Add ThemeToggle to header/nav
  - Place in header next to user menu
  - Visible on all authenticated pages
  - **Files**: `apps/web/components/layout/Header.tsx` or nav component
  - **Dependencies**: TASK-D006
  - **Complexity**: S
  - **Acceptance**: Toggle visible in header on all pages

---

## Phase 4: CSS Variable Audit (Days 3-4)

### Globals Verification

- [ ] **TASK-D010**: Verify CSS variables in globals.css
  - Confirm all color variables defined for light and dark modes
  - Check `:root` and `.dark` selectors
  - **Files**: `apps/web/app/globals.css`
  - **Dependencies**: None
  - **Complexity**: S
  - **Acceptance**: All color variables present for both themes

- [ ] **TASK-D011**: Verify Tailwind darkMode config
  - Confirm `darkMode: ["class"]` in tailwind.config.ts
  - **Files**: `apps/web/tailwind.config.ts` or `tailwind.config.js`
  - **Dependencies**: None
  - **Complexity**: S
  - **Acceptance**: darkMode class strategy configured

### Component Audit

- [ ] **TASK-D012**: Audit shadcn components for dark mode support
  - Check all installed shadcn components
  - Verify they use CSS variables (should already support dark mode)
  - Test components in dark mode
  - **Files**: `apps/web/components/ui/*`
  - **Dependencies**: TASK-D010
  - **Complexity**: M
  - **Acceptance**: All shadcn components render correctly in dark mode

- [ ] **TASK-D013**: Audit custom components for hardcoded colors
  - Search for hardcoded hex/rgb colors (e.g., `bg-white`, `text-black`)
  - Replace with CSS variable equivalents or `dark:` variants
  - **Files**: All custom components in `apps/web/components/`
  - **Dependencies**: TASK-D010
  - **Complexity**: L
  - **Acceptance**: No hardcoded colors, all components use variables or dark variants

---

## Phase 5: Transition Animation (Day 4)

### CSS Transitions

- [ ] **TASK-D014**: Add theme transition CSS
  - Add transition on root element for color properties
  - Duration: 200ms, easing: ease-in-out
  - Properties: background-color, color, border-color
  - **Files**: `apps/web/app/globals.css`
  - **Dependencies**: None
  - **Complexity**: S
  - **Acceptance**: Theme changes animate smoothly, no jarring color jumps

- [ ] **TASK-D015**: Test transition performance
  - Verify transition is smooth (no lag)
  - Check for any visual glitches
  - **Files**: N/A (testing task)
  - **Dependencies**: TASK-D014
  - **Complexity**: S
  - **Acceptance**: Transition is smooth on all browsers

---

## Phase 6: Special Component Handling (Day 5)

### Tiptap Editor

- [ ] **TASK-D016**: Audit Tiptap editor dark mode styling
  - Check editor background, text color, toolbar
  - Ensure readable in dark mode
  - **Files**: Tiptap editor components
  - **Dependencies**: TASK-D010
  - **Complexity**: M
  - **Acceptance**: Tiptap editor readable and usable in dark mode

- [ ] **TASK-D017**: Fix Tiptap editor dark mode issues (if any)
  - Add `dark:` variants or CSS variables to editor styles
  - Test all editor features in dark mode
  - **Files**: Tiptap editor CSS or component files
  - **Dependencies**: TASK-D016
  - **Complexity**: M
  - **Acceptance**: Editor fully functional and styled correctly in dark mode

### Charts/Graphs (if present)

- [ ] **TASK-D018**: Audit charts/graphs for dark mode (if applicable)
  - Check if any data visualization components exist
  - Ensure colors contrast correctly in dark mode
  - **Files**: Chart components (if any)
  - **Dependencies**: TASK-D010
  - **Complexity**: S
  - **Acceptance**: Charts readable in dark mode (or N/A if no charts)

---

## Phase 7: Accessibility (Day 6)

### Color Contrast

- [ ] **TASK-D019**: Verify WCAG AA contrast ratios in dark mode
  - Test text on background (4.5:1 for normal text)
  - Test UI elements on background (3:1 for large text, UI)
  - Use contrast checker tool
  - **Files**: `apps/web/app/globals.css` (adjust if needed)
  - **Dependencies**: TASK-D010
  - **Complexity**: M
  - **Acceptance**: All text/UI meets WCAG AA standards in dark mode

- [ ] **TASK-D020**: Fix contrast issues (if found)
  - Adjust CSS variable values for dark mode
  - Re-test after changes
  - **Files**: `apps/web/app/globals.css`
  - **Dependencies**: TASK-D019
  - **Complexity**: S
  - **Acceptance**: All contrast issues resolved

### Focus Indicators

- [ ] **TASK-D021**: Verify focus indicators visible in dark mode
  - Test focus rings on buttons, inputs, links
  - Ensure visible against dark backgrounds
  - **Files**: `apps/web/app/globals.css` or component styles
  - **Dependencies**: TASK-D010
  - **Complexity**: S
  - **Acceptance**: Focus indicators visible in dark mode

---

## Phase 8: Mobile & Responsive (Day 6)

### Mobile Testing

- [ ] **TASK-D022**: Test theme toggle on mobile viewport
  - Verify toggle works on small screens
  - Check if toggle is accessible (not hidden/cut off)
  - **Files**: N/A (testing task)
  - **Dependencies**: TASK-D009
  - **Complexity**: S
  - **Acceptance**: Toggle works on mobile, accessible

- [ ] **TASK-D023**: Test dark mode on all page types (mobile)
  - Test meetings, actions, decisions pages on mobile
  - Verify no layout/styling issues
  - **Files**: N/A (testing task)
  - **Dependencies**: TASK-D013
  - **Complexity**: S
  - **Acceptance**: All pages render correctly in dark mode on mobile

---

## Phase 9: System Preference Integration (Day 7)

### System Detection

- [ ] **TASK-D024**: Verify system preference detection
  - Test "System" mode follows OS dark mode setting
  - Change OS preference while app open, verify it updates
  - **Files**: N/A (testing task - next-themes handles this)
  - **Dependencies**: TASK-D002
  - **Complexity**: S
  - **Acceptance**: "System" mode matches OS, updates when OS changes

- [ ] **TASK-D025**: Test default theme for new users
  - Clear localStorage, verify default is "system"
  - Confirm it matches OS preference on first visit
  - **Files**: N/A (testing task)
  - **Dependencies**: TASK-D002
  - **Complexity**: S
  - **Acceptance**: New users default to system preference

---

## Phase 10: Cross-Browser Testing (Day 8)

### Browser Compatibility

- [ ] **TASK-D026**: Test dark mode on Chrome
  - Verify theme toggle works
  - Check all pages render correctly
  - Test FOUC prevention
  - **Files**: N/A (testing task)
  - **Dependencies**: All previous tasks
  - **Complexity**: S
  - **Acceptance**: Dark mode works perfectly on Chrome

- [ ] **TASK-D027**: Test dark mode on Firefox
  - Same tests as Chrome
  - **Files**: N/A (testing task)
  - **Dependencies**: All previous tasks
  - **Complexity**: S
  - **Acceptance**: Dark mode works perfectly on Firefox

- [ ] **TASK-D028**: Test dark mode on Safari
  - Same tests as Chrome
  - Check for Safari-specific issues
  - **Files**: N/A (testing task)
  - **Dependencies**: All previous tasks
  - **Complexity**: S
  - **Acceptance**: Dark mode works perfectly on Safari

- [ ] **TASK-D029**: Test dark mode on Edge
  - Same tests as Chrome
  - **Files**: N/A (testing task)
  - **Dependencies**: All previous tasks
  - **Complexity**: S
  - **Acceptance**: Dark mode works perfectly on Edge

---

## Phase 11: Documentation & Cleanup (Day 8)

### Documentation

- [ ] **TASK-D030**: Document theme system in README (if needed)
  - Explain how to add dark mode support to new components
  - Document CSS variable naming convention
  - **Files**: `apps/web/README.md` or `docs/dark-mode.md` (if requested)
  - **Dependencies**: All previous tasks
  - **Complexity**: S
  - **Acceptance**: Documentation exists and is clear (if requested by user)

### Cleanup

- [ ] **TASK-D031**: Remove any theme-related debugging code
  - Remove console.logs, test components
  - Clean up commented code
  - **Files**: All theme-related files
  - **Dependencies**: All previous tasks
  - **Complexity**: S
  - **Acceptance**: No debug code remains

---

## Phase 12: Optional Enhancements (Day 9+)

### Profile Sync (Optional)

- [ ] **TASK-D032**: Sync theme preference to user profile (optional)
  - Store theme preference in database user settings
  - Sync across devices when user logs in
  - **Files**: User settings API, database schema
  - **Dependencies**: All previous tasks
  - **Complexity**: M
  - **Acceptance**: Theme preference syncs across devices

### Public Pages (Optional)

- [ ] **TASK-D033**: Add theme support to public/marketing pages (optional)
  - Extend theme toggle to unauthenticated pages
  - Test marketing site in dark mode
  - **Files**: Public page layouts
  - **Dependencies**: TASK-D002
  - **Complexity**: M
  - **Acceptance**: Public pages support dark mode

---

## Summary

### Total Task Count: 33 (31 required, 2 optional)

### Breakdown by Complexity
- **S (Small)**: 23 tasks
- **M (Medium)**: 9 tasks
- **L (Large)**: 1 task
- **XL (Extra Large)**: 0 tasks

### Estimated Timeline
- **Phase 1 (Setup)**: Day 1 (3 tasks)
- **Phase 2 (FOUC)**: Day 1 (2 tasks)
- **Phase 3 (Toggle)**: Days 2-3 (4 tasks)
- **Phase 4 (Audit)**: Days 3-4 (4 tasks)
- **Phase 5 (Transition)**: Day 4 (2 tasks)
- **Phase 6 (Components)**: Day 5 (3 tasks)
- **Phase 7 (Accessibility)**: Day 6 (3 tasks)
- **Phase 8 (Mobile)**: Day 6 (2 tasks)
- **Phase 9 (System)**: Day 7 (2 tasks)
- **Phase 10 (Browsers)**: Day 8 (4 tasks)
- **Phase 11 (Docs)**: Day 8 (2 tasks)
- **Phase 12 (Optional)**: Day 9+ (2 tasks)

**Total Duration**: 8 days (1.5 weeks for required tasks)

### Suggested Priority Order
1. Phase 1 (setup foundation)
2. Phase 2 (FOUC prevention - critical UX)
3. Phase 3 (toggle component - user-facing)
4. Phase 4 (audit - find issues)
5. Phase 5 (transition - polish)
6. Phase 6 (fix issues found in audit)
7. Phase 7, 8, 9 (accessibility, mobile, system)
8. Phase 10 (cross-browser testing)
9. Phase 11 (cleanup)
10. Phase 12 (optional enhancements)

### Critical Path
```
TASK-D001 → TASK-D002 → TASK-D003 → TASK-D004 → TASK-D006 → TASK-D009
```

Setup dependencies, providers, FOUC prevention, and toggle component are critical. Other tasks can be done in parallel after these.

### Quick Win Path
For a minimal viable dark mode in 1-2 days:
1. TASK-D001, D002, D003 (setup)
2. TASK-D004, D005 (FOUC)
3. TASK-D006, D007, D009 (toggle)
4. TASK-D010, D011 (verify CSS)
5. Quick test on a few pages

Then iterate with audit, fixes, and polish.

---

**Ready for implementation**: Begin with Phase 1 (setup).
