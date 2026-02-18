import { describe, it, expect } from 'vitest';
import { DEMO_ARCS, getArc, getArcsForAudience, validateArc } from '../demo/arcs.js';

describe('Demo Arcs', () => {
  describe('DEMO_ARCS structure', () => {
    it('has exactly 5 arcs', () => {
      expect(DEMO_ARCS).toHaveLength(5);
    });

    it('each arc has required fields', () => {
      for (const arc of DEMO_ARCS) {
        expect(arc).toHaveProperty('id');
        expect(arc).toHaveProperty('title');
        expect(arc).toHaveProperty('audience');
        expect(arc).toHaveProperty('summary');
        expect(arc).toHaveProperty('steps');
        expect(Array.isArray(arc.steps)).toBe(true);
        expect(arc.steps.length).toBeGreaterThan(0);
      }
    });

    it('each step has required fields', () => {
      for (const arc of DEMO_ARCS) {
        for (const step of arc.steps) {
          expect(step).toHaveProperty('page');
          expect(step).toHaveProperty('narration');
          expect(step).toHaveProperty('duration');
          expect(step.duration).toBeGreaterThan(0);
        }
      }
    });

    it('arcs have correct step counts', () => {
      expect(DEMO_ARCS[0].steps).toHaveLength(9); // New Customer Journey
      expect(DEMO_ARCS[1].steps).toHaveLength(8); // Day in the Life
      expect(DEMO_ARCS[2].steps).toHaveLength(6); // Executive Rollup
      expect(DEMO_ARCS[3].steps).toHaveLength(6); // AI Agent Showcase
      expect(DEMO_ARCS[4].steps).toHaveLength(5); // Integration Story
    });

    it('arc IDs are sequential 1-5', () => {
      const ids = DEMO_ARCS.map(a => a.id);
      expect(ids).toEqual([1, 2, 3, 4, 5]);
    });

    it('audiences are valid values', () => {
      const validAudiences = ['customers', 'team', 'investors'];
      for (const arc of DEMO_ARCS) {
        expect(validAudiences).toContain(arc.audience);
      }
    });
  });

  describe('getArc', () => {
    it('returns arc by ID', () => {
      const arc = getArc(1);
      expect(arc).not.toBeNull();
      expect(arc.title).toBe('New Customer Journey');
    });

    it('returns null for invalid ID', () => {
      expect(getArc(99)).toBeNull();
      expect(getArc(0)).toBeNull();
    });
  });

  describe('getArcsForAudience', () => {
    it('returns customer arcs', () => {
      const arcs = getArcsForAudience('customers');
      expect(arcs.length).toBeGreaterThan(0);
      arcs.forEach(a => expect(a.audience).toBe('customers'));
    });

    it('returns investor arcs', () => {
      const arcs = getArcsForAudience('investors');
      expect(arcs.length).toBeGreaterThan(0);
      arcs.forEach(a => expect(a.audience).toBe('investors'));
    });

    it('returns empty for unknown audience', () => {
      expect(getArcsForAudience('aliens')).toHaveLength(0);
    });
  });

  describe('validateArc', () => {
    it('validates all built-in arcs', () => {
      for (const arc of DEMO_ARCS) {
        expect(validateArc(arc)).toBe(true);
      }
    });

    it('rejects arc without steps', () => {
      expect(validateArc({ id: 1, title: 'X', audience: 'team' })).toBe(false);
    });

    it('rejects arc with empty steps', () => {
      expect(validateArc({ id: 1, title: 'X', audience: 'team', steps: [] })).toBe(false);
    });

    it('rejects null/undefined', () => {
      expect(validateArc(null)).toBe(false);
      expect(validateArc(undefined)).toBe(false);
    });

    it('rejects step without duration', () => {
      const bad = { id: 1, title: 'X', audience: 'team', steps: [{ page: 'a.html', narration: 'hi' }] };
      expect(validateArc(bad)).toBe(false);
    });
  });
});
