/**
 * Tests for plan-exit-tracker PostToolUse hook (RED phase -- implementation does not exist yet).
 *
 * The plan-exit-tracker hook fires on ExitPlanMode. When triggered, it writes a
 * state file marking that a plan has been approved:
 *
 *   State file: $TEMP/claude-plan-approved-<sessionId>.json
 *   Content:    { "approved": true, "timestamp": <epoch ms>, "sessionId": "<id>" }
 *
 * It uses:
 *   - getStatePathWithMigration('plan-approved', sessionId) for the state path
 *   - writeStateWithLock(path, jsonString) for atomic writes
 *   - readStateWithLock(path) for atomic reads
 *   - Always outputs {} to stdout (PostToolUse hooks don't block)
 *
 * These tests will FAIL because plan-exit-tracker.ts does not exist yet.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { getStatePathWithMigration } from '../shared/session-isolation.js';
import { writeStateWithLock, readStateWithLock } from '../shared/atomic-write.js';

// ---------------------------------------------------------------------------
// The module under test -- does NOT exist yet, so this import will fail.
// This is the RED phase of TDD.
// ---------------------------------------------------------------------------
import {
  handlePlanExit,
  buildPlanApprovedState,
  shouldTrack,
} from '../plan-exit-tracker.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEST_SESSION = 'plan-exit-test-session';
const TEST_SESSION_B = 'plan-exit-test-session-b';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let tempDir: string;
let originalTmpdir: string | undefined;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-exit-tracker-test-'));
  // We don't override TMPDIR since getStatePathWithMigration uses os.tmpdir()
  // directly. Instead, tests that need file I/O will use explicit paths.
});

afterEach(() => {
  // Clean up temp directory and any state files created during tests
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }

  // Clean up any state files in the real tmpdir that our tests might create
  const patterns = [
    `claude-plan-approved-${TEST_SESSION}.json`,
    `claude-plan-approved-${TEST_SESSION}.json.lock`,
    `claude-plan-approved-${TEST_SESSION_B}.json`,
    `claude-plan-approved-${TEST_SESSION_B}.json.lock`,
  ];
  for (const pattern of patterns) {
    const fullPath = path.join(os.tmpdir(), pattern);
    try {
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch {
      // Ignore
    }
  }
});

// =============================================================================
// Test 1: shouldTrack -- only ExitPlanMode tools should be tracked
// =============================================================================

describe('shouldTrack', () => {
  it('returns true for ExitPlanMode tool', () => {
    const input = {
      session_id: TEST_SESSION,
      tool_name: 'ExitPlanMode',
      tool_input: {},
    };
    expect(shouldTrack(input)).toBe(true);
  });

  it('returns false for non-ExitPlanMode tools', () => {
    const tools = ['Bash', 'Read', 'Write', 'Grep', 'Glob', 'Task', 'EnterPlanMode'];
    for (const tool of tools) {
      const input = {
        session_id: TEST_SESSION,
        tool_name: tool,
        tool_input: {},
      };
      expect(shouldTrack(input)).toBe(false);
    }
  });

  it('returns false when tool_name is missing', () => {
    const input = {
      session_id: TEST_SESSION,
      tool_input: {},
    };
    expect(shouldTrack(input as any)).toBe(false);
  });

  it('returns false for empty input', () => {
    expect(shouldTrack({} as any)).toBe(false);
  });

  it('returns false for null/undefined input', () => {
    expect(shouldTrack(null as any)).toBe(false);
    expect(shouldTrack(undefined as any)).toBe(false);
  });
});

// =============================================================================
// Test 2: buildPlanApprovedState -- state object construction
// =============================================================================

describe('buildPlanApprovedState', () => {
  it('creates state with approved: true', () => {
    const state = buildPlanApprovedState(TEST_SESSION);
    expect(state.approved).toBe(true);
  });

  it('includes the session ID', () => {
    const state = buildPlanApprovedState(TEST_SESSION);
    expect(state.sessionId).toBe(TEST_SESSION);
  });

  it('includes a timestamp within 1 second of Date.now()', () => {
    const before = Date.now();
    const state = buildPlanApprovedState(TEST_SESSION);
    const after = Date.now();

    expect(state.timestamp).toBeGreaterThanOrEqual(before);
    expect(state.timestamp).toBeLessThanOrEqual(after);
  });

  it('uses different timestamps for sequential calls', () => {
    const state1 = buildPlanApprovedState(TEST_SESSION);
    // Small delay to ensure timestamp difference
    const waitUntil = Date.now() + 5;
    while (Date.now() < waitUntil) { /* spin */ }
    const state2 = buildPlanApprovedState(TEST_SESSION);

    expect(state2.timestamp).toBeGreaterThanOrEqual(state1.timestamp);
  });

  it('returns a plain object with exactly 3 keys', () => {
    const state = buildPlanApprovedState(TEST_SESSION);
    const keys = Object.keys(state).sort();
    expect(keys).toEqual(['approved', 'sessionId', 'timestamp']);
  });
});

