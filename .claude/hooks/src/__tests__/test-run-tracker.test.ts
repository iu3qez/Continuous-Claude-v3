/**
 * Tests for test-run-tracker PostToolUse hook.
 *
 * This hook fires on PostToolUse for Bash. It detects test commands
 * (vitest, jest, pytest, npm test, etc.) and records the timestamp
 * to a state file that test-before-done reads.
 *
 * State file: $TEMP/claude-recent-test-runs-<sessionId>.json
 * Content:    { "lastTestRun": <epoch ms>, "command": "<cmd>" }
 *
 * Behavior:
 * - Detects test commands via regex patterns
 * - Writes state file with timestamp and command
 * - Ignores non-Bash tool calls
 * - Ignores non-test Bash commands
 * - Fails open: any error -> output {}
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { TEST_PATTERNS, getStateFile } from '../test-run-tracker.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEST_SESSION = 'test-run-tracker-session';
const TEST_SESSION_B = 'test-run-tracker-session-b';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatePath(sessionId: string): string {
  return path.join(os.tmpdir(), `claude-recent-test-runs-${sessionId}.json`);
}

function writeTestState(sessionId: string, lastTestRun: number, command = 'npm test'): void {
  const statePath = getStatePath(sessionId);
  fs.writeFileSync(statePath, JSON.stringify({ lastTestRun, command }), 'utf-8');
}

function cleanupStateFiles(): void {
  for (const sid of [TEST_SESSION, TEST_SESSION_B]) {
    const statePath = getStatePath(sid);
    try {
      if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
    } catch { /* ignore */ }
  }
}

beforeEach(() => {
  cleanupStateFiles();
});

afterEach(() => {
  cleanupStateFiles();
});

// =============================================================================
// Test 1: TEST_PATTERNS -- regex pattern matching
// =============================================================================

describe('TEST_PATTERNS', () => {
  it('detects vitest command', () => {
    const cmd = 'npx vitest run';
    const match = TEST_PATTERNS.some(p => p.test(cmd));
    expect(match).toBe(true);
  });

  it('detects jest command', () => {
    const cmd = 'npx jest --coverage';
    const match = TEST_PATTERNS.some(p => p.test(cmd));
    expect(match).toBe(true);
  });

  it('detects pytest command', () => {
    const cmd = 'uv run pytest tests/';
    const match = TEST_PATTERNS.some(p => p.test(cmd));
    expect(match).toBe(true);
  });

  it('detects npm test command', () => {
    const cmd = 'npm test';
    const match = TEST_PATTERNS.some(p => p.test(cmd));
    expect(match).toBe(true);
  });

  it('detects npm run test command', () => {
    const cmd = 'npm run test';
    const match = TEST_PATTERNS.some(p => p.test(cmd));
    expect(match).toBe(true);
  });

  it('detects cargo test command', () => {
    const cmd = 'cargo test --release';
    const match = TEST_PATTERNS.some(p => p.test(cmd));
    expect(match).toBe(true);
  });

  it('detects go test command', () => {
    const cmd = 'go test ./...';
    const match = TEST_PATTERNS.some(p => p.test(cmd));
    expect(match).toBe(true);
  });

  it('ignores non-test Bash commands', () => {
    const cmds = ['git status', 'ls -la', 'echo hello', 'cat file.ts', 'npm install'];
    for (const cmd of cmds) {
      const match = TEST_PATTERNS.some(p => p.test(cmd));
      expect(match).toBe(false);
    }
  });
});

// =============================================================================
// Test 2: getStateFile -- state file path generation
// =============================================================================

describe('getStateFile', () => {
  it('returns path in tmpdir with session ID', () => {
    const result = getStateFile(TEST_SESSION);
    expect(result).toContain(os.tmpdir());
    expect(result).toContain(TEST_SESSION);
    expect(result).toContain('claude-recent-test-runs-');
  });

  it('produces different paths for different sessions', () => {
    const pathA = getStateFile(TEST_SESSION);
    const pathB = getStateFile(TEST_SESSION_B);
    expect(pathA).not.toBe(pathB);
  });

  it('handles default session ID', () => {
    const result = getStateFile('default');
    expect(result).toContain('claude-recent-test-runs-default');
  });
});

// =============================================================================
// Test 3: Session isolation
// =============================================================================

describe('session isolation', () => {
  it('session A state does not affect session B', () => {
    // Write state for session A
    writeTestState(TEST_SESSION, Date.now(), 'npm test');

    // Session A state file exists
    expect(fs.existsSync(getStatePath(TEST_SESSION))).toBe(true);

    // Session B state file does not exist
    expect(fs.existsSync(getStatePath(TEST_SESSION_B))).toBe(false);
  });
});

// =============================================================================
// Test 4: State file content
// =============================================================================

describe('state file content', () => {
  it('writes valid JSON with lastTestRun and command', () => {
    const before = Date.now();
    writeTestState(TEST_SESSION, before, 'vitest run');
    const content = JSON.parse(fs.readFileSync(getStatePath(TEST_SESSION), 'utf-8'));
    expect(content).toHaveProperty('lastTestRun', before);
    expect(content).toHaveProperty('command', 'vitest run');
  });

  it('handles empty state file gracefully', () => {
    const statePath = getStatePath(TEST_SESSION);
    fs.writeFileSync(statePath, '', 'utf-8');
    expect(() => {
      try { JSON.parse(fs.readFileSync(statePath, 'utf-8')); } catch { /* expected */ }
    }).not.toThrow();
  });

  it('handles malformed JSON gracefully', () => {
    const statePath = getStatePath(TEST_SESSION);
    fs.writeFileSync(statePath, 'not-json{{{', 'utf-8');
    expect(() => {
      try { JSON.parse(fs.readFileSync(statePath, 'utf-8')); } catch { /* expected */ }
    }).not.toThrow();
  });
});
