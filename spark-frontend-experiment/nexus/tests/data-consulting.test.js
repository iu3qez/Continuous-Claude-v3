import { describe, it, expect } from 'vitest';
import {
  validateTeamMember,
  validateMeeting,
  validateAction,
  validateDecision,
  validateDataset,
} from '../data/shared.js';

// Import the consulting dataset (also triggers registerDataset)
import consultingData from '../data/consulting.js';
import { registerDataset } from '../components/industry.js';

// ── Company ─────────────────────────────────────────────────

describe('Consulting Dataset - Company', () => {
  it('has company name "Meridian Consulting Group"', () => {
    expect(consultingData.company.name).toBe('Meridian Consulting Group');
  });

  it('has company size of 48', () => {
    expect(consultingData.company.size).toBe(48);
  });

  it('has industry set to "consulting"', () => {
    expect(consultingData.company.industry).toBe('consulting');
  });
});

// ── Team ────────────────────────────────────────────────────

describe('Consulting Dataset - Team', () => {
  it('has exactly 8 team members', () => {
    expect(consultingData.team).toHaveLength(8);
  });

  it('each team member passes validateTeamMember', () => {
    consultingData.team.forEach((member) => {
      expect(validateTeamMember(member)).toBe(true);
    });
  });

  const expectedTeam = [
    { name: 'Jay Altizer', role: 'CEO' },
    { name: 'Sarah Chen', role: 'COO' },
    { name: 'Marcus Johnson', role: 'VP Engineering' },
    { name: 'Lisa Park', role: 'BD Director' },
    { name: 'David Hayes', role: 'Senior Consultant' },
    { name: 'Priya Sharma', role: 'Finance Director' },
    { name: 'Tom Wilson', role: 'HR Manager' },
    { name: 'Anna Rodriguez', role: 'Client Manager' },
  ];

  expectedTeam.forEach(({ name, role }) => {
    it(`includes ${name} as ${role}`, () => {
      const member = consultingData.team.find((m) => m.name === name);
      expect(member).toBeDefined();
      expect(member.role).toBe(role);
    });
  });
});

// ── Meetings ────────────────────────────────────────────────

describe('Consulting Dataset - Meetings', () => {
  it('has exactly 10 meetings', () => {
    expect(consultingData.meetings).toHaveLength(10);
  });

  it('each meeting passes validateMeeting', () => {
    consultingData.meetings.forEach((meeting) => {
      expect(validateMeeting(meeting)).toBe(true);
    });
  });

  const expectedMeetings = [
    'OPS Weekly Standup',
    'Client Services Review',
    'Emergency: Campaign Blocker Resolution',
    'BD Pipeline Review',
    'Q2 Planning Workshop',
    'Finance Monthly Close',
    'All-Hands',
    'Client: Acme Corp Check-in',
    'Hiring Committee',
    'ELT Strategic Review',
  ];

  expectedMeetings.forEach((title) => {
    it(`includes meeting "${title}"`, () => {
      const meeting = consultingData.meetings.find((m) => m.title === title);
      expect(meeting).toBeDefined();
    });
  });
});

// ── Actions ─────────────────────────────────────────────────

describe('Consulting Dataset - Actions', () => {
  it('has exactly 23 actions', () => {
    expect(consultingData.actions).toHaveLength(23);
  });

  it('each action passes validateAction', () => {
    consultingData.actions.forEach((action) => {
      expect(validateAction(action)).toBe(true);
    });
  });

  it('has exactly 5 overdue actions', () => {
    const overdue = consultingData.actions.filter((a) => a.status === 'overdue');
    expect(overdue).toHaveLength(5);
  });

  it('has exactly 5 in_progress actions', () => {
    const inProgress = consultingData.actions.filter((a) => a.status === 'in_progress');
    expect(inProgress).toHaveLength(5);
  });

  it('has exactly 4 blocked actions', () => {
    const blocked = consultingData.actions.filter((a) => a.status === 'blocked');
    expect(blocked).toHaveLength(4);
  });

  it('has exactly 9 completed actions', () => {
    const completed = consultingData.actions.filter((a) => a.status === 'completed');
    expect(completed).toHaveLength(9);
  });
});

// ── Decisions ───────────────────────────────────────────────

describe('Consulting Dataset - Decisions', () => {
  it('has exactly 8 decisions', () => {
    expect(consultingData.decisions).toHaveLength(8);
  });

  it('each decision passes validateDecision', () => {
    consultingData.decisions.forEach((decision) => {
      expect(validateDecision(decision)).toBe(true);
    });
  });
});

// ── Financials ──────────────────────────────────────────────

describe('Consulting Dataset - Financials', () => {
  it('has pipeline of $2.4M', () => {
    expect(consultingData.financials.pipeline).toBe(2400000);
  });

  it('has q2Target of $1.8M', () => {
    expect(consultingData.financials.q2Target).toBe(1800000);
  });

  it('has monthlyRevenue of $320K', () => {
    expect(consultingData.financials.monthlyRevenue).toBe(320000);
  });

  it('has clientRetention of 0.94', () => {
    expect(consultingData.financials.clientRetention).toBe(0.94);
  });
});

// ── AI Insights ─────────────────────────────────────────────

describe('Consulting Dataset - AI Insights', () => {
  it('has exactly 10 AI insights', () => {
    expect(consultingData.insights).toHaveLength(10);
  });
});

// ── Full Dataset Validation ─────────────────────────────────

describe('Consulting Dataset - Full Validation', () => {
  it('passes validateDataset', () => {
    expect(validateDataset(consultingData)).toBe(true);
  });
});

// ── Registration ────────────────────────────────────────────

describe('Consulting Dataset - Registration', () => {
  it('registers itself with registerDataset("consulting", data)', async () => {
    // The import of consulting.js should have called registerDataset
    // We can verify by loading the industry data
    const { loadIndustryData } = await import('../components/industry.js');
    const loaded = loadIndustryData('consulting');
    expect(loaded).toBe(consultingData);
  });
});
