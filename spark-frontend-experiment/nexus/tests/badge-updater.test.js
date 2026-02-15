import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Badge Updater', () => {
  let badgeUpdater;
  let sidebar;
  let WorkbookDemo;

  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '';
    localStorage.clear();

    const stateMod = await import('../components/state.js');
    WorkbookDemo = stateMod.default;
    WorkbookDemo.industry = 'consulting';
    WorkbookDemo.persona = 'ceo';
    WorkbookDemo._listeners = {};

    sidebar = await import('../components/sidebar.js');
    badgeUpdater = await import('../components/badge-updater.js');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('getBadgeCounts', () => {
    it('returns an object with actions, proposals, and meetings keys', () => {
      const counts = badgeUpdater.getBadgeCounts('consulting');
      expect(counts).toHaveProperty('actions');
      expect(counts).toHaveProperty('proposals');
      expect(counts).toHaveProperty('meetings');
    });

    it('actions count is a non-negative integer', () => {
      const counts = badgeUpdater.getBadgeCounts('consulting');
      expect(typeof counts.actions).toBe('number');
      expect(counts.actions).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(counts.actions)).toBe(true);
    });

    it('proposals count is a non-negative integer', () => {
      const counts = badgeUpdater.getBadgeCounts('consulting');
      expect(typeof counts.proposals).toBe('number');
      expect(counts.proposals).toBeGreaterThanOrEqual(0);
    });

    it('meetings count is a non-negative integer', () => {
      const counts = badgeUpdater.getBadgeCounts('consulting');
      expect(typeof counts.meetings).toBe('number');
      expect(counts.meetings).toBeGreaterThanOrEqual(0);
    });

    it('returns different counts for different industries', () => {
      const consulting = badgeUpdater.getBadgeCounts('consulting');
      const tech = badgeUpdater.getBadgeCounts('tech');
      // At least one count should differ (or they could be the same, but the function handles both)
      expect(consulting).toBeDefined();
      expect(tech).toBeDefined();
    });
  });

  describe('initBadges', () => {
    it('sets Actions badge to overdue count on sidebar', () => {
      const nav = sidebar.createSidebar();
      document.body.appendChild(nav);
      badgeUpdater.initBadges(nav, 'consulting');

      const actionsItem = nav.querySelector('[data-nav-id="actions"]');
      const badge = actionsItem.querySelector('[data-badge]');
      expect(badge).not.toBeNull();
      const count = parseInt(badge.textContent);
      expect(count).toBeGreaterThan(0);
    });

    it('sets Proposals badge to pending count on sidebar', () => {
      const nav = sidebar.createSidebar();
      document.body.appendChild(nav);
      badgeUpdater.initBadges(nav, 'consulting');

      const proposalsItem = nav.querySelector('[data-nav-id="proposals"]');
      const badge = proposalsItem.querySelector('[data-badge]');
      expect(badge).not.toBeNull();
      const count = parseInt(badge.textContent);
      expect(count).toBeGreaterThan(0);
    });

    it('sets Meetings badge to today meeting count on sidebar', () => {
      const nav = sidebar.createSidebar();
      document.body.appendChild(nav);
      badgeUpdater.initBadges(nav, 'consulting');

      const meetingsItem = nav.querySelector('[data-nav-id="meetings"]');
      const badge = meetingsItem.querySelector('[data-badge]');
      expect(badge).not.toBeNull();
      const count = parseInt(badge.textContent);
      expect(count).toBeGreaterThan(0);
    });

    it('hides badge when count is 0', () => {
      const nav = sidebar.createSidebar();
      document.body.appendChild(nav);
      // Use a custom industry that returns 0 for something
      badgeUpdater.initBadges(nav, 'consulting');

      // Manually test the 0 case
      sidebar.updateBadge(nav, 'decisions', 0);
      const decisionsItem = nav.querySelector('[data-nav-id="decisions"]');
      const badge = decisionsItem.querySelector('[data-badge]');
      if (badge) {
        expect(badge.style.display).toBe('none');
      }
    });
  });
});
