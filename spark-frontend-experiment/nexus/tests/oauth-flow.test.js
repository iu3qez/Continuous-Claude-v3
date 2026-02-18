import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('OAuth Flow - Full Integration', () => {
  let modals;
  let WorkbookDemo;

  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();
    document.body.innerHTML = '';

    const stateMod = await import('../components/state.js');
    WorkbookDemo = stateMod.default;
    WorkbookDemo._listeners = {};
    WorkbookDemo.connections = {};

    modals = await import('../oauth/modals.js');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('All Platforms Config', () => {
    it('salesforce has valid config with name, color, permissions', () => {
      const config = modals.getPlatformConfig('salesforce');
      expect(config).not.toBeNull();
      expect(config.name).toBe('Salesforce');
      expect(config.color).toBe('#1798C1');
      expect(Array.isArray(config.permissions)).toBe(true);
      expect(config.permissions.length).toBeGreaterThan(0);
    });

    it('all 8 platforms have valid configs', () => {
      const platforms = ['salesforce', 'slack', 'microsoft', 'google', 'jira', 'hubspot', 'quickbooks', 'notion'];

      platforms.forEach(platformId => {
        const config = modals.getPlatformConfig(platformId);
        expect(config, `${platformId} should have config`).not.toBeNull();
        expect(config.name, `${platformId} should have name`).toBeTruthy();
        expect(config.color, `${platformId} should have color`).toMatch(/^#[0-9A-F]{6}$/i);
        expect(Array.isArray(config.permissions), `${platformId} should have permissions array`).toBe(true);
        expect(config.permissions.length, `${platformId} should have at least one permission`).toBeGreaterThan(0);
      });
    });

    it('getPlatforms returns all 8 platform ids', () => {
      const platforms = modals.getPlatforms();
      expect(platforms).toHaveLength(8);
      expect(platforms).toEqual(expect.arrayContaining([
        'salesforce', 'slack', 'microsoft', 'google',
        'jira', 'hubspot', 'quickbooks', 'notion'
      ]));
    });
  });

  describe('Full Flow Per Platform', () => {
    it('salesforce completes full flow: loading -> consent -> connecting -> scanning -> connected', async () => {
      vi.useFakeTimers();

      modals.showOAuth('salesforce');
      const overlay = document.querySelector('.oauth-overlay');
      expect(overlay.getAttribute('data-state')).toBe('loading');

      // loading -> consent (500ms)
      await vi.advanceTimersByTimeAsync(500);
      expect(overlay.getAttribute('data-state')).toBe('consent');

      const authorizeBtn = document.querySelector('[data-action="authorize"]');
      expect(authorizeBtn).not.toBeNull();
      authorizeBtn.click();
      expect(overlay.getAttribute('data-state')).toBe('connecting');

      // connecting -> scanning (2000ms)
      await vi.advanceTimersByTimeAsync(2000);
      expect(overlay.getAttribute('data-state')).toBe('scanning');

      // scanning -> connected (3000ms)
      await vi.advanceTimersByTimeAsync(3000);
      expect(modals.isConnected('salesforce')).toBe(true);

      vi.useRealTimers();
    });

    it('google completes full flow', async () => {
      vi.useFakeTimers();

      modals.showOAuth('google');
      await vi.advanceTimersByTimeAsync(500);

      const authorizeBtn = document.querySelector('[data-action="authorize"]');
      authorizeBtn.click();

      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(3000);

      expect(modals.isConnected('google')).toBe(true);

      vi.useRealTimers();
    });

    it('slack completes full flow', async () => {
      vi.useFakeTimers();

      modals.showOAuth('slack');
      await vi.advanceTimersByTimeAsync(500);

      const authorizeBtn = document.querySelector('[data-action="authorize"]');
      authorizeBtn.click();

      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(3000);

      expect(modals.isConnected('slack')).toBe(true);

      vi.useRealTimers();
    });

    it('jira completes full flow', async () => {
      vi.useFakeTimers();

      modals.showOAuth('jira');
      await vi.advanceTimersByTimeAsync(500);

      const authorizeBtn = document.querySelector('[data-action="authorize"]');
      authorizeBtn.click();

      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(3000);

      expect(modals.isConnected('jira')).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('Skip Option', () => {
    it('modal has cancel/skip button in consent state', async () => {
      vi.useFakeTimers();

      modals.showOAuth('salesforce');
      await vi.advanceTimersByTimeAsync(500);

      const cancelBtn = document.querySelector('[data-action="cancel"]');
      expect(cancelBtn).not.toBeNull();
      expect(cancelBtn.textContent).toBe('Cancel');

      vi.useRealTimers();
    });

    it('closeModal removes overlay without connecting platform', async () => {
      vi.useFakeTimers();

      modals.showOAuth('salesforce');
      await vi.advanceTimersByTimeAsync(500);

      expect(document.querySelector('.oauth-overlay')).not.toBeNull();
      modals.closeModal();

      expect(document.querySelector('.oauth-overlay')).toBeNull();
      expect(modals.isConnected('salesforce')).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('Multiple Connections', () => {
    it('connects 3 platforms sequentially, count updates correctly', async () => {
      vi.useFakeTimers();

      expect(modals.getConnectedCount()).toBe(0);

      // Connect salesforce
      modals.showOAuth('salesforce');
      await vi.advanceTimersByTimeAsync(500);
      document.querySelector('[data-action="authorize"]').click();
      await vi.advanceTimersByTimeAsync(5000);
      expect(modals.getConnectedCount()).toBe(1);
      modals.closeModal();

      // Connect slack
      modals.showOAuth('slack');
      await vi.advanceTimersByTimeAsync(500);
      document.querySelector('[data-action="authorize"]').click();
      await vi.advanceTimersByTimeAsync(5000);
      expect(modals.getConnectedCount()).toBe(2);
      modals.closeModal();

      // Connect google
      modals.showOAuth('google');
      await vi.advanceTimersByTimeAsync(500);
      document.querySelector('[data-action="authorize"]').click();
      await vi.advanceTimersByTimeAsync(5000);
      expect(modals.getConnectedCount()).toBe(3);

      vi.useRealTimers();
    });

    it('disconnecting one platform updates count correctly', () => {
      modals.connectPlatform('salesforce');
      modals.connectPlatform('slack');
      modals.connectPlatform('google');

      expect(modals.getConnectedCount()).toBe(3);

      modals.disconnectPlatform('slack');
      expect(modals.getConnectedCount()).toBe(2);
      expect(modals.isConnected('salesforce')).toBe(true);
      expect(modals.isConnected('slack')).toBe(false);
      expect(modals.isConnected('google')).toBe(true);
    });

    it('getConnectionState reflects multiple connections', () => {
      modals.connectPlatform('salesforce');
      modals.connectPlatform('google');

      const state = modals.getConnectionState();
      expect(state.salesforce).toBe(true);
      expect(state.google).toBe(true);
      expect(state.slack).toBeFalsy();
    });
  });

  describe('Connection Events', () => {
    it('connectionChange event fires when connecting platform', () => {
      const callback = vi.fn();
      WorkbookDemo.subscribe('connectionChange', callback);

      modals.connectPlatform('salesforce');

      expect(callback).toHaveBeenCalledWith({
        platform: 'salesforce',
        connected: true,
      });
    });

    it('connectionChange event fires when disconnecting platform', () => {
      const callback = vi.fn();
      modals.connectPlatform('salesforce');

      WorkbookDemo.subscribe('connectionChange', callback);
      modals.disconnectPlatform('salesforce');

      expect(callback).toHaveBeenCalledWith({
        platform: 'salesforce',
        connected: false,
      });
    });

    it('connectionChange event fires with correct platform for multiple connections', () => {
      const callback = vi.fn();
      WorkbookDemo.subscribe('connectionChange', callback);

      modals.connectPlatform('salesforce');
      modals.connectPlatform('slack');

      expect(callback).toHaveBeenNthCalledWith(1, {
        platform: 'salesforce',
        connected: true,
      });
      expect(callback).toHaveBeenNthCalledWith(2, {
        platform: 'slack',
        connected: true,
      });
    });
  });

  describe('Edge Cases', () => {
    it('connecting same platform twice is idempotent', async () => {
      vi.useFakeTimers();

      // First connection
      modals.showOAuth('salesforce');
      await vi.advanceTimersByTimeAsync(500);
      document.querySelector('[data-action="authorize"]').click();
      await vi.advanceTimersByTimeAsync(5000);
      expect(modals.isConnected('salesforce')).toBe(true);
      modals.closeModal();

      // Second connection
      modals.showOAuth('salesforce');
      await vi.advanceTimersByTimeAsync(500);
      document.querySelector('[data-action="authorize"]').click();
      await vi.advanceTimersByTimeAsync(5000);
      expect(modals.isConnected('salesforce')).toBe(true);
      expect(modals.getConnectedCount()).toBe(1);

      vi.useRealTimers();
    });

    it('showOAuth with invalid platform name returns null and does not create modal', () => {
      const result = modals.showOAuth('invalid-platform');
      expect(result).toBeNull();
      expect(document.querySelector('.oauth-overlay')).toBeNull();
    });

    it('rapid open and close does not leave stale state', async () => {
      vi.useFakeTimers();

      modals.showOAuth('salesforce');
      expect(document.querySelector('.oauth-overlay')).not.toBeNull();

      modals.closeModal();
      expect(document.querySelector('.oauth-overlay')).toBeNull();

      modals.showOAuth('slack');
      expect(document.querySelector('.oauth-overlay')).not.toBeNull();

      const overlay = document.querySelector('.oauth-overlay');
      expect(overlay.getAttribute('data-state')).toBe('loading');

      vi.useRealTimers();
    });
  });
});
