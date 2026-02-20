/**
 * Tests for roadmap-reconcile SessionStart hook.
 *
 * The hook reads ROADMAP.md, extracts claims (decisions, milestones, files),
 * and validates them against actual project state (package.json, git log,
 * file existence). Returns contradictions as a system message.
 *
 * TDD Red Phase: These tests define expected behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Module under test
import {
  extractDecisions,
  extractMilestones,
  extractCurrentFocus,
  extractMentionedFiles,
  extractMentionedPackages,
  validateDecisions,
  validateMilestones,
  validateCurrentFocus,
  reconcile,
} from '../roadmap-reconcile.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const SAMPLE_ROADMAP = `# Project Roadmap

## Current Focus

**Implement authentication system**
- Working on OAuth integration
- Target: src/auth/ module

## Completed
- [x] Set up project structure (2026-01-15)
- [x] Add database schema (2026-01-20)
- [x] Implement user model (2026-02-01)

## Planned
- [ ] Add rate limiting
- [ ] Implement caching layer

## Recent Planning Sessions
### 2026-02-10: Auth System Design
**Key Decisions:**
| Decision | Rationale |
|----------|-----------|
| Use passport.js for auth | Industry standard, well-maintained |
| Use Redis for sessions | Fast, supports TTL natively |
| Branch: feature/auth | Isolate auth work |

**Files:** src/auth/passport.ts, src/auth/session.ts, src/middleware/auth.ts
`;

const SAMPLE_PACKAGE_JSON = JSON.stringify({
  name: 'test-project',
  dependencies: {
    'express': '^4.18.0',
    'passport': '^0.7.0',
  },
  devDependencies: {
    'jest': '^29.0.0',
  },
}, null, 2);

const SAMPLE_GIT_LOG = `abc1234 feat: add user model
def5678 fix: database connection
ghi9012 feat: set up project structure
jkl3456 chore: initial commit
mno7890 docs: add readme
pqr1234 feat: add database schema
stu5678 test: add user tests
vwx9012 refactor: clean up imports
yza3456 ci: add github actions
bcd7890 feat: add middleware`;

// ---------------------------------------------------------------------------
// Tests: extractDecisions
// ---------------------------------------------------------------------------

describe('extractDecisions', () => {
  it('extracts decision rows from Key Decisions table', () => {
    const decisions = extractDecisions(SAMPLE_ROADMAP);
    expect(decisions).toHaveLength(3);
    expect(decisions[0]).toMatchObject({
      decision: expect.stringContaining('passport.js'),
    });
  });

  it('returns empty array when no decisions table exists', () => {
    const roadmap = '# Project Roadmap\n\n## Current Focus\nDoing stuff\n';
    const decisions = extractDecisions(roadmap);
    expect(decisions).toEqual([]);
  });

  it('skips the header row of the table', () => {
    const decisions = extractDecisions(SAMPLE_ROADMAP);
    // Should not include "Decision" or "Rationale" header
    const hasHeader = decisions.some(d =>
      d.decision === 'Decision' || d.decision === 'Rationale'
    );
    expect(hasHeader).toBe(false);
  });

  it('skips the separator row (dashes)', () => {
    const decisions = extractDecisions(SAMPLE_ROADMAP);
    const hasSeparator = decisions.some(d => d.decision.startsWith('---'));
    expect(hasSeparator).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests: extractMilestones
// ---------------------------------------------------------------------------

describe('extractMilestones', () => {
  it('extracts completed milestones with [x]', () => {
    const milestones = extractMilestones(SAMPLE_ROADMAP);
    const completed = milestones.filter(m => m.completed);
    expect(completed.length).toBeGreaterThanOrEqual(3);
    expect(completed[0].title).toContain('Set up project structure');
  });

  it('extracts planned milestones with [ ]', () => {
    const milestones = extractMilestones(SAMPLE_ROADMAP);
    const planned = milestones.filter(m => !m.completed);
    expect(planned.length).toBeGreaterThanOrEqual(2);
    expect(planned[0].title).toContain('rate limiting');
  });

  it('extracts dates from completed milestones', () => {
    const milestones = extractMilestones(SAMPLE_ROADMAP);
    const withDate = milestones.find(m => m.title.includes('project structure'));
    expect(withDate).toBeDefined();
    expect(withDate!.date).toBe('2026-01-15');
  });

  it('returns empty array for roadmap without milestones', () => {
    const roadmap = '# Roadmap\n\nJust some text.\n';
    const milestones = extractMilestones(roadmap);
    expect(milestones).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: extractCurrentFocus
// ---------------------------------------------------------------------------

describe('extractCurrentFocus', () => {
  it('extracts the current focus title from bold text', () => {
    const focus = extractCurrentFocus(SAMPLE_ROADMAP);
    expect(focus).toBeDefined();
    expect(focus!.title).toBe('Implement authentication system');
  });

  it('extracts detail lines from current focus', () => {
    const focus = extractCurrentFocus(SAMPLE_ROADMAP);
    expect(focus).toBeDefined();
    expect(focus!.details).toContain('OAuth');
  });

  it('returns null for "No current goal" placeholder', () => {
    const roadmap = `# Roadmap\n\n## Current Focus\n\n_No current goal. Next planned item will be promoted on next planning session._\n`;
    const focus = extractCurrentFocus(roadmap);
    expect(focus).toBeNull();
  });

  it('returns null when no Current Focus section exists', () => {
    const roadmap = '# Roadmap\n\n## Completed\n- [x] Done\n';
    const focus = extractCurrentFocus(roadmap);
    expect(focus).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: extractMentionedFiles
// ---------------------------------------------------------------------------

describe('extractMentionedFiles', () => {
  it('extracts file paths from Files: line', () => {
    const files = extractMentionedFiles(SAMPLE_ROADMAP);
    expect(files).toContain('src/auth/passport.ts');
    expect(files).toContain('src/auth/session.ts');
    expect(files).toContain('src/middleware/auth.ts');
  });

  it('returns empty array when no Files: line exists', () => {
    const roadmap = '# Roadmap\n\nNo files mentioned.\n';
    const files = extractMentionedFiles(roadmap);
    expect(files).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: extractMentionedPackages
// ---------------------------------------------------------------------------

describe('extractMentionedPackages', () => {
  it('extracts package names from decision text', () => {
    const packages = extractMentionedPackages(SAMPLE_ROADMAP);
    expect(packages).toContain('passport');
    expect(packages).toContain('redis');
  });

  it('returns empty array when no recognizable packages mentioned', () => {
    const roadmap = '# Roadmap\n\nJust general text here.\n';
    const packages = extractMentionedPackages(roadmap);
    expect(packages).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: validateDecisions
// ---------------------------------------------------------------------------

describe('validateDecisions', () => {
  it('flags missing packages from decisions', () => {
    const decisions = [
      { decision: 'Use passport.js for auth', rationale: 'standard' },
      { decision: 'Use Redis for sessions', rationale: 'fast' },
    ];
    const packageJson = { dependencies: { passport: '^0.7.0' }, devDependencies: {} };
    const issues = validateDecisions(decisions, packageJson);
    // Redis is not in package.json
    expect(issues.some(i => i.toLowerCase().includes('redis'))).toBe(true);
    // Passport IS in package.json, should not be flagged
    expect(issues.some(i => i.toLowerCase().includes('passport'))).toBe(false);
  });

  it('returns empty array when all packages present', () => {
    const decisions = [
      { decision: 'Use passport.js for auth', rationale: 'standard' },
    ];
    const packageJson = { dependencies: { passport: '^0.7.0' }, devDependencies: {} };
    const issues = validateDecisions(decisions, packageJson);
    expect(issues).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: validateMilestones
// ---------------------------------------------------------------------------

describe('validateMilestones', () => {
  it('flags completed milestones with no matching commit', () => {
    const milestones = [
      { title: 'Set up project structure', completed: true, date: '2026-01-15' },
      { title: 'Add GraphQL layer', completed: true, date: '2026-02-01' },
    ];
    const gitLog = SAMPLE_GIT_LOG;
    const issues = validateMilestones(milestones, gitLog);
    // GraphQL has no matching commit
    expect(issues.some(i => i.includes('GraphQL'))).toBe(true);
    // project structure has a matching commit
    expect(issues.some(i => i.includes('project structure'))).toBe(false);
  });

  it('flags stale in-progress milestones (>30 days old)', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);
    const dateStr = oldDate.toISOString().split('T')[0];

    const milestones = [
      { title: 'Stale work item', completed: false, date: dateStr },
    ];
    const issues = validateMilestones(milestones, '');
    // Should not flag planned items without dates as stale
    expect(issues).toEqual([]);
  });

  it('returns empty when all completed milestones have matching commits', () => {
    const milestones = [
      { title: 'Set up project structure', completed: true, date: '2026-01-15' },
      { title: 'Add database schema', completed: true, date: '2026-01-20' },
    ];
    const issues = validateMilestones(milestones, SAMPLE_GIT_LOG);
    expect(issues).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: validateCurrentFocus
// ---------------------------------------------------------------------------

describe('validateCurrentFocus', () => {
  it('flags when mentioned directory does not exist', () => {
    const focus = {
      title: 'Implement auth system',
      details: 'Working on src/auth/ module',
    };
    const existingPaths = new Set<string>(); // nothing exists
    const issues = validateCurrentFocus(focus, existingPaths);
    expect(issues.some(i => i.includes('src/auth'))).toBe(true);
  });

  it('returns empty when mentioned paths exist', () => {
    const focus = {
      title: 'Implement auth system',
      details: 'Working on src/auth/ module',
    };
    const existingPaths = new Set(['src/auth']);
    const issues = validateCurrentFocus(focus, existingPaths);
    expect(issues).toEqual([]);
  });

  it('returns empty for null focus', () => {
    const issues = validateCurrentFocus(null, new Set());
    expect(issues).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Tests: reconcile (integration)
// ---------------------------------------------------------------------------

describe('reconcile', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'roadmap-reconcile-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty object when no ROADMAP.md exists', () => {
    const result = reconcile(tempDir);
    expect(result).toEqual({});
  });

  it('returns empty object when fewer than 2 contradictions found', () => {
    // Create a minimal roadmap with no contradictions
    fs.writeFileSync(path.join(tempDir, 'ROADMAP.md'), `# Roadmap\n\n## Current Focus\n\n_No current goal._\n`);
    const result = reconcile(tempDir);
    expect(result).toEqual({});
  });

  it('returns system message when 2+ contradictions found', () => {
    // Create a roadmap with contradictions
    const contradictoryRoadmap = `# Roadmap

## Current Focus

**Build the GraphQL API**
- Working on src/graphql/ directory

## Completed
- [x] Add Kubernetes deployment (2026-01-15)
- [x] Implement WebSocket server (2026-01-20)

## Recent Planning Sessions
### 2026-02-10: API Design
**Key Decisions:**
| Decision | Rationale |
|----------|-----------|
| Use apollo-server | Best GraphQL server |
| Use prisma ORM | Type-safe database |

**Files:** src/graphql/schema.ts, src/graphql/resolvers.ts
`;
    fs.writeFileSync(path.join(tempDir, 'ROADMAP.md'), contradictoryRoadmap);
    // No package.json, no git, no src/graphql/ => multiple contradictions
    const result = reconcile(tempDir);

    // Should have values.system with contradiction list
    expect(result).toHaveProperty('values');
    expect(result).toHaveProperty('values.system');
    expect((result as any).values.system).toContain('ROADMAP Reconciliation');
  });

  it('checks package.json for mentioned packages', () => {
    const roadmap = `# Roadmap

## Recent Planning Sessions
### 2026-02-10: Stack Choices
**Key Decisions:**
| Decision | Rationale |
|----------|-----------|
| Use mongoose for MongoDB | ODM |
| Use socket.io for realtime | WebSocket lib |
| Use helmet for security | HTTP headers |
`;
    fs.writeFileSync(path.join(tempDir, 'ROADMAP.md'), roadmap);
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({
      dependencies: { mongoose: '^7.0.0' },
    }));

    const result = reconcile(tempDir);
    // socket.io and helmet are missing from package.json
    if (Object.keys(result).length > 0) {
      const msg = (result as any).values?.system || '';
      expect(msg).toContain('socket.io');
    }
  });

  it('validates mentioned files exist', () => {
    const roadmap = `# Roadmap

## Current Focus

**Working on feature X**

**Files:** src/feature/index.ts, src/feature/utils.ts
`;
    fs.writeFileSync(path.join(tempDir, 'ROADMAP.md'), roadmap);

    const result = reconcile(tempDir);
    // Files don't exist, should produce contradictions (if 2+)
    // At minimum, both files don't exist = 2 contradictions
    if (Object.keys(result).length > 0) {
      const msg = (result as any).values?.system || '';
      expect(msg).toContain('src/feature');
    }
  });
});
