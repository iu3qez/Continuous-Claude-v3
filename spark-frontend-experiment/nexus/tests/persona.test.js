import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Persona Module', () => {
  let WorkbookDemo;
  let persona;

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

    persona = await import('../components/persona.js');
  });

  describe('persona definitions', () => {
    it('defines 4 personas: ceo, ops, engineering, new', () => {
      const all = persona.getAllPersonas();
      expect(all).toHaveLength(4);
      const ids = all.map((p) => p.id);
      expect(ids).toContain('ceo');
      expect(ids).toContain('ops');
      expect(ids).toContain('engineering');
      expect(ids).toContain('new');
    });

    it('each persona has id, name, role, department, avatarColor', () => {
      const all = persona.getAllPersonas();
      for (const p of all) {
        expect(p).toHaveProperty('id');
        expect(p).toHaveProperty('name');
        expect(p).toHaveProperty('role');
        expect(p).toHaveProperty('department');
        expect(p).toHaveProperty('avatarColor');
      }
    });
  });

  describe('getPersona', () => {
    it('returns Jay Altizer for ceo', () => {
      const p = persona.getPersona('ceo');
      expect(p).not.toBeNull();
      expect(p.id).toBe('ceo');
      expect(p.name).toBe('Jay Altizer');
      expect(p.role).toBe('CEO');
      expect(p.department).toBe('Executive');
      expect(p.avatarColor).toBe('#7C3AED');
    });

    it('returns Sarah Chen for ops', () => {
      const p = persona.getPersona('ops');
      expect(p).not.toBeNull();
      expect(p.id).toBe('ops');
      expect(p.name).toBe('Sarah Chen');
      expect(p.role).toBe('COO');
      expect(p.department).toBe('Operations');
      expect(p.avatarColor).toBe('#4F46E5');
    });

    it('returns Marcus Johnson for engineering', () => {
      const p = persona.getPersona('engineering');
      expect(p).not.toBeNull();
      expect(p.id).toBe('engineering');
      expect(p.name).toBe('Marcus Johnson');
      expect(p.role).toBe('VP Engineering');
      expect(p.department).toBe('Engineering');
      expect(p.avatarColor).toBe('#059669');
    });

    it('returns Lisa Park for new', () => {
      const p = persona.getPersona('new');
      expect(p).not.toBeNull();
      expect(p.id).toBe('new');
      expect(p.name).toBe('Lisa Park');
      expect(p.role).toBe('BD Associate');
      expect(p.department).toBe('Business Development');
      expect(p.avatarColor).toBe('#2563EB');
    });

    it('returns null for unknown persona id', () => {
      expect(persona.getPersona('unknown')).toBeNull();
    });
  });

  describe('switchPersona', () => {
    it('updates WorkbookDemo.persona and fires event', () => {
      const callback = vi.fn();
      WorkbookDemo.subscribe('personaChange', callback);

      const result = persona.switchPersona('ops');

      expect(WorkbookDemo.persona).toBe('ops');
      expect(callback).toHaveBeenCalledWith({ persona: 'ops' });
      expect(result).toBe(true);
    });

    it('returns false for invalid persona id', () => {
      const result = persona.switchPersona('invalid');
      expect(result).toBe(false);
      expect(WorkbookDemo.persona).toBe('ceo');
    });
  });

  describe('getPersonaConfig', () => {
    it('returns current persona full config', () => {
      // Default persona is ceo
      const config = persona.getPersonaConfig();
      expect(config).not.toBeNull();
      expect(config.id).toBe('ceo');
      expect(config.name).toBe('Jay Altizer');
    });

    it('returns updated config after switching persona', () => {
      persona.switchPersona('ops');
      const config = persona.getPersonaConfig();
      expect(config.id).toBe('ops');
      expect(config.name).toBe('Sarah Chen');
    });
  });

  describe('getVisibleWorkspaces', () => {
    it('returns all workspaces for ceo', () => {
      const workspaces = persona.getVisibleWorkspaces('ceo');
      expect(workspaces).toEqual(['all']);
    });

    it('returns OPS-focused workspaces for ops', () => {
      const workspaces = persona.getVisibleWorkspaces('ops');
      expect(workspaces).toEqual(['Operations', 'Executive']);
    });

    it('returns engineering workspaces for engineering', () => {
      const workspaces = persona.getVisibleWorkspaces('engineering');
      expect(workspaces).toEqual(['Engineering', 'Product']);
    });

    it('returns limited workspaces for new', () => {
      const workspaces = persona.getVisibleWorkspaces('new');
      expect(workspaces).toEqual(['Business Development']);
    });

    it('returns empty array for unknown persona', () => {
      const workspaces = persona.getVisibleWorkspaces('unknown');
      expect(workspaces).toEqual([]);
    });
  });

  describe('canAccessPage', () => {
    it('ceo can access elt-rollup', () => {
      expect(persona.canAccessPage('elt-rollup', 'ceo')).toBe(true);
    });

    it('ops cannot access elt-rollup', () => {
      expect(persona.canAccessPage('elt-rollup', 'ops')).toBe(false);
    });

    it('engineering cannot access elt-rollup', () => {
      expect(persona.canAccessPage('elt-rollup', 'engineering')).toBe(false);
    });

    it('ceo can access any page', () => {
      expect(persona.canAccessPage('dashboard', 'ceo')).toBe(true);
      expect(persona.canAccessPage('meetings', 'ceo')).toBe(true);
      expect(persona.canAccessPage('random-page', 'ceo')).toBe(true);
    });

    it('new persona has limited page access', () => {
      expect(persona.canAccessPage('dashboard', 'new')).toBe(true);
      expect(persona.canAccessPage('meetings', 'new')).toBe(true);
      expect(persona.canAccessPage('agents', 'new')).toBe(false);
      expect(persona.canAccessPage('connections', 'new')).toBe(false);
    });

    it('returns false for unknown persona', () => {
      expect(persona.canAccessPage('dashboard', 'unknown')).toBe(false);
    });
  });

  describe('getGreeting', () => {
    it('returns greeting for ceo', () => {
      expect(persona.getGreeting('ceo')).toBe('Good morning, Jay');
    });

    it('returns greeting for new', () => {
      expect(persona.getGreeting('new')).toBe('Welcome, Lisa!');
    });

    it('returns greeting for ops', () => {
      expect(persona.getGreeting('ops')).toBe('Good morning, Sarah');
    });

    it('returns greeting for engineering', () => {
      expect(persona.getGreeting('engineering')).toBe('Good morning, Marcus');
    });

    it('returns empty string for unknown persona', () => {
      expect(persona.getGreeting('unknown')).toBe('');
    });
  });
});
