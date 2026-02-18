import { describe, it, expect } from 'vitest';
import {
  CATEGORY_RESPONSES,
  getCategoryResponse,
  getCategoryIds,
} from '../ai/category-responses.js';

const ALL_CATEGORY_IDS = [
  'finance',
  'timeline',
  'risk',
  'team',
  'performance',
  'client',
  'meeting',
  'action',
  'decision',
  'strategy',
  'comparison',
  'trend',
  'forecast',
  'summary',
  'search',
  'create',
  'update',
  'report',
  'notify',
  'help',
];

describe('AI Category Responses', () => {
  describe('getCategoryResponse', () => {
    it('returns a response template for finance category', () => {
      const response = getCategoryResponse('finance');
      expect(response).not.toBeNull();
      expect(response).not.toBeUndefined();
      expect(response.category).toBe('finance');
      expect(typeof response.content).toBe('string');
      expect(Array.isArray(response.toolChips)).toBe(true);
      expect(Array.isArray(response.followUpSuggestions)).toBe(true);
    });

    it('returns null for unknown category', () => {
      const response = getCategoryResponse('nonexistent');
      expect(response).toBeNull();
    });

    it('returns null for empty string', () => {
      const response = getCategoryResponse('');
      expect(response).toBeNull();
    });

    it('returns null for undefined', () => {
      const response = getCategoryResponse(undefined);
      expect(response).toBeNull();
    });
  });

  describe('all 20 categories exist', () => {
    it.each(ALL_CATEGORY_IDS)('category "%s" exists in CATEGORY_RESPONSES', (id) => {
      expect(CATEGORY_RESPONSES).toHaveProperty(id);
    });

    it('has exactly 20 categories', () => {
      expect(Object.keys(CATEGORY_RESPONSES).length).toBe(20);
    });
  });

  describe('response shape validation', () => {
    it.each(ALL_CATEGORY_IDS)('category "%s" has required properties', (id) => {
      const response = getCategoryResponse(id);
      expect(response).toHaveProperty('category');
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('toolChips');
      expect(response).toHaveProperty('followUpSuggestions');
    });

    it.each(ALL_CATEGORY_IDS)('category "%s" has category field matching its id', (id) => {
      const response = getCategoryResponse(id);
      expect(response.category).toBe(id);
    });

    it.each(ALL_CATEGORY_IDS)('category "%s" has toolChips as non-empty array of strings', (id) => {
      const response = getCategoryResponse(id);
      expect(Array.isArray(response.toolChips)).toBe(true);
      expect(response.toolChips.length).toBeGreaterThan(0);
      response.toolChips.forEach((chip) => {
        expect(typeof chip).toBe('string');
        expect(chip.length).toBeGreaterThan(0);
      });
    });

    it.each(ALL_CATEGORY_IDS)('category "%s" has followUpSuggestions as non-empty array of strings', (id) => {
      const response = getCategoryResponse(id);
      expect(Array.isArray(response.followUpSuggestions)).toBe(true);
      expect(response.followUpSuggestions.length).toBeGreaterThan(0);
      response.followUpSuggestions.forEach((suggestion) => {
        expect(typeof suggestion).toBe('string');
        expect(suggestion.length).toBeGreaterThan(0);
      });
    });
  });

  describe('content quality', () => {
    it.each(ALL_CATEGORY_IDS)('category "%s" content is longer than 80 characters', (id) => {
      const response = getCategoryResponse(id);
      expect(response.content.length).toBeGreaterThan(80);
    });

    it.each(ALL_CATEGORY_IDS)('category "%s" content contains {{company}} placeholder', (id) => {
      const response = getCategoryResponse(id);
      expect(response.content).toContain('{{company}}');
    });
  });

  describe('getCategoryIds', () => {
    it('returns an array', () => {
      const ids = getCategoryIds();
      expect(Array.isArray(ids)).toBe(true);
    });

    it('returns exactly 20 ids', () => {
      const ids = getCategoryIds();
      expect(ids.length).toBe(20);
    });

    it('contains all expected category ids', () => {
      const ids = getCategoryIds();
      ALL_CATEGORY_IDS.forEach((expectedId) => {
        expect(ids).toContain(expectedId);
      });
    });

    it('returns a new array each time (not a reference)', () => {
      const ids1 = getCategoryIds();
      const ids2 = getCategoryIds();
      expect(ids1).not.toBe(ids2);
      expect(ids1).toEqual(ids2);
    });
  });
});
