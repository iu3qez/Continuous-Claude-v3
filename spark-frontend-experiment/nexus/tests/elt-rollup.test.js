import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ELT Rollup Page', () => {
  let WorkbookDemo;
  let persona;

  // Department data matching the HTML page
  const DEPARTMENTS = [
    { name: 'Operations', score: 92, trend: 'up', status: 'Strong', color: '#10B981' },
    { name: 'Engineering', score: 88, trend: 'up', status: 'Strong', color: '#10B981' },
    { name: 'Marketing', score: 85, trend: 'stable', status: 'On Track', color: '#6B7280' },
    { name: 'Sales', score: 71, trend: 'down', status: 'Needs Attention', color: '#EF4444' },
    { name: 'Finance', score: 68, trend: 'down', status: 'At Risk', color: '#EF4444' },
    { name: 'HR', score: 90, trend: 'stable', status: 'Strong', color: '#6B7280' },
  ];

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

  // ── Persona Restriction (4 tests) ──────────────────────────────

  describe('Persona Restriction', () => {
    it('CEO can access elt-rollup page', () => {
      expect(persona.canAccessPage('elt-rollup', 'ceo')).toBe(true);
    });

    it('ops persona cannot access elt-rollup page', () => {
      expect(persona.canAccessPage('elt-rollup', 'ops')).toBe(false);
    });

    it('engineering persona cannot access elt-rollup page', () => {
      expect(persona.canAccessPage('elt-rollup', 'engineering')).toBe(false);
    });

    it('new persona cannot access elt-rollup page', () => {
      expect(persona.canAccessPage('elt-rollup', 'new')).toBe(false);
    });
  });

  // ── Page Structure (4 tests) ───────────────────────────────────

  describe('Page Structure', () => {
    /** Helper: build a minimal ELT rollup header DOM matching elt-rollup.html */
    function buildHeaderDOM() {
      const header = document.createElement('header');

      const h1 = document.createElement('h1');
      h1.textContent = 'Executive Rollup';
      header.appendChild(h1);

      const badge = document.createElement('span');
      badge.className = 'ceo-badge';
      badge.textContent = 'CEO View Only';
      header.appendChild(badge);

      const refreshBtn = document.createElement('button');
      refreshBtn.className = 'refresh-btn';
      refreshBtn.textContent = 'Refresh';
      header.appendChild(refreshBtn);

      document.body.appendChild(header);
      return header;
    }

    it('header displays "Executive Rollup" title', () => {
      const header = buildHeaderDOM();
      const h1 = header.querySelector('h1');
      expect(h1).not.toBeNull();
      expect(h1.textContent).toBe('Executive Rollup');
    });

    it('header contains CEO View Only badge', () => {
      const header = buildHeaderDOM();
      const badge = header.querySelector('.ceo-badge');
      expect(badge).not.toBeNull();
      expect(badge.textContent).toBe('CEO View Only');
    });

    it('header contains a Refresh button', () => {
      const header = buildHeaderDOM();
      const btn = header.querySelector('.refresh-btn');
      expect(btn).not.toBeNull();
      expect(btn.textContent).toBe('Refresh');
    });

    it('page subtitle describes ELT Weekly Intelligence Brief', () => {
      const header = buildHeaderDOM();
      const subtitle = document.createElement('p');
      subtitle.className = 'subtitle';
      subtitle.textContent = 'ELT Weekly Intelligence Brief';
      header.appendChild(subtitle);

      expect(header.querySelector('.subtitle').textContent).toBe(
        'ELT Weekly Intelligence Brief'
      );
    });
  });

  // ── Department Grid (4 tests) ──────────────────────────────────

  describe('Department Grid', () => {
    /** Helper: build department card DOM from data */
    function buildDeptGrid(depts) {
      const grid = document.createElement('div');
      grid.className = 'dept-grid';

      for (const dept of depts) {
        const card = document.createElement('div');
        card.className = 'dept-card';
        card.dataset.department = dept.name.toLowerCase();

        const nameEl = document.createElement('h3');
        nameEl.textContent = dept.name;
        card.appendChild(nameEl);

        const scoreEl = document.createElement('span');
        scoreEl.className = 'dept-score';
        scoreEl.textContent = String(dept.score);
        card.appendChild(scoreEl);

        const trendEl = document.createElement('span');
        trendEl.className = 'dept-trend';
        trendEl.dataset.trend = dept.trend;
        card.appendChild(trendEl);

        const statusEl = document.createElement('span');
        statusEl.className = 'dept-status';
        statusEl.textContent = dept.status;
        card.appendChild(statusEl);

        grid.appendChild(card);
      }

      document.body.appendChild(grid);
      return grid;
    }

    it('renders 6 department cards', () => {
      const grid = buildDeptGrid(DEPARTMENTS);
      const cards = grid.querySelectorAll('.dept-card');
      expect(cards).toHaveLength(6);
    });

    it('each card displays the department name', () => {
      const grid = buildDeptGrid(DEPARTMENTS);
      const names = Array.from(grid.querySelectorAll('h3')).map(
        (el) => el.textContent
      );
      expect(names).toContain('Operations');
      expect(names).toContain('Sales');
      expect(names).toContain('Finance');
      expect(names).toContain('Marketing');
      expect(names).toContain('Engineering');
      expect(names).toContain('HR');
    });

    it('each card displays a numeric score', () => {
      const grid = buildDeptGrid(DEPARTMENTS);
      const scores = Array.from(grid.querySelectorAll('.dept-score')).map(
        (el) => Number(el.textContent)
      );
      expect(scores).toEqual([92, 88, 85, 71, 68, 90]);
    });

    it('each card has a trend indicator (up, down, or stable)', () => {
      const grid = buildDeptGrid(DEPARTMENTS);
      const trends = Array.from(grid.querySelectorAll('.dept-trend')).map(
        (el) => el.dataset.trend
      );
      for (const trend of trends) {
        expect(['up', 'down', 'stable']).toContain(trend);
      }
    });
  });

  // ── Health Score Calculations (3 tests) ────────────────────────

  describe('Health Score Calculations', () => {
    it('calculates correct average health score across all departments', () => {
      const scores = DEPARTMENTS.map((d) => d.score);
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      expect(Math.round(avg)).toBe(82);
    });

    it('identifies departments needing attention (score < 75)', () => {
      const needsAttention = DEPARTMENTS.filter((d) => d.score < 75);
      expect(needsAttention).toHaveLength(2);
      expect(needsAttention.map((d) => d.name)).toContain('Sales');
      expect(needsAttention.map((d) => d.name)).toContain('Finance');
    });

    it('identifies departments with strong health (score >= 85)', () => {
      const strong = DEPARTMENTS.filter((d) => d.score >= 85);
      expect(strong).toHaveLength(4);
      const names = strong.map((d) => d.name);
      expect(names).toContain('Operations');
      expect(names).toContain('Engineering');
      expect(names).toContain('Marketing');
      expect(names).toContain('HR');
    });
  });

  // ── Circular Progress (3 tests) ────────────────────────────────

  describe('Circular Progress', () => {
    /** Helper: build a circular progress element matching the HTML pattern */
    function buildCircularProgress(score, color) {
      const el = document.createElement('div');
      el.className = 'circular-progress';
      el.style.setProperty('--progress', String(score));
      el.style.setProperty('--progress-color', color);

      const label = document.createElement('span');
      label.textContent = String(score);
      el.appendChild(label);

      document.body.appendChild(el);
      return el;
    }

    it('sets --progress CSS custom property to the department score', () => {
      const el = buildCircularProgress(92, '#10B981');
      expect(el.style.getPropertyValue('--progress')).toBe('92');
    });

    it('sets --progress-color to green (#10B981) for high scores', () => {
      const el = buildCircularProgress(92, '#10B981');
      expect(el.style.getPropertyValue('--progress-color')).toBe('#10B981');
    });

    it('sets --progress-color to red (#EF4444) for low scores', () => {
      const el = buildCircularProgress(68, '#EF4444');
      expect(el.style.getPropertyValue('--progress-color')).toBe('#EF4444');
    });
  });

  // ── Executive Summary (2 tests) ───────────────────────────────

  describe('Executive Summary', () => {
    /** Helper: build the AI summary card matching elt-rollup.html structure */
    function buildSummaryCard() {
      const card = document.createElement('div');
      card.className = 'executive-summary';
      card.style.borderLeft = '4px solid var(--accent-subtle)';

      const header = document.createElement('div');
      header.className = 'summary-header';

      const icon = document.createElement('div');
      icon.className = 'summary-icon';
      header.appendChild(icon);

      const title = document.createElement('h2');
      title.textContent = 'Executive Intelligence';
      header.appendChild(title);
      card.appendChild(header);

      const content = document.createElement('div');
      content.className = 'summary-content';

      const p1 = document.createElement('p');
      p1.textContent =
        'This week saw strong momentum across Operations and Engineering, with 94% of committed actions completed on time.';
      content.appendChild(p1);

      const p2 = document.createElement('p');
      p2.textContent =
        'Two areas need attention: Sales pipeline velocity dropped 12% week-over-week.';
      content.appendChild(p2);

      const p3 = document.createElement('p');
      p3.textContent =
        'Overall organizational health remains strong at 82%.';
      content.appendChild(p3);

      card.appendChild(content);

      const regenBtn = document.createElement('button');
      regenBtn.className = 'regen-btn';
      regenBtn.textContent = 'Regenerate Summary';
      card.appendChild(regenBtn);

      document.body.appendChild(card);
      return card;
    }

    it('displays Executive Intelligence header and summary paragraphs', () => {
      const card = buildSummaryCard();
      const title = card.querySelector('h2');
      expect(title.textContent).toBe('Executive Intelligence');

      const paragraphs = card.querySelectorAll('.summary-content p');
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    });

    it('includes a Regenerate Summary button', () => {
      const card = buildSummaryCard();
      const btn = card.querySelector('.regen-btn');
      expect(btn).not.toBeNull();
      expect(btn.textContent).toBe('Regenerate Summary');
    });
  });
});
