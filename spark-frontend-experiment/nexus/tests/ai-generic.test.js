import { describe, it, expect } from 'vitest';
import {
  GENERIC_TEMPLATES,
  getGenericTemplate,
  selectFallback,
  getGenericIds,
} from '../ai/generic-templates.js';

const EXPECTED_IDS = [
  'data-table',
  'chart',
  'action-list',
  'risk-assessment',
  'executive-summary',
];

describe('Generic Templates (Tier 3)', () => {
  describe('GENERIC_TEMPLATES', () => {
    it('contains exactly 5 templates', () => {
      expect(Object.keys(GENERIC_TEMPLATES)).toHaveLength(5);
    });

    it('has all 5 expected template ids', () => {
      for (const id of EXPECTED_IDS) {
        expect(GENERIC_TEMPLATES).toHaveProperty(id);
      }
    });

    it.each(EXPECTED_IDS)('template "%s" has id, content, toolChips, followUpSuggestions', (id) => {
      const tmpl = GENERIC_TEMPLATES[id];
      expect(tmpl).toHaveProperty('id');
      expect(tmpl.id).toBe(id);
      expect(tmpl).toHaveProperty('content');
      expect(typeof tmpl.content).toBe('string');
      expect(tmpl).toHaveProperty('toolChips');
      expect(Array.isArray(tmpl.toolChips)).toBe(true);
      expect(tmpl).toHaveProperty('followUpSuggestions');
      expect(Array.isArray(tmpl.followUpSuggestions)).toBe(true);
    });

    it.each(EXPECTED_IDS)('template "%s" content is longer than 80 chars', (id) => {
      expect(GENERIC_TEMPLATES[id].content.length).toBeGreaterThan(80);
    });

    it.each(EXPECTED_IDS)('template "%s" uses {{company}} placeholder', (id) => {
      expect(GENERIC_TEMPLATES[id].content).toContain('{{company}}');
    });
  });

  describe('getGenericTemplate', () => {
    it('returns a template object for "data-table"', () => {
      const tmpl = getGenericTemplate('data-table');
      expect(tmpl).not.toBeNull();
      expect(tmpl).not.toBeUndefined();
      expect(tmpl.id).toBe('data-table');
      expect(typeof tmpl.content).toBe('string');
      expect(Array.isArray(tmpl.toolChips)).toBe(true);
      expect(Array.isArray(tmpl.followUpSuggestions)).toBe(true);
    });

    it.each(EXPECTED_IDS)('returns template for "%s"', (id) => {
      const tmpl = getGenericTemplate(id);
      expect(tmpl).toBeDefined();
      expect(tmpl.id).toBe(id);
    });

    it('returns undefined for unknown id', () => {
      const tmpl = getGenericTemplate('nonexistent');
      expect(tmpl).toBeUndefined();
    });
  });

  describe('selectFallback', () => {
    it('returns one of the 5 templates', () => {
      const tmpl = selectFallback();
      expect(tmpl).toBeDefined();
      expect(EXPECTED_IDS).toContain(tmpl.id);
    });

    it('returned template has all required properties', () => {
      const tmpl = selectFallback();
      expect(tmpl).toHaveProperty('id');
      expect(tmpl).toHaveProperty('content');
      expect(tmpl).toHaveProperty('toolChips');
      expect(tmpl).toHaveProperty('followUpSuggestions');
    });

    it('cycles through templates on repeated calls (round-robin)', () => {
      const seen = new Set();
      // Call enough times to see all 5 (round-robin guarantees this)
      for (let i = 0; i < 5; i++) {
        const tmpl = selectFallback();
        seen.add(tmpl.id);
      }
      expect(seen.size).toBe(5);
    });
  });

  describe('getGenericIds', () => {
    it('returns an array of 5 ids', () => {
      const ids = getGenericIds();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids).toHaveLength(5);
    });

    it('contains all expected ids', () => {
      const ids = getGenericIds();
      for (const id of EXPECTED_IDS) {
        expect(ids).toContain(id);
      }
    });

    it('returns a new array each time (not a reference)', () => {
      const ids1 = getGenericIds();
      const ids2 = getGenericIds();
      expect(ids1).not.toBe(ids2);
      expect(ids1).toEqual(ids2);
    });
  });
});
