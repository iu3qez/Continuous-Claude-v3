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

  describe('collapsible sidebar', () => {
    describe('initCollapsible', () => {
      it('exports initCollapsible function', () => {
        expect(typeof sidebar.initCollapsible).toBe('function');
      });

      it('adds a collapse toggle button to the sidebar', () => {
        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
        expect(toggleBtn).not.toBeNull();
      });

      it('toggle button contains a chevron icon', () => {
        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
        // Should have some kind of chevron indicator
        expect(toggleBtn.textContent.length).toBeGreaterThan(0);
      });
    });

    describe('collapse/expand behavior', () => {
      it('sidebar starts expanded at 240px by default', () => {
        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        expect(nav.style.width).toBe('240px');
        expect(nav.dataset.collapsed).not.toBe('true');
      });

      it('clicking toggle collapses sidebar to 56px', () => {
        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
        toggleBtn.click();

        expect(nav.style.width).toBe('56px');
        expect(nav.dataset.collapsed).toBe('true');
      });

      it('clicking toggle again expands sidebar back to 240px', () => {
        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
        toggleBtn.click(); // collapse
        toggleBtn.click(); // expand

        expect(nav.style.width).toBe('240px');
        expect(nav.dataset.collapsed).not.toBe('true');
      });

      it('adds transition style for smooth animation', () => {
        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        expect(nav.style.transition).toContain('width');
        expect(nav.style.transition).toContain('200ms');
      });
    });

    describe('collapsed state hides text elements', () => {
      it('section headings are hidden when collapsed', () => {
        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
        toggleBtn.click();

        const headings = nav.querySelectorAll('.nav-section-heading');
        headings.forEach((heading) => {
          expect(heading.style.display).toBe('none');
        });
      });

      it('nav labels are hidden when collapsed', () => {
        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
        toggleBtn.click();

        const labels = nav.querySelectorAll('.nav-label');
        labels.forEach((label) => {
          expect(label.style.display).toBe('none');
        });
      });

      it('badges are hidden when collapsed', () => {
        const nav = sidebar.createSidebar();
        sidebar.updateBadge(nav, 'proposals', 5);
        sidebar.initCollapsible(nav);

        const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
        toggleBtn.click();

        const badges = nav.querySelectorAll('.nav-badge');
        badges.forEach((badge) => {
          expect(badge.style.display).toBe('none');
        });
      });

      it('section headings reappear when expanded', () => {
        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
        toggleBtn.click(); // collapse
        toggleBtn.click(); // expand

        const headings = nav.querySelectorAll('.nav-section-heading');
        headings.forEach((heading) => {
          expect(heading.style.display).not.toBe('none');
        });
      });

      it('nav labels reappear when expanded', () => {
        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
        toggleBtn.click(); // collapse
        toggleBtn.click(); // expand

        const labels = nav.querySelectorAll('.nav-label');
        labels.forEach((label) => {
          expect(label.style.display).not.toBe('none');
        });
      });
    });

    describe('localStorage persistence', () => {
      it('saves collapsed state to localStorage', () => {
        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
        toggleBtn.click();

        expect(localStorage.getItem('nexus-sidebar-collapsed')).toBe('true');
      });

      it('saves expanded state to localStorage', () => {
        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
        toggleBtn.click(); // collapse
        toggleBtn.click(); // expand

        expect(localStorage.getItem('nexus-sidebar-collapsed')).toBe('false');
      });

      it('restores collapsed state from localStorage on init', () => {
        localStorage.setItem('nexus-sidebar-collapsed', 'true');

        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        expect(nav.style.width).toBe('56px');
        expect(nav.dataset.collapsed).toBe('true');
      });

      it('restores expanded state from localStorage on init', () => {
        localStorage.setItem('nexus-sidebar-collapsed', 'false');

        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        expect(nav.style.width).toBe('240px');
        expect(nav.dataset.collapsed).not.toBe('true');
      });
    });

    describe('tooltip support', () => {
      it('nav items have title attribute for tooltip when collapsed', () => {
        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        // Nav items already have title from createNavItem
        const navItems = nav.querySelectorAll('.nav-item');
        navItems.forEach((item) => {
          expect(item.title).toBeTruthy();
        });
      });
    });

    describe('main content margin callback', () => {
      it('calls onToggle callback with collapsed state when toggling', () => {
        const nav = sidebar.createSidebar();
        const callback = vi.fn();
        sidebar.initCollapsible(nav, { onToggle: callback });

        const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
        toggleBtn.click();

        expect(callback).toHaveBeenCalledWith(true); // collapsed=true
      });

      it('calls onToggle with false when expanding', () => {
        const nav = sidebar.createSidebar();
        const callback = vi.fn();
        sidebar.initCollapsible(nav, { onToggle: callback });

        const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
        toggleBtn.click(); // collapse
        toggleBtn.click(); // expand

        expect(callback).toHaveBeenLastCalledWith(false); // collapsed=false
      });
    });

    describe('overflow behavior', () => {
      it('sidebar has overflow hidden when collapsed to prevent text leak', () => {
        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
        toggleBtn.click();

        expect(nav.style.overflow).toBe('hidden');
      });

      it('sidebar overflow is restored when expanded', () => {
        const nav = sidebar.createSidebar();
        sidebar.initCollapsible(nav);

        const toggleBtn = nav.querySelector('[data-sidebar-toggle]');
        toggleBtn.click(); // collapse
        toggleBtn.click(); // expand

        // Should not be 'hidden' anymore
        expect(nav.style.overflow).not.toBe('hidden');
      });
    });
  });
});
