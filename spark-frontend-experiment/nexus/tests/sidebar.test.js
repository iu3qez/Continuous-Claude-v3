import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Sidebar Component', () => {
  let sidebar;
  let WorkbookDemo;

  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();

    const stateMod = await import('../components/state.js');
    WorkbookDemo = stateMod.default;

    // Reset state to defaults
    WorkbookDemo.industry = 'consulting';
    WorkbookDemo.persona = 'ceo';
    WorkbookDemo.demoMode = 'free';
    WorkbookDemo.currentArc = null;
    WorkbookDemo.currentStep = 0;
    WorkbookDemo.aiMode = 'scripted';
    WorkbookDemo.theme = 'dark';
    WorkbookDemo._listeners = {};

    sidebar = await import('../components/sidebar.js');
  });

  describe('createSidebar', () => {
    it('returns a nav element', () => {
      const nav = sidebar.createSidebar();
      expect(nav).toBeInstanceOf(HTMLElement);
      expect(nav.tagName).toBe('NAV');
    });

    it('has 3 sections: Workspace, AI, Admin', () => {
      const nav = sidebar.createSidebar();
      const sectionHeaders = nav.querySelectorAll('[data-section]');
      expect(sectionHeaders).toHaveLength(3);

      const sectionNames = Array.from(sectionHeaders).map(
        (el) => el.dataset.section
      );
      expect(sectionNames).toContain('workspace');
      expect(sectionNames).toContain('ai');
      expect(sectionNames).toContain('admin');
    });

    it('default width is 240px (full-width with labels)', () => {
      const nav = sidebar.createSidebar();
      expect(nav.style.width).toBe('240px');
    });
  });

  describe('section items', () => {
    it('Workspace section has 8 items', () => {
      const nav = sidebar.createSidebar();
      const workspaceSection = nav.querySelector('[data-section="workspace"]');
      const items = workspaceSection.querySelectorAll('[data-nav-id]');
      expect(items).toHaveLength(8);
    });

    it('Workspace section has correct items: Dashboard, Calendar, Meetings, Actions, Decisions, Proposals, My Work', () => {
      const nav = sidebar.createSidebar();
      const workspaceSection = nav.querySelector('[data-section="workspace"]');
      const ids = Array.from(
        workspaceSection.querySelectorAll('[data-nav-id]')
      ).map((el) => el.dataset.navId);

      expect(ids).toContain('dashboard');
      expect(ids).toContain('calendar');
      expect(ids).toContain('meetings');
      expect(ids).toContain('actions');
      expect(ids).toContain('decisions');
      expect(ids).toContain('proposals');
      expect(ids).toContain('my-work');
    });

    it('AI section has 3 items', () => {
      const nav = sidebar.createSidebar();
      const aiSection = nav.querySelector('[data-section="ai"]');
      const items = aiSection.querySelectorAll('[data-nav-id]');
      expect(items).toHaveLength(3);
    });

    it('AI section has correct items: Agent Dashboard, Marketplace, ELT Rollup', () => {
      const nav = sidebar.createSidebar();
      const aiSection = nav.querySelector('[data-section="ai"]');
      const ids = Array.from(aiSection.querySelectorAll('[data-nav-id]')).map(
        (el) => el.dataset.navId
      );

      expect(ids).toContain('agents');
      expect(ids).toContain('marketplace');
      expect(ids).toContain('elt-rollup');
    });

    it('Admin section has 2 items', () => {
      const nav = sidebar.createSidebar();
      const adminSection = nav.querySelector('[data-section="admin"]');
      const items = adminSection.querySelectorAll('[data-nav-id]');
      expect(items).toHaveLength(2);
    });

    it('Admin section has correct items: Connections, Settings', () => {
      const nav = sidebar.createSidebar();
      const adminSection = nav.querySelector('[data-section="admin"]');
      const ids = Array.from(
        adminSection.querySelectorAll('[data-nav-id]')
      ).map((el) => el.dataset.navId);

      expect(ids).toContain('connections');
      expect(ids).toContain('settings');
    });
  });

  describe('setActivePage', () => {
    it('highlights the dashboard item', () => {
      const nav = sidebar.createSidebar();
      sidebar.setActivePage(nav, 'dashboard');

      const dashboardItem = nav.querySelector('[data-nav-id="dashboard"]');
      expect(dashboardItem.classList.contains('active')).toBe(true);
    });

    it('highlights meetings item', () => {
      const nav = sidebar.createSidebar();
      sidebar.setActivePage(nav, 'meetings');

      const meetingsItem = nav.querySelector('[data-nav-id="meetings"]');
      expect(meetingsItem.classList.contains('active')).toBe(true);
    });

    it('removes previous active highlight when changing page', () => {
      const nav = sidebar.createSidebar();
      sidebar.setActivePage(nav, 'dashboard');
      sidebar.setActivePage(nav, 'meetings');

      const dashboardItem = nav.querySelector('[data-nav-id="dashboard"]');
      const meetingsItem = nav.querySelector('[data-nav-id="meetings"]');
      expect(dashboardItem.classList.contains('active')).toBe(false);
      expect(meetingsItem.classList.contains('active')).toBe(true);
    });
  });

  describe('getNavItems', () => {
    it('returns all 13 nav items', () => {
      const items = sidebar.getNavItems();
      expect(items).toHaveLength(13);
    });

    it('each item has id, label, icon, href', () => {
      const items = sidebar.getNavItems();
      for (const item of items) {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('icon');
        expect(item).toHaveProperty('href');
      }
    });
  });

  describe('getNavItemsForPersona', () => {
    it('returns all items for ceo', () => {
      const items = sidebar.getNavItemsForPersona('ceo');
      expect(items).toHaveLength(13);
    });

    it('returns limited items for new persona (no ELT Rollup, no agents, etc)', () => {
      const items = sidebar.getNavItemsForPersona('new');
      const ids = items.map((item) => item.id);

      // new persona can access: dashboard, meetings, actions, my-work
      // new persona cannot access: calendar, decisions, proposals, agents, marketplace, elt-rollup, connections, settings
      expect(ids).toContain('dashboard');
      expect(ids).toContain('meetings');
      expect(ids).toContain('actions');
      expect(ids).toContain('my-work');

      expect(ids).not.toContain('elt-rollup');
      expect(ids).not.toContain('agents');
      expect(ids).not.toContain('marketplace');
      expect(ids).not.toContain('connections');
      expect(ids).not.toContain('settings');
      expect(ids).not.toContain('calendar');
      expect(ids).not.toContain('decisions');
      expect(ids).not.toContain('proposals');
    });

    it('returns items matching ops persona page access', () => {
      const items = sidebar.getNavItemsForPersona('ops');
      const ids = items.map((item) => item.id);

      // ops has: dashboard, meetings, actions, decisions, proposals, calendar, my-work, agents, connections, settings
      expect(ids).toContain('dashboard');
      expect(ids).toContain('agents');
      expect(ids).toContain('connections');

      // ops cannot access: elt-rollup, marketplace
      expect(ids).not.toContain('elt-rollup');
      expect(ids).not.toContain('marketplace');
    });
  });

  describe('updateBadge', () => {
    it('shows count 5 on proposals item', () => {
      const nav = sidebar.createSidebar();
      sidebar.updateBadge(nav, 'proposals', 5);

      const proposalsItem = nav.querySelector('[data-nav-id="proposals"]');
      const badge = proposalsItem.querySelector('[data-badge]');
      expect(badge).not.toBeNull();
      expect(badge.textContent).toBe('5');
    });

    it('hides the badge when count is 0', () => {
      const nav = sidebar.createSidebar();
      sidebar.updateBadge(nav, 'proposals', 5);
      sidebar.updateBadge(nav, 'proposals', 0);

      const proposalsItem = nav.querySelector('[data-nav-id="proposals"]');
      const badge = proposalsItem.querySelector('[data-badge]');
      // Badge should be hidden or removed
      if (badge) {
        expect(badge.style.display).toBe('none');
      }
      // else it was removed, which is also valid
    });

    it('updates an existing badge count', () => {
      const nav = sidebar.createSidebar();
      sidebar.updateBadge(nav, 'proposals', 5);
      sidebar.updateBadge(nav, 'proposals', 10);

      const proposalsItem = nav.querySelector('[data-nav-id="proposals"]');
      const badge = proposalsItem.querySelector('[data-badge]');
      expect(badge.textContent).toBe('10');
    });
  });
});
