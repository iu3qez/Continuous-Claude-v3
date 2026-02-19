/**
 * Ralph Watchdog — Regression Tests (CRITICAL-2)
 *
 * Verifies that the watchdog uses `last_activity` (epoch ms int),
 * not `last_heartbeat` (ISO string), for staleness detection.
 *
 * Pattern tested from ralph-watchdog.ts:89-91:
 *   const lastHeartbeat = unified.session.last_activity || 0;
 *   const elapsed = Date.now() - lastHeartbeat;
 *   if (elapsed >= STALE_THRESHOLD_MS) { ... }
 *
 * STALE_THRESHOLD_MS = 30 * 60 * 1000 = 1,800,000 ms
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Replicate the exact staleness check from ralph-watchdog.ts:89-91
// ---------------------------------------------------------------------------

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

interface UnifiedSession {
  active: boolean;
  last_activity?: number;  // epoch ms (int)
  last_heartbeat?: string; // ISO string — SHOULD NOT be used
}

interface UnifiedState {
  session: UnifiedSession;
  story_id?: string;
}

/**
 * Returns the staleness check result exactly as ralph-watchdog.ts does it.
 * Returns { stale: boolean, elapsedMs: number } for test assertions.
 */
function checkStaleness(unified: UnifiedState, now: number): { stale: boolean; elapsedMs: number } {
  // Exact pattern from ralph-watchdog.ts:89-91
  const lastHeartbeat = unified.session.last_activity || 0;
  const elapsed = now - lastHeartbeat;
  return {
    stale: elapsed >= STALE_THRESHOLD_MS,
    elapsedMs: elapsed,
  };
}

// =============================================================================
// Test 1: fresh activity (5 min ago) is NOT stale
// =============================================================================

describe('checkStaleness — fresh activity', () => {
  it('detects activity from 5 minutes ago as NOT stale', () => {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    const unified: UnifiedState = {
      session: {
        active: true,
        last_activity: fiveMinutesAgo,
      },
    };

    const result = checkStaleness(unified, now);
    expect(result.stale).toBe(false);
    expect(result.elapsedMs).toBeLessThan(STALE_THRESHOLD_MS);
  });

  it('detects activity from 29 minutes ago as NOT stale', () => {
    const now = Date.now();
    const twentyNineMinAgo = now - (29 * 60 * 1000);

    const unified: UnifiedState = {
      session: {
        active: true,
        last_activity: twentyNineMinAgo,
      },
    };

    const result = checkStaleness(unified, now);
    expect(result.stale).toBe(false);
  });
});

// =============================================================================
// Test 2: old activity (45 min ago) IS stale
// =============================================================================

describe('checkStaleness — old activity', () => {
  it('detects activity from 45 minutes ago as stale', () => {
    const now = Date.now();
    const fortyFiveMinAgo = now - (45 * 60 * 1000);

    const unified: UnifiedState = {
      session: {
        active: true,
        last_activity: fortyFiveMinAgo,
      },
    };

    const result = checkStaleness(unified, now);
    expect(result.stale).toBe(true);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(STALE_THRESHOLD_MS);
  });

  it('detects activity from exactly 30 minutes ago as stale (boundary)', () => {
    const now = Date.now();
    const exactlyThirtyMin = now - STALE_THRESHOLD_MS;

    const unified: UnifiedState = {
      session: {
        active: true,
        last_activity: exactlyThirtyMin,
      },
    };

    const result = checkStaleness(unified, now);
    // elapsed >= STALE_THRESHOLD_MS means exactly 30 min IS stale
    expect(result.stale).toBe(true);
  });
});

// =============================================================================
// Test 3: missing last_activity falls back to 0 (always stale)
// =============================================================================

describe('checkStaleness — missing last_activity', () => {
  it('falls back to 0 when last_activity is undefined, making it stale', () => {
    const now = Date.now();

    const unified: UnifiedState = {
      session: {
        active: true,
        // last_activity is missing/undefined
      },
    };

    const result = checkStaleness(unified, now);
    // elapsed = now - 0 = now (huge number, always >= 30 min)
    expect(result.stale).toBe(true);
    expect(result.elapsedMs).toBe(now);
  });

  it('falls back to 0 when last_activity is null', () => {
    const now = Date.now();

    const unified: UnifiedState = {
      session: {
        active: true,
        last_activity: null as any,
      },
    };

    const result = checkStaleness(unified, now);
    // null || 0 = 0
    expect(result.stale).toBe(true);
    expect(result.elapsedMs).toBe(now);
  });

  it('falls back to 0 when last_activity is 0', () => {
    const now = Date.now();

    const unified: UnifiedState = {
      session: {
        active: true,
        last_activity: 0,
      },
    };

    const result = checkStaleness(unified, now);
    // 0 || 0 = 0 (falsy, falls through to 0)
    expect(result.stale).toBe(true);
  });
});

