import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadPage() {
  const html = readFileSync(resolve(__dirname, '..', 'workspaces.html'), 'utf-8');
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) throw new Error('No body found');
  let content = bodyMatch[1];
  // Remove module scripts (they import ES modules which jsdom can't handle)
  content = content.replace(/<script\s+type="module"[\s\S]*?<\/script>/gi, '');
  document.body.innerHTML = content;
}

describe('Workspaces Page', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  // ── Page Structure (2 tests) ──────────────────────────────

  it('renders with "Workspaces" heading', () => {
    loadPage();
    const headings = document.querySelectorAll('h1');
    const found = Array.from(headings).some(h => h.textContent.trim() === 'Workspaces');
    expect(found).toBe(true);
  });

  it('has sidebar container element', () => {
    loadPage();
    const sidebar = document.getElementById('sidebar') || document.getElementById('sidebar-container');
    expect(sidebar).not.toBeNull();
  });

  // ── Workspace Cards (3 tests) ─────────────────────────────

  it('contains 6 workspace cards', () => {
    loadPage();
    const cards = document.querySelectorAll('[data-workspace]');
    expect(cards.length).toBe(6);
  });

  it('each card shows the workspace name', () => {
    loadPage();
    const expectedNames = ['Operations', 'Engineering', 'Sales', 'Marketing', 'Finance', 'HR'];
    const cards = document.querySelectorAll('[data-workspace]');
    const names = Array.from(cards).map(c => {
      const nameEl = c.querySelector('.workspace-name');
      return nameEl ? nameEl.textContent.trim() : '';
    });
    for (const name of expectedNames) {
      expect(names).toContain(name);
    }
  });

  it('cards are in a grid or flex container', () => {
    loadPage();
    const cards = document.querySelectorAll('[data-workspace]');
    expect(cards.length).toBeGreaterThan(0);
    // All cards should share a common parent that uses grid or flex
    const parent = cards[0].parentElement;
    const hasGrid = parent.className.includes('grid') || parent.style.display === 'grid';
    const hasFlex = parent.className.includes('flex') || parent.style.display === 'flex';
    expect(hasGrid || hasFlex).toBe(true);
  });

  // ── Card Details (4 tests) ────────────────────────────────

  it('each card shows member count', () => {
    loadPage();
    const cards = document.querySelectorAll('[data-workspace]');
    for (const card of cards) {
      const text = card.textContent;
      expect(text).toMatch(/\d+\s*members/i);
    }
  });

  it('each card shows agent count', () => {
    loadPage();
    const cards = document.querySelectorAll('[data-workspace]');
    for (const card of cards) {
      const text = card.textContent;
      expect(text).toMatch(/\d+\s*agents?/i);
    }
  });

  it('each card has Active or Inactive status indicator', () => {
    loadPage();
    const cards = document.querySelectorAll('[data-workspace]');
    for (const card of cards) {
      const statusEl = card.querySelector('[data-status]');
      expect(statusEl).not.toBeNull();
      const status = statusEl.getAttribute('data-status');
      expect(['active', 'inactive']).toContain(status);
    }
  });

  it('at least one workspace is Active and at least one is Inactive', () => {
    loadPage();
    const statusEls = document.querySelectorAll('[data-workspace] [data-status]');
    const statuses = Array.from(statusEls).map(el => el.getAttribute('data-status'));
    expect(statuses).toContain('active');
    expect(statuses).toContain('inactive');
  });

  // ── Create Button (1 test) ────────────────────────────────

  it('"Create Workspace" button exists', () => {
    loadPage();
    const buttons = document.querySelectorAll('button');
    const createBtn = Array.from(buttons).find(b =>
      b.textContent.trim().toLowerCase().includes('create workspace')
    );
    expect(createBtn).toBeDefined();
    expect(createBtn).not.toBeNull();
  });

  // ── Sidebar Nav Item (1 test) ─────────────────────────────

  describe('Sidebar Navigation', () => {
    let sidebar;

    beforeEach(async () => {
      vi.resetModules();
      sidebar = await import('../components/sidebar.js');
    });

    it('sidebar includes workspaces nav item', () => {
      const container = document.createElement('div');
      sidebar.createSidebar(container);
      const navItem = container.querySelector('[data-nav-id="workspaces"]');
      expect(navItem).not.toBeNull();
      expect(navItem.textContent).toContain('Workspaces');
    });
  });
});
