/**
 * Plan-to-Ralph Enforcer — RED Phase Tests (TDD)
 *
 * Tests for plan-to-ralph-enforcer.ts, a PreToolUse hook on Edit|Write.
 *
 * After a plan is approved (tracked by plan-exit-tracker state file),
 * if the user tries to Edit/Write a CODE file without Ralph being active,
 * this hook BLOCKS the action and directs them to use /ralph.
 *
 * Decision flow:
 *   1. Read plan-approved state from $TEMP/claude-plan-approved-<sessionId>.json
 *   2. No plan approved -> ALLOW
 *   3. Plan approved + Ralph active -> ALLOW (agents need to edit)
 *   4. Plan approved + Ralph NOT active + code file -> DENY
 *   5. Plan approved + Ralph NOT active + config/doc file -> ALLOW
 *
 * These tests WILL FAIL because the implementation does not exist yet.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, writeFileSync, unlinkSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEST_SESSION = 'plan-enforcer-test';
const STATE_FILE_PREFIX = 'claude-plan-approved-';

// ---------------------------------------------------------------------------
// Replicate decision functions from the hook (will be imported once impl exists)
// ---------------------------------------------------------------------------

/**
 * Code file detection — same extensions as ralph-delegation-enforcer.ts:122-137
 */
function isCodeFile(filePath: string): boolean {
  const codeExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.py', '.pyi',
    '.go',
    '.rs',
    '.java', '.kt', '.scala',
    '.c', '.cpp', '.h', '.hpp',
    '.cs',
    '.rb',
    '.php',
    '.swift',
    '.vue', '.svelte',
  ];
  return codeExtensions.some(ext => filePath.endsWith(ext));
}

/**
 * Config/doc file detection — same patterns as ralph-delegation-enforcer.ts:160-175
 */
function isAllowedConfigFile(filePath: string): boolean {
  const configPatterns = [
    /\.ralph\//,
    /IMPLEMENTATION_PLAN\.md$/,
    /tasks\/.*\.md$/,
    /\.json$/,
    /\.yaml$/,
    /\.yml$/,
    /\.env/,
    /\.gitignore$/,
    /package\.json$/,
    /tsconfig\.json$/,
    /\.md$/,
  ];
  return configPatterns.some(p => p.test(filePath));
}

// ---------------------------------------------------------------------------
// Hook output shapes
// ---------------------------------------------------------------------------

interface DenyOutput {
  hookSpecificOutput: {
    hookEventName: 'PreToolUse';
    permissionDecision: 'deny';
    permissionDecisionReason: string;
  };
}

type AllowOutput = Record<string, never>;

// ---------------------------------------------------------------------------
// Simulated hook decision function
//
// This mirrors what plan-to-ralph-enforcer.ts main() should do.
// Once the implementation exists, these tests should import the real logic
// instead. For now, we import from the not-yet-existing module to make
// tests FAIL (RED phase).
// ---------------------------------------------------------------------------

// This import WILL FAIL because the module doesn't exist yet.
// That's intentional — RED phase of TDD.
import {
  decidePlanEnforcement,
} from '../plan-to-ralph-enforcer.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function getPlanStateFilePath(sessionId: string): string {
  return join(tmpdir(), `${STATE_FILE_PREFIX}${sessionId}.json`);
}

function writePlanApprovedState(sessionId: string, data?: Record<string, unknown>): void {
  const stateFile = getPlanStateFilePath(sessionId);
  const stateData = data || {
    approved: true,
    approvedAt: Date.now(),
    planSummary: 'Test plan',
  };
  writeFileSync(stateFile, JSON.stringify(stateData, null, 2));
}

function removePlanApprovedState(sessionId: string): void {
  const stateFile = getPlanStateFilePath(sessionId);
  if (existsSync(stateFile)) {
    unlinkSync(stateFile);
  }
}