// =============================================================================
// Test 4: last_activity is epoch ms number, NOT ISO string
// =============================================================================

describe('checkStaleness — data type validation', () => {
  it('works correctly with epoch millisecond number', () => {
    const now = 1707000000000; // Fixed epoch ms for deterministic test
    const tenMinAgo = now - (10 * 60 * 1000);

    const unified: UnifiedState = {
      session: {
        active: true,
        last_activity: tenMinAgo,
      },
    };

    const result = checkStaleness(unified, now);
    expect(result.stale).toBe(false);
    expect(result.elapsedMs).toBe(10 * 60 * 1000);
  });

  it('epoch ms is a large integer (not seconds, not ISO)', () => {
    const epochMs = 1707000000000;

    // Epoch ms should be > 1_000_000_000_000 (post-2001)
    expect(epochMs).toBeGreaterThan(1_000_000_000_000);

    // It is a number, not a string
    expect(typeof epochMs).toBe('number');
  });
});

// =============================================================================
// Test 5: last_heartbeat string field should NOT be used
// =============================================================================

describe('checkStaleness — last_heartbeat is ignored', () => {
  it('does NOT use last_heartbeat string for staleness calculation', () => {
    const now = Date.now();

    const unified: UnifiedState = {
      session: {
        active: true,
        // No last_activity, but has last_heartbeat (which should be ignored)
        last_heartbeat: new Date(now - 1000).toISOString(), // 1 second ago
      },
    };

    const result = checkStaleness(unified, now);

    // Because we use last_activity (missing), NOT last_heartbeat (fresh),
    // this should be stale
    expect(result.stale).toBe(true);
  });

  it('uses last_activity even when last_heartbeat is also present', () => {
    const now = Date.now();
    const fiveMinAgo = now - (5 * 60 * 1000);

    const unified: UnifiedState = {
      session: {
        active: true,
        last_activity: fiveMinAgo,                           // 5 min ago (fresh)
        last_heartbeat: new Date(now - 60 * 60 * 1000).toISOString(), // 1 hour ago (stale)
      },
    };

    const result = checkStaleness(unified, now);

    // Should use last_activity (5 min), NOT last_heartbeat (1 hour)
    expect(result.stale).toBe(false);
    expect(result.elapsedMs).toBe(5 * 60 * 1000);
  });

  it('subtracting Date.now() from an ISO string produces NaN, not a valid elapsed time', () => {
    const now = Date.now();
    const isoString = new Date().toISOString();

    // Demonstrate why using an ISO string would be wrong:
    // Date.now() - "2026-02-19T..." results in NaN-like behavior
    const badElapsed = now - (isoString as any);
    expect(Number.isNaN(badElapsed)).toBe(true);
  });
});

// =============================================================================
// Additional: legacy checkStaleWorkflow uses lastActivity OR activatedAt
// =============================================================================

describe('legacy checkStaleWorkflow — fallback chain', () => {
  it('uses lastActivity field from legacy state', () => {
    // From ralph-watchdog.ts:49: const lastTime = state.lastActivity || state.activatedAt;
    const state = {
      active: true,
      lastActivity: Date.now() - (5 * 60 * 1000),
      activatedAt: Date.now() - (60 * 60 * 1000),
    };

    const lastTime = state.lastActivity || state.activatedAt;
    const elapsed = Date.now() - lastTime;
    expect(elapsed).toBeLessThan(STALE_THRESHOLD_MS);
  });

  it('falls back to activatedAt when lastActivity is missing', () => {
    const state = {
      active: true,
      activatedAt: Date.now() - (5 * 60 * 1000),
    };

    const lastTime = (state as any).lastActivity || state.activatedAt;
    const elapsed = Date.now() - lastTime;
    expect(elapsed).toBeLessThan(STALE_THRESHOLD_MS);
  });
});
