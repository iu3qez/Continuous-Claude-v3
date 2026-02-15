import { describe, it, expect } from 'vitest';
import {
  getShowcaseResponse,
  adaptShowcaseResponse,
  getShowcaseIds,
  SHOWCASE_RESPONSES,
} from '../ai/showcase-responses.js';

const ALL_IDS = [
  'meeting-prep',
  'q2-status',
  'blockers',
  'today-focus',
  'pipeline',
  'deal-stalled',
  'board-summary',
  'yesterday',
  'dept-compare',
  'follow-up-email',
];

describe('AI Showcase Responses', () => {
  describe('getShowcaseResponse', () => {
    it('returns a response object for meeting-prep', () => {
      const response = getShowcaseResponse('meeting-prep');
      expect(response).toBeDefined();
      expect(response).not.toBeNull();
    });

    it('response has required properties: id, trigger, content, toolChips, followUpSuggestions', () => {
      const response = getShowcaseResponse('meeting-prep');
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('trigger');
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('toolChips');
      expect(response).toHaveProperty('followUpSuggestions');
    });

    it('content is a string with structured content', () => {
      const response = getShowcaseResponse('meeting-prep');
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
    });

    it('toolChips is an array', () => {
      const response = getShowcaseResponse('meeting-prep');
      expect(Array.isArray(response.toolChips)).toBe(true);
    });

    it('followUpSuggestions is an array of 3', () => {
      const response = getShowcaseResponse('meeting-prep');
      expect(Array.isArray(response.followUpSuggestions)).toBe(true);
      expect(response.followUpSuggestions).toHaveLength(3);
    });

    it('returns null for unknown id', () => {
      const response = getShowcaseResponse('nonexistent');
      expect(response).toBeNull();
    });
  });

  describe('all 10 showcase responses exist', () => {
    it.each(ALL_IDS)('showcase response "%s" exists', (id) => {
      const response = getShowcaseResponse(id);
      expect(response).not.toBeNull();
      expect(response.id).toBe(id);
    });
  });

  describe('industry placeholders', () => {
    it.each(ALL_IDS)(
      'response "%s" content includes at least one placeholder',
      (id) => {
        const response = getShowcaseResponse(id);
        const hasPlaceholder = /\{\{[a-zA-Z]+\}\}/.test(response.content);
        expect(hasPlaceholder).toBe(true);
      }
    );
  });

  describe('adaptShowcaseResponse', () => {
    it('replaces {{company}} with provided value', () => {
      const response = getShowcaseResponse('meeting-prep');
      const adapted = adaptShowcaseResponse(response, { company: 'TestCo' });
      expect(adapted.content).toContain('TestCo');
      expect(adapted.content).not.toContain('{{company}}');
    });

    it('replaces multiple placeholders at once', () => {
      const response = getShowcaseResponse('q2-status');
      const adapted = adaptShowcaseResponse(response, {
        company: 'TestCo',
        metric: '82%',
      });
      expect(adapted.content).not.toContain('{{company}}');
    });

    it('returns a new object without modifying the original', () => {
      const response = getShowcaseResponse('meeting-prep');
      const originalContent = response.content;
      adaptShowcaseResponse(response, { company: 'TestCo' });
      expect(response.content).toBe(originalContent);
    });
  });

  describe('getShowcaseIds', () => {
    it('returns an array of 10 ids', () => {
      const ids = getShowcaseIds();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids).toHaveLength(10);
    });

    it('contains all expected ids', () => {
      const ids = getShowcaseIds();
      ALL_IDS.forEach((id) => {
        expect(ids).toContain(id);
      });
    });
  });

  describe('meeting-prep specific', () => {
    it('has correct toolChips', () => {
      const response = getShowcaseResponse('meeting-prep');
      expect(response.toolChips).toContain('Querying CRM');
      expect(response.toolChips).toContain('Checking Calendar');
      expect(response.toolChips).toContain('Scanning Email');
    });
  });

  describe('content length', () => {
    it.each(ALL_IDS)(
      'response "%s" has at least 100 characters of content',
      (id) => {
        const response = getShowcaseResponse(id);
        expect(response.content.length).toBeGreaterThanOrEqual(100);
      }
    );
  });
});
