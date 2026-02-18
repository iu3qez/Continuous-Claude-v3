/**
 * Demo Compliance Tests - DEMO-SPEC.md Section 5
 * Validates arc definitions, step structure, page references,
 * keyboard shortcuts, and demo bar integration.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DEMO_ARCS, getArc, getArcsForAudience, validateArc } from '../demo/arcs.js';

// Valid HTML pages in the nexus project (no hash fragments)
const VALID_PAGES = [
  'index.html', 'dashboard.html', 'meetings.html', 'meeting-detail.html',
  'actions.html', 'decisions.html', 'proposals.html', 'my-work.html',
  'calendar.html', 'agents.html', 'marketplace.html', 'connections.html',
  'settings.html', 'elt-rollup.html',
  'onboarding/step-1-company.html', 'onboarding/step-2-departments.html',
  'onboarding/step-3-tools.html', 'onboarding/step-4-connect.html',
  'onboarding/step-5-scanning.html', 'onboarding/step-6-insight.html',
];

// ── 1. Arc Count ──────────────────────────────────────────────

describe('Demo Compliance - Arc Count', () => {
  it('defines exactly 5 arcs', () => {
    expect(DEMO_ARCS).toHaveLength(5);
  });

  it('each arc has a unique ID', () => {
    const ids = DEMO_ARCS.map(a => a.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ── 2. Arc 1 Structure ───────────────────────────────────────

describe('Demo Compliance - Arc 1: New Customer Journey', () => {
  const arc = DEMO_ARCS[0];

  it('has exactly 9 steps', () => {
    expect(arc.steps).toHaveLength(9);
  });

  it('has the correct title', () => {
    expect(arc.title).toBe('New Customer Journey');
  });

  it('targets the customers audience', () => {
    expect(arc.audience).toBe('customers');
  });
});

// ── 3. Arc 2 Structure ───────────────────────────────────────

describe('Demo Compliance - Arc 2: Day in the Life', () => {
  const arc = DEMO_ARCS[1];

  it('has exactly 8 steps', () => {
    expect(arc.steps).toHaveLength(8);
  });

  it('targets the team audience', () => {
    expect(arc.audience).toBe('team');
  });
});

// ── 4. Arc 3 Structure ───────────────────────────────────────

describe('Demo Compliance - Arc 3: Executive Rollup', () => {
  const arc = DEMO_ARCS[2];

  it('has exactly 6 steps', () => {
    expect(arc.steps).toHaveLength(6);
  });

  it('targets the investors audience', () => {
    expect(arc.audience).toBe('investors');
  });
});

// ── 5. Arc 4 Structure ───────────────────────────────────────

describe('Demo Compliance - Arc 4: AI Agent Showcase', () => {
  const arc = DEMO_ARCS[3];

  it('has exactly 6 steps', () => {
    expect(arc.steps).toHaveLength(6);
  });

  it('targets the investors audience', () => {
    expect(arc.audience).toBe('investors');
  });
});

// ── 6. Arc 5 Structure ───────────────────────────────────────

describe('Demo Compliance - Arc 5: Integration Story', () => {
  const arc = DEMO_ARCS[4];

  it('has exactly 5 steps', () => {
    expect(arc.steps).toHaveLength(5);
  });

  it('targets the customers audience', () => {
    expect(arc.audience).toBe('customers');
  });
});

// ── 7. Step Validation ───────────────────────────────────────

describe('Demo Compliance - Step Validation', () => {
  it('every step has page, narration, highlight, and duration', () => {
    for (const arc of DEMO_ARCS) {
      for (const step of arc.steps) {
        expect(step).toHaveProperty('page');
        expect(step).toHaveProperty('narration');
        expect(step).toHaveProperty('highlight');
        expect(step).toHaveProperty('duration');
      }
    }
  });

  it('every highlight is a non-empty CSS selector string', () => {
    for (const arc of DEMO_ARCS) {
      for (const step of arc.steps) {
        expect(typeof step.highlight).toBe('string');
        expect(step.highlight.length).toBeGreaterThan(0);
      }
    }
  });

  it('every duration is a positive number in milliseconds', () => {
    for (const arc of DEMO_ARCS) {
      for (const step of arc.steps) {
        expect(typeof step.duration).toBe('number');
        expect(step.duration).toBeGreaterThanOrEqual(1000);
      }
    }
  });
});

// ── 8. Page References ───────────────────────────────────────

describe('Demo Compliance - Page References', () => {
  it('all step pages reference valid HTML files', () => {
    for (const arc of DEMO_ARCS) {
      for (const step of arc.steps) {
        const basePage = step.page.split('#')[0];
        expect(VALID_PAGES).toContain(basePage);
      }
    }
  });

  it('page references end with .html', () => {
    for (const arc of DEMO_ARCS) {
      for (const step of arc.steps) {
        const basePage = step.page.split('#')[0];
        expect(basePage).toMatch(/\.html$/);
      }
    }
  });

  it('page hash fragments (if present) are non-empty', () => {
    for (const arc of DEMO_ARCS) {
      for (const step of arc.steps) {
        const hashIndex = step.page.indexOf('#');
        if (hashIndex !== -1) {
          const fragment = step.page.slice(hashIndex + 1);
          expect(fragment.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

// ── 9. getArc() ──────────────────────────────────────────────

describe('Demo Compliance - getArc()', () => {
  it('returns the correct arc for each valid ID', () => {
    for (let id = 1; id <= 5; id++) {
      const arc = getArc(id);
      expect(arc).not.toBeNull();
      expect(arc.id).toBe(id);
    }
  });

  it('returns null for out-of-range and invalid IDs', () => {
    expect(getArc(0)).toBeNull();
    expect(getArc(6)).toBeNull();
    expect(getArc(-1)).toBeNull();
    expect(getArc(999)).toBeNull();
  });
});

// ── 10. getArcsForAudience() ─────────────────────────────────

describe('Demo Compliance - getArcsForAudience()', () => {
  it('returns exactly 2 arcs for customers', () => {
    const arcs = getArcsForAudience('customers');
    expect(arcs).toHaveLength(2);
    arcs.forEach(a => expect(a.audience).toBe('customers'));
  });

  it('returns exactly 2 arcs for investors', () => {
    const arcs = getArcsForAudience('investors');
    expect(arcs).toHaveLength(2);
    arcs.forEach(a => expect(a.audience).toBe('investors'));
  });

  it('returns exactly 1 arc for team', () => {
    const arcs = getArcsForAudience('team');
    expect(arcs).toHaveLength(1);
    expect(arcs[0].audience).toBe('team');
  });
});

// ── 11. Keyboard Shortcuts ───────────────────────────────────

describe('Demo Compliance - Keyboard Shortcuts', () => {
  let keyboardMod;
  let WorkbookDemo;

  beforeEach(async () => {
    vi.resetModules();

    // Mock state so keyboard.js can import it
    vi.mock('../components/state.js', () => ({
      default: {
        demoMode: 'guided',
        industry: 'consulting',
        persona: 'ceo',
      },
    }));

    WorkbookDemo = (await import('../components/state.js')).default;
    WorkbookDemo.demoMode = 'guided';
    keyboardMod = await import('../components/keyboard.js');
    keyboardMod.initKeyboard();
  });

  afterEach(() => {
    if (keyboardMod && keyboardMod.destroyKeyboard) {
      keyboardMod.destroyKeyboard();
    }
  });

  it('Space dispatches demo-next in guided mode', () => {
    const spy = vi.fn();
    document.addEventListener('demo-next', spy);

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true })
    );

    expect(spy).toHaveBeenCalledTimes(1);
    document.removeEventListener('demo-next', spy);
  });

  it('ArrowLeft dispatches demo-prev in guided mode', () => {
    const spy = vi.fn();
    document.addEventListener('demo-prev', spy);

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
    );

    expect(spy).toHaveBeenCalledTimes(1);
    document.removeEventListener('demo-prev', spy);
  });

  it('Escape dispatches demo-exit in guided mode', () => {
    const spy = vi.fn();
    document.addEventListener('demo-exit', spy);

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );

    expect(spy).toHaveBeenCalledTimes(1);
    document.removeEventListener('demo-exit', spy);
  });
});

// ── 12. Demo Bar ─────────────────────────────────────────────

describe('Demo Compliance - Demo Bar', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('initDemoBar creates the bar element', async () => {
    const { initDemoBar } = await import('../demo/demo-bar.js');
    initDemoBar();
    const bar = document.getElementById('demo-bar');
    expect(bar).not.toBeNull();
  });

  it('bar contains prev, next, and close navigation buttons', async () => {
    const { initDemoBar } = await import('../demo/demo-bar.js');
    initDemoBar();
    expect(document.getElementById('demo-prev')).not.toBeNull();
    expect(document.getElementById('demo-next')).not.toBeNull();
    expect(document.getElementById('demo-close')).not.toBeNull();
  });

  it('bar contains an arc selector with options for all 5 arcs', async () => {
    const { initDemoBar } = await import('../demo/demo-bar.js');
    initDemoBar();
    const select = document.getElementById('demo-arc-select');
    expect(select).not.toBeNull();
    // 1 default "Scene..." option + 5 arc options
    expect(select.options.length).toBe(6);
  });
});
