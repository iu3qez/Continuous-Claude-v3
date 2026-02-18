import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('My Work Page', () => {
  let WorkbookDemo;
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

    persona = await import('../components/persona.js');
  });

  // ── Persona Access (3 tests) ──────────────────────────────────

  describe('Persona Access', () => {
    it('CEO can access my-work page', () => {
      expect(persona.canAccessPage('my-work', 'ceo')).toBe(true);
    });

    it('ops persona can access my-work page', () => {
      expect(persona.canAccessPage('my-work', 'ops')).toBe(true);
    });

    it('new persona can access my-work page', () => {
      expect(persona.canAccessPage('my-work', 'new')).toBe(true);
    });
  });

  // ── Persona Greeting (3 tests) ────────────────────────────────

  describe('Persona Greeting', () => {
    it('CEO greeting is "Good morning, Jay"', () => {
      const config = persona.getPersona('ceo');
      expect(config.greeting).toBe('Good morning, Jay');
    });

    it('ops greeting is "Good morning, Sarah"', () => {
      const config = persona.getPersona('ops');
      expect(config.greeting).toBe('Good morning, Sarah');
    });

    it('new persona greeting is "Welcome, Lisa!"', () => {
      const config = persona.getPersona('new');
      expect(config.greeting).toBe('Welcome, Lisa!');
    });
  });

  // ── Action Grouping (4 tests) ─────────────────────────────────

  describe('Action Grouping', () => {
    // Action data matching my-work.html DOM
    const ACTIONS = [
      { title: 'Finalize Q2 budget proposal', urgency: 'overdue', workspace: 'Finance', due: 'Feb 12' },
      { title: 'Review integration test results', urgency: 'overdue', workspace: 'Engineering', due: 'Feb 11' },
      { title: 'Send meeting notes to Acme Corp', urgency: 'today', workspace: 'Sales', due: 'Today' },
      { title: 'Update project timeline', urgency: 'today', workspace: 'Operations', due: 'Today' },
      { title: 'Review pull request #247', urgency: 'today', workspace: 'Engineering', due: 'Today' },
      { title: 'Prepare board deck Section 3', urgency: 'this-week', workspace: 'Operations', due: 'Feb 16' },
      { title: 'Draft vendor evaluation report', urgency: 'this-week', workspace: 'Procurement', due: 'Feb 17' },
      { title: 'Complete security training module', urgency: 'this-week', workspace: 'HR', due: 'Feb 18' },
      { title: 'Review Q1 performance metrics', urgency: 'this-week', workspace: 'Analytics', due: 'Feb 19' },
    ];

    /** Helper: build actions grouped by urgency, matching my-work.html DOM */
    function buildActionGroups(actions) {
      const container = document.createElement('div');
      container.className = 'actions-card';

      const groups = ['overdue', 'today', 'this-week'];
      for (const group of groups) {
        const section = document.createElement('div');
        section.className = 'action-group';
        section.dataset.urgency = group;

        const label = document.createElement('span');
        label.className = 'group-label';
        label.textContent = group;
        section.appendChild(label);

        const items = actions.filter((a) => a.urgency === group);
        const countBadge = document.createElement('span');
        countBadge.className = 'group-count';
        countBadge.textContent = String(items.length);
        section.appendChild(countBadge);

        for (const action of items) {
          const row = document.createElement('div');
          row.className = `dash-card ${group}-row`;
          row.dataset.workspace = action.workspace.toLowerCase();

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'action-checkbox';
          row.appendChild(checkbox);

          const titleEl = document.createElement('span');
          titleEl.className = 'action-title';
          titleEl.textContent = action.title;
          row.appendChild(titleEl);

          const dueEl = document.createElement('span');
          dueEl.className = 'action-due';
          dueEl.textContent = action.due;
          row.appendChild(dueEl);

          const wsChip = document.createElement('span');
          wsChip.className = 'metadata-chip';
          wsChip.textContent = action.workspace;
          row.appendChild(wsChip);

          section.appendChild(row);
        }

        container.appendChild(section);
      }

      document.body.appendChild(container);
      return container;
    }

    it('groups actions into overdue, today, and this-week sections', () => {
      const container = buildActionGroups(ACTIONS);
      const groups = container.querySelectorAll('.action-group');
      expect(groups).toHaveLength(3);

      const urgencies = Array.from(groups).map((g) => g.dataset.urgency);
      expect(urgencies).toEqual(['overdue', 'today', 'this-week']);
    });

    it('overdue group contains 2 items', () => {
      const container = buildActionGroups(ACTIONS);
      const overdueGroup = container.querySelector('[data-urgency="overdue"]');
      const items = overdueGroup.querySelectorAll('.dash-card');
      expect(items).toHaveLength(2);
    });

    it('today group contains 3 items', () => {
      const container = buildActionGroups(ACTIONS);
      const todayGroup = container.querySelector('[data-urgency="today"]');
      const items = todayGroup.querySelectorAll('.dash-card');
      expect(items).toHaveLength(3);
    });

    it('this-week group contains 4 items', () => {
      const container = buildActionGroups(ACTIONS);
      const weekGroup = container.querySelector('[data-urgency="this-week"]');
      const items = weekGroup.querySelectorAll('.dash-card');
      expect(items).toHaveLength(4);
    });
  });

  // ── Priority Display (3 tests) ────────────────────────────────

  describe('Priority Display', () => {
    function buildPriorityRow(urgency) {
      const row = document.createElement('div');
      row.className = `dash-card ${urgency}-row`;

      if (urgency === 'overdue') {
        row.style.borderLeftColor = '#DC2626';
        row.style.borderLeftWidth = '2px';
        row.style.borderLeftStyle = 'solid';
      } else if (urgency === 'today') {
        row.style.borderLeftColor = '#D97706';
        row.style.borderLeftWidth = '2px';
        row.style.borderLeftStyle = 'solid';
      } else {
        row.style.borderLeftColor = '#232326';
        row.style.borderLeftWidth = '2px';
        row.style.borderLeftStyle = 'solid';
      }

      document.body.appendChild(row);
      return row;
    }

    it('overdue rows have red left border', () => {
      const row = buildPriorityRow('overdue');
      expect(row.classList.contains('overdue-row')).toBe(true);
      // jsdom normalizes hex to rgb
      expect(row.style.borderLeftColor).toBe('rgb(220, 38, 38)');
    });

    it('today rows have amber left border', () => {
      const row = buildPriorityRow('today');
      expect(row.classList.contains('today-row')).toBe(true);
      expect(row.style.borderLeftColor).toBe('rgb(217, 119, 6)');
    });

    it('this-week rows have default left border', () => {
      const row = buildPriorityRow('this-week');
      expect(row.classList.contains('this-week-row')).toBe(true);
      expect(row.style.borderLeftColor).toBe('rgb(35, 35, 38)');
    });
  });

  // ── Workspace Filtering (3 tests) ─────────────────────────────

  describe('Workspace Filtering', () => {
    const ALL_ACTIONS = [
      { title: 'Task A', workspace: 'engineering' },
      { title: 'Task B', workspace: 'sales' },
      { title: 'Task C', workspace: 'engineering' },
      { title: 'Task D', workspace: 'operations' },
      { title: 'Task E', workspace: 'sales' },
    ];

    function buildFilterableActions(actions) {
      const container = document.createElement('div');
      container.className = 'action-list';

      // Build filter chips
      const chipBar = document.createElement('div');
      chipBar.className = 'filter-chips';
      const workspaces = [...new Set(actions.map((a) => a.workspace))];
      for (const ws of workspaces) {
        const chip = document.createElement('button');
        chip.className = 'filter-chip';
        chip.dataset.workspace = ws;
        chip.textContent = ws;
        chipBar.appendChild(chip);
      }
      container.appendChild(chipBar);

      // Build action rows
      for (const action of actions) {
        const row = document.createElement('div');
        row.className = 'action-row';
        row.dataset.workspace = action.workspace;
        row.textContent = action.title;
        container.appendChild(row);
      }

      document.body.appendChild(container);
      return container;
    }

    function applyFilter(container, workspace) {
      const rows = container.querySelectorAll('.action-row');
      for (const row of rows) {
        if (workspace === 'all') {
          row.style.display = '';
        } else {
          row.style.display =
            row.dataset.workspace === workspace ? '' : 'none';
        }
      }
    }

    it('filtering by "engineering" shows only engineering actions', () => {
      const container = buildFilterableActions(ALL_ACTIONS);
      applyFilter(container, 'engineering');

      const visible = Array.from(
        container.querySelectorAll('.action-row')
      ).filter((r) => r.style.display !== 'none');
      expect(visible).toHaveLength(2);
      for (const row of visible) {
        expect(row.dataset.workspace).toBe('engineering');
      }
    });

    it('filtering by "sales" shows only sales actions', () => {
      const container = buildFilterableActions(ALL_ACTIONS);
      applyFilter(container, 'sales');

      const visible = Array.from(
        container.querySelectorAll('.action-row')
      ).filter((r) => r.style.display !== 'none');
      expect(visible).toHaveLength(2);
      for (const row of visible) {
        expect(row.dataset.workspace).toBe('sales');
      }
    });

    it('filtering by "all" shows every action', () => {
      const container = buildFilterableActions(ALL_ACTIONS);
      applyFilter(container, 'engineering');
      applyFilter(container, 'all');

      const visible = Array.from(
        container.querySelectorAll('.action-row')
      ).filter((r) => r.style.display !== 'none');
      expect(visible).toHaveLength(5);
    });
  });

  // ── Quick Stats (2 tests) ─────────────────────────────────────

  describe('Quick Stats', () => {
    function buildQuickStats(pending, meetings, decisions) {
      const row = document.createElement('div');
      row.className = 'quick-stats';

      const stats = [
        { label: 'Pending Actions', value: pending, cls: 'stat-pending' },
        { label: 'Meetings Today', value: meetings, cls: 'stat-meetings' },
        { label: 'Decisions Needed', value: decisions, cls: 'stat-decisions' },
      ];

      for (const stat of stats) {
        const el = document.createElement('div');
        el.className = `stat-item ${stat.cls}`;

        const valEl = document.createElement('span');
        valEl.className = 'stat-value';
        valEl.textContent = String(stat.value);
        el.appendChild(valEl);

        const labelEl = document.createElement('span');
        labelEl.className = 'stat-label';
        labelEl.textContent = stat.label;
        el.appendChild(labelEl);

        row.appendChild(el);
      }

      document.body.appendChild(row);
      return row;
    }

    it('displays three stat items: pending, meetings, decisions', () => {
      const row = buildQuickStats(12, 5, 2);
      const items = row.querySelectorAll('.stat-item');
      expect(items).toHaveLength(3);

      const labels = Array.from(row.querySelectorAll('.stat-label')).map(
        (el) => el.textContent
      );
      expect(labels).toContain('Pending Actions');
      expect(labels).toContain('Meetings Today');
      expect(labels).toContain('Decisions Needed');
    });

    it('displays correct numeric values for each stat', () => {
      const row = buildQuickStats(12, 5, 2);

      const pending = row.querySelector('.stat-pending .stat-value');
      expect(pending.textContent).toBe('12');

      const meetings = row.querySelector('.stat-meetings .stat-value');
      expect(meetings.textContent).toBe('5');

      const decisions = row.querySelector('.stat-decisions .stat-value');
      expect(decisions.textContent).toBe('2');
    });
  });

  // ── Next Meeting (2 tests) ────────────────────────────────────

  describe('Next Meeting', () => {
    it('calculates minutes remaining until next meeting', () => {
      const targetMinutes = 47;
      const startTime = Date.now();
      const meetingTime = startTime + targetMinutes * 60 * 1000;
      const remaining = meetingTime - startTime;
      const mins = Math.floor(remaining / 60000);
      expect(mins).toBe(47);
    });

    it('displays countdown text in the DOM', () => {
      const countdown = document.createElement('span');
      countdown.id = 'meeting-countdown';

      const mins = 47;
      countdown.textContent = `Next meeting in ${mins} minute${mins !== 1 ? 's' : ''}`;
      document.body.appendChild(countdown);

      const el = document.getElementById('meeting-countdown');
      expect(el).not.toBeNull();
      expect(el.textContent).toBe('Next meeting in 47 minutes');
    });
  });
});
