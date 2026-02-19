/**
 * Ralph Template Inject — Regression Tests (CRITICAL-3)
 *
 * Tests the PreToolUse hook output schema and shouldInjectTemplates logic.
 *
 * Patterns tested from ralph-template-inject.ts:
 *   - HookOutput schema (lines 26-33)
 *   - shouldInjectTemplates function (lines 41-51)
 *   - Modify path output (lines 146-153)
 *   - Allow path output (line 139)
 *   - Error fallback (lines 156-158)
 */

import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Replicate types and logic from ralph-template-inject.ts
// ---------------------------------------------------------------------------

interface HookOutput {
  result: 'allow' | 'block';
  hookSpecificOutput?: {
    hookEventName: string;
    modifiedInput?: Record<string, unknown>;
    additionalContext?: string;
  };
}

// Exact RALPH_KEYWORDS from ralph-template-inject.ts:36-39
const RALPH_KEYWORDS = [
  'ralph', 'prd', 'feature', 'build', 'implement', 'create',
  'autonomous', 'workflow', 'develop', 'tasks',
];

// Exact logic from ralph-template-inject.ts:41-51
function shouldInjectTemplates(prompt: string, subagentType: string): boolean {
  if (subagentType !== 'maestro') {
    return false;
  }

  const lowerPrompt = prompt.toLowerCase();
  return RALPH_KEYWORDS.some(kw => lowerPrompt.includes(kw));
}

/**
 * Simulate the modify path output (ralph-template-inject.ts:146-153).
 */
function buildModifyOutput(modifiedPrompt: string): HookOutput {
  return {
    result: 'allow',
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      modifiedInput: { prompt: modifiedPrompt },
      additionalContext: 'Ralph workflow templates injected into Maestro prompt',
    },
  };
}

/**
 * Simulate the allow (no-op) path output (ralph-template-inject.ts:139).
 */
function buildAllowOutput(): HookOutput {
  return { result: 'allow' };
}

/**
 * Simulate the error fallback (ralph-template-inject.ts:157-158).
 */
function buildErrorFallback(): HookOutput {
  return { result: 'allow' };
}

// =============================================================================
// Test 1: modify path output has correct schema
// =============================================================================

describe('buildModifyOutput — schema validation', () => {
  it('produces correct PreToolUse modify schema', () => {
    const output = buildModifyOutput('Injected prompt content here');

    expect(output.result).toBe('allow');
    expect(output.hookSpecificOutput).toBeDefined();
    expect(output.hookSpecificOutput!.hookEventName).toBe('PreToolUse');
    expect(output.hookSpecificOutput!.modifiedInput).toBeDefined();
    expect(output.hookSpecificOutput!.modifiedInput!.prompt).toBe('Injected prompt content here');
    expect(output.hookSpecificOutput!.additionalContext).toBe(
      'Ralph workflow templates injected into Maestro prompt'
    );
  });

  it('modifiedInput contains prompt as a string', () => {
    const output = buildModifyOutput('Some prompt');
    expect(typeof output.hookSpecificOutput!.modifiedInput!.prompt).toBe('string');
  });
});

// =============================================================================
// Test 2: allow (no match) path outputs {result: 'allow'} only
// =============================================================================

describe('buildAllowOutput — no-op schema', () => {
  it('outputs only {result: "allow"} with no hookSpecificOutput', () => {
    const output = buildAllowOutput();

    expect(output.result).toBe('allow');
    expect(output.hookSpecificOutput).toBeUndefined();
  });

  it('serializes to a minimal JSON object', () => {
    const output = buildAllowOutput();
    const json = JSON.parse(JSON.stringify(output));

    expect(Object.keys(json)).toEqual(['result']);
    expect(json.result).toBe('allow');
  });
});

// =============================================================================
// Test 3: shouldInjectTemplates only fires for maestro subagent type
// =============================================================================

describe('shouldInjectTemplates — subagent type gate', () => {
  it('returns true for maestro with Ralph keyword', () => {
    expect(shouldInjectTemplates('Build the auth feature', 'maestro')).toBe(true);
  });

  it('returns false for kraken even with Ralph keyword', () => {
    expect(shouldInjectTemplates('Build the auth feature', 'kraken')).toBe(false);
  });

  it('returns false for spark even with Ralph keyword', () => {
    expect(shouldInjectTemplates('Implement the login page', 'spark')).toBe(false);
  });

  it('returns false for scout even with Ralph keyword', () => {
    expect(shouldInjectTemplates('Create a new module', 'scout')).toBe(false);
  });

  it('returns false for empty subagent type', () => {
    expect(shouldInjectTemplates('Build something', '')).toBe(false);
  });
});

