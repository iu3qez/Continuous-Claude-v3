import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDrawer,
  openDrawer,
  closeDrawer,
  setDrawerContent,
  setDrawerTitle,
  isDrawerOpen,
} from '../components/detail-drawer.js';

describe('Detail Drawer', () => {
  let drawer;

  beforeEach(() => {
    drawer = createDrawer({ title: 'Test' });
    document.body.appendChild(drawer);
  });

  afterEach(() => {
    // Clean up any drawers and backdrops left in the DOM
    document.querySelectorAll('.detail-drawer').forEach((el) => el.remove());
    document.querySelectorAll('.drawer-backdrop').forEach((el) => el.remove());
  });

  describe('createDrawer', () => {
    it('returns a drawer DOM element', () => {
      const d = createDrawer({ title: 'Test' });
      expect(d).toBeInstanceOf(HTMLElement);
      expect(d.className).toContain('detail-drawer');
    });

    it('has default width of 400px', () => {
      const d = createDrawer({ title: 'Test' });
      expect(d.style.width).toBe('400px');
    });

    it('accepts custom width', () => {
      const d = createDrawer({ title: 'Wide', width: 600 });
      expect(d.style.width).toBe('600px');
    });

    it('displays the provided title', () => {
      const d = createDrawer({ title: 'My Title' });
      const titleEl = d.querySelector('.drawer-title');
      expect(titleEl).not.toBeNull();
      expect(titleEl.textContent).toBe('My Title');
    });

    it('has a close button', () => {
      const d = createDrawer({ title: 'Test' });
      const closeBtn = d.querySelector('.drawer-close');
      expect(closeBtn).not.toBeNull();
    });

    it('has a content area', () => {
      const d = createDrawer({ title: 'Test' });
      const content = d.querySelector('.drawer-content');
      expect(content).not.toBeNull();
    });

    it('starts hidden (translated off-screen)', () => {
      const d = createDrawer({ title: 'Test' });
      expect(d.style.transform).toBe('translateX(100%)');
    });
  });

  describe('openDrawer', () => {
    it('sets drawer to visible (translateX(0))', () => {
      openDrawer(drawer);
      // jsdom does not normalize unitless 0 to 0px in transform values
      expect(drawer.style.transform).toBe('translateX(0)');
    });

    it('creates a backdrop overlay', () => {
      openDrawer(drawer);
      const backdrop = document.querySelector('.drawer-backdrop');
      expect(backdrop).not.toBeNull();
    });
  });

  describe('closeDrawer', () => {
    it('sets drawer to hidden (translateX(100%))', () => {
      openDrawer(drawer);
      closeDrawer(drawer);
      expect(drawer.style.transform).toBe('translateX(100%)');
    });

    it('removes the backdrop', () => {
      openDrawer(drawer);
      closeDrawer(drawer);
      const backdrop = document.querySelector('.drawer-backdrop');
      expect(backdrop).toBeNull();
    });
  });

  describe('backdrop click closes drawer', () => {
    it('clicking backdrop closes the drawer', () => {
      openDrawer(drawer);
      const backdrop = document.querySelector('.drawer-backdrop');
      backdrop.click();
      expect(drawer.style.transform).toBe('translateX(100%)');
      expect(document.querySelector('.drawer-backdrop')).toBeNull();
    });
  });

  describe('Escape key closes drawer', () => {
    it('pressing Escape closes the drawer', () => {
      openDrawer(drawer);
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
      expect(drawer.style.transform).toBe('translateX(100%)');
      expect(document.querySelector('.drawer-backdrop')).toBeNull();
    });
  });

  describe('setDrawerContent', () => {
    it('updates the content area with HTML string', () => {
      setDrawerContent(drawer, '<p>Hello World</p>');
      const content = drawer.querySelector('.drawer-content');
      expect(content.innerHTML).toBe('<p>Hello World</p>');
    });
  });

  describe('setDrawerTitle', () => {
    it('updates the title text', () => {
      setDrawerTitle(drawer, 'New Title');
      const titleEl = drawer.querySelector('.drawer-title');
      expect(titleEl.textContent).toBe('New Title');
    });
  });

  describe('close button', () => {
    it('clicking the close button closes the drawer', () => {
      openDrawer(drawer);
      const closeBtn = drawer.querySelector('.drawer-close');
      closeBtn.click();
      expect(drawer.style.transform).toBe('translateX(100%)');
      expect(document.querySelector('.drawer-backdrop')).toBeNull();
    });
  });

  describe('isDrawerOpen', () => {
    it('returns false when drawer is closed', () => {
      expect(isDrawerOpen(drawer)).toBe(false);
    });

    it('returns true when drawer is open', () => {
      openDrawer(drawer);
      expect(isDrawerOpen(drawer)).toBe(true);
    });

    it('returns false after opening then closing', () => {
      openDrawer(drawer);
      closeDrawer(drawer);
      expect(isDrawerOpen(drawer)).toBe(false);
    });
  });
});
