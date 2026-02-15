import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createBanner,
  showBanner,
  dismissBanner,
  isDismissed,
  clearDismissed,
} from '../components/alert-banner.js';

describe('Alert Banner', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'banner-container';
    document.body.appendChild(container);
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    container.remove();
    sessionStorage.clear();
  });

  describe('createBanner', () => {
    it('returns a DOM element', () => {
      const banner = createBanner({ message: 'Test', variant: 'info' });
      expect(banner).toBeInstanceOf(HTMLElement);
    });

    it('has correct CSS class for info variant', () => {
      const banner = createBanner({ message: 'Test', variant: 'info' });
      expect(banner.classList.contains('alert-banner')).toBe(true);
      expect(banner.classList.contains('alert-info')).toBe(true);
    });

    it('has correct CSS class for warning variant', () => {
      const banner = createBanner({ message: 'Test', variant: 'warning' });
      expect(banner.classList.contains('alert-banner')).toBe(true);
      expect(banner.classList.contains('alert-warning')).toBe(true);
    });

    it('has correct CSS class for danger variant', () => {
      const banner = createBanner({ message: 'Test', variant: 'danger' });
      expect(banner.classList.contains('alert-banner')).toBe(true);
      expect(banner.classList.contains('alert-danger')).toBe(true);
    });

    it('has correct CSS class for success variant', () => {
      const banner = createBanner({ message: 'Test', variant: 'success' });
      expect(banner.classList.contains('alert-banner')).toBe(true);
      expect(banner.classList.contains('alert-success')).toBe(true);
    });

    it('contains the message text', () => {
      const banner = createBanner({ message: 'Hello World', variant: 'info' });
      expect(banner.textContent).toContain('Hello World');
    });

    it('has a dismiss button by default', () => {
      const banner = createBanner({ message: 'Test', variant: 'info' });
      const btn = banner.querySelector('button');
      expect(btn).not.toBeNull();
    });

    it('clicking dismiss removes the banner from DOM', () => {
      const banner = createBanner({ message: 'Test', variant: 'info' });
      container.appendChild(banner);
      expect(container.contains(banner)).toBe(true);

      const btn = banner.querySelector('button');
      btn.click();

      expect(container.contains(banner)).toBe(false);
    });

    it('has no dismiss button when dismissible is false', () => {
      const banner = createBanner({
        message: 'Test',
        variant: 'warning',
        dismissible: false,
      });
      const btn = banner.querySelector('button');
      expect(btn).toBeNull();
    });

    it('auto-removes after autoDismiss milliseconds', async () => {
      vi.useFakeTimers();
      const banner = createBanner({
        message: 'Test',
        variant: 'info',
        autoDismiss: 500,
      });
      container.appendChild(banner);
      expect(container.contains(banner)).toBe(true);

      vi.advanceTimersByTime(500);

      expect(container.contains(banner)).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('showBanner', () => {
    it('appends banner to container', () => {
      const banner = showBanner(container, {
        id: 'test-1',
        message: 'Show me',
        variant: 'info',
      });
      expect(banner).not.toBeNull();
      expect(container.contains(banner)).toBe(true);
    });

    it('prepends banner (first child)', () => {
      const existing = document.createElement('div');
      existing.textContent = 'existing';
      container.appendChild(existing);

      const banner = showBanner(container, {
        id: 'test-2',
        message: 'Prepended',
        variant: 'info',
      });
      expect(container.firstChild).toBe(banner);
    });
  });

  describe('dismissBanner', () => {
    it('removes banner from the DOM', () => {
      const banner = createBanner({
        id: 'dismiss-1',
        message: 'Dismiss me',
        variant: 'info',
      });
      container.appendChild(banner);
      expect(container.contains(banner)).toBe(true);

      dismissBanner(banner);

      expect(container.contains(banner)).toBe(false);
    });

    it('stores dismissed banner id in sessionStorage', () => {
      const banner = createBanner({
        id: 'dismiss-2',
        message: 'Remember me',
        variant: 'info',
      });
      container.appendChild(banner);

      dismissBanner(banner);

      const dismissed = JSON.parse(
        sessionStorage.getItem('workbook-dismissed-banners')
      );
      expect(dismissed).toContain('dismiss-2');
    });
  });

  describe('sessionStorage dismissed state', () => {
    it('showBanner does not show a previously dismissed banner', () => {
      // Dismiss a banner first
      const banner = createBanner({
        id: 'blocked-1',
        message: 'Block me',
        variant: 'info',
      });
      container.appendChild(banner);
      dismissBanner(banner);

      // Try to show it again
      const result = showBanner(container, {
        id: 'blocked-1',
        message: 'Block me',
        variant: 'info',
      });
      expect(result).toBeNull();
    });

    it('isDismissed returns true for dismissed banner', () => {
      const banner = createBanner({
        id: 'check-1',
        message: 'Check me',
        variant: 'info',
      });
      container.appendChild(banner);
      dismissBanner(banner);

      expect(isDismissed('check-1')).toBe(true);
    });

    it('isDismissed returns false for non-dismissed banner', () => {
      expect(isDismissed('never-dismissed')).toBe(false);
    });
  });

  describe('clearDismissed', () => {
    it('clears sessionStorage dismissed state', () => {
      const banner = createBanner({
        id: 'clear-1',
        message: 'Clear me',
        variant: 'info',
      });
      container.appendChild(banner);
      dismissBanner(banner);

      expect(isDismissed('clear-1')).toBe(true);

      clearDismissed();

      expect(isDismissed('clear-1')).toBe(false);
    });

    it('allows showing banner again after clearing', () => {
      const banner = createBanner({
        id: 'reshow-1',
        message: 'Reshow me',
        variant: 'info',
      });
      container.appendChild(banner);
      dismissBanner(banner);

      clearDismissed();

      const result = showBanner(container, {
        id: 'reshow-1',
        message: 'Reshow me',
        variant: 'info',
      });
      expect(result).not.toBeNull();
      expect(container.contains(result)).toBe(true);
    });
  });
});