// =============================================================================
// Test 3: State file creation via handlePlanExit
// =============================================================================

describe('handlePlanExit -- state file creation', () => {
  it('writes state file when ExitPlanMode fires', () => {
    const input = {
      session_id: TEST_SESSION,
      tool_name: 'ExitPlanMode',
      tool_input: {},
    };

    handlePlanExit(input);

    const statePath = getStatePathWithMigration('plan-approved', TEST_SESSION);
    expect(fs.existsSync(statePath)).toBe(true);
  });

  it('state file contains approved: true', () => {
    const input = {
      session_id: TEST_SESSION,
      tool_name: 'ExitPlanMode',
      tool_input: {},
    };

    handlePlanExit(input);

    const statePath = getStatePathWithMigration('plan-approved', TEST_SESSION);
    const raw = readStateWithLock(statePath);
    expect(raw).not.toBeNull();

    const state = JSON.parse(raw!);
    expect(state.approved).toBe(true);
  });

  it('state file contains correct sessionId', () => {
    const input = {
      session_id: TEST_SESSION,
      tool_name: 'ExitPlanMode',
      tool_input: {},
    };

    handlePlanExit(input);

    const statePath = getStatePathWithMigration('plan-approved', TEST_SESSION);
    const raw = readStateWithLock(statePath);
    const state = JSON.parse(raw!);
    expect(state.sessionId).toBe(TEST_SESSION);
  });

  it('state file contains a valid epoch ms timestamp', () => {
    const before = Date.now();
    const input = {
      session_id: TEST_SESSION,
      tool_name: 'ExitPlanMode',
      tool_input: {},
    };

    handlePlanExit(input);
    const after = Date.now();

    const statePath = getStatePathWithMigration('plan-approved', TEST_SESSION);
    const raw = readStateWithLock(statePath);
    const state = JSON.parse(raw!);

    expect(typeof state.timestamp).toBe('number');
    expect(state.timestamp).toBeGreaterThanOrEqual(before);
    expect(state.timestamp).toBeLessThanOrEqual(after);
  });
});

// =============================================================================
// Test 4: Session isolation -- different sessions get different files
// =============================================================================

describe('session isolation', () => {
  it('different sessions produce different state file paths', () => {
    const pathA = getStatePathWithMigration('plan-approved', TEST_SESSION);
    const pathB = getStatePathWithMigration('plan-approved', TEST_SESSION_B);
    expect(pathA).not.toBe(pathB);
  });

  it('writing for session A does not affect session B', () => {
    const inputA = {
      session_id: TEST_SESSION,
      tool_name: 'ExitPlanMode',
      tool_input: {},
    };
    const inputB = {
      session_id: TEST_SESSION_B,
      tool_name: 'ExitPlanMode',
      tool_input: {},
    };

    handlePlanExit(inputA);

    const pathB = getStatePathWithMigration('plan-approved', TEST_SESSION_B);
    // Session B state file should NOT exist after only session A wrote
    expect(fs.existsSync(pathB)).toBe(false);

    handlePlanExit(inputB);

    // Now both should exist with their own session IDs
    const pathA = getStatePathWithMigration('plan-approved', TEST_SESSION);
    const stateA = JSON.parse(readStateWithLock(pathA)!);
    const stateB = JSON.parse(readStateWithLock(pathB)!);

    expect(stateA.sessionId).toBe(TEST_SESSION);
    expect(stateB.sessionId).toBe(TEST_SESSION_B);
  });

  it('state file path follows naming convention: claude-plan-approved-<sessionId>.json', () => {
    const statePath = getStatePathWithMigration('plan-approved', TEST_SESSION);
    const fileName = path.basename(statePath);
    expect(fileName).toMatch(/^claude-plan-approved-.*\.json$/);
  });
});

// =============================================================================
// Test 5: Non-ExitPlanMode tools are ignored
// =============================================================================

