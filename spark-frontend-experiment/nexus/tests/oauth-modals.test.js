import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('OAuth Modal Controller', () => {
  let modals;
  let WorkbookDemo;

  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();

    // Clear any leftover overlays
    document.body.innerHTML = '';

    const stateMod = await import('../components/state.js');
    WorkbookDemo = stateMod.default;
    WorkbookDemo._listeners = {};
    WorkbookDemo.connections = {};

    const mod = await import('../oauth/modals.js');
    modals = mod;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('getConnectionState', () => {
    it('returns object tracking which platforms are connected', () => {
      const state = modals.getConnectionState();
      expect(state).toEqual(expect.any(Object));
    });
  });

  describe('isConnected', () => {
    it('returns false initially for salesforce', () => {
      expect(modals.isConnected('salesforce')).toBe(false);
    });
  });

  describe('showOAuth', () => {
    it('creates modal overlay in document.body', () => {
      modals.showOAuth('salesforce');
      const overlay = document.querySelector('.oauth-overlay');
      expect(overlay).not.toBeNull();
      expect(document.body.contains(overlay)).toBe(true);
    });

    it('modal has oauth-overlay class', () => {
      modals.showOAuth('salesforce');
      const overlay = document.querySelector('.oauth-overlay');
      expect(overlay).not.toBeNull();
      expect(overlay.classList.contains('oauth-overlay')).toBe(true);
    });

    it('starts in loading state', () => {
      modals.showOAuth('salesforce');
      const overlay = document.querySelector('.oauth-overlay');
      expect(overlay.getAttribute('data-state')).toBe('loading');
    });
  });

  describe('authorize flow', () => {
    it('after calling authorize handler, state transitions to connecting', async () => {
      vi.useFakeTimers();
      modals.showOAuth('salesforce');

      // Wait for loading -> consent transition (500ms)
      await vi.advanceTimersByTimeAsync(500);

      const authorizeBtn = document.querySelector('[data-action="authorize"]');
      expect(authorizeBtn).not.toBeNull();
      authorizeBtn.click();

      const overlay = document.querySelector('.oauth-overlay');
      expect(overlay.getAttribute('data-state')).toBe('connecting');

      vi.useRealTimers();
    });

    it('after full flow completes, isConnected returns true', async () => {
      vi.useFakeTimers();
      modals.showOAuth('salesforce');

      // loading -> consent (500ms)
      await vi.advanceTimersByTimeAsync(500);

      const authorizeBtn = document.querySelector('[data-action="authorize"]');
      authorizeBtn.click();

      // connecting (2s) -> scanning (3s) -> connected
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(3000);

      expect(modals.isConnected('salesforce')).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('disconnectPlatform', () => {
    it('sets connected to false', () => {
      modals.connectPlatform('salesforce');
      expect(modals.isConnected('salesforce')).toBe(true);
      modals.disconnectPlatform('salesforce');
      expect(modals.isConnected('salesforce')).toBe(false);
    });
  });

  describe('getPlatforms', () => {
    it('returns all 8 platform ids', () => {
      const platforms = modals.getPlatforms();
      expect(platforms).toHaveLength(8);
      expect(platforms).toContain('salesforce');
      expect(platforms).toContain('slack');
      expect(platforms).toContain('microsoft');
      expect(platforms).toContain('google');
      expect(platforms).toContain('jira');
      expect(platforms).toContain('hubspot');
      expect(platforms).toContain('quickbooks');
      expect(platforms).toContain('notion');
    });
  });

  describe('getConnectedCount', () => {
    it('returns number of connected platforms', () => {
      expect(modals.getConnectedCount()).toBe(0);
      modals.connectPlatform('salesforce');
      expect(modals.getConnectedCount()).toBe(1);
      modals.connectPlatform('slack');
      expect(modals.getConnectedCount()).toBe(2);
    });
  });

  describe('closeModal', () => {
    it('removes the overlay from DOM', () => {
      modals.showOAuth('salesforce');
      expect(document.querySelector('.oauth-overlay')).not.toBeNull();
      modals.closeModal();
      expect(document.querySelector('.oauth-overlay')).toBeNull();
    });
  });

  describe('connectionChange event', () => {
    it('fires connectionChange event on WorkbookDemo', () => {
      const callback = vi.fn();
      WorkbookDemo.subscribe('connectionChange', callback);
      modals.connectPlatform('salesforce');
      expect(callback).toHaveBeenCalledWith({
        platform: 'salesforce',
        connected: true,
      });
    });
  });

  describe('getPlatformConfig', () => {
    it('returns platform-specific config for salesforce', () => {
      const config = modals.getPlatformConfig('salesforce');
      expect(config).not.toBeNull();
      expect(config.name).toBe('Salesforce');
      expect(config.color).toBe('#1798C1');
      expect(Array.isArray(config.permissions)).toBe(true);
      expect(config.permissions.length).toBeGreaterThan(0);
    });

    it('returns null for invalid platform', () => {
      const config = modals.getPlatformConfig('invalid');
      expect(config).toBeNull();
    });
  });
});
