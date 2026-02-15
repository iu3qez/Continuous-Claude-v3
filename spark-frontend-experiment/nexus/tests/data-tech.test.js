import { describe, it, expect } from 'vitest';
import {
  validateTeamMember,
  validateMeeting,
  validateAction,
  validateDecision,
  validateDataset,
} from '../data/shared.js';

// Import the tech dataset - this will also trigger registerDataset
import techData from '../data/tech.js';

// ── Company ───────────────────────────────────────────────

describe('Tech Dataset - Company', () => {
  it('has company name ByteForge Labs', () => {
    expect(techData.company.name).toBe('ByteForge Labs');
  });

  it('has company size 32', () => {
    expect(techData.company.size).toBe(32);
  });

  it('has industry set to tech', () => {
    expect(techData.company.industry).toBe('tech');
  });
});

// ── Team ──────────────────────────────────────────────────

describe('Tech Dataset - Team', () => {
  it('has 8 team members', () => {
    expect(techData.team).toHaveLength(8);
  });

  it('each team member passes validateTeamMember', () => {
    techData.team.forEach((member) => {
      expect(validateTeamMember(member)).toBe(true);
    });
  });

  it('has Alex Rivera as CEO/Founder', () => {
    const alex = techData.team.find((m) => m.name === 'Alex Rivera');
    expect(alex).toBeDefined();
    expect(alex.role).toBe('CEO/Founder');
  });

  it('has Jordan Kim as CTO', () => {
    const jordan = techData.team.find((m) => m.name === 'Jordan Kim');
    expect(jordan).toBeDefined();
    expect(jordan.role).toBe('CTO');
  });

  it('has Sam Patel as VP Product', () => {
    const sam = techData.team.find((m) => m.name === 'Sam Patel');
    expect(sam).toBeDefined();
    expect(sam.role).toBe('VP Product');
  });

  it('has Maya Chen as Head of Sales', () => {
    const maya = techData.team.find((m) => m.name === 'Maya Chen');
    expect(maya).toBeDefined();
    expect(maya.role).toBe('Head of Sales');
  });

  it('has Chris Taylor as Marketing Director', () => {
    const chris = techData.team.find((m) => m.name === 'Chris Taylor');
    expect(chris).toBeDefined();
    expect(chris.role).toBe('Marketing Director');
  });

  it('has Dev Nguyen as Lead Engineer', () => {
    const dev = techData.team.find((m) => m.name === 'Dev Nguyen');
    expect(dev).toBeDefined();
    expect(dev.role).toBe('Lead Engineer');
  });

  it('has Rachel Stone as Sales Rep', () => {
    const rachel = techData.team.find((m) => m.name === 'Rachel Stone');
    expect(rachel).toBeDefined();
    expect(rachel.role).toBe('Sales Rep');
  });

  it('has Kai Yamamoto as Designer', () => {
    const kai = techData.team.find((m) => m.name === 'Kai Yamamoto');
    expect(kai).toBeDefined();
    expect(kai.role).toBe('Designer');
  });
});

// ── Meetings ──────────────────────────────────────────────

describe('Tech Dataset - Meetings', () => {
  it('has 10 meetings', () => {
    expect(techData.meetings).toHaveLength(10);
  });

  it('each meeting passes validateMeeting', () => {
    techData.meetings.forEach((meeting) => {
      expect(validateMeeting(meeting)).toBe(true);
    });
  });
});

// ── Actions ───────────────────────────────────────────────

describe('Tech Dataset - Actions', () => {
  it('has 23 actions', () => {
    expect(techData.actions).toHaveLength(23);
  });

  it('each action passes validateAction', () => {
    techData.actions.forEach((action) => {
      expect(validateAction(action)).toBe(true);
    });
  });

  it('has a mix of statuses', () => {
    const statuses = new Set(techData.actions.map((a) => a.status));
    expect(statuses.size).toBeGreaterThanOrEqual(3);
  });
});

// ── Decisions ─────────────────────────────────────────────

describe('Tech Dataset - Decisions', () => {
  it('has 8 decisions', () => {
    expect(techData.decisions).toHaveLength(8);
  });

  it('each decision passes validateDecision', () => {
    techData.decisions.forEach((decision) => {
      expect(validateDecision(decision)).toBe(true);
    });
  });
});

// ── Financials ────────────────────────────────────────────

describe('Tech Dataset - Financials', () => {
  it('has mrr of 42000', () => {
    expect(techData.financials.mrr).toBe(42000);
  });

  it('has pipeline of 180000', () => {
    expect(techData.financials.pipeline).toBe(180000);
  });

  it('has 12 deals', () => {
    expect(techData.financials.deals).toBe(12);
  });

  it('has burnRate of 95000', () => {
    expect(techData.financials.burnRate).toBe(95000);
  });

  it('has runway of 14', () => {
    expect(techData.financials.runway).toBe(14);
  });

  it('has arr of 504000', () => {
    expect(techData.financials.arr).toBe(504000);
  });
});

// ── AI Insights ───────────────────────────────────────────

describe('Tech Dataset - AI Insights', () => {
  it('has 10 AI insights', () => {
    expect(techData.insights).toHaveLength(10);
  });
});

// ── Full Validation ───────────────────────────────────────

describe('Tech Dataset - Full Validation', () => {
  it('passes validateDataset', () => {
    expect(validateDataset(techData)).toBe(true);
  });
});
