import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need a fresh import for each test to reset state
// Use dynamic import + resetModules approach
describe('WorkbookDemo State', () => {
  let WorkbookDemo;

  beforeEach(async () => {
    // Clear localStorage before each test (setup.js afterEach also clears)
    localStorage.clear();

    // Reset modules to get fresh state each test
    vi.resetModules();

    const mod = await import('../components/state.js');
    WorkbookDemo = mod.default;

    // Reset internal state for tests that don't rely on localStorage init
    WorkbookDemo.industry = 'consulting';
    WorkbookDemo.persona = 'ceo';
    WorkbookDemo.demoMode = 'free';
    WorkbookDemo.currentArc = null;
    WorkbookDemo.currentStep = 0;
    WorkbookDemo.aiMode = 'scripted';
    WorkbookDemo.theme = 'dark';
    WorkbookDemo._listeners = {};
  });

  describe('initial state defaults', () => {
    it('has correct default values', () => {
      expect(WorkbookDemo.industry).toBe('consulting');
      expect(WorkbookDemo.persona).toBe('ceo');
      expect(WorkbookDemo.demoMode).toBe('free');
      expect(WorkbookDemo.aiMode).toBe('scripted');
      expect(WorkbookDemo.theme).toBe('dark');
    });

    it('has null currentArc and zero currentStep', () => {
      expect(WorkbookDemo.currentArc).toBeNull();
      expect(WorkbookDemo.currentStep).toBe(0);
    });
  });

  describe('switchIndustry', () => {
    it('updates state.industry when given a valid industry', () => {
      WorkbookDemo.switchIndustry('tech');
      expect(WorkbookDemo.industry).toBe('tech');
    });

    it('fires industryChange event on switch', () => {
      const callback = vi.fn();
      WorkbookDemo.subscribe('industryChange', callback);
      WorkbookDemo.switchIndustry('tech');
      expect(callback).toHaveBeenCalledWith({ industry: 'tech' });
    });

    it('persists industry to localStorage', () => {
      WorkbookDemo.switchIndustry('hospitality');
      expect(localStorage.getItem('workbook-industry')).toBe('hospitality');
    });

    it('rejects invalid industry values', () => {
      WorkbookDemo.switchIndustry('invalid');
      expect(WorkbookDemo.industry).toBe('consulting');
    });
  });

  describe('switchPersona', () => {
    it('updates state.persona when given a valid persona', () => {
      WorkbookDemo.switchPersona('ops');
      expect(WorkbookDemo.persona).toBe('ops');
    });

    it('fires personaChange event on switch', () => {
      const callback = vi.fn();
      WorkbookDemo.subscribe('personaChange', callback);
      WorkbookDemo.switchPersona('ops');
      expect(callback).toHaveBeenCalledWith({ persona: 'ops' });
    });

    it('persists persona to localStorage', () => {
      WorkbookDemo.switchPersona('engineering');
      expect(localStorage.getItem('workbook-persona')).toBe('engineering');
    });

    it('rejects invalid persona values', () => {
      WorkbookDemo.switchPersona('badpersona');
      expect(WorkbookDemo.persona).toBe('ceo');
    });
  });

  describe('startArc', () => {
    it('sets demoMode to guided', () => {
      WorkbookDemo.startArc(1);
      expect(WorkbookDemo.demoMode).toBe('guided');
    });

    it('sets currentArc to the given arcId', () => {
      WorkbookDemo.startArc(1);
      expect(WorkbookDemo.currentArc).toBe(1);
    });

    it('resets currentStep to 0', () => {
      WorkbookDemo.currentStep = 5;
      WorkbookDemo.startArc(2);
      expect(WorkbookDemo.currentStep).toBe(0);
    });
  });

  describe('nextStep', () => {
    it('increments currentStep', () => {
      WorkbookDemo.currentStep = 0;
      WorkbookDemo.nextStep();
      expect(WorkbookDemo.currentStep).toBe(1);
    });

    it('increments multiple times', () => {
      WorkbookDemo.currentStep = 0;
      WorkbookDemo.nextStep();
      WorkbookDemo.nextStep();
      WorkbookDemo.nextStep();
      expect(WorkbookDemo.currentStep).toBe(3);
    });
  });

  describe('prevStep', () => {
    it('decrements currentStep', () => {
      WorkbookDemo.currentStep = 3;
      WorkbookDemo.prevStep();
      expect(WorkbookDemo.currentStep).toBe(2);
    });

    it('does not go below 0', () => {
      WorkbookDemo.currentStep = 0;
      WorkbookDemo.prevStep();
      expect(WorkbookDemo.currentStep).toBe(0);
    });
  });

  describe('toggleAiMode', () => {
    it('toggles from scripted to live', () => {
      WorkbookDemo.aiMode = 'scripted';
      WorkbookDemo.toggleAiMode();
      expect(WorkbookDemo.aiMode).toBe('live');
    });

    it('toggles from live to scripted', () => {
      WorkbookDemo.aiMode = 'live';
      WorkbookDemo.toggleAiMode();
      expect(WorkbookDemo.aiMode).toBe('scripted');
    });
  });

  describe('toggleTheme', () => {
    it('toggles from dark to light', () => {
      WorkbookDemo.theme = 'dark';
      WorkbookDemo.toggleTheme();
      expect(WorkbookDemo.theme).toBe('light');
    });

    it('toggles from light to dark', () => {
      WorkbookDemo.theme = 'light';
      WorkbookDemo.toggleTheme();
      expect(WorkbookDemo.theme).toBe('dark');
    });

    it('persists theme to localStorage', () => {
      WorkbookDemo.theme = 'dark';
      WorkbookDemo.toggleTheme();
      expect(localStorage.getItem('workbook-theme')).toBe('light');
    });
  });

  describe('subscribe / notify / unsubscribe', () => {
    it('subscribe registers a listener that receives notifications', () => {
      const callback = vi.fn();
      WorkbookDemo.subscribe('testEvent', callback);
      WorkbookDemo.notify('testEvent', { value: 42 });
      expect(callback).toHaveBeenCalledWith({ value: 42 });
    });

    it('multiple subscribers receive notifications', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      WorkbookDemo.subscribe('testEvent', cb1);
      WorkbookDemo.subscribe('testEvent', cb2);
      WorkbookDemo.notify('testEvent', { value: 'hello' });
      expect(cb1).toHaveBeenCalledWith({ value: 'hello' });
      expect(cb2).toHaveBeenCalledWith({ value: 'hello' });
    });

    it('unsubscribe removes a listener', () => {
      const callback = vi.fn();
      WorkbookDemo.subscribe('testEvent', callback);
      WorkbookDemo.unsubscribe('testEvent', callback);
      WorkbookDemo.notify('testEvent', { value: 'nope' });
      expect(callback).not.toHaveBeenCalled();
    });

    it('notify with no subscribers does not throw', () => {
      expect(() => WorkbookDemo.notify('noListeners', {})).not.toThrow();
    });
  });

  describe('localStorage persistence on init', () => {
    it('loads industry from localStorage on init', async () => {
      localStorage.setItem('workbook-industry', 'tech');
      vi.resetModules();
      const mod = await import('../components/state.js');
      const freshState = mod.default;
      expect(freshState.industry).toBe('tech');
    });

    it('loads persona from localStorage on init', async () => {
      localStorage.setItem('workbook-persona', 'engineering');
      vi.resetModules();
      const mod = await import('../components/state.js');
      const freshState = mod.default;
      expect(freshState.persona).toBe('engineering');
    });

    it('loads theme from localStorage on init', async () => {
      localStorage.setItem('workbook-theme', 'light');
      vi.resetModules();
      const mod = await import('../components/state.js');
      const freshState = mod.default;
      expect(freshState.theme).toBe('light');
    });

    it('ignores invalid localStorage values for industry', async () => {
      localStorage.setItem('workbook-industry', 'badvalue');
      vi.resetModules();
      const mod = await import('../components/state.js');
      const freshState = mod.default;
      expect(freshState.industry).toBe('consulting');
    });

    it('ignores invalid localStorage values for persona', async () => {
      localStorage.setItem('workbook-persona', 'badvalue');
      vi.resetModules();
      const mod = await import('../components/state.js');
      const freshState = mod.default;
      expect(freshState.persona).toBe('ceo');
    });
  });
});
