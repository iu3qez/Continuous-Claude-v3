/**
 * Ralph Task List Parse — Regression Tests (CRITICAL-1)
 *
 * Verifies that hooks parse the {success: true, tasks: [...]} envelope correctly,
 * using `parsed.tasks || []` (array access) instead of `Object.entries` on the wrapper.
 *
 * Patterns tested from:
 *   ralph-monitor.ts:94-96
 *   ralph-task-monitor.ts:144-145
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Replicate the exact parse pattern from ralph-monitor.ts:94-96
// and ralph-task-monitor.ts:144-145
// ---------------------------------------------------------------------------

function parseTaskListOutput(stdout: string): any[] {
  const parsed = JSON.parse(stdout);
  const tasks: any[] = parsed.tasks || [];
  return tasks;
}

function filterInProgress(tasks: any[]): any[] {
  return tasks.filter((t: any) => t.status === 'in_progress');
}

function findTaskById(tasks: any[], id: string): any | undefined {
  return tasks.find((t: any) => String(t.id) === id);
}

// Signal patterns from ralph-monitor.ts:36-41
const SIGNAL_PATTERNS = [
  { pattern: /<TASK_COMPLETE\s*\/?>/i, type: 'TASK_COMPLETE' as const },
  { pattern: /<COMPLETE\s*\/?>/i, type: 'COMPLETE' as const },
  { pattern: /<BLOCKED(?:\s+reason="([^"]+)")?\s*\/?>/i, type: 'BLOCKED' as const, reasonGroup: 1 },
  { pattern: /<ERROR(?:\s+reason="([^"]+)")?\s*\/?>/i, type: 'ERROR' as const, reasonGroup: 1 },
];

interface RalphSignal {
  type: 'TASK_COMPLETE' | 'COMPLETE' | 'BLOCKED' | 'ERROR';
  reason?: string;
}

function parseRalphSignals(output: string): RalphSignal[] {
  const signals: RalphSignal[] = [];
  for (const { pattern, type, reasonGroup } of SIGNAL_PATTERNS) {
    const match = output.match(pattern);
    if (match) {
      const signal: RalphSignal = { type };
      if (reasonGroup && match[reasonGroup]) {
        signal.reason = match[reasonGroup];
      }
      signals.push(signal);
    }
  }
  return signals;
}

// =============================================================================
// Test 1: parsed.tasks extracts array from envelope
// =============================================================================

describe('parseTaskListOutput — envelope extraction', () => {
  it('extracts tasks array from {success: true, tasks: [...]} envelope', () => {
    const stdout = JSON.stringify({
      success: true,
      tasks: [
        { id: '1.1', status: 'in_progress', name: 'Test' },
      ],
    });

    const tasks = parseTaskListOutput(stdout);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('1.1');
    expect(tasks[0].status).toBe('in_progress');
    expect(tasks[0].name).toBe('Test');
  });

  it('does NOT treat the envelope itself as a task (no Object.entries on wrapper)', () => {
    const stdout = JSON.stringify({
      success: true,
      tasks: [
        { id: '1.1', status: 'in_progress', name: 'Auth module' },
        { id: '1.2', status: 'pending', name: 'Tests' },
      ],
    });

    const tasks = parseTaskListOutput(stdout);

    // Should be exactly 2 tasks, not 2 entries from the top-level object
    expect(tasks).toHaveLength(2);
    // Each task must have id, status, name — not 'success' or 'tasks' as keys
    expect(tasks[0]).toHaveProperty('id');
    expect(tasks[0]).toHaveProperty('status');
    expect(tasks[0]).not.toHaveProperty('success');
  });
});

// =============================================================================
// Test 2: filter by t.status === 'in_progress' works on array items
// =============================================================================

describe('filterInProgress — status filtering', () => {
  it('filters tasks by status === in_progress', () => {
    const tasks = [
      { id: '1.1', status: 'in_progress', name: 'Active task' },
      { id: '1.2', status: 'pending', name: 'Waiting' },
      { id: '1.3', status: 'complete', name: 'Done' },
    ];

    const result = filterInProgress(tasks);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1.1');
  });

  it('returns multiple in-progress tasks', () => {
    const tasks = [
      { id: '1.1', status: 'in_progress', name: 'A' },
      { id: '1.2', status: 'in_progress', name: 'B' },
      { id: '1.3', status: 'complete', name: 'C' },
    ];

    const result = filterInProgress(tasks);
    expect(result).toHaveLength(2);
  });
});

// =============================================================================
// Test 3: match by t.id (not dict key)
// =============================================================================

describe('findTaskById — ID-based lookup on array', () => {
  it('finds a task by String(t.id) match', () => {
    const tasks = [
      { id: '1.1', status: 'in_progress', name: 'First' },
      { id: '1.2', status: 'pending', name: 'Second' },
    ];

    const found = findTaskById(tasks, '1.2');
    expect(found).toBeDefined();
    expect(found.name).toBe('Second');
  });

  it('handles numeric id by converting with String()', () => {
    const tasks = [
      { id: 1.1, status: 'in_progress', name: 'Numeric ID' },
    ];

    // The hook does String(t.id) === "1.1"
    const found = tasks.find(t => String(t.id) === '1.1');
    expect(found).toBeDefined();
    expect(found!.name).toBe('Numeric ID');
  });

  it('returns undefined when ID not found', () => {
    const tasks = [
      { id: '1.1', status: 'in_progress', name: 'Only' },
    ];

    const found = findTaskById(tasks, '999');
    expect(found).toBeUndefined();
  });
});

// =============================================================================
// Test 4: empty tasks array does not crash
// =============================================================================

describe('parseTaskListOutput — empty tasks', () => {
  it('handles empty tasks array without crash', () => {
    const stdout = JSON.stringify({ success: true, tasks: [] });

    const tasks = parseTaskListOutput(stdout);
    expect(tasks).toHaveLength(0);
    expect(filterInProgress(tasks)).toHaveLength(0);
  });
});

// =============================================================================
// Test 5: missing tasks field falls back to empty array
// =============================================================================

describe('parseTaskListOutput — missing tasks field', () => {
  it('returns empty array when tasks field is missing', () => {
    const stdout = JSON.stringify({ success: true });

    const tasks = parseTaskListOutput(stdout);
    expect(tasks).toEqual([]);
  });

  it('returns empty array when tasks field is null', () => {
    const stdout = JSON.stringify({ success: true, tasks: null });

    // parsed.tasks || [] where parsed.tasks is null
    const tasks = parseTaskListOutput(stdout);
    expect(tasks).toEqual([]);
  });

  it('returns empty array when tasks field is undefined', () => {
    const stdout = JSON.stringify({ success: true, tasks: undefined });

    // undefined serialized as missing key -> parsed.tasks is undefined -> fallback []
    const tasks = parseTaskListOutput(stdout);
    expect(tasks).toEqual([]);
  });
});

// =============================================================================
// Test 6: signal parsing from output text
// =============================================================================

describe('parseRalphSignals — signal detection', () => {
  it('detects <TASK_COMPLETE/> signal', () => {
    const signals = parseRalphSignals('Some output\n<TASK_COMPLETE/>\nMore text');
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe('TASK_COMPLETE');
  });

  it('detects <TASK_COMPLETE> without self-closing slash', () => {
    const signals = parseRalphSignals('<TASK_COMPLETE>');
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe('TASK_COMPLETE');
  });

  it('detects <BLOCKED reason="timeout"/> with reason', () => {
    const signals = parseRalphSignals('<BLOCKED reason="timeout"/>');
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe('BLOCKED');
    expect(signals[0].reason).toBe('timeout');
  });

  it('detects <BLOCKED/> without reason', () => {
    const signals = parseRalphSignals('<BLOCKED/>');
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe('BLOCKED');
    expect(signals[0].reason).toBeUndefined();
  });

  it('detects <ERROR reason="compile failure"/> with reason', () => {
    const signals = parseRalphSignals('<ERROR reason="compile failure"/>');
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe('ERROR');
    expect(signals[0].reason).toBe('compile failure');
  });

  it('detects <COMPLETE/> signal', () => {
    const signals = parseRalphSignals('<COMPLETE/>');
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe('COMPLETE');
  });

  it('detects multiple signals in one output', () => {
    const signals = parseRalphSignals('<TASK_COMPLETE/>\n<BLOCKED reason="tests"/>');
    expect(signals).toHaveLength(2);
    const types = signals.map(s => s.type);
    expect(types).toContain('TASK_COMPLETE');
    expect(types).toContain('BLOCKED');
  });

  it('returns empty array when no signals present', () => {
    const signals = parseRalphSignals('Regular output with no signals');
    expect(signals).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    const signals = parseRalphSignals('<task_complete/>');
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe('TASK_COMPLETE');
  });
});
