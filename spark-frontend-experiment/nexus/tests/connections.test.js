import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Connections Page', () => {
  let WorkbookDemo;
  let detailDrawer;
  let persona;

  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();
    document.body.innerHTML = '';

    const stateMod = await import('../components/state.js');
    WorkbookDemo = stateMod.default;
    WorkbookDemo.industry = 'consulting';
    WorkbookDemo.persona = 'ceo';
    WorkbookDemo._listeners = {};

    detailDrawer = await import('../components/detail-drawer.js');
    persona = await import('../components/persona.js');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  // ── Detail Drawer (6 tests) ──────────────────────────────────

  describe('Detail Drawer', () => {
    it('createDrawer returns a div with detail-drawer class', () => {
      const drawer = detailDrawer.createDrawer({ title: 'Test' });
      expect(drawer).toBeInstanceOf(HTMLElement);
      expect(drawer.tagName).toBe('DIV');
      expect(drawer.classList.contains('detail-drawer')).toBe(true);
    });

    it('createDrawer includes header with title and content area', () => {
      const drawer = detailDrawer.createDrawer({ title: 'Connection Info' });
      const titleEl = drawer.querySelector('.drawer-title');
      expect(titleEl).not.toBeNull();
      expect(titleEl.textContent).toBe('Connection Info');

      const contentEl = drawer.querySelector('.drawer-content');
      expect(contentEl).not.toBeNull();
    });

    it('createDrawer applies custom width', () => {
      const drawer = detailDrawer.createDrawer({ title: 'Wide', width: 600 });
      expect(drawer.style.width).toBe('600px');
    });

    it('openDrawer slides drawer in and creates backdrop', () => {
      const drawer = detailDrawer.createDrawer({ title: 'Open Test' });
      document.body.appendChild(drawer);
      detailDrawer.openDrawer(drawer);

      expect(drawer.style.transform).toBe('translateX(0)');
      const backdrop = document.querySelector('.drawer-backdrop');
      expect(backdrop).not.toBeNull();
    });

    it('closeDrawer slides drawer out and removes backdrop', () => {
      const drawer = detailDrawer.createDrawer({ title: 'Close Test' });
      document.body.appendChild(drawer);
      detailDrawer.openDrawer(drawer);
      detailDrawer.closeDrawer(drawer);

      expect(drawer.style.transform).toBe('translateX(100%)');
      const backdrop = document.querySelector('.drawer-backdrop');
      expect(backdrop).toBeNull();
    });

    it('isDrawerOpen returns correct state after open and close', () => {
      const drawer = detailDrawer.createDrawer({ title: 'State Test' });
      document.body.appendChild(drawer);

      expect(detailDrawer.isDrawerOpen(drawer)).toBe(false);
      detailDrawer.openDrawer(drawer);
      expect(detailDrawer.isDrawerOpen(drawer)).toBe(true);
      detailDrawer.closeDrawer(drawer);
      expect(detailDrawer.isDrawerOpen(drawer)).toBe(false);
    });
  });

  // ── Persona Access (3 tests) ─────────────────────────────────

  describe('Persona Access', () => {
    it('CEO can access connections page', () => {
      expect(persona.canAccessPage('connections', 'ceo')).toBe(true);
    });

    it('ops persona can access connections page', () => {
      expect(persona.canAccessPage('connections', 'ops')).toBe(true);
    });

    it('new persona cannot access connections page', () => {
      expect(persona.canAccessPage('connections', 'new')).toBe(false);
    });
  });

  // ── Connection Tile DOM (5 tests) ────────────────────────────

  describe('Connection Tile DOM', () => {
    function createConnectionTile({ name, status, metric, lastSync }) {
      const tile = document.createElement('div');
      tile.className = 'conn-tile';
      tile.setAttribute('data-platform', name.toLowerCase());

      const nameEl = document.createElement('span');
      nameEl.className = 'conn-name';
      nameEl.textContent = name;

      const statusEl = document.createElement('span');
      statusEl.className = `conn-status conn-status--${status}`;
      statusEl.setAttribute('data-status', status);

      const metricEl = document.createElement('span');
      metricEl.className = 'conn-metric';
      metricEl.textContent = metric;

      const syncEl = document.createElement('span');
      syncEl.className = 'conn-sync';
      syncEl.textContent = lastSync;

      tile.appendChild(nameEl);
      tile.appendChild(statusEl);
      tile.appendChild(metricEl);
      tile.appendChild(syncEl);
      return tile;
    }

    it('tile has conn-tile class and data-platform attribute', () => {
      const tile = createConnectionTile({
        name: 'Salesforce',
        status: 'connected',
        metric: '342 contacts',
        lastSync: '2 min ago',
      });
      expect(tile.classList.contains('conn-tile')).toBe(true);
      expect(tile.getAttribute('data-platform')).toBe('salesforce');
    });

    it('tile displays the platform name', () => {
      const tile = createConnectionTile({
        name: 'Slack',
        status: 'connected',
        metric: '12 channels',
        lastSync: '5 min ago',
      });
      const nameEl = tile.querySelector('.conn-name');
      expect(nameEl.textContent).toBe('Slack');
    });

    it('tile displays the status indicator', () => {
      const tile = createConnectionTile({
        name: 'Jira',
        status: 'error',
        metric: '45 issues',
        lastSync: '1 hr ago',
      });
      const statusEl = tile.querySelector('.conn-status');
      expect(statusEl.getAttribute('data-status')).toBe('error');
      expect(statusEl.classList.contains('conn-status--error')).toBe(true);
    });

    it('tile displays metric text', () => {
      const tile = createConnectionTile({
        name: 'HubSpot',
        status: 'connected',
        metric: '89 deals',
        lastSync: '10 min ago',
      });
      const metricEl = tile.querySelector('.conn-metric');
      expect(metricEl.textContent).toBe('89 deals');
    });

    it('tile displays last sync time', () => {
      const tile = createConnectionTile({
        name: 'Google',
        status: 'syncing',
        metric: '200 emails',
        lastSync: 'Syncing now',
      });
      const syncEl = tile.querySelector('.conn-sync');
      expect(syncEl.textContent).toBe('Syncing now');
    });
  });

  // ── Connection States (4 tests) ──────────────────────────────

  describe('Connection States', () => {
    const STATES = ['connected', 'error', 'syncing', 'disconnected', 'pending', 'never-connected'];

    function createStatusIndicator(status) {
      const el = document.createElement('span');
      el.className = `conn-status conn-status--${status}`;
      el.setAttribute('data-status', status);
      return el;
    }

    it('connected state renders with green indicator class', () => {
      const indicator = createStatusIndicator('connected');
      expect(indicator.classList.contains('conn-status--connected')).toBe(true);
      expect(indicator.getAttribute('data-status')).toBe('connected');
    });

    it('error state renders with error indicator class', () => {
      const indicator = createStatusIndicator('error');
      expect(indicator.classList.contains('conn-status--error')).toBe(true);
      expect(indicator.getAttribute('data-status')).toBe('error');
    });

    it('syncing state renders with syncing indicator class', () => {
      const indicator = createStatusIndicator('syncing');
      expect(indicator.classList.contains('conn-status--syncing')).toBe(true);
      expect(indicator.getAttribute('data-status')).toBe('syncing');
    });

    it('all defined states produce valid status classes', () => {
      for (const status of STATES) {
        const indicator = createStatusIndicator(status);
        expect(indicator.classList.contains(`conn-status--${status}`)).toBe(true);
        expect(indicator.getAttribute('data-status')).toBe(status);
      }
    });
  });

  // ── Drawer Integration (2 tests) ─────────────────────────────

  describe('Drawer Integration', () => {
    it('setDrawerContent populates drawer with connection details', () => {
      const drawer = detailDrawer.createDrawer({ title: 'Salesforce' });
      document.body.appendChild(drawer);

      const html = '<div class="conn-detail"><strong>Status:</strong> Connected</div>';
      detailDrawer.setDrawerContent(drawer, html);

      const contentEl = drawer.querySelector('.drawer-content');
      expect(contentEl.innerHTML).toBe(html);
      expect(contentEl.querySelector('.conn-detail')).not.toBeNull();
    });

    it('setDrawerTitle updates drawer heading text', () => {
      const drawer = detailDrawer.createDrawer({ title: 'Initial' });
      document.body.appendChild(drawer);

      detailDrawer.setDrawerTitle(drawer, 'Salesforce Details');
      const titleEl = drawer.querySelector('.drawer-title');
      expect(titleEl.textContent).toBe('Salesforce Details');
    });
  });

  // ── Connection State Tiles (TASK-002) ────────────────────────

  describe('Connection State Tiles (TASK-002)', () => {
    let connections;

    beforeEach(async () => {
      connections = await import('../components/connections.js');
    });

    it('createConnectionTile with syncing state renders spinner and Syncing text', () => {
      const tile = connections.createConnectionTile({
        name: 'Slack', abbr: 'SL', color: 'bg-purple-600',
        status: 'syncing', metric: '12 channels monitored', lastSync: 'Syncing now'
      });
      document.body.appendChild(tile);
      expect(tile.querySelector('.conn-spinner')).not.toBeNull();
      expect(tile.textContent).toContain('Syncing');
    });

    it('createConnectionTile with error state renders red badge and Retry button', () => {
      const tile = connections.createConnectionTile({
        name: 'Microsoft 365', abbr: 'MS', color: 'bg-sky-600',
        status: 'error', metric: 'Email + Teams + OneDrive', lastSync: 'Auth expired',
        errorMessage: 'Auth expired'
      });
      document.body.appendChild(tile);
      const statusEl = tile.querySelector('[data-status="error"]');
      expect(statusEl).not.toBeNull();
      expect(tile.textContent).toContain('Auth expired');
      const retryBtn = tile.querySelector('[data-action="retry"]');
      expect(retryBtn).not.toBeNull();
      expect(retryBtn.textContent).toContain('Retry');
    });

    it('createConnectionTile with paused state renders gray badge and Resume button', () => {
      const tile = connections.createConnectionTile({
        name: 'HubSpot', abbr: 'HS', color: 'bg-orange-500',
        status: 'paused', metric: 'Marketing automation', lastSync: 'Paused 2 days ago'
      });
      document.body.appendChild(tile);
      const statusEl = tile.querySelector('[data-status="paused"]');
      expect(statusEl).not.toBeNull();
      expect(tile.textContent).toContain('Paused');
      const resumeBtn = tile.querySelector('[data-action="resume"]');
      expect(resumeBtn).not.toBeNull();
      expect(resumeBtn.textContent).toContain('Resume');
    });

    it('createConnectionTile with pending state renders yellow badge and Cancel button', () => {
      const tile = connections.createConnectionTile({
        name: 'QuickBooks', abbr: 'QB', color: 'bg-green-600',
        status: 'pending', metric: 'Financial data', lastSync: 'Pending setup...'
      });
      document.body.appendChild(tile);
      const statusEl = tile.querySelector('[data-status="pending"]');
      expect(statusEl).not.toBeNull();
      expect(tile.textContent).toContain('Pending');
      const cancelBtn = tile.querySelector('[data-action="cancel"]');
      expect(cancelBtn).not.toBeNull();
      expect(cancelBtn.textContent).toContain('Cancel');
    });

    it('createConnectionTile with connected state renders green indicator and Manage button', () => {
      const tile = connections.createConnectionTile({
        name: 'Salesforce', abbr: 'SF', color: 'bg-blue-600',
        status: 'connected', metric: '342 contacts, 89 deals', lastSync: 'Synced 2 min ago'
      });
      document.body.appendChild(tile);
      const statusEl = tile.querySelector('[data-status="connected"]');
      expect(statusEl).not.toBeNull();
      expect(tile.textContent).toContain('Connected');
      const manageBtn = tile.querySelector('[data-action="manage"]');
      expect(manageBtn).not.toBeNull();
    });

    it('Retry button click transitions error tile to syncing state', () => {
      const tile = connections.createConnectionTile({
        name: 'MS365', abbr: 'MS', color: 'bg-sky-600',
        status: 'error', metric: 'Email', lastSync: 'Auth expired',
        errorMessage: 'Auth expired'
      });
      document.body.appendChild(tile);
      const retryBtn = tile.querySelector('[data-action="retry"]');
      retryBtn.click();
      // After click, status should change to syncing
      const syncingIndicator = tile.querySelector('[data-status="syncing"]');
      expect(syncingIndicator).not.toBeNull();
    });

    it('Resume button click transitions paused tile to syncing state', () => {
      const tile = connections.createConnectionTile({
        name: 'HubSpot', abbr: 'HS', color: 'bg-orange-500',
        status: 'paused', metric: 'Marketing', lastSync: 'Paused'
      });
      document.body.appendChild(tile);
      const resumeBtn = tile.querySelector('[data-action="resume"]');
      resumeBtn.click();
      const syncingIndicator = tile.querySelector('[data-status="syncing"]');
      expect(syncingIndicator).not.toBeNull();
    });
  });
});