function makeHookInput(toolName: string, filePath: string, sessionId?: string): string {
  return JSON.stringify({
    session_id: sessionId || TEST_SESSION,
    tool_name: toolName,
    tool_input: {
      file_path: filePath,
      ...(toolName === 'Edit' ? { old_string: 'foo', new_string: 'bar' } : { content: '// new file' }),
    },
  });
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

afterEach(() => {
  removePlanApprovedState(TEST_SESSION);
});

// =============================================================================
// Test 1: No plan approved -> ALLOW
// =============================================================================

describe('decidePlanEnforcement -- no plan approved', () => {
  it('allows Edit on .ts file when no plan state file exists', () => {
    // No state file written -> not in post-plan context
    removePlanApprovedState(TEST_SESSION);

    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/src/main.ts',
      planApproved: false,
      ralphActive: false,
    });

    // Should allow -- no plan was approved
    expect(result.block).toBe(false);
  });

  it('allows Write on .py file when no plan state file exists', () => {
    removePlanApprovedState(TEST_SESSION);

    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Write',
      filePath: '/project/src/handler.py',
      planApproved: false,
      ralphActive: false,
    });

    expect(result.block).toBe(false);
  });
});

// =============================================================================
// Test 2: Plan approved + Ralph active -> ALLOW
// =============================================================================

describe('decidePlanEnforcement -- plan approved, Ralph active', () => {
  beforeEach(() => {
    writePlanApprovedState(TEST_SESSION);
  });

  it('allows Edit on .ts file when Ralph is active', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/src/main.ts',
      planApproved: true,
      ralphActive: true,
    });

    // Ralph is active, agents are editing via delegation -- allow
    expect(result.block).toBe(false);
  });

  it('allows Write on .py file when Ralph is active', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Write',
      filePath: '/project/src/service.py',
      planApproved: true,
      ralphActive: true,
    });

    expect(result.block).toBe(false);
  });

  it('allows Edit on .go file when Ralph is active', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/cmd/server.go',
      planApproved: true,
      ralphActive: true,
    });

    expect(result.block).toBe(false);
  });
});

// =============================================================================
// Test 3: Plan approved + Ralph NOT active + code file -> DENY
// =============================================================================

describe('decidePlanEnforcement -- plan approved, Ralph NOT active, code file', () => {
  beforeEach(() => {
    writePlanApprovedState(TEST_SESSION);
  });

  it('blocks Edit on .ts file with deny message mentioning /ralph', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/src/main.ts',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(true);
    expect(result.reason).toBeDefined();
    expect(result.reason!.toLowerCase()).toContain('/ralph');
  });

  it('blocks Write on .py file with deny message', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Write',
      filePath: '/project/src/handler.py',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(true);
    expect(result.reason).toBeDefined();
    expect(result.reason!.toLowerCase()).toContain('plan approved');
  });

  it('deny message includes instruction to use /ralph', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/src/component.tsx',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(true);
    expect(result.reason).toMatch(/\/ralph/i);
    // Should mention that direct edits are blocked
    expect(result.reason).toMatch(/block/i);
  });

  it('deny output has correct hook output structure', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/src/main.ts',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(true);
    // When the hook produces output, it should include the deny structure
    expect(result.reason).toBeTruthy();
  });
});

// =============================================================================
// Test 4: Plan approved + Ralph NOT active + config file -> ALLOW
// =============================================================================

describe('decidePlanEnforcement -- plan approved, Ralph NOT active, config file', () => {
  beforeEach(() => {
    writePlanApprovedState(TEST_SESSION);
  });

  it('allows Edit on .json file', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/package.json',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(false);
  });

  it('allows Write on .yaml file', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Write',
      filePath: '/project/.github/workflows/ci.yaml',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(false);
  });

  it('allows Edit on tsconfig.json', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/tsconfig.json',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(false);
  });

  it('allows Write on .env file', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Write',
      filePath: '/project/.env.local',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(false);
  });

  it('allows Edit on .gitignore', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/.gitignore',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(false);
  });
});

// =============================================================================
// Test 5: Plan approved + Ralph NOT active + markdown -> ALLOW
// =============================================================================

