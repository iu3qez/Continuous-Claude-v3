import { describe, it, expect } from 'vitest';
import {
  validateTeamMember,
  validateMeeting,
  validateAction,
  validateDecision,
  validateDataset,
} from '../data/shared.js';

// Import the hospitality dataset (also triggers registerDataset)
import hospitalityData from '../data/hospitality.js';
import { registerDataset } from '../components/industry.js';

// ── Company ─────────────────────────────────────────────────

describe('Hospitality Dataset - Company', () => {
  it('has company name "Harbor Restaurant Group"', () => {
    expect(hospitalityData.company.name).toBe('Harbor Restaurant Group');
  });

  it('has company size of 95', () => {
    expect(hospitalityData.company.size).toBe(95);
  });

  it('has industry set to "hospitality"', () => {
    expect(hospitalityData.company.industry).toBe('hospitality');
  });
});

// ── Team ────────────────────────────────────────────────────

describe('Hospitality Dataset - Team', () => {
  it('has exactly 8 team members', () => {
    expect(hospitalityData.team).toHaveLength(8);
  });

  it('each team member passes validateTeamMember', () => {
    hospitalityData.team.forEach((member) => {
      expect(validateTeamMember(member)).toBe(true);
    });
  });

  const expectedTeam = [
    { name: 'Maria Santos', role: 'Owner/GM' },
    { name: "James O'Brien", role: 'Head Chef' },
    { name: 'Sophie Laurent', role: 'FOH Manager (Downtown)' },
    { name: 'Carlos Mendez', role: 'Events Director' },
    { name: 'Aisha Williams', role: 'Operations Manager' },
    { name: 'Ryan Park', role: 'FOH Manager (Waterfront)' },
    { name: 'Nina Petrov', role: 'Catering Lead' },
    { name: 'Ben Thompson', role: 'Sous Chef' },
  ];

  expectedTeam.forEach(({ name, role }) => {
    it(`includes ${name} as ${role}`, () => {
      const member = hospitalityData.team.find((m) => m.name === name);
      expect(member).toBeDefined();
      expect(member.role).toBe(role);
    });
  });
});

// ── Meetings ────────────────────────────────────────────────

describe('Hospitality Dataset - Meetings', () => {
  it('has exactly 10 meetings', () => {
    expect(hospitalityData.meetings).toHaveLength(10);
  });

  it('each meeting passes validateMeeting', () => {
    hospitalityData.meetings.forEach((meeting) => {
      expect(validateMeeting(meeting)).toBe(true);
    });
  });
});

// ── Actions ─────────────────────────────────────────────────

describe('Hospitality Dataset - Actions', () => {
  it('has exactly 23 actions', () => {
    expect(hospitalityData.actions).toHaveLength(23);
  });

  it('each action passes validateAction', () => {
    hospitalityData.actions.forEach((action) => {
      expect(validateAction(action)).toBe(true);
    });
  });
});

// ── Decisions ───────────────────────────────────────────────

describe('Hospitality Dataset - Decisions', () => {
  it('has exactly 8 decisions', () => {
    expect(hospitalityData.decisions).toHaveLength(8);
  });

  it('each decision passes validateDecision', () => {
    hospitalityData.decisions.forEach((decision) => {
      expect(validateDecision(decision)).toBe(true);
    });
  });
});

// ── Financials ──────────────────────────────────────────────

describe('Hospitality Dataset - Financials', () => {
  it('has monthlyRevenue of 285000', () => {
    expect(hospitalityData.financials.monthlyRevenue).toBe(285000);
  });

  it('has foodCost of 0.31', () => {
    expect(hospitalityData.financials.foodCost).toBe(0.31);
  });

  it('has laborCost of 0.28', () => {
    expect(hospitalityData.financials.laborCost).toBe(0.28);
  });

  it('has eventBookings of 12', () => {
    expect(hospitalityData.financials.eventBookings).toBe(12);
  });

  it('has eventRevenue of 68000', () => {
    expect(hospitalityData.financials.eventRevenue).toBe(68000);
  });
});

// ── AI Insights ─────────────────────────────────────────────

describe('Hospitality Dataset - AI Insights', () => {
  it('has exactly 10 AI insights', () => {
    expect(hospitalityData.insights).toHaveLength(10);
  });
});

// ── Locations ───────────────────────────────────────────────

describe('Hospitality Dataset - Locations', () => {
  it('has exactly 3 locations', () => {
    expect(hospitalityData.locations).toHaveLength(3);
  });

  it('has Harbor Downtown with 45 staff', () => {
    const loc = hospitalityData.locations.find((l) => l.name === 'Harbor Downtown');
    expect(loc).toBeDefined();
    expect(loc.staff).toBe(45);
    expect(loc.type).toBe('restaurant');
  });

  it('has Harbor Waterfront with 30 staff', () => {
    const loc = hospitalityData.locations.find((l) => l.name === 'Harbor Waterfront');
    expect(loc).toBeDefined();
    expect(loc.staff).toBe(30);
    expect(loc.type).toBe('restaurant');
  });

  it('has Harbor Catering with 20 staff', () => {
    const loc = hospitalityData.locations.find((l) => l.name === 'Harbor Catering');
    expect(loc).toBeDefined();
    expect(loc.staff).toBe(20);
    expect(loc.type).toBe('catering');
  });
});

// ── Full Dataset Validation ─────────────────────────────────

describe('Hospitality Dataset - Full Validation', () => {
  it('passes validateDataset', () => {
    expect(validateDataset(hospitalityData)).toBe(true);
  });
});

// ── Registration ────────────────────────────────────────────

describe('Hospitality Dataset - Registration', () => {
  it('registers itself with registerDataset("hospitality", data)', async () => {
    // The import of hospitality.js should have called registerDataset
    const { loadIndustryData } = await import('../components/industry.js');
    const loaded = loadIndustryData('hospitality');
    expect(loaded).toBe(hospitalityData);
  });
});
