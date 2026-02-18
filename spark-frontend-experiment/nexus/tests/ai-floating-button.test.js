import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createContainer, cleanup } from './setup.js';

describe('AI Floating Button & Chat Panel', () => {
  let mod;
  let container;

  beforeEach(async () => {
    vi.resetModules();
    // Set a page title for context detection
    document.title = 'Dashboard | Workbook';
    window.location.pathname = '/dashboard.html';
    mod = await import('../components/ai-floating-button.js');
    // Reset internal state (auto-init may have fired on import)
    mod._reset();
    // Clean up any auto-injected elements
    document.querySelectorAll('[data-ai-fab],[data-ai-panel],[data-ai-overlay],[data-ai-fab-styles]').forEach(el => el.remove());
    container = createContainer();
  });

  afterEach(() => {
    cleanup();
    // Remove any injected elements from body
    const fab = document.querySelector('[data-ai-fab]');
    if (fab) fab.remove();
    const panel = document.querySelector('[data-ai-panel]');
    if (panel) panel.remove();
    const overlay = document.querySelector('[data-ai-overlay]');
    if (overlay) overlay.remove();
    const style = document.querySelector('[data-ai-fab-styles]');
    if (style) style.remove();
  });

  // ── Floating Button Tests ──────────────────────────────────

  describe('createFloatingButton', () => {
    it('returns a button element', () => {
      const btn = mod.createFloatingButton();
      expect(btn).toBeInstanceOf(HTMLElement);
      expect(btn.tagName).toBe('BUTTON');
    });

    it('has data-ai-fab attribute', () => {
      const btn = mod.createFloatingButton();
      expect(btn.hasAttribute('data-ai-fab')).toBe(true);
    });

    it('contains an AI icon (sparkle character or SVG)', () => {
      const btn = mod.createFloatingButton();
      // Should have either text content or an SVG child
      const hasContent = btn.textContent.trim().length > 0 || btn.querySelector('svg') !== null;
      expect(hasContent).toBe(true);
    });

    it('has aria-label for accessibility', () => {
      const btn = mod.createFloatingButton();
      expect(btn.getAttribute('aria-label')).toBeTruthy();
    });
  });

  // ── Chat Panel Tests ───────────────────────────────────────

  describe('createChatPanel', () => {
    it('returns a panel element with data-ai-panel attribute', () => {
      const panel = mod.createChatPanel();
      expect(panel).toBeInstanceOf(HTMLElement);
      expect(panel.hasAttribute('data-ai-panel')).toBe(true);
    });

    it('has a header with "Workbook AI" title', () => {
      const panel = mod.createChatPanel();
      const header = panel.querySelector('[data-ai-panel-header]');
      expect(header).not.toBeNull();
      expect(header.textContent).toContain('Workbook AI');
    });

    it('has a close button in the header', () => {
      const panel = mod.createChatPanel();
      const closeBtn = panel.querySelector('[data-ai-panel-close]');
      expect(closeBtn).not.toBeNull();
    });

    it('has a context indicator', () => {
      const panel = mod.createChatPanel();
      const ctx = panel.querySelector('[data-ai-context]');
      expect(ctx).not.toBeNull();
    });

    it('has a scrollable messages area', () => {
      const panel = mod.createChatPanel();
      const messages = panel.querySelector('[data-ai-messages]');
      expect(messages).not.toBeNull();
    });

    it('has a chat input with placeholder', () => {
      const panel = mod.createChatPanel();
      const input = panel.querySelector('[data-ai-input]');
      expect(input).not.toBeNull();
      expect(input.placeholder).toContain('Ask about this page');
    });

    it('starts hidden (off-screen)', () => {
      const panel = mod.createChatPanel();
      expect(panel.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ── Context Detection Tests ────────────────────────────────

  describe('detectPageContext', () => {
    it('returns "Dashboard" for dashboard page', () => {
      document.title = 'Dashboard | Workbook';
      window.location.pathname = '/dashboard.html';
      expect(mod.detectPageContext()).toBe('Dashboard');
    });

    it('returns "Meetings" for meetings page', () => {
      document.title = 'Meetings | Workbook';
      window.location.pathname = '/meetings.html';
      expect(mod.detectPageContext()).toBe('Meetings');
    });

    it('returns "Actions" for actions page', () => {
      document.title = 'Actions | Workbook';
      window.location.pathname = '/actions.html';
      expect(mod.detectPageContext()).toBe('Actions');
    });

    it('returns "Decisions" for decisions page', () => {
      document.title = 'Decisions | Workbook';
      window.location.pathname = '/decisions.html';
      expect(mod.detectPageContext()).toBe('Decisions');
    });

    it('returns generic context for unknown pages', () => {
      document.title = 'Settings | Workbook';
      window.location.pathname = '/settings.html';
      const ctx = mod.detectPageContext();
      expect(ctx).toBeTruthy();
      // Should not be one of the known pages
      expect(['Dashboard', 'Meetings', 'Actions', 'Decisions']).not.toContain(ctx);
    });
  });

  // ── Contextual Messages Tests ──────────────────────────────

  describe('getContextualMessages', () => {
    it('returns array of messages', () => {
      const msgs = mod.getContextualMessages('Dashboard');
      expect(Array.isArray(msgs)).toBe(true);
      expect(msgs.length).toBeGreaterThanOrEqual(1);
    });

    it('dashboard messages mention overdue or workspace', () => {
      const msgs = mod.getContextualMessages('Dashboard');
      const text = msgs.map(m => m.text).join(' ').toLowerCase();
      expect(text).toMatch(/overdue|workspace|analyz/i);
    });

    it('meetings messages mention meetings or briefing', () => {
      const msgs = mod.getContextualMessages('Meetings');
      const text = msgs.map(m => m.text).join(' ').toLowerCase();
      expect(text).toMatch(/meeting|briefing|prep/i);
    });

    it('actions messages mention actions or overdue', () => {
      const msgs = mod.getContextualMessages('Actions');
      const text = msgs.map(m => m.text).join(' ').toLowerCase();
      expect(text).toMatch(/action|overdue/i);
    });

    it('decisions messages mention decisions or review', () => {
      const msgs = mod.getContextualMessages('Decisions');
      const text = msgs.map(m => m.text).join(' ').toLowerCase();
      expect(text).toMatch(/decision|review/i);
    });

    it('unknown pages get generic help message', () => {
      const msgs = mod.getContextualMessages('Settings');
      const text = msgs.map(m => m.text).join(' ').toLowerCase();
      expect(text).toMatch(/help|ask/i);
    });

    it('each message has role and text properties', () => {
      const msgs = mod.getContextualMessages('Dashboard');
      msgs.forEach(msg => {
        expect(msg).toHaveProperty('role');
        expect(msg).toHaveProperty('text');
        expect(msg.role).toBe('ai');
      });
    });
  });

  // ── Open/Close State Tests ─────────────────────────────────

  describe('open/close behavior', () => {
    it('openPanel sets aria-hidden to false on panel', () => {
      const panel = mod.createChatPanel();
      document.body.appendChild(panel);
      mod.openPanel(panel);
      expect(panel.getAttribute('aria-hidden')).toBe('false');
    });

    it('closePanel sets aria-hidden to true on panel', () => {
      const panel = mod.createChatPanel();
      document.body.appendChild(panel);
      mod.openPanel(panel);
      mod.closePanel(panel);
      expect(panel.getAttribute('aria-hidden')).toBe('true');
    });

    it('openPanel populates context indicator', () => {
      document.title = 'Actions | Workbook';
      window.location.pathname = '/actions.html';
      const panel = mod.createChatPanel();
      document.body.appendChild(panel);
      mod.openPanel(panel);
      const ctx = panel.querySelector('[data-ai-context]');
      expect(ctx.textContent).toContain('Actions');
    });

    it('openPanel populates initial messages if messages area is empty', () => {
      const panel = mod.createChatPanel();
      document.body.appendChild(panel);
      mod.openPanel(panel);
      const messages = panel.querySelector('[data-ai-messages]');
      expect(messages.children.length).toBeGreaterThan(0);
    });

    it('openPanel does not re-populate messages if already has content', () => {
      const panel = mod.createChatPanel();
      document.body.appendChild(panel);
      // Open once to populate
      mod.openPanel(panel);
      const messages = panel.querySelector('[data-ai-messages]');
      const initialCount = messages.children.length;
      // Close and re-open
      mod.closePanel(panel);
      mod.openPanel(panel);
      expect(messages.children.length).toBe(initialCount);
    });
  });

  // ── Typing Indicator Tests ─────────────────────────────────

  describe('typing indicator', () => {
    it('showTyping adds a thinking indicator to messages area', () => {
      const panel = mod.createChatPanel();
      document.body.appendChild(panel);
      mod.showTyping(panel);
      const indicator = panel.querySelector('[data-ai-typing]');
      expect(indicator).not.toBeNull();
    });

    it('showTyping creates 3 animated dots', () => {
      const panel = mod.createChatPanel();
      document.body.appendChild(panel);
      mod.showTyping(panel);
      const dots = panel.querySelectorAll('[data-ai-typing] [data-dot]');
      expect(dots.length).toBe(3);
    });

    it('hideTyping removes the indicator', () => {
      const panel = mod.createChatPanel();
      document.body.appendChild(panel);
      mod.showTyping(panel);
      mod.hideTyping(panel);
      const indicator = panel.querySelector('[data-ai-typing]');
      expect(indicator).toBeNull();
    });
  });

  // ── Styles Injection Tests ─────────────────────────────────

  describe('injectStyles', () => {
    it('injects a style element into the document head', () => {
      mod.injectStyles();
      const style = document.querySelector('[data-ai-fab-styles]');
      expect(style).not.toBeNull();
      expect(style.tagName).toBe('STYLE');
    });

    it('does not duplicate styles on multiple calls', () => {
      mod.injectStyles();
      mod.injectStyles();
      const styles = document.querySelectorAll('[data-ai-fab-styles]');
      expect(styles.length).toBe(1);
    });

    it('includes pulse animation keyframes', () => {
      mod.injectStyles();
      const style = document.querySelector('[data-ai-fab-styles]');
      expect(style.textContent).toContain('@keyframes');
      expect(style.textContent.toLowerCase()).toContain('pulse');
    });

    it('includes panel slide animation', () => {
      mod.injectStyles();
      const style = document.querySelector('[data-ai-fab-styles]');
      expect(style.textContent).toContain('translateX');
    });
  });

  // ── Integration: init() wires everything ───────────────────

  describe('init', () => {
    it('creates and appends the floating button to body', () => {
      mod.init();
      const fab = document.querySelector('[data-ai-fab]');
      expect(fab).not.toBeNull();
      expect(document.body.contains(fab)).toBe(true);
    });

    it('creates and appends the chat panel to body', () => {
      mod.init();
      const panel = document.querySelector('[data-ai-panel]');
      expect(panel).not.toBeNull();
      expect(document.body.contains(panel)).toBe(true);
    });

    it('creates and appends an overlay for click-outside-to-close', () => {
      mod.init();
      const overlay = document.querySelector('[data-ai-overlay]');
      expect(overlay).not.toBeNull();
    });

    it('clicking the fab opens the panel', () => {
      mod.init();
      const fab = document.querySelector('[data-ai-fab]');
      const panel = document.querySelector('[data-ai-panel]');
      fab.click();
      expect(panel.getAttribute('aria-hidden')).toBe('false');
    });

    it('clicking close button closes the panel', () => {
      mod.init();
      const fab = document.querySelector('[data-ai-fab]');
      const panel = document.querySelector('[data-ai-panel]');
      fab.click(); // open
      const closeBtn = panel.querySelector('[data-ai-panel-close]');
      closeBtn.click();
      expect(panel.getAttribute('aria-hidden')).toBe('true');
    });

    it('clicking overlay closes the panel', () => {
      mod.init();
      const fab = document.querySelector('[data-ai-fab]');
      const panel = document.querySelector('[data-ai-panel]');
      const overlay = document.querySelector('[data-ai-overlay]');
      fab.click(); // open
      overlay.click();
      expect(panel.getAttribute('aria-hidden')).toBe('true');
    });

    it('injects styles automatically', () => {
      mod.init();
      const style = document.querySelector('[data-ai-fab-styles]');
      expect(style).not.toBeNull();
    });

    it('does not init twice (idempotent)', () => {
      mod.init();
      mod.init();
      const fabs = document.querySelectorAll('[data-ai-fab]');
      expect(fabs.length).toBe(1);
    });
  });

  // ── Meeting-detail exclusion ───────────────────────────────

  describe('shouldShow', () => {
    it('returns true for normal pages', () => {
      window.location.pathname = '/dashboard.html';
      expect(mod.shouldShow()).toBe(true);
    });

    it('returns false for meeting-detail page (has inline AI chat)', () => {
      window.location.pathname = '/meeting-detail.html';
      expect(mod.shouldShow()).toBe(false);
    });
  });
});