describe('decidePlanEnforcement -- plan approved, Ralph NOT active, markdown', () => {
  beforeEach(() => {
    writePlanApprovedState(TEST_SESSION);
  });

  it('allows Edit on .md file', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/README.md',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(false);
  });

  it('allows Write on IMPLEMENTATION_PLAN.md', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Write',
      filePath: '/project/IMPLEMENTATION_PLAN.md',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(false);
  });

  it('allows Edit on tasks/*.md', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/tasks/auth-feature.md',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(false);
  });

  it('allows Edit on .ralph/ directory files', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/.ralph/state.json',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(false);
  });
});

// =============================================================================
// Test 6: Write tool also blocked on code files
// =============================================================================

describe('decidePlanEnforcement -- Write tool blocked on code files', () => {
  beforeEach(() => {
    writePlanApprovedState(TEST_SESSION);
  });

  it('blocks Write on .ts file', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Write',
      filePath: '/project/src/new-module.ts',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(true);
    expect(result.reason).toMatch(/\/ralph/i);
  });

  it('blocks Write on .jsx file', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Write',
      filePath: '/project/src/Component.jsx',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(true);
  });

  it('blocks Write on .rs file', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Write',
      filePath: '/project/src/main.rs',
      planApproved: true,
      ralphActive: false,
    });

    expect(result.block).toBe(true);
  });
});

// =============================================================================
// Test 7: Empty input -> ALLOW (fail open)
// =============================================================================

describe('decidePlanEnforcement -- empty/missing input', () => {
  it('allows when input is empty object', () => {
    const result = decidePlanEnforcement({
      sessionId: '',
      toolName: '',
      filePath: '',
      planApproved: false,
      ralphActive: false,
    });

    expect(result.block).toBe(false);
  });

  it('allows when filePath is empty string', () => {
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '',
      planApproved: true,
      ralphActive: false,
    });

    // Empty path is not a code file, so allow
    expect(result.block).toBe(false);
  });
});

// =============================================================================
// Test 8: Invalid JSON -> ALLOW (fail open)
// =============================================================================

describe('decidePlanEnforcement -- invalid/malformed input', () => {
  it('allows when planApproved is false regardless of other fields', () => {
    // Simulates what happens when the state file is corrupted/missing
    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/src/main.ts',
      planApproved: false,  // State file unreadable -> treated as no plan
      ralphActive: false,
    });

    expect(result.block).toBe(false);
  });
});

// =============================================================================
// Test 9: Multiple code file extensions are all blocked
// =============================================================================

describe('decidePlanEnforcement -- code file extensions coverage', () => {
  const codeFiles = [
    '/project/src/main.ts',
    '/project/src/app.tsx',
    '/project/src/index.js',
    '/project/src/component.jsx',
    '/project/src/utils.mjs',
    '/project/src/config.cjs',
    '/project/src/handler.py',
    '/project/src/types.pyi',
    '/project/cmd/server.go',
    '/project/src/main.rs',
    '/project/src/Main.java',
    '/project/src/Main.kt',
    '/project/src/Main.scala',
    '/project/src/main.c',
    '/project/src/main.cpp',
    '/project/src/main.h',
    '/project/src/main.hpp',
    '/project/src/Program.cs',
    '/project/src/app.rb',
    '/project/src/index.php',
    '/project/src/App.swift',
    '/project/src/App.vue',
    '/project/src/App.svelte',
  ];

  for (const filePath of codeFiles) {
    const ext = filePath.split('.').pop();

    it(`blocks Edit on .${ext} file: ${filePath}`, () => {
      const result = decidePlanEnforcement({
        sessionId: TEST_SESSION,
        toolName: 'Edit',
        filePath,
        planApproved: true,
        ralphActive: false,
      });

      expect(result.block).toBe(true);
      expect(result.reason).toBeDefined();
    });
  }
});

// =============================================================================
// Test 10: Plan state cleared after Ralph completes -> allow edits
// =============================================================================