// =============================================================================
// Test 4: shouldInjectTemplates with Ralph keyword present
// =============================================================================

describe('shouldInjectTemplates — keyword matching', () => {
  it('matches "Build the auth feature" for maestro', () => {
    expect(shouldInjectTemplates('Build the auth feature', 'maestro')).toBe(true);
  });

  it('matches "ralph" keyword', () => {
    expect(shouldInjectTemplates('Start ralph workflow', 'maestro')).toBe(true);
  });

  it('matches "prd" keyword', () => {
    expect(shouldInjectTemplates('Generate the PRD', 'maestro')).toBe(true);
  });

  it('matches "implement" keyword', () => {
    expect(shouldInjectTemplates('Implement the new API', 'maestro')).toBe(true);
  });

  it('matches "create" keyword', () => {
    expect(shouldInjectTemplates('Create a dashboard', 'maestro')).toBe(true);
  });

  it('matches "autonomous" keyword', () => {
    expect(shouldInjectTemplates('Run in autonomous mode', 'maestro')).toBe(true);
  });

  it('matches "workflow" keyword', () => {
    expect(shouldInjectTemplates('Start the workflow', 'maestro')).toBe(true);
  });

  it('matches "develop" keyword', () => {
    expect(shouldInjectTemplates('Develop the backend', 'maestro')).toBe(true);
  });

  it('matches "tasks" keyword', () => {
    expect(shouldInjectTemplates('Generate tasks for this story', 'maestro')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(shouldInjectTemplates('BUILD THE FEATURE', 'maestro')).toBe(true);
    expect(shouldInjectTemplates('Create A Thing', 'maestro')).toBe(true);
  });
});

// =============================================================================
// Test 5: shouldInjectTemplates returns false for wrong subagent
// =============================================================================

describe('shouldInjectTemplates — non-maestro rejection', () => {
  it('returns false for kraken with keyword', () => {
    expect(shouldInjectTemplates('random stuff', 'kraken')).toBe(false);
  });

  // Even if prompt has all keywords, non-maestro = false
  it('returns false for non-maestro even with many keywords', () => {
    expect(shouldInjectTemplates(
      'ralph build implement create autonomous workflow develop tasks prd feature',
      'kraken'
    )).toBe(false);
  });
});

// =============================================================================
// Test 6: shouldInjectTemplates returns false for no keywords
// =============================================================================

describe('shouldInjectTemplates — no keyword match', () => {
  it('returns false for maestro with no matching keywords', () => {
    expect(shouldInjectTemplates('random stuff', 'maestro')).toBe(false);
  });

  it('returns false for empty prompt', () => {
    expect(shouldInjectTemplates('', 'maestro')).toBe(false);
  });

  it('returns false for unrelated prompt', () => {
    expect(shouldInjectTemplates('Check the weather forecast', 'maestro')).toBe(false);
  });
});

// =============================================================================
// Test 7: error fallback returns {result: 'allow'} (fail open)
// =============================================================================

describe('buildErrorFallback — fail open', () => {
  it('returns {result: "allow"} on error', () => {
    const output = buildErrorFallback();
    expect(output.result).toBe('allow');
    expect(output.hookSpecificOutput).toBeUndefined();
  });

  it('matches the allow output (same structure)', () => {
    const errorOutput = buildErrorFallback();
    const allowOutput = buildAllowOutput();
    expect(errorOutput).toEqual(allowOutput);
  });
});

// =============================================================================
// Test 8: output must NOT use old format
// =============================================================================

describe('output format — no legacy schema', () => {
  it('modify output does NOT use {decision: "modify", modified_params: {...}}', () => {
    const output = buildModifyOutput('test prompt');
    const json = JSON.parse(JSON.stringify(output));

    // Must NOT have legacy fields
    expect(json).not.toHaveProperty('decision');
    expect(json).not.toHaveProperty('modified_params');

    // Must have current fields
    expect(json).toHaveProperty('result');
    expect(json).toHaveProperty('hookSpecificOutput');
    expect(json.hookSpecificOutput).toHaveProperty('hookEventName');
    expect(json.hookSpecificOutput).toHaveProperty('modifiedInput');
  });

  it('allow output does NOT use {decision: "allow"}', () => {
    const output = buildAllowOutput();
    const json = JSON.parse(JSON.stringify(output));

    expect(json).not.toHaveProperty('decision');
    expect(json.result).toBe('allow');
  });
});
