import { describe, it, expect } from 'vitest';
import {
  validateTeamMember,
  validateMeeting,
  validateAction,
  validateDecision,
  validateDataset,
  formatCurrency,
  formatPercentage,
  formatDate,
  formatRelativeTime,
  STATUS_VALUES,
  PRIORITY_LEVELS,
  WORKSPACE_COLORS,
} from '../data/shared.js';

// ── Schema Validation ──────────────────────────────────────

describe('validateTeamMember', () => {
  it('returns true for a valid member with all required fields', () => {
    const member = {
      name: 'Alice Chen',
      role: 'Engineering Lead',
      department: 'Engineering',
      avatarColor: '#4F46E5',
    };
    expect(validateTeamMember(member)).toBe(true);
  });

  it('returns false for an empty object', () => {
    expect(validateTeamMember({})).toBe(false);
  });

  it('returns false when a required field is missing', () => {
    const partial = { name: 'Bob', role: 'Dev', department: 'Eng' };
    expect(validateTeamMember(partial)).toBe(false);
  });

  it('returns false for null or undefined input', () => {
    expect(validateTeamMember(null)).toBe(false);
    expect(validateTeamMember(undefined)).toBe(false);
  });
});

describe('validateMeeting', () => {
  it('returns true for a valid meeting', () => {
    const meeting = {
      title: 'Sprint Planning',
      type: 'recurring',
      time: '2026-02-14T10:00:00Z',
      attendees: ['Alice', 'Bob'],
      workspace: 'Engineering',
    };
    expect(validateMeeting(meeting)).toBe(true);
  });

  it('returns false for an empty object', () => {
    expect(validateMeeting({})).toBe(false);
  });

  it('returns false when attendees is missing', () => {
    const meeting = {
      title: 'Standup',
      type: 'daily',
      time: '2026-02-14T09:00:00Z',
      workspace: 'Engineering',
    };
    expect(validateMeeting(meeting)).toBe(false);
  });
});

describe('validateAction', () => {
  it('returns true for a valid action', () => {
    const action = {
      title: 'Fix login bug',
      status: 'in_progress',
      assignee: 'Alice',
      workspace: 'Engineering',
      priority: 'high',
    };
    expect(validateAction(action)).toBe(true);
  });

  it('returns false for an empty object', () => {
    expect(validateAction({})).toBe(false);
  });

  it('returns false when priority is missing', () => {
    const action = {
      title: 'Deploy v2',
      status: 'completed',
      assignee: 'Bob',
      workspace: 'Engineering',
    };
    expect(validateAction(action)).toBe(false);
  });
});

describe('validateDecision', () => {
  it('returns true for a valid decision', () => {
    const decision = {
      title: 'Adopt TypeScript',
      status: 'approved',
      rationale: 'Better type safety',
      workspace: 'Engineering',
    };
    expect(validateDecision(decision)).toBe(true);
  });

  it('returns false for an empty object', () => {
    expect(validateDecision({})).toBe(false);
  });

  it('returns false when rationale is missing', () => {
    const decision = {
      title: 'New CI pipeline',
      status: 'pending',
      workspace: 'DevOps',
    };
    expect(validateDecision(decision)).toBe(false);
  });
});

describe('validateDataset', () => {
  it('returns true for a complete dataset', () => {
    const dataset = {
      company: { name: 'Acme' },
      team: [{ name: 'Alice' }],
      meetings: [{ title: 'Standup' }],
      actions: [{ title: 'Fix bug' }],
      decisions: [{ title: 'Adopt TS' }],
      financials: { revenue: 100000 },
      insights: [{ text: 'Good quarter' }],
    };
    expect(validateDataset(dataset)).toBe(true);
  });

  it('returns false for an empty object', () => {
    expect(validateDataset({})).toBe(false);
  });

  it('returns false when a section is missing', () => {
    const partial = {
      company: { name: 'Acme' },
      team: [],
      meetings: [],
      // missing: actions, decisions, financials, insights
    };
    expect(validateDataset(partial)).toBe(false);
  });

  it('returns false for null input', () => {
    expect(validateDataset(null)).toBe(false);
  });
});

// ── Formatters ─────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats thousands with comma or K suffix', () => {
    const result = formatCurrency(42000);
    // Accept either "$42,000" or "$42K"
    expect(result === '$42,000' || result === '$42K').toBe(true);
  });

  it('formats millions with M suffix', () => {
    expect(formatCurrency(1200000)).toBe('$1.2M');
  });

  it('formats small amounts directly', () => {
    const result = formatCurrency(500);
    expect(result).toContain('$');
    expect(result).toContain('500');
  });

  it('handles zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('$');
  });
});

describe('formatPercentage', () => {
  it('converts decimal to percentage string', () => {
    expect(formatPercentage(0.94)).toBe('94%');
  });

  it('handles 100%', () => {
    expect(formatPercentage(1.0)).toBe('100%');
  });

  it('handles 0%', () => {
    expect(formatPercentage(0)).toBe('0%');
  });

  it('handles fractional percentages', () => {
    const result = formatPercentage(0.333);
    // Should be "33%" or "33.3%"
    expect(result).toMatch(/^33/);
    expect(result).toContain('%');
  });
});

describe('formatDate', () => {
  it('returns a human-readable date string', () => {
    const result = formatDate('2026-02-14T10:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // Should contain some recognizable date component
    expect(result).toMatch(/Feb|2|14|2026/);
  });

  it('handles ISO date strings', () => {
    const result = formatDate('2026-01-01');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" or similar for very recent times', () => {
    const now = new Date();
    const result = formatRelativeTime(now.toISOString());
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a string containing "ago" or "yesterday" for past dates', () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const result = formatRelativeTime(yesterday.toISOString());
    expect(result).toMatch(/ago|yesterday/i);
  });

  it('returns hours ago for a few hours back', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const result = formatRelativeTime(twoHoursAgo.toISOString());
    expect(result).toMatch(/2\s*hours?\s*ago/i);
  });
});

// ── Constants ──────────────────────────────────────────────

describe('STATUS_VALUES', () => {
  it('contains overdue', () => {
    expect(STATUS_VALUES).toHaveProperty('overdue');
  });

  it('contains in_progress', () => {
    expect(STATUS_VALUES).toHaveProperty('in_progress');
  });

  it('contains blocked', () => {
    expect(STATUS_VALUES).toHaveProperty('blocked');
  });

  it('contains completed', () => {
    expect(STATUS_VALUES).toHaveProperty('completed');
  });
});

describe('PRIORITY_LEVELS', () => {
  it('contains critical', () => {
    expect(PRIORITY_LEVELS).toHaveProperty('critical');
  });

  it('contains high', () => {
    expect(PRIORITY_LEVELS).toHaveProperty('high');
  });

  it('contains medium', () => {
    expect(PRIORITY_LEVELS).toHaveProperty('medium');
  });

  it('contains low', () => {
    expect(PRIORITY_LEVELS).toHaveProperty('low');
  });
});

describe('WORKSPACE_COLORS', () => {
  it('is an object mapping workspace names to hex colors', () => {
    expect(typeof WORKSPACE_COLORS).toBe('object');
    const values = Object.values(WORKSPACE_COLORS);
    expect(values.length).toBeGreaterThan(0);
    // Each value should be a hex color
    values.forEach((color) => {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('has at least 3 workspace entries', () => {
    expect(Object.keys(WORKSPACE_COLORS).length).toBeGreaterThanOrEqual(3);
  });
});
