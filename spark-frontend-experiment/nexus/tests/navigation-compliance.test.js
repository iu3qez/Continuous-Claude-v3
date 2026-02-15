import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Navigation Compliance', () => {
  let sidebar;
  let persona;
  let commandBar;
  let WorkbookDemo;

  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();
    document.body.innerHTML = '';

    const stateMod = await import('../components/state.js');
    WorkbookDemo = stateMod.default;
    WorkbookDemo.industry = 'consulting';
    WorkbookDemo.persona = 'ceo';
    WorkbookDemo._listeners = {};

    sidebar = await import('../components/sidebar.js');
    persona = await import('../components/persona.js');
    commandBar = await import('../components/command-bar.js');
  });

  describe('Section Structure', () => {
    it('should have exactly 3 sections', () => {
      const nav = sidebar.createSidebar();
      const sections = nav.querySelectorAll('[data-section]');
      expect(sections.length).toBe(3);
    });

    it('should have workspace, ai, and admin sections', () => {
      const nav = sidebar.createSidebar();
      const workspace = nav.querySelector('[data-section="workspace"]');
      const ai = nav.querySelector('[data-section="ai"]');
      const admin = nav.querySelector('[data-section="admin"]');

      expect(workspace).toBeTruthy();
      expect(ai).toBeTruthy();
      expect(admin).toBeTruthy();
    });

    it('should display section headings with capitalized names', () => {
      const nav = sidebar.createSidebar();
      const headings = nav.querySelectorAll('.nav-section-heading');

      expect(headings.length).toBe(3);
      expect(headings[0].textContent).toBe('Workspace');
      expect(headings[1].textContent).toBe('Ai');
      expect(headings[2].textContent).toBe('Admin');
    });
  });

  describe('Item Counts', () => {
    it('should have 8 items in workspace section', () => {
      const nav = sidebar.createSidebar();
      const workspace = nav.querySelector('[data-section="workspace"]');
      const items = workspace.querySelectorAll('[data-nav-id]');
      expect(items.length).toBe(8);
    });

    it('should have 3 items in AI section', () => {
      const nav = sidebar.createSidebar();
      const ai = nav.querySelector('[data-section="ai"]');
      const items = ai.querySelectorAll('[data-nav-id]');
      expect(items.length).toBe(3);
    });

    it('should have 2 items in admin section', () => {
      const nav = sidebar.createSidebar();
      const admin = nav.querySelector('[data-section="admin"]');
      const items = admin.querySelectorAll('[data-nav-id]');
      expect(items.length).toBe(2);
    });
  });

  describe('Correct Items Per Section', () => {
    it('should have correct workspace items', () => {
      const nav = sidebar.createSidebar();
      const workspace = nav.querySelector('[data-section="workspace"]');
      const items = Array.from(workspace.querySelectorAll('[data-nav-id]'));
      const ids = items.map(el => el.dataset.navId);

      expect(ids).toEqual([
        'dashboard',
        'calendar',
        'meetings',
        'actions',
        'decisions',
        'proposals',
        'my-work',
        'workspaces',
      ]);
    });

    it('should have correct AI items', () => {
      const nav = sidebar.createSidebar();
      const ai = nav.querySelector('[data-section="ai"]');
      const items = Array.from(ai.querySelectorAll('[data-nav-id]'));
      const ids = items.map(el => el.dataset.navId);

      expect(ids).toEqual([
        'agents',
        'marketplace',
        'elt-rollup',
      ]);
    });

    it('should have correct admin items', () => {
      const nav = sidebar.createSidebar();
      const admin = nav.querySelector('[data-section="admin"]');
      const items = Array.from(admin.querySelectorAll('[data-nav-id]'));
      const ids = items.map(el => el.dataset.navId);

      expect(ids).toEqual([
        'connections',
        'settings',
      ]);
    });
  });

  describe('Active Page Highlighting', () => {
    it('should highlight the active page', () => {
      const nav = sidebar.createSidebar();
      sidebar.setActivePage(nav, 'dashboard');

      const activeItem = nav.querySelector('[data-nav-id="dashboard"]');
      expect(activeItem.classList.contains('active')).toBe(true);
    });

    it('should remove highlight from previous active page', () => {
      const nav = sidebar.createSidebar();

      // Set dashboard active
      sidebar.setActivePage(nav, 'dashboard');
      const dashboard = nav.querySelector('[data-nav-id="dashboard"]');
      expect(dashboard.classList.contains('active')).toBe(true);

      // Switch to meetings
      sidebar.setActivePage(nav, 'meetings');
      const meetings = nav.querySelector('[data-nav-id="meetings"]');

      expect(meetings.classList.contains('active')).toBe(true);
      expect(dashboard.classList.contains('active')).toBe(false);
    });

    it('should handle non-existent page gracefully', () => {
      const nav = sidebar.createSidebar();
      sidebar.setActivePage(nav, 'nonexistent-page');

      const allItems = nav.querySelectorAll('[data-nav-id]');
      const anyActive = Array.from(allItems).some(el => el.classList.contains('active'));
      expect(anyActive).toBe(false);
    });
  });

  describe('All Nav Items', () => {
    it('should return all 13 nav items', () => {
      const items = sidebar.getNavItems();
      expect(items.length).toBe(13);
    });

    it('should include id, label, icon, and href for each item', () => {
      const items = sidebar.getNavItems();

      items.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('icon');
        expect(item).toHaveProperty('href');
        expect(typeof item.id).toBe('string');
        expect(typeof item.label).toBe('string');
        expect(typeof item.icon).toBe('string');
        expect(typeof item.href).toBe('string');
      });
    });
  });

  describe('CEO Access', () => {
    it('should grant CEO access to all 13 items', () => {
      const items = sidebar.getNavItemsForPersona('ceo');
      expect(items.length).toBe(13);
    });

    it('should verify CEO persona has "all" pages access', () => {
      const ceo = persona.getPersona('ceo');
      expect(ceo.pages).toEqual(['all']);

      // Test all items individually
      const allItems = sidebar.getNavItems();
      allItems.forEach(item => {
        expect(persona.canAccessPage(item.id, 'ceo')).toBe(true);
      });
    });
  });

  describe('OPS Access', () => {
    it('should grant OPS access to correct subset (no elt-rollup, no marketplace)', () => {
      const items = sidebar.getNavItemsForPersona('ops');
      const ids = items.map(item => item.id);

      expect(ids).toContain('dashboard');
      expect(ids).toContain('meetings');
      expect(ids).toContain('actions');
      expect(ids).toContain('decisions');
      expect(ids).toContain('proposals');
      expect(ids).toContain('calendar');
      expect(ids).toContain('my-work');
      expect(ids).toContain('agents');
      expect(ids).toContain('connections');
      expect(ids).toContain('settings');

      expect(ids).not.toContain('elt-rollup');
      expect(ids).not.toContain('marketplace');
    });

    it('should have exactly 10 accessible pages for OPS', () => {
      const items = sidebar.getNavItemsForPersona('ops');
      expect(items.length).toBe(10);
    });
  });

  describe('New Hire Access', () => {
    it('should grant new hire access only to allowed pages', () => {
      const items = sidebar.getNavItemsForPersona('new');
      const ids = items.map(item => item.id);

      // New hire should only see these
      expect(ids).toContain('dashboard');
      expect(ids).toContain('meetings');
      expect(ids).toContain('actions');
      expect(ids).toContain('my-work');

      // Should NOT see these
      expect(ids).not.toContain('calendar');
      expect(ids).not.toContain('decisions');
      expect(ids).not.toContain('proposals');
      expect(ids).not.toContain('agents');
      expect(ids).not.toContain('marketplace');
      expect(ids).not.toContain('elt-rollup');
      expect(ids).not.toContain('connections');
      expect(ids).not.toContain('settings');
    });

    it('should have exactly 4 accessible pages for new hire', () => {
      const items = sidebar.getNavItemsForPersona('new');
      expect(items.length).toBe(4);
    });
  });

  describe('Badge System', () => {
    it('should show badge with count when count > 0', () => {
      const nav = sidebar.createSidebar();
      document.body.appendChild(nav);

      sidebar.updateBadge(nav, 'proposals', 5);

      const proposalItem = nav.querySelector('[data-nav-id="proposals"]');
      const badge = proposalItem.querySelector('[data-badge]');

      expect(badge).toBeTruthy();
      expect(badge.textContent).toBe('5');
      expect(badge.style.display).not.toBe('none');
    });

    it('should hide badge when count is 0', () => {
      const nav = sidebar.createSidebar();
      document.body.appendChild(nav);

      // First set to 5
      sidebar.updateBadge(nav, 'proposals', 5);
      const proposalItem = nav.querySelector('[data-nav-id="proposals"]');
      let badge = proposalItem.querySelector('[data-badge]');
      expect(badge.style.display).not.toBe('none');

      // Then set to 0
      sidebar.updateBadge(nav, 'proposals', 0);
      badge = proposalItem.querySelector('[data-badge]');
      expect(badge.style.display).toBe('none');
    });
  });

  describe('Page Links', () => {
    it('should have valid .html hrefs for all nav items', () => {
      const items = sidebar.getNavItems();

      items.forEach(item => {
        expect(item.href).toMatch(/\.html$/);
      });
    });

    it('should have hrefs matching expected file names', () => {
      const items = sidebar.getNavItems();
      const hrefMap = {};
      items.forEach(item => {
        hrefMap[item.id] = item.href;
      });

      expect(hrefMap['dashboard']).toBe('dashboard.html');
      expect(hrefMap['calendar']).toBe('calendar.html');
      expect(hrefMap['meetings']).toBe('meetings.html');
      expect(hrefMap['actions']).toBe('actions.html');
      expect(hrefMap['decisions']).toBe('decisions.html');
      expect(hrefMap['proposals']).toBe('proposals.html');
      expect(hrefMap['my-work']).toBe('my-work.html');
      expect(hrefMap['agents']).toBe('agents.html');
      expect(hrefMap['marketplace']).toBe('marketplace.html');
      expect(hrefMap['elt-rollup']).toBe('elt-rollup.html');
      expect(hrefMap['connections']).toBe('connections.html');
      expect(hrefMap['settings']).toBe('settings.html');
    });
  });

  describe('Sidebar Width', () => {
    it('sidebar defaults to 240px full-width with visible labels', () => {
      const nav = sidebar.createSidebar();
      expect(nav.style.width).toBe('240px');
    });

    it('section headings are visible text labels', () => {
      const nav = sidebar.createSidebar();
      const headings = nav.querySelectorAll('.nav-section-heading');
      expect(headings.length).toBe(3);
      const texts = Array.from(headings).map(h => h.textContent);
      expect(texts).toContain('Workspace');
      expect(texts).toContain('Ai');
      expect(texts).toContain('Admin');
    });

    it('nav items have visible label elements', () => {
      const nav = sidebar.createSidebar();
      const labels = nav.querySelectorAll('.nav-label');
      expect(labels.length).toBe(13);
      // First label should be "Dashboard"
      expect(labels[0].textContent).toBe('Dashboard');
    });
  });

  describe('Command Bar Integration', () => {
    it('should include navigation commands for all major pages', () => {
      const commands = commandBar.getCommands();
      const navCommands = commands.filter(cmd => cmd.category === 'Navigation');

      // Command bar should have navigation entries
      expect(navCommands.length).toBeGreaterThan(0);

      const labels = navCommands.map(cmd => cmd.label.toLowerCase());

      // Check for key navigation commands
      expect(labels.some(l => l.includes('dashboard'))).toBe(true);
      expect(labels.some(l => l.includes('meetings'))).toBe(true);
      expect(labels.some(l => l.includes('actions'))).toBe(true);
      expect(labels.some(l => l.includes('decisions'))).toBe(true);
      expect(labels.some(l => l.includes('proposals'))).toBe(true);
    });

    it('should open command bar and render commands', () => {
      const bar = commandBar.createCommandBar();
      document.body.appendChild(bar);

      commandBar.openCommandBar();

      expect(bar.classList.contains('hidden')).toBe(false);

      const input = bar.querySelector('input[type="text"]');
      expect(input).toBeTruthy();
      expect(document.activeElement).toBe(input);

      const list = bar.querySelector('.command-list');
      expect(list).toBeTruthy();
      expect(list.children.length).toBeGreaterThan(0);
    });

    it('should filter commands as user types', () => {
      const bar = commandBar.createCommandBar();
      document.body.appendChild(bar);

      commandBar.openCommandBar();

      const input = bar.querySelector('input[type="text"]');
      input.value = 'meeting';
      input.dispatchEvent(new Event('input'));

      const list = bar.querySelector('.command-list');
      const items = Array.from(list.querySelectorAll('.command-item'));
      const labels = items.map(item => item.textContent);

      // Should only show meeting-related commands
      expect(labels.some(l => l.toLowerCase().includes('meeting'))).toBe(true);
    });

    it('should navigate on Enter key', () => {
      const bar = commandBar.createCommandBar();
      document.body.appendChild(bar);

      const mockAction = vi.fn();
      commandBar.registerCommand({
        id: 'test-cmd',
        label: 'Test Command',
        category: 'Test',
        action: mockAction,
      });

      commandBar.openCommandBar();

      const input = bar.querySelector('input[type="text"]');
      input.value = 'Test Command';
      input.dispatchEvent(new Event('input'));

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      bar.dispatchEvent(enterEvent);

      expect(mockAction).toHaveBeenCalled();
    });

    it('should close command bar on Escape key', () => {
      const bar = commandBar.createCommandBar();
      document.body.appendChild(bar);

      commandBar.openCommandBar();
      expect(bar.classList.contains('hidden')).toBe(false);

      const escEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      bar.dispatchEvent(escEvent);

      expect(bar.classList.contains('hidden')).toBe(true);
    });
  });
});
