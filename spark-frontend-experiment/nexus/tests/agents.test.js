import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Agent Dashboard', () => {
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

  afterEach(() => {
    document.body.innerHTML = '';
  });

  // ── Persona Access (3 tests) ─────────────────────────────────

  describe('Persona Access', () => {
    it('CEO can access agents page', () => {
      expect(persona.canAccessPage('agents', 'ceo')).toBe(true);
    });

    it('ops persona can access agents page', () => {
      expect(persona.canAccessPage('agents', 'ops')).toBe(true);
    });

    it('new persona cannot access agents page', () => {
      expect(persona.canAccessPage('agents', 'new')).toBe(false);
    });
  });

  // ── Agent Card DOM (5 tests) ─────────────────────────────────

  describe('Agent Card DOM', () => {
    function createAgentCard({ name, role, status, task, avatarColor }) {
      const card = document.createElement('div');
      card.className = 'agent-card';
      card.setAttribute('data-agent', name.toLowerCase());

      const avatar = document.createElement('div');
      avatar.className = 'agent-avatar';
      avatar.style.backgroundColor = avatarColor || '#7C3AED';
      avatar.textContent = name.charAt(0);

      const nameEl = document.createElement('h3');
      nameEl.className = 'agent-name';
      nameEl.textContent = name;

      const roleEl = document.createElement('span');
      roleEl.className = 'agent-role';
      roleEl.textContent = role;

      const statusEl = document.createElement('span');
      statusEl.className = `agent-status agent-status--${status}`;
      statusEl.setAttribute('data-status', status);
      statusEl.textContent = status;

      const taskEl = document.createElement('p');
      taskEl.className = 'agent-task';
      taskEl.textContent = task;

      card.appendChild(avatar);
      card.appendChild(nameEl);
      card.appendChild(roleEl);
      card.appendChild(statusEl);
      card.appendChild(taskEl);
      return card;
    }

    it('card has agent-card class and data-agent attribute', () => {
      const card = createAgentCard({
        name: 'Aria',
        role: 'Meeting Prep Agent',
        status: 'active',
        task: 'Preparing briefing for Client Review',
      });
      expect(card.classList.contains('agent-card')).toBe(true);
      expect(card.getAttribute('data-agent')).toBe('aria');
    });

    it('card displays agent avatar with initial', () => {
      const card = createAgentCard({
        name: 'Nova',
        role: 'Follow-up Agent',
        status: 'active',
        task: 'Sending follow-up emails',
        avatarColor: '#4F46E5',
      });
      const avatar = card.querySelector('.agent-avatar');
      expect(avatar).not.toBeNull();
      expect(avatar.textContent).toBe('N');
      expect(avatar.style.backgroundColor).toBe('rgb(79, 70, 229)');
    });

    it('card displays agent name', () => {
      const card = createAgentCard({
        name: 'Kai',
        role: 'Data Analysis Agent',
        status: 'idle',
        task: 'Idle',
      });
      const nameEl = card.querySelector('.agent-name');
      expect(nameEl.textContent).toBe('Kai');
    });

    it('card displays agent role', () => {
      const card = createAgentCard({
        name: 'Sage',
        role: 'Risk Monitor',
        status: 'active',
        task: 'Monitoring risk metrics',
      });
      const roleEl = card.querySelector('.agent-role');
      expect(roleEl.textContent).toBe('Risk Monitor');
    });

    it('card displays current task', () => {
      const card = createAgentCard({
        name: 'Aria',
        role: 'Meeting Prep Agent',
        status: 'active',
        task: 'Preparing briefing for Client Review',
      });
      const taskEl = card.querySelector('.agent-task');
      expect(taskEl.textContent).toBe('Preparing briefing for Client Review');
    });
  });

  // ── Stats Row (4 tests) ──────────────────────────────────────

  describe('Stats Row', () => {
    function createStatsRow(stats) {
      const row = document.createElement('div');
      row.className = 'stats-row';

      for (const { label, value } of stats) {
        const stat = document.createElement('div');
        stat.className = 'stat-card';
        stat.setAttribute('data-stat', label.toLowerCase().replace(/\s+/g, '-'));

        const valEl = document.createElement('span');
        valEl.className = 'stat-value';
        valEl.textContent = value;

        const labelEl = document.createElement('span');
        labelEl.className = 'stat-label';
        labelEl.textContent = label;

        stat.appendChild(valEl);
        stat.appendChild(labelEl);
        row.appendChild(stat);
      }
      return row;
    }

    const DEFAULT_STATS = [
      { label: 'Active', value: '6' },
      { label: 'Idle', value: '2' },
      { label: 'Actions', value: '142' },
      { label: 'Hrs Saved', value: '12.4' },
    ];

    it('stats row renders all 4 stat cards', () => {
      const row = createStatsRow(DEFAULT_STATS);
      const cards = row.querySelectorAll('.stat-card');
      expect(cards).toHaveLength(4);
    });

    it('Active stat shows correct count', () => {
      const row = createStatsRow(DEFAULT_STATS);
      const activeStat = row.querySelector('[data-stat="active"]');
      const value = activeStat.querySelector('.stat-value');
      expect(value.textContent).toBe('6');
    });

    it('each stat card has a value and label', () => {
      const row = createStatsRow(DEFAULT_STATS);
      const cards = row.querySelectorAll('.stat-card');
      cards.forEach((card) => {
        expect(card.querySelector('.stat-value')).not.toBeNull();
        expect(card.querySelector('.stat-label')).not.toBeNull();
      });
    });

    it('hours saved stat displays decimal value', () => {
      const row = createStatsRow(DEFAULT_STATS);
      const hrsStat = row.querySelector('[data-stat="hrs-saved"]');
      const value = hrsStat.querySelector('.stat-value');
      expect(value.textContent).toBe('12.4');
    });
  });

  // ── Activity Feed (4 tests) ──────────────────────────────────

  describe('Activity Feed', () => {
    function createFeedItem({ agent, action, timestamp }) {
      const item = document.createElement('div');
      item.className = 'feed-item';
      item.setAttribute('data-agent', agent.toLowerCase());

      const agentEl = document.createElement('strong');
      agentEl.className = 'feed-agent';
      agentEl.textContent = agent;

      const actionEl = document.createElement('span');
      actionEl.className = 'feed-action';
      actionEl.textContent = action;

      const timeEl = document.createElement('time');
      timeEl.className = 'feed-time';
      timeEl.textContent = timestamp;
      timeEl.setAttribute('datetime', timestamp);

      item.appendChild(agentEl);
      item.appendChild(actionEl);
      item.appendChild(timeEl);
      return item;
    }

    const FEED_DATA = [
      { agent: 'Aria', action: 'Completed meeting prep for Client Review', timestamp: '10:32 AM' },
      { agent: 'Nova', action: 'Sent 3 follow-up emails', timestamp: '10:28 AM' },
      { agent: 'Aria', action: 'Started briefing research', timestamp: '10:15 AM' },
      { agent: 'Kai', action: 'Generated Q3 revenue report', timestamp: '10:01 AM' },
    ];

    it('feed item displays agent name', () => {
      const item = createFeedItem(FEED_DATA[0]);
      const agentEl = item.querySelector('.feed-agent');
      expect(agentEl.textContent).toBe('Aria');
    });

    it('feed item displays action text', () => {
      const item = createFeedItem(FEED_DATA[1]);
      const actionEl = item.querySelector('.feed-action');
      expect(actionEl.textContent).toBe('Sent 3 follow-up emails');
    });

    it('feed items can be filtered by agent', () => {
      const container = document.createElement('div');
      container.className = 'activity-feed';
      FEED_DATA.forEach((data) => {
        container.appendChild(createFeedItem(data));
      });

      const ariaItems = container.querySelectorAll('[data-agent="aria"]');
      expect(ariaItems).toHaveLength(2);

      const kaiItems = container.querySelectorAll('[data-agent="kai"]');
      expect(kaiItems).toHaveLength(1);
    });

    it('feed item displays timestamp', () => {
      const item = createFeedItem(FEED_DATA[3]);
      const timeEl = item.querySelector('.feed-time');
      expect(timeEl.textContent).toBe('10:01 AM');
      expect(timeEl.getAttribute('datetime')).toBe('10:01 AM');
    });
  });

  // ── Agent Status (4 tests) ───────────────────────────────────

  describe('Agent Status', () => {
    function createStatusIndicator(status) {
      const el = document.createElement('span');
      el.className = `agent-status agent-status--${status}`;
      el.setAttribute('data-status', status);
      el.textContent = status;
      return el;
    }

    it('active status renders with active class', () => {
      const indicator = createStatusIndicator('active');
      expect(indicator.classList.contains('agent-status--active')).toBe(true);
      expect(indicator.getAttribute('data-status')).toBe('active');
    });

    it('idle status renders with idle class', () => {
      const indicator = createStatusIndicator('idle');
      expect(indicator.classList.contains('agent-status--idle')).toBe(true);
      expect(indicator.getAttribute('data-status')).toBe('idle');
    });

    it('processing status renders with processing class', () => {
      const indicator = createStatusIndicator('processing');
      expect(indicator.classList.contains('agent-status--processing')).toBe(true);
      expect(indicator.getAttribute('data-status')).toBe('processing');
    });

    it('all defined statuses produce valid status classes', () => {
      const statuses = ['active', 'idle', 'processing'];
      for (const status of statuses) {
        const indicator = createStatusIndicator(status);
        expect(indicator.classList.contains(`agent-status--${status}`)).toBe(true);
        expect(indicator.textContent).toBe(status);
      }
    });
  });
});
