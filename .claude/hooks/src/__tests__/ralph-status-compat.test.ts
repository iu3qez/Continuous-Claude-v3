/**
 * Ralph Status Compatibility — Regression Tests (HIGH-1 + HIGH-2)
 *
 * HIGH-1: Tests that 'complete' and 'completed' are both accepted as done statuses.
 * Pattern from session-start-recovery.ts:121:
 *   const completedTasks = tasks.filter((t: any) => t.status === 'complete' || t.status === 'completed').length;
 *
 * HIGH-2: Tests that retry field is `entry.attempt` (not `entry.retry_count`)
 * and the escalation function getEscalationAgent.
 * Pattern from ralph-retry-reminder.ts:85:
 *   const retries = entry.attempt || 0;
 * And ralph-retry-reminder.ts:38-43:
 *   function getEscalationAgent(retries, originalAgent) { ... }
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Replicate the exact status filter from session-start-recovery.ts:121
// ---------------------------------------------------------------------------

function countCompleted(tasks: any[]): number {
  return tasks.filter((t: any) => t.status === 'complete' || t.status === 'completed').length;
}

// ---------------------------------------------------------------------------
// Replicate the exact retry field access from ralph-retry-reminder.ts:85
// ---------------------------------------------------------------------------

function getRetryCount(entry: any): number {
  return entry.attempt || 0;
}

// ---------------------------------------------------------------------------
// Replicate the exact escalation function from ralph-retry-reminder.ts:38-43
// ---------------------------------------------------------------------------

function getEscalationAgent(retries: number, originalAgent: string): string {
  if (retries === 0) return originalAgent || 'spark';
  if (retries === 1) return 'spark';
  if (retries === 2) return 'debug-agent';
  return 'ESCALATE';
}

// =============================================================================
// HIGH-1 Tests: status compatibility ('complete' vs 'completed')
// =============================================================================

describe('countCompleted — status: complete', () => {
  it('counts tasks with status "complete"', () => {
    const tasks = [
      { id: '1.1', status: 'complete', name: 'Done v2' },
      { id: '1.2', status: 'pending', name: 'Waiting' },
    ];

    expect(countCompleted(tasks)).toBe(1);
  });
});

describe('countCompleted — status: completed', () => {
  it('counts tasks with status "completed"', () => {
    const tasks = [
      { id: '1.1', status: 'completed', name: 'Done v1' },
      { id: '1.2', status: 'pending', name: 'Waiting' },
    ];

    expect(countCompleted(tasks)).toBe(1);
  });
});

describe('countCompleted — mixed statuses', () => {
  it('counts both "complete" and "completed" in a mixed list', () => {
    const tasks = [
      { id: '1.1', status: 'complete', name: 'V2 task' },
      { id: '1.2', status: 'completed', name: 'V1 task' },
      { id: '1.3', status: 'in_progress', name: 'Active' },
    ];

    expect(countCompleted(tasks)).toBe(2);
  });

  it('ignores other statuses', () => {
    const tasks = [
      { id: '1.1', status: 'pending', name: 'A' },
      { id: '1.2', status: 'in_progress', name: 'B' },
      { id: '1.3', status: 'failed', name: 'C' },
      { id: '1.4', status: 'blocked', name: 'D' },
    ];

    expect(countCompleted(tasks)).toBe(0);
  });

  it('returns 0 for empty tasks array', () => {
    expect(countCompleted([])).toBe(0);
  });

  it('handles all tasks complete', () => {
    const tasks = [
      { id: '1', status: 'complete' },
      { id: '2', status: 'completed' },
      { id: '3', status: 'complete' },
    ];

    expect(countCompleted(tasks)).toBe(3);
  });
});

// =============================================================================
// HIGH-2 Tests: retry field name (entry.attempt, NOT entry.retry_count)
// =============================================================================

describe('getRetryCount — uses entry.attempt', () => {
  it('reads attempt field from entry', () => {
    const entry = { task_id: '1.1', attempt: 2, last_error: 'timeout' };
    expect(getRetryCount(entry)).toBe(2);
  });

  it('falls back to 0 when attempt is missing', () => {
    const entry = { task_id: '1.1', last_error: 'timeout' };
    expect(getRetryCount(entry)).toBe(0);
  });

  it('falls back to 0 when attempt is null', () => {
    const entry = { task_id: '1.1', attempt: null, last_error: 'timeout' };
    expect(getRetryCount(entry)).toBe(0);
  });

  it('falls back to 0 when attempt is 0', () => {
    // 0 || 0 = 0
    const entry = { task_id: '1.1', attempt: 0 };
    expect(getRetryCount(entry)).toBe(0);
  });

  it('does NOT use retry_count field', () => {
    // Even if retry_count is present, the code reads entry.attempt
    const entry = { task_id: '1.1', retry_count: 5, attempt: 1 };
    expect(getRetryCount(entry)).toBe(1); // uses attempt, NOT retry_count
  });

  it('ignores retry_count when attempt is missing', () => {
    // The code does entry.attempt || 0, so retry_count is never consulted
    const entry = { task_id: '1.1', retry_count: 3 };
    expect(getRetryCount(entry)).toBe(0); // falls back to 0, NOT retry_count
  });
});

// =============================================================================
// HIGH-2 Tests: escalation strategy
// =============================================================================

describe('getEscalationAgent — escalation strategy', () => {
  it('attempt=0 returns originalAgent', () => {
    expect(getEscalationAgent(0, 'kraken')).toBe('kraken');
  });

  it('attempt=0 with empty originalAgent falls back to spark', () => {
    expect(getEscalationAgent(0, '')).toBe('spark');
  });

  it('attempt=1 returns spark (regardless of originalAgent)', () => {
    expect(getEscalationAgent(1, 'kraken')).toBe('spark');
    expect(getEscalationAgent(1, 'architect')).toBe('spark');
    expect(getEscalationAgent(1, '')).toBe('spark');
  });

  it('attempt=2 returns debug-agent', () => {
    expect(getEscalationAgent(2, 'kraken')).toBe('debug-agent');
    expect(getEscalationAgent(2, '')).toBe('debug-agent');
  });

  it('attempt=3 returns ESCALATE', () => {
    expect(getEscalationAgent(3, 'kraken')).toBe('ESCALATE');
  });

  it('attempt=4+ also returns ESCALATE', () => {
    expect(getEscalationAgent(4, 'spark')).toBe('ESCALATE');
    expect(getEscalationAgent(10, 'spark')).toBe('ESCALATE');
    expect(getEscalationAgent(100, 'any')).toBe('ESCALATE');
  });
});

// =============================================================================
// Integration: full retry flow simulation
// =============================================================================

describe('retry flow — end to end', () => {
  it('simulates escalation through retry queue entries', () => {
    const retryQueue = [
      { task_id: '1.1', task_name: 'Auth module', attempt: 0, original_agent: 'kraken', last_error: 'test failure' },
      { task_id: '1.2', task_name: 'DB migration', attempt: 2, original_agent: 'kraken', last_error: 'schema error' },
      { task_id: '1.3', task_name: 'Docs', attempt: 3, original_agent: 'spark', last_error: 'timeout' },
    ];

    const escalations = retryQueue.map(entry => {
      const retries = getRetryCount(entry);
      return {
        taskId: entry.task_id,
        agent: getEscalationAgent(retries, entry.original_agent),
      };
    });

    expect(escalations[0]).toEqual({ taskId: '1.1', agent: 'kraken' });   // attempt 0 -> original
    expect(escalations[1]).toEqual({ taskId: '1.2', agent: 'debug-agent' }); // attempt 2 -> debug-agent
    expect(escalations[2]).toEqual({ taskId: '1.3', agent: 'ESCALATE' });    // attempt 3 -> ESCALATE
  });
});
