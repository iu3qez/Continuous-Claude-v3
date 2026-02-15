import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createContainer, cleanup } from './setup.js';

describe('Tour Hint - Persistent Guided Tour Button', () => {
  let mod;
  let container;

  beforeEach(async () => {
    vi.resetModules();
    localStorage.clear();
    // Clean up any leftover tour hint elements
    document.querySelectorAll(
      '[data-tour-hint],[data-tour-hint-styles],[data-demo-badge]'
    ).forEach(el => el.remove());
    mod = await import('../components/tour-hint.js');
    mod._reset();
    container = createContainer();
  });

  afterEach(() => {
    cleanup();
    document.querySelectorAll(
      '[data-tour-hint],[data-tour-hint-styles],[data-demo-badge]'
    ).forEach(el => el.remove());
  });

  // ── createTourHintButton ──────────────────────────────────

  describe('createTourHintButton', () => {
    it('returns a button element', () => {
      const btn = mod.createTourHintButton();
      expect(btn).toBeInstanceOf(HTMLElement);
      expect(btn.tagName).toBe('BUTTON');
    });

    it('has data-tour-hint attribute', () => {
      const btn = mod.createTourHintButton();
      expect(btn.hasAttribute('data-tour-hint')).toBe(true);
    });

    it('displays "Guided Tour" text', () => {
      const btn = mod.createTourHintButton();
      expect(btn.textContent).toContain('Guided Tour');
    });

    it('has aria-label for accessibility', () => {
      const btn = mod.createTourHintButton();
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });

    it('has the tour-hint-pill CSS class', () => {
      const btn = mod.createTourHintButton();
      expect(btn.classList.contains('tour-hint-pill')).toBe(true);
    });
  });

  // ── Dismissal via localStorage ──────────────────────────────

  describe('dismissal persistence', () => {
    it('isDismissed returns false when never dismissed', () => {
      expect(mod.isDismissed()).toBe(false);
    });

    it('dismiss sets localStorage flag', () => {
      mod.dismiss();
      expect(localStorage.getItem('nexus-tour-dismissed')).toBe('true');
    });

    it('isDismissed returns true after dismiss()', () => {
      mod.dismiss();
      expect(mod.isDismissed()).toBe(true);
    });

    it('isDismissed returns true if localStorage already has flag', () => {
      localStorage.setItem('nexus-tour-dismissed', 'true');
      expect(mod.isDismissed()).toBe(true);
    });
  });

  // ── Demo Mode Badge ─────────────────────────────────────────

  describe('demo mode badge', () => {
    it('showDemoBadge adds a badge element to the body', () => {
      mod.showDemoBadge();
      const badge = document.querySelector('[data-demo-badge]');
      expect(badge).not.toBeNull();
    });

    it('badge displays "Demo Mode" text', () => {
      mod.showDemoBadge();
      const badge = document.querySelector('[data-demo-badge]');
      expect(badge.textContent).toContain('Demo Mode');
    });

    it('hideDemoBadge removes the badge', () => {
      mod.showDemoBadge();
      mod.hideDemoBadge();
      const badge = document.querySelector('[data-demo-badge]');
      expect(badge).toBeNull();
    });

    it('showDemoBadge is idempotent', () => {
      mod.showDemoBadge();
      mod.showDemoBadge();
      const badges = document.querySelectorAll('[data-demo-badge]');
      expect(badges.length).toBe(1);
    });
  });

  // ── Style Injection ─────────────────────────────────────────

  describe('injectTourStyles', () => {
    it('injects a style element with data-tour-hint-styles', () => {
      mod.injectTourStyles();
      const style = document.querySelector('[data-tour-hint-styles]');
      expect(style).not.toBeNull();
      expect(style.tagName).toBe('STYLE');
    });

    it('is idempotent - does not duplicate styles', () => {
      mod.injectTourStyles();
      mod.injectTourStyles();
      const styles = document.querySelectorAll('[data-tour-hint-styles]');
      expect(styles.length).toBe(1);
    });

    it('includes tour-hint-pill class styles', () => {
      mod.injectTourStyles();
      const style = document.querySelector('[data-tour-hint-styles]');
      expect(style.textContent).toContain('tour-hint-pill');
    });

    it('includes demo-badge styles', () => {
      mod.injectTourStyles();
      const style = document.querySelector('[data-tour-hint-styles]');
      expect(style.textContent).toContain('demo-badge');
    });

    it('positions pill button in bottom-left area', () => {
      mod.injectTourStyles();
      const style = document.querySelector('[data-tour-hint-styles]');
      // Should be positioned fixed bottom-left, not conflicting with AI FAB (bottom-right)
      expect(style.textContent).toContain('bottom');
      expect(style.textContent).toContain('left');
    });
  });

  // ── init() Integration ──────────────────────────────────────

  describe('init', () => {
    it('creates and appends the tour hint button to body', () => {
      mod.init();
      const btn = document.querySelector('[data-tour-hint]');
      expect(btn).not.toBeNull();
      expect(document.body.contains(btn)).toBe(true);
    });

    it('injects styles automatically', () => {
      mod.init();
      const style = document.querySelector('[data-tour-hint-styles]');
      expect(style).not.toBeNull();
    });

    it('does not render button if tour was previously dismissed', () => {
      localStorage.setItem('nexus-tour-dismissed', 'true');
      mod.init();
      const btn = document.querySelector('[data-tour-hint]');
      expect(btn).toBeNull();
    });

    it('is idempotent - does not create duplicate buttons', () => {
      mod.init();
      mod.init();
      const buttons = document.querySelectorAll('[data-tour-hint]');
      expect(buttons.length).toBe(1);
    });

    it('clicking the button starts the guided tour (arc 1)', () => {
      // We need to mock startArc since it's from guided-mode.js
      const startArcMock = vi.fn().mockReturnValue(true);
      mod._setStartArc(startArcMock);
      mod.init();
      const btn = document.querySelector('[data-tour-hint]');
      btn.click();
      expect(startArcMock).toHaveBeenCalledWith(1);
    });

    it('clicking the button shows the demo mode badge', () => {
      const startArcMock = vi.fn().mockReturnValue(true);
      mod._setStartArc(startArcMock);
      mod.init();
      const btn = document.querySelector('[data-tour-hint]');
      btn.click();
      const badge = document.querySelector('[data-demo-badge]');
      expect(badge).not.toBeNull();
    });

    it('clicking the button hides the tour hint pill', () => {
      const startArcMock = vi.fn().mockReturnValue(true);
      mod._setStartArc(startArcMock);
      mod.init();
      const btn = document.querySelector('[data-tour-hint]');
      btn.click();
      // The button should be hidden after clicking
      expect(btn.style.display).toBe('none');
    });
  });

  // ── Dismiss button (X) ─────────────────────────────────────

  describe('dismiss button', () => {
    it('tour hint pill has a dismiss/close element', () => {
      mod.init();
      const btn = document.querySelector('[data-tour-hint]');
      const dismissEl = btn.querySelector('[data-tour-dismiss]');
      expect(dismissEl).not.toBeNull();
    });

    it('clicking dismiss hides the pill and sets localStorage', () => {
      mod.init();
      const btn = document.querySelector('[data-tour-hint]');
      const dismissEl = btn.querySelector('[data-tour-dismiss]');
      dismissEl.click();
      expect(btn.style.display).toBe('none');
      expect(localStorage.getItem('nexus-tour-dismissed')).toBe('true');
    });

    it('dismiss click does not start the tour', () => {
      const startArcMock = vi.fn().mockReturnValue(true);
      mod._setStartArc(startArcMock);
      mod.init();
      const dismissEl = document.querySelector('[data-tour-dismiss]');
      dismissEl.click();
      expect(startArcMock).not.toHaveBeenCalled();
    });
  });

  // ── onTourEnd callback ──────────────────────────────────────

  describe('onTourEnd', () => {
    it('hides demo badge when tour ends', () => {
      mod.init();
      mod.showDemoBadge();
      mod.onTourEnd();
      const badge = document.querySelector('[data-demo-badge]');
      expect(badge).toBeNull();
    });

    it('marks tour as dismissed after completing', () => {
      mod.init();
      mod.onTourEnd();
      expect(mod.isDismissed()).toBe(true);
    });
  });
});
