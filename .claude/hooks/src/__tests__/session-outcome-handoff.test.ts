/**
 * Tests for session-outcome.ts handoff reminder extension.
 *
 * When a session outcome is PARTIAL_PLUS or PARTIAL_MINUS, the hook
 * should include a reminder to create a handoff document.
 *
 * The session-outcome hook is a Stop hook that fires on session end.
 * We test the new buildOutcomeMessage helper that generates the output
 * message including the handoff reminder when appropriate.
 */

import { describe, it, expect } from 'vitest';

import {
  buildOutcomeMessage,
  needsHandoffReminder,
} from '../session-outcome.js';

// =============================================================================
// Test 1: needsHandoffReminder -- detect partial outcomes
// =============================================================================

describe('needsHandoffReminder', () => {
  it('returns true for PARTIAL_PLUS', () => {
    expect(needsHandoffReminder('PARTIAL_PLUS')).toBe(true);
  });

  it('returns true for PARTIAL_MINUS', () => {
    expect(needsHandoffReminder('PARTIAL_MINUS')).toBe(true);
  });

  it('returns false for SUCCEEDED', () => {
    expect(needsHandoffReminder('SUCCEEDED')).toBe(false);
  });

  it('returns false for FAILED', () => {
    expect(needsHandoffReminder('FAILED')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(needsHandoffReminder('')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(needsHandoffReminder(undefined as any)).toBe(false);
  });

  it('returns false for null', () => {
    expect(needsHandoffReminder(null as any)).toBe(false);
  });

  it('is case-sensitive (partial_plus lowercase returns false)', () => {
    expect(needsHandoffReminder('partial_plus')).toBe(false);
  });
});

// =============================================================================
// Test 2: buildOutcomeMessage -- message generation
// =============================================================================

describe('buildOutcomeMessage', () => {
  it('includes session name in output', () => {
    const msg = buildOutcomeMessage('test-session', 'test-handoff');
    expect(msg).toContain('test-session');
  });

  it('includes handoff name in output', () => {
    const msg = buildOutcomeMessage('test-session', 'test-handoff');
    expect(msg).toContain('test-handoff');
  });

  it('includes outcome marking instructions', () => {
    const msg = buildOutcomeMessage('test-session', 'test-handoff');
    expect(msg).toContain('SUCCEEDED');
    expect(msg).toContain('PARTIAL_PLUS');
    expect(msg).toContain('PARTIAL_MINUS');
    expect(msg).toContain('FAILED');
  });

  it('includes handoff reminder when outcome is PARTIAL_PLUS', () => {
    const msg = buildOutcomeMessage('test-session', 'test-handoff', 'PARTIAL_PLUS');
    expect(msg).toContain('handoff');
    expect(msg).toContain('create_handoff');
  });

  it('includes handoff reminder when outcome is PARTIAL_MINUS', () => {
    const msg = buildOutcomeMessage('test-session', 'test-handoff', 'PARTIAL_MINUS');
    expect(msg).toContain('handoff');
    expect(msg).toContain('create_handoff');
  });

  it('does NOT include handoff reminder for SUCCEEDED', () => {
    const msg = buildOutcomeMessage('test-session', 'test-handoff', 'SUCCEEDED');
    expect(msg).not.toContain('create_handoff');
  });

  it('does NOT include handoff reminder when no outcome provided', () => {
    const msg = buildOutcomeMessage('test-session', 'test-handoff');
    // Without an outcome, we don't know if it's partial
    expect(msg).not.toContain('create_handoff');
  });
});
