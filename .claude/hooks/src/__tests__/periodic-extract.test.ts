/**
 * Tests for periodic-extract PostToolUse hook.
 *
 * The periodic-extract hook fires on every tool use and increments a counter
 * in a session-specific state file. Every INTERVAL (50) tool uses, it triggers
 * a lightweight memory extraction by spawning store_learning.py in the background.
 *
 * Exported functions under test:
 *   - loadState(stateFile): reads state from disk, returns default if missing
 *   - saveState(stateFile, state): writes state to disk
 *   - trackTool(state, toolName, interval): adds tool to state, returns updated state
 *   - shouldExtract(state, interval): returns true if count is a multiple of interval
 *   - buildSummary(tools): builds a human-readable summary of tool usage
 *   - buildLearningContent(state, sessionId): builds content string for store_learning.py
 *   - buildOutput(state): builds the JSON output for stdout
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  loadState,
  saveState,
  trackTool,
  shouldExtract,
  buildSummary,
  buildLearningContent,
  buildOutput,
  INTERVAL,
  type PeriodicState,
} from '../periodic-extract.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEST_SESSION = 'periodic-extract-test';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let tempDir: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'periodic-extract-test-'));
});

afterEach(() => {
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

// =============================================================================
// Test 1: INTERVAL constant
// =============================================================================

describe('INTERVAL', () => {
  it('is 50', () => {
    expect(INTERVAL).toBe(50);
  });
});

// =============================================================================
// Test 2: loadState -- reads state from disk
// =============================================================================

describe('loadState', () => {
  it('returns default state when file does not exist', () => {
    const stateFile = path.join(tempDir, 'nonexistent.json');
    const state = loadState(stateFile);
    expect(state.count).toBe(0);
    expect(state.lastExtract).toBe(0);
    expect(state.tools).toEqual([]);
  });

  it('reads existing state from disk', () => {
    const stateFile = path.join(tempDir, 'state.json');
    const existing: PeriodicState = { count: 42, lastExtract: 1000, tools: ['Bash', 'Read'] };
    fs.writeFileSync(stateFile, JSON.stringify(existing));

    const state = loadState(stateFile);
    expect(state.count).toBe(42);
    expect(state.lastExtract).toBe(1000);
    expect(state.tools).toEqual(['Bash', 'Read']);
  });

  it('returns default state for corrupted JSON', () => {
    const stateFile = path.join(tempDir, 'bad.json');
    fs.writeFileSync(stateFile, 'not valid json{{{');

    const state = loadState(stateFile);
    expect(state.count).toBe(0);
    expect(state.tools).toEqual([]);
  });

  it('handles empty file gracefully', () => {
    const stateFile = path.join(tempDir, 'empty.json');
    fs.writeFileSync(stateFile, '');

    const state = loadState(stateFile);
    expect(state.count).toBe(0);
  });

  it('handles state with missing fields by providing defaults', () => {
    const stateFile = path.join(tempDir, 'partial.json');
    fs.writeFileSync(stateFile, JSON.stringify({ count: 10 }));

    const state = loadState(stateFile);
    expect(state.count).toBe(10);
    expect(state.lastExtract).toBe(0);
    expect(state.tools).toEqual([]);
  });
});

// =============================================================================
// Test 3: saveState -- writes state to disk
// =============================================================================

describe('saveState', () => {
  it('writes state that can be read back', () => {
    const stateFile = path.join(tempDir, 'save-test.json');
    const state: PeriodicState = { count: 5, lastExtract: 999, tools: ['Glob'] };

    saveState(stateFile, state);

    const raw = fs.readFileSync(stateFile, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.count).toBe(5);
    expect(parsed.lastExtract).toBe(999);
    expect(parsed.tools).toEqual(['Glob']);
  });

  it('overwrites existing state', () => {
    const stateFile = path.join(tempDir, 'overwrite.json');
    saveState(stateFile, { count: 1, lastExtract: 0, tools: [] });
    saveState(stateFile, { count: 2, lastExtract: 100, tools: ['Bash'] });

    const parsed = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    expect(parsed.count).toBe(2);
  });

  it('does not throw on write errors (fail-open)', () => {
    // Write to a non-existent directory -- should not throw
    const badPath = path.join(tempDir, 'nonexistent-dir', 'deep', 'state.json');
    expect(() => saveState(badPath, { count: 1, lastExtract: 0, tools: [] })).not.toThrow();
  });
});

// =============================================================================
// Test 4: trackTool -- adds tool name and increments counter
// =============================================================================

describe('trackTool', () => {
  it('increments count by 1', () => {
    const state: PeriodicState = { count: 0, lastExtract: 0, tools: [] };
    const updated = trackTool(state, 'Bash', INTERVAL);
    expect(updated.count).toBe(1);
  });

  it('appends tool name to tools array', () => {
    const state: PeriodicState = { count: 0, lastExtract: 0, tools: [] };
    const updated = trackTool(state, 'Read', INTERVAL);
    expect(updated.tools).toContain('Read');
  });

  it('keeps tools array at most INTERVAL length', () => {
    const tools = Array.from({ length: 55 }, (_, i) => `Tool${i}`);
    const state: PeriodicState = { count: 55, lastExtract: 0, tools };
    const updated = trackTool(state, 'NewTool', INTERVAL);
    expect(updated.tools.length).toBeLessThanOrEqual(INTERVAL);
    expect(updated.tools[updated.tools.length - 1]).toBe('NewTool');
  });

  it('handles empty tool name', () => {
    const state: PeriodicState = { count: 0, lastExtract: 0, tools: [] };
    const updated = trackTool(state, '', INTERVAL);
    expect(updated.count).toBe(1);
    expect(updated.tools).toContain('');
  });

  it('does not mutate the original state object', () => {
    const state: PeriodicState = { count: 5, lastExtract: 0, tools: ['A'] };
    const updated = trackTool(state, 'B', INTERVAL);
    expect(state.count).toBe(5);
    expect(state.tools).toEqual(['A']);
    expect(updated.count).toBe(6);
  });
});

// =============================================================================
// Test 5: shouldExtract -- determines if extraction should trigger
// =============================================================================

describe('shouldExtract', () => {
  it('returns true when count is exactly INTERVAL', () => {
    const state: PeriodicState = { count: 50, lastExtract: 0, tools: [] };
    expect(shouldExtract(state, INTERVAL)).toBe(true);
  });

  it('returns true when count is a multiple of INTERVAL', () => {
    const state100: PeriodicState = { count: 100, lastExtract: 0, tools: [] };
    expect(shouldExtract(state100, INTERVAL)).toBe(true);

    const state150: PeriodicState = { count: 150, lastExtract: 0, tools: [] };
    expect(shouldExtract(state150, INTERVAL)).toBe(true);
  });

  it('returns false when count is not a multiple of INTERVAL', () => {
    const state: PeriodicState = { count: 49, lastExtract: 0, tools: [] };
    expect(shouldExtract(state, INTERVAL)).toBe(false);
  });

  it('returns false when count is 0', () => {
    const state: PeriodicState = { count: 0, lastExtract: 0, tools: [] };
    expect(shouldExtract(state, INTERVAL)).toBe(false);
  });

  it('returns false for count 1', () => {
    const state: PeriodicState = { count: 1, lastExtract: 0, tools: [] };
    expect(shouldExtract(state, INTERVAL)).toBe(false);
  });

  it('returns false for count 51', () => {
    const state: PeriodicState = { count: 51, lastExtract: 0, tools: [] };
    expect(shouldExtract(state, INTERVAL)).toBe(false);
  });
});

// =============================================================================
// Test 6: buildSummary -- summarizes tool usage
// =============================================================================

describe('buildSummary', () => {
  it('returns empty string for empty tools array', () => {
    expect(buildSummary([])).toBe('');
  });

  it('counts and sorts tools by frequency', () => {
    const tools = ['Bash', 'Bash', 'Read', 'Bash', 'Read', 'Glob'];
    const summary = buildSummary(tools);
    // Bash(3) should come first since it has highest count
    expect(summary).toMatch(/^Bash\(3\)/);
    expect(summary).toContain('Read(2)');
    expect(summary).toContain('Glob(1)');
  });

  it('limits to top 5 tools', () => {
    const tools = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const summary = buildSummary(tools);
    const parts = summary.split(', ');
    expect(parts.length).toBeLessThanOrEqual(5);
  });

  it('handles single tool', () => {
    const summary = buildSummary(['Bash']);
    expect(summary).toBe('Bash(1)');
  });

  it('separates entries with comma-space', () => {
    const tools = ['Bash', 'Read'];
    const summary = buildSummary(tools);
    expect(summary).toContain(', ');
  });
});

// =============================================================================
// Test 7: buildLearningContent -- builds the content string for storage
// =============================================================================

describe('buildLearningContent', () => {
  it('includes tool count in content', () => {
    const state: PeriodicState = { count: 50, lastExtract: 0, tools: ['Bash', 'Read'] };
    const content = buildLearningContent(state, TEST_SESSION);
    expect(content).toContain('50');
  });

  it('includes session ID in content', () => {
    const state: PeriodicState = { count: 50, lastExtract: 0, tools: ['Bash'] };
    const content = buildLearningContent(state, TEST_SESSION);
    expect(content).toContain(TEST_SESSION);
  });

  it('includes tool summary in content', () => {
    const state: PeriodicState = { count: 50, lastExtract: 0, tools: ['Bash', 'Bash', 'Read'] };
    const content = buildLearningContent(state, TEST_SESSION);
    expect(content).toContain('Bash(2)');
    expect(content).toContain('Read(1)');
  });

  it('mentions mid-session checkpoint', () => {
    const state: PeriodicState = { count: 100, lastExtract: 0, tools: [] };
    const content = buildLearningContent(state, TEST_SESSION);
    expect(content.toLowerCase()).toContain('mid-session');
  });
});

// =============================================================================
// Test 8: buildOutput -- constructs stdout JSON
// =============================================================================

describe('buildOutput', () => {
  it('returns empty object when not at extraction interval', () => {
    const state: PeriodicState = { count: 49, lastExtract: 0, tools: [] };
    const output = buildOutput(state, false);
    expect(output).toEqual({});
  });

  it('returns values.system when extraction occurred', () => {
    const state: PeriodicState = { count: 50, lastExtract: Date.now(), tools: [] };
    const output = buildOutput(state, true);
    expect(output).toHaveProperty('values');
    expect(output).toHaveProperty('values.system');
  });

  it('system message includes tool count', () => {
    const state: PeriodicState = { count: 100, lastExtract: Date.now(), tools: [] };
    const output = buildOutput(state, true);
    expect((output as any).values.system).toContain('100');
  });

  it('system message mentions periodic extraction', () => {
    const state: PeriodicState = { count: 50, lastExtract: Date.now(), tools: [] };
    const output = buildOutput(state, true);
    const msg = (output as any).values.system.toLowerCase();
    expect(msg).toContain('periodic');
    expect(msg).toContain('extraction');
  });
});

// =============================================================================
// Test 9: Integration -- full cycle without spawning
// =============================================================================

describe('integration: counter lifecycle', () => {
  it('counts up correctly over multiple trackTool calls', () => {
    let state: PeriodicState = { count: 0, lastExtract: 0, tools: [] };
    for (let i = 0; i < 50; i++) {
      state = trackTool(state, `Tool${i % 5}`, INTERVAL);
    }
    expect(state.count).toBe(50);
    expect(shouldExtract(state, INTERVAL)).toBe(true);
  });

  it('tools array stays bounded at INTERVAL', () => {
    let state: PeriodicState = { count: 0, lastExtract: 0, tools: [] };
    for (let i = 0; i < 100; i++) {
      state = trackTool(state, `Tool${i}`, INTERVAL);
    }
    expect(state.tools.length).toBeLessThanOrEqual(INTERVAL);
  });

  it('round-trips through file: save then load', () => {
    const stateFile = path.join(tempDir, 'roundtrip.json');
    const state: PeriodicState = { count: 49, lastExtract: 500, tools: ['Bash', 'Read'] };

    saveState(stateFile, state);
    const loaded = loadState(stateFile);

    expect(loaded.count).toBe(49);
    expect(loaded.lastExtract).toBe(500);
    expect(loaded.tools).toEqual(['Bash', 'Read']);
  });

  it('extraction triggers at exactly the 50th call after save/load', () => {
    const stateFile = path.join(tempDir, 'trigger.json');

    // Simulate 49 calls
    let state: PeriodicState = { count: 0, lastExtract: 0, tools: [] };
    for (let i = 0; i < 49; i++) {
      state = trackTool(state, 'Bash', INTERVAL);
    }
    saveState(stateFile, state);

    // Load and do the 50th
    state = loadState(stateFile);
    state = trackTool(state, 'Bash', INTERVAL);
    expect(shouldExtract(state, INTERVAL)).toBe(true);
    expect(state.count).toBe(50);
  });
});
