import { describe, it, expect, beforeEach } from 'vitest';
import {
  matchTier1,
  matchTier2Keywords,
  adaptResponse,
  getToolChips,
  getResponse,
} from '../ai/response-engine.js';

describe('AI Response Engine', () => {
  describe('matchTier1', () => {
    it('returns match for exact trigger phrase with context', () => {
      const match = matchTier1('prep me for this meeting', 'meeting-detail');
      expect(match).not.toBeNull();
      expect(match.responseId).toBe('meeting-prep');
    });

    it('returns match for trigger phrase without context requirement', () => {
      const match = matchTier1('status of q2 results');
      expect(match).not.toBeNull();
      expect(match.responseId).toBe('q2-status');
    });

    it('returns null for random unrecognized input', () => {
      const match = matchTier1('random');
      expect(match).toBeNull();
    });

    it('matches partial trigger phrases within longer queries', () => {
      const match = matchTier1('can you prep me for the meeting');
      expect(match).not.toBeNull();
      expect(match.responseId).toBe('meeting-prep');
    });
  });

  describe('matchTier2Keywords', () => {
    it('returns finance category for budget-related query', () => {
      const category = matchTier2Keywords('what about the budget and costs');
      expect(category).toBe('finance');
    });

    it('returns timeline category for deadline-related query', () => {
      const category = matchTier2Keywords('when is the deadline');
      expect(category).toBe('timeline');
    });

    it('returns null for unrecognized input', () => {
      const category = matchTier2Keywords('xyz abc');
      expect(category).toBeNull();
    });

    it('returns risk category for problem-related query', () => {
      const category = matchTier2Keywords('what are the risks and issues');
      expect(category).toBe('risk');
    });

    it('returns team category for assignment query', () => {
      const category = matchTier2Keywords('who should we assign this to');
      expect(category).toBe('team');
    });
  });

  describe('adaptResponse', () => {
    it('replaces {{company}} placeholder with context value', () => {
      const response = { content: 'Report for {{company}} is ready.' };
      const adapted = adaptResponse(response, { company: 'TestCo' });
      expect(adapted.content).toBe('Report for TestCo is ready.');
    });

    it('replaces {{metric}} placeholder with context value', () => {
      const response = { content: 'Revenue is {{metric}} this quarter.' };
      const adapted = adaptResponse(response, { metric: '$500K' });
      expect(adapted.content).toBe('Revenue is $500K this quarter.');
    });

    it('replaces multiple placeholders at once', () => {
      const response = { content: '{{company}} revenue: {{metric}}' };
      const adapted = adaptResponse(response, {
        company: 'TestCo',
        metric: '$500K',
      });
      expect(adapted.content).toBe('TestCo revenue: $500K');
    });

    it('returns original content when no placeholders match', () => {
      const response = { content: 'No placeholders here.' };
      const adapted = adaptResponse(response, { company: 'TestCo' });
      expect(adapted.content).toBe('No placeholders here.');
    });
  });

  describe('getToolChips', () => {
    it('returns array of tool-use chip labels for meeting-prep', () => {
      const chips = getToolChips('meeting-prep');
      expect(Array.isArray(chips)).toBe(true);
      expect(chips.length).toBeGreaterThan(0);
      chips.forEach((chip) => {
        expect(typeof chip).toBe('string');
      });
    });

    it('returns empty array for unknown responseId', () => {
      const chips = getToolChips('nonexistent-response');
      expect(Array.isArray(chips)).toBe(true);
      expect(chips.length).toBe(0);
    });
  });

  describe('getResponse', () => {
    it('returns a Tier 1 response for known trigger phrase', () => {
      const response = getResponse('prep me for this meeting', {
        page: 'meeting-detail',
      });
      expect(response.tier).toBe(1);
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
      expect(Array.isArray(response.toolChips)).toBe(true);
      expect(Array.isArray(response.followUpSuggestions)).toBe(true);
      expect(typeof response.category).toBe('string');
    });

    it('returns a Tier 2 response for keyword match', () => {
      const response = getResponse('what is the budget status', {});
      expect(response.tier).toBe(2);
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.category).toBe('finance');
    });

    it('returns a Tier 3 fallback response for unrecognized input', () => {
      const response = getResponse('random gibberish xyz', {});
      expect(response.tier).toBe(3);
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
    });

    it('response object has all required properties', () => {
      const response = getResponse('prep me for this meeting', {
        page: 'meeting-detail',
      });
      expect(response).toHaveProperty('tier');
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('toolChips');
      expect(response).toHaveProperty('followUpSuggestions');
      expect(response).toHaveProperty('category');
    });

    it('response has typingSpeed property', () => {
      const textResponse = getResponse('what is the budget status', {});
      expect(textResponse).toHaveProperty('typingSpeed');
      expect(typeof textResponse.typingSpeed).toBe('number');
    });

    it('typingSpeed is 40 for text responses', () => {
      const response = getResponse('what is the budget status', {});
      expect(response.typingSpeed).toBe(40);
    });
  });

  describe('getTier', () => {
    it('returns tier 1 for a Tier 1 match', () => {
      const response = getResponse('prep me for this meeting', {
        page: 'meeting-detail',
      });
      expect(response.tier).toBe(1);
    });

    it('returns tier 2 for a Tier 2 keyword match', () => {
      const response = getResponse('what about the budget', {});
      expect(response.tier).toBe(2);
    });

    it('returns tier 3 for no match', () => {
      const response = getResponse('completely unrelated gibberish', {});
      expect(response.tier).toBe(3);
    });
  });
});
