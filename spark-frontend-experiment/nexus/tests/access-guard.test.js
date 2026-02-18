import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Access Guard', () => {
  let accessGuard;
  let WorkbookDemo;

  beforeEach(async () => {
    vi.resetModules();
    document.body.innerHTML = '';
    localStorage.clear();

    const stateMod = await import('../components/state.js');
    WorkbookDemo = stateMod.default;
    WorkbookDemo.industry = 'consulting';
    WorkbookDemo._listeners = {};

    accessGuard = await import('../components/access-guard.js');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('enforceAccess', () => {
    it('returns true and shows no overlay when persona can access page', () => {
      WorkbookDemo.persona = 'ceo';
      document.body.innerHTML = '<main id="main-content"><p>Dashboard content</p></main>';
      const result = accessGuard.enforceAccess('dashboard', document.getElementById('main-content'));
      expect(result).toBe(true);
      expect(document.querySelector('.access-restricted')).toBeNull();
    });

    it('returns false and shows overlay when ops persona accesses elt-rollup', () => {
      WorkbookDemo.persona = 'ops';
      document.body.innerHTML = '<main id="main-content"><p>ELT content</p></main>';
      const result = accessGuard.enforceAccess('elt-rollup', document.getElementById('main-content'));
      expect(result).toBe(false);
      const overlay = document.querySelector('.access-restricted');
      expect(overlay).not.toBeNull();
    });

    it('returns true for ceo accessing elt-rollup (ceo has all access)', () => {
      WorkbookDemo.persona = 'ceo';
      document.body.innerHTML = '<main id="main-content"><p>ELT content</p></main>';
      const result = accessGuard.enforceAccess('elt-rollup', document.getElementById('main-content'));
      expect(result).toBe(true);
    });

    it('returns true for new persona accessing dashboard (universal page)', () => {
      WorkbookDemo.persona = 'new';
      document.body.innerHTML = '<main id="main-content"><p>Dashboard</p></main>';
      const result = accessGuard.enforceAccess('dashboard', document.getElementById('main-content'));
      expect(result).toBe(true);
    });

    it('returns false for new persona accessing connections', () => {
      WorkbookDemo.persona = 'new';
      document.body.innerHTML = '<main id="main-content"><p>Connections</p></main>';
      const result = accessGuard.enforceAccess('connections', document.getElementById('main-content'));
      expect(result).toBe(false);
    });

    it('returns false for new persona accessing calendar', () => {
      WorkbookDemo.persona = 'new';
      document.body.innerHTML = '<main id="main-content"><p>Calendar</p></main>';
      const result = accessGuard.enforceAccess('calendar', document.getElementById('main-content'));
      expect(result).toBe(false);
    });
  });

  describe('restriction overlay', () => {
    it('overlay contains "Access Restricted" text', () => {
      WorkbookDemo.persona = 'new';
      document.body.innerHTML = '<main id="main-content"><p>Content</p></main>';
      accessGuard.enforceAccess('connections', document.getElementById('main-content'));
      const overlay = document.querySelector('.access-restricted');
      expect(overlay.textContent).toContain('Access Restricted');
    });

    it('overlay contains link to dashboard', () => {
      WorkbookDemo.persona = 'new';
      document.body.innerHTML = '<main id="main-content"><p>Content</p></main>';
      accessGuard.enforceAccess('connections', document.getElementById('main-content'));
      const link = document.querySelector('.access-restricted a');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toContain('dashboard');
    });

    it('main content is hidden when restricted', () => {
      WorkbookDemo.persona = 'new';
      document.body.innerHTML = '<main id="main-content"><p>Content</p></main>';
      const main = document.getElementById('main-content');
      accessGuard.enforceAccess('connections', main);
      expect(main.style.display).toBe('none');
    });

    it('main content is visible when allowed', () => {
      WorkbookDemo.persona = 'ceo';
      document.body.innerHTML = '<main id="main-content"><p>Content</p></main>';
      const main = document.getElementById('main-content');
      accessGuard.enforceAccess('connections', main);
      expect(main.style.display).not.toBe('none');
    });
  });
});
