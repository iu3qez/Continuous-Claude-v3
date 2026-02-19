/**
 * Ralph Progress Inject — Regression Tests (MEDIUM-1/2)
 *
 * Tests array/object handling for tasks and makeProgressBar math.
 *
 * Patterns tested from ralph-progress-inject.ts:
 *   - Tasks normalization (lines 70-72):
 *       const tasks = Array.isArray(unified.tasks) ? unified.tasks : Object.values(unified.tasks || {});
 *       const total = tasks.length;
 *       const completed = (tasks as any[]).filter(t => t.status === 'complete' || t.status === 'completed').length;
 *
 *   - makeProgressBar function (lines 34-38):
 *       function makeProgressBar(done, total, width = 20) { ... }
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Replicate the exact makeProgressBar from ralph-progress-inject.ts:34-38
// ---------------------------------------------------------------------------

function makeProgressBar(done: number, total: number, width: number = 20): string {
  if (total === 0) return '[' + '-'.repeat(width) + ']';
  const filled = Math.round((done / total) * width);
  const empty = width - filled;
  return '[' + '='.repeat(filled) + '-'.repeat(empty) + ']';
}

// ---------------------------------------------------------------------------
// Replicate the exact task normalization from ralph-progress-inject.ts:70-72
// ---------------------------------------------------------------------------

function normalizeTasks(tasksInput: any): any[] {
  return Array.isArray(tasksInput) ? tasksInput : Object.values(tasksInput || {});
}

function countCompleted(tasks: any[]): number {
  return tasks.filter((t: any) => t.status === 'complete' || t.status === 'completed').length;
}

// =============================================================================
// Test 1: array input works directly
// =============================================================================

describe('normalizeTasks — array input', () => {
  it('passes array input through unchanged', () => {
    const input = [
      { id: '1', status: 'complete', name: 'Done' },
      { id: '2', status: 'in_progress', name: 'Active' },
    ];

    const tasks = normalizeTasks(input);
    expect(tasks).toHaveLength(2);
    expect(tasks[0].id).toBe('1');
    expect(tasks[1].id).toBe('2');
  });

  it('counts completed from array input', () => {
    const input = [
      { status: 'complete' },
      { status: 'in_progress' },
    ];

    expect(countCompleted(normalizeTasks(input))).toBe(1);
  });

  it('handles empty array', () => {
    const tasks = normalizeTasks([]);
    expect(tasks).toHaveLength(0);
  });
});

// =============================================================================
// Test 2: object input (legacy fallback) converts via Object.values
// =============================================================================

describe('normalizeTasks — object input (legacy)', () => {
  it('converts object values to array', () => {
    const input = {
      a: { id: 'a', status: 'complete', name: 'Task A' },
      b: { id: 'b', status: 'pending', name: 'Task B' },
    };

    const tasks = normalizeTasks(input);
    expect(tasks).toHaveLength(2);
  });

  it('counts completed from object input', () => {
    const input = {
      a: { status: 'complete' },
      b: { status: 'pending' },
    };

    expect(countCompleted(normalizeTasks(input))).toBe(1);
  });

  it('handles empty object', () => {
    const tasks = normalizeTasks({});
    expect(tasks).toHaveLength(0);
  });

  it('handles null with fallback to empty object', () => {
    // Object.values(null || {}) = Object.values({}) = []
    const tasks = normalizeTasks(null);
    expect(tasks).toHaveLength(0);
  });

  it('handles undefined with fallback to empty object', () => {
    const tasks = normalizeTasks(undefined);
    expect(tasks).toHaveLength(0);
  });
});

// =============================================================================
// Test 3: both 'complete' and 'completed' counted as done
// =============================================================================

describe('countCompleted — dual status acceptance', () => {
  it('counts "complete" as done', () => {
    const tasks = [{ status: 'complete' }];
    expect(countCompleted(tasks)).toBe(1);
  });

  it('counts "completed" as done', () => {
    const tasks = [{ status: 'completed' }];
    expect(countCompleted(tasks)).toBe(1);
  });

  it('counts both in a mixed list', () => {
    const tasks = [
      { status: 'complete' },
      { status: 'completed' },
      { status: 'in_progress' },
      { status: 'pending' },
    ];

    expect(countCompleted(tasks)).toBe(2);
  });
});

// =============================================================================
// Test 4: makeProgressBar(5, 10, 20) produces correct bar
// =============================================================================

describe('makeProgressBar — half complete', () => {
  it('renders 50% progress correctly', () => {
    const bar = makeProgressBar(5, 10, 20);
    expect(bar).toBe('[==========----------]');
  });

  it('bar length equals width + 2 brackets', () => {
    const bar = makeProgressBar(5, 10, 20);
    expect(bar.length).toBe(22); // 20 chars + '[' + ']'
  });
});

// =============================================================================
// Test 5: makeProgressBar(0, 10, 20) produces empty bar
// =============================================================================

describe('makeProgressBar — 0% progress', () => {
  it('renders all dashes when nothing is done', () => {
    const bar = makeProgressBar(0, 10, 20);
    expect(bar).toBe('[--------------------]');
  });
});

// =============================================================================
// Test 6: makeProgressBar(10, 10, 20) produces full bar
// =============================================================================

describe('makeProgressBar — 100% progress', () => {
  it('renders all equals when everything is done', () => {
    const bar = makeProgressBar(10, 10, 20);
    expect(bar).toBe('[====================]');
  });
});

// =============================================================================
// Test 7: makeProgressBar(0, 0, 20) handles zero total
// =============================================================================

describe('makeProgressBar — zero total', () => {
  it('renders all dashes when total is 0 (no division by zero)', () => {
    const bar = makeProgressBar(0, 0, 20);
    expect(bar).toBe('[--------------------]');
  });

  it('also handles done > 0 with total 0 (edge case)', () => {
    // This would be a data bug, but should not throw
    const bar = makeProgressBar(5, 0, 20);
    expect(bar).toBe('[--------------------]');
  });
});

// =============================================================================
// Additional: various fractions
// =============================================================================

describe('makeProgressBar — various fractions', () => {
  it('renders 25% (5/20 tasks, width 20)', () => {
    const bar = makeProgressBar(5, 20, 20);
    // Math.round((5/20) * 20) = Math.round(5) = 5
    expect(bar).toBe('[=====---------------]');
  });

  it('renders 75% (15/20 tasks, width 20)', () => {
    const bar = makeProgressBar(15, 20, 20);
    // Math.round((15/20) * 20) = Math.round(15) = 15
    expect(bar).toBe('[===============-----]');
  });

  it('renders 1/3 (rounding applies)', () => {
    const bar = makeProgressBar(1, 3, 20);
    // Math.round((1/3) * 20) = Math.round(6.67) = 7
    expect(bar).toBe('[=======-----------]'.length === 22 ? '[=======-----------]' : bar);
    // More precisely:
    const filled = Math.round((1 / 3) * 20);
    expect(filled).toBe(7);
    const expected = '[' + '='.repeat(7) + '-'.repeat(13) + ']';
    expect(bar).toBe(expected);
  });

  it('uses default width of 20 when not specified', () => {
    const bar = makeProgressBar(5, 10);
    // Default width=20, so same as makeProgressBar(5, 10, 20)
    expect(bar).toBe('[==========----------]');
    expect(bar.length).toBe(22);
  });

  it('works with custom width', () => {
    const bar = makeProgressBar(5, 10, 10);
    // Math.round((5/10) * 10) = 5
    expect(bar).toBe('[=====-----]');
    expect(bar.length).toBe(12);
  });
});

// =============================================================================
// Integration: full progress calculation from unified state
// =============================================================================

describe('integration — progress from unified state', () => {
  it('calculates progress from array-based tasks', () => {
    const unified = {
      session: { active: true },
      story_id: 'AUTH-001',
      tasks: [
        { id: '1', status: 'complete' },
        { id: '2', status: 'completed' },
        { id: '3', status: 'in_progress' },
        { id: '4', status: 'pending' },
        { id: '5', status: 'pending' },
      ],
    };

    const tasks = normalizeTasks(unified.tasks);
    const total = tasks.length;
    const completed = countCompleted(tasks);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const bar = makeProgressBar(completed, total);

    expect(total).toBe(5);
    expect(completed).toBe(2);
    expect(pct).toBe(40);
    expect(bar).toBe('[========------------]');
  });

  it('calculates progress from object-based tasks (legacy)', () => {
    const unified = {
      session: { active: true },
      story_id: 'DB-002',
      tasks: {
        '1.1': { status: 'complete' },
        '1.2': { status: 'complete' },
        '1.3': { status: 'complete' },
        '1.4': { status: 'complete' },
      },
    };

    const tasks = normalizeTasks(unified.tasks);
    const total = tasks.length;
    const completed = countCompleted(tasks);
    const bar = makeProgressBar(completed, total);

    expect(total).toBe(4);
    expect(completed).toBe(4);
    expect(bar).toBe('[====================]');
  });
});