describe('non-ExitPlanMode tools ignored', () => {
  it('does not write state file for Bash tool', () => {
    const input = {
      session_id: TEST_SESSION,
      tool_name: 'Bash',
      tool_input: { command: 'ls' },
    };

    handlePlanExit(input);

    const statePath = getStatePathWithMigration('plan-approved', TEST_SESSION);
    // State file should not be created by this call
    // (it may exist from a prior ExitPlanMode, but should not be created fresh)
    // We check by verifying no file was written in this test
    expect(fs.existsSync(statePath)).toBe(false);
  });

  it('does not write state file for Read tool', () => {
    const input = {
      session_id: TEST_SESSION,
      tool_name: 'Read',
      tool_input: { file_path: '/tmp/test.txt' },
    };

    handlePlanExit(input);

    const statePath = getStatePathWithMigration('plan-approved', TEST_SESSION);
    expect(fs.existsSync(statePath)).toBe(false);
  });

  it('does not write state file for EnterPlanMode (similar name, different tool)', () => {
    const input = {
      session_id: TEST_SESSION,
      tool_name: 'EnterPlanMode',
      tool_input: {},
    };

    handlePlanExit(input);

    const statePath = getStatePathWithMigration('plan-approved', TEST_SESSION);
    expect(fs.existsSync(statePath)).toBe(false);
  });
});

// =============================================================================
// Test 6: Empty / invalid input handling (fail open -- no crash, no state)
// =============================================================================

describe('empty and invalid input handling', () => {
  it('does not crash on empty input object', () => {
    expect(() => handlePlanExit({} as any)).not.toThrow();
  });

  it('does not crash on null input', () => {
    expect(() => handlePlanExit(null as any)).not.toThrow();
  });

  it('does not crash on undefined input', () => {
    expect(() => handlePlanExit(undefined as any)).not.toThrow();
  });

  it('does not write state for empty input', () => {
    handlePlanExit({} as any);

    const statePath = getStatePathWithMigration('plan-approved', TEST_SESSION);
    expect(fs.existsSync(statePath)).toBe(false);
  });

  it('does not crash on input missing session_id', () => {
    const input = {
      tool_name: 'ExitPlanMode',
      tool_input: {},
    };
    // Should not throw -- hook should use fallback session ID or skip gracefully
    expect(() => handlePlanExit(input as any)).not.toThrow();
  });

  it('does not crash on input with non-string tool_name', () => {
    const input = {
      session_id: TEST_SESSION,
      tool_name: 12345,
      tool_input: {},
    };
    expect(() => handlePlanExit(input as any)).not.toThrow();
  });
});

// =============================================================================
// Test 7: State can be read back (round-trip)
// =============================================================================

describe('state round-trip', () => {
  it('state written by handlePlanExit can be read back with readStateWithLock', () => {
    const input = {
      session_id: TEST_SESSION,
      tool_name: 'ExitPlanMode',
      tool_input: {},
    };

    handlePlanExit(input);

    const statePath = getStatePathWithMigration('plan-approved', TEST_SESSION);
    const raw = readStateWithLock(statePath);
    expect(raw).not.toBeNull();

    const state = JSON.parse(raw!);
    expect(state).toEqual(
      expect.objectContaining({
        approved: true,
        sessionId: TEST_SESSION,
      }),
    );
    expect(typeof state.timestamp).toBe('number');
  });

  it('state is valid JSON', () => {
    const input = {
      session_id: TEST_SESSION,
      tool_name: 'ExitPlanMode',
      tool_input: {},
    };

    handlePlanExit(input);

    const statePath = getStatePathWithMigration('plan-approved', TEST_SESSION);
    const raw = readStateWithLock(statePath);
    expect(() => JSON.parse(raw!)).not.toThrow();
  });

  it('overwriting state updates the timestamp', () => {
    const input = {
      session_id: TEST_SESSION,
      tool_name: 'ExitPlanMode',
      tool_input: {},
    };

    handlePlanExit(input);
    const statePath = getStatePathWithMigration('plan-approved', TEST_SESSION);
    const firstState = JSON.parse(readStateWithLock(statePath)!);

    // Small delay
    const waitUntil = Date.now() + 10;
    while (Date.now() < waitUntil) { /* spin */ }

    handlePlanExit(input);
    const secondState = JSON.parse(readStateWithLock(statePath)!);

    expect(secondState.timestamp).toBeGreaterThanOrEqual(firstState.timestamp);
    expect(secondState.approved).toBe(true);
    expect(secondState.sessionId).toBe(TEST_SESSION);
  });
});