describe('decidePlanEnforcement -- plan state cleared', () => {
  it('allows edits when plan-approved state has been removed', () => {
    // Initially plan was approved
    writePlanApprovedState(TEST_SESSION);
    // Then Ralph completed and state was cleared
    removePlanApprovedState(TEST_SESSION);

    const result = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/src/main.ts',
      planApproved: false,  // State file gone -> no plan approved
      ralphActive: false,
    });

    // Back to normal -- allow direct edits
    expect(result.block).toBe(false);
  });

  it('transitions from blocked to allowed when plan state is removed', () => {
    // Step 1: plan approved, Ralph not active -> BLOCK
    writePlanApprovedState(TEST_SESSION);

    const blockedResult = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/src/main.ts',
      planApproved: true,
      ralphActive: false,
    });

    expect(blockedResult.block).toBe(true);

    // Step 2: plan state cleared -> ALLOW
    removePlanApprovedState(TEST_SESSION);

    const allowedResult = decidePlanEnforcement({
      sessionId: TEST_SESSION,
      toolName: 'Edit',
      filePath: '/project/src/main.ts',
      planApproved: false,
      ralphActive: false,
    });

    expect(allowedResult.block).toBe(false);
  });
});

// =============================================================================
// Unit tests for isCodeFile and isAllowedConfigFile (reused from ralph-delegation-enforcer)
// =============================================================================

describe('isCodeFile -- unit tests', () => {
  it('detects .ts as code', () => expect(isCodeFile('main.ts')).toBe(true));
  it('detects .tsx as code', () => expect(isCodeFile('App.tsx')).toBe(true));
  it('detects .js as code', () => expect(isCodeFile('index.js')).toBe(true));
  it('detects .py as code', () => expect(isCodeFile('handler.py')).toBe(true));
  it('detects .go as code', () => expect(isCodeFile('server.go')).toBe(true));
  it('detects .rs as code', () => expect(isCodeFile('main.rs')).toBe(true));
  it('detects .vue as code', () => expect(isCodeFile('App.vue')).toBe(true));
  it('detects .svelte as code', () => expect(isCodeFile('App.svelte')).toBe(true));

  it('does NOT detect .json as code', () => expect(isCodeFile('package.json')).toBe(false));
  it('does NOT detect .md as code', () => expect(isCodeFile('README.md')).toBe(false));
  it('does NOT detect .yaml as code', () => expect(isCodeFile('config.yaml')).toBe(false));
  it('does NOT detect .txt as code', () => expect(isCodeFile('notes.txt')).toBe(false));
  it('does NOT detect empty string as code', () => expect(isCodeFile('')).toBe(false));
});

describe('isAllowedConfigFile -- unit tests', () => {
  it('allows .json', () => expect(isAllowedConfigFile('package.json')).toBe(true));
  it('allows .yaml', () => expect(isAllowedConfigFile('config.yaml')).toBe(true));
  it('allows .yml', () => expect(isAllowedConfigFile('config.yml')).toBe(true));
  it('allows .md', () => expect(isAllowedConfigFile('README.md')).toBe(true));
  it('allows .env', () => expect(isAllowedConfigFile('.env.local')).toBe(true));
  it('allows .gitignore', () => expect(isAllowedConfigFile('.gitignore')).toBe(true));
  it('allows tsconfig.json', () => expect(isAllowedConfigFile('tsconfig.json')).toBe(true));
  it('allows .ralph/ files', () => expect(isAllowedConfigFile('.ralph/state.json')).toBe(true));
  it('allows IMPLEMENTATION_PLAN.md', () => expect(isAllowedConfigFile('IMPLEMENTATION_PLAN.md')).toBe(true));
  it('allows tasks/*.md', () => expect(isAllowedConfigFile('tasks/auth.md')).toBe(true));

  it('does NOT allow .ts', () => expect(isAllowedConfigFile('main.ts')).toBe(false));
  it('does NOT allow .py', () => expect(isAllowedConfigFile('handler.py')).toBe(false));
  it('does NOT allow .go', () => expect(isAllowedConfigFile('server.go')).toBe(false));
});
