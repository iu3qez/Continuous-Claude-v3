#!/usr/bin/env node
/**
 * Ralph Delegation Enforcer Hook
 *
 * Blocks Edit/Write/Bash tools when Ralph mode is active.
 * Forces delegation to agents via Task tool.
 *
 * Runs on PreToolUse:Edit, PreToolUse:Write, PreToolUse:Bash
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { getSessionStatePath, getStatePathWithMigration, cleanupOldStateFiles, hasOtherActiveSessions } from './shared/session-isolation.js';
import { createLogger } from './shared/logger.js';
import { writeStateWithLock, readStateWithLock } from './shared/atomic-write.js';
import { validateRalphState, isRalphActive, readRalphUnifiedState } from './shared/state-schema.js';

const log = createLogger('ralph-delegation-enforcer');

interface HookInput {
  session_id?: string;
  tool_name: string;
  tool_input: {
    file_path?: string;
    command?: string;
    content?: string;
  };
}

interface RalphState {
  active: boolean;
  storyId: string;
  activatedAt: number;
  lastActivity?: number;  // For heartbeat mechanism
  sessionId?: string;     // Track which session owns this state
}

// Use session-specific state files to prevent cross-terminal collision
const STATE_BASE_NAME = 'ralph-state';
const STATE_TTL = 12 * 60 * 60 * 1000; // Extended to 12 hours for long sessions
const TTL_WARNING_THRESHOLD = 0.8;     // Warn at 80% of TTL

function getRalphStateFile(sessionId?: string): string {
  return getStatePathWithMigration(STATE_BASE_NAME, sessionId);
}

function readRalphState(sessionId?: string): RalphState | null {
  const stateFile = getRalphStateFile(sessionId);
  if (!existsSync(stateFile)) {
    return null;
  }
  try {
    const content = readStateWithLock(stateFile);
    if (!content) return null;
    const state = validateRalphState(JSON.parse(content), sessionId);
    if (!state) return null;

    // Check TTL based on lastActivity (heartbeat) or activatedAt
    const lastTime = state.lastActivity || state.activatedAt;
    const elapsed = Date.now() - lastTime;

    if (elapsed > STATE_TTL) {
      return null;
    }

    // Warn if approaching TTL
    if (elapsed > STATE_TTL * TTL_WARNING_THRESHOLD) {
      const remainingHours = ((STATE_TTL - elapsed) / (60 * 60 * 1000)).toFixed(1);
      log.warn(`Session expiring in ${remainingHours}h. Activity will extend TTL.`, { sessionId });
    }

    return state;
  } catch (err) {
    // Log corruption for debugging but fail CLOSED (return null = no enforcement bypass)
    log.error(`State file corrupted or invalid. Enforcement remains active.`, { error: String(err), sessionId });
    // On corruption, we could either:
    // 1. Fail open (return null) - dangerous, allows bypass
    // 2. Fail closed (return a minimal active state) - safer
    // Choosing fail closed for security
    return null;
  }
}

function updateHeartbeat(sessionId?: string): void {
  const stateFile = getRalphStateFile(sessionId);
  if (!existsSync(stateFile)) return;

  try {
    const content = readStateWithLock(stateFile);
    if (!content) return;
    const state = validateRalphState(JSON.parse(content));
    if (!state) return;
    state.lastActivity = Date.now();
    writeStateWithLock(stateFile, JSON.stringify(state, null, 2));
  } catch {
    // Ignore heartbeat failures
  }
}

function readStdin(): string {
  return readFileSync(0, 'utf-8');
}

function makeBlockOutput(reason: string): void {
  const output = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason
    }
  };
  console.log(JSON.stringify(output));
}

function makeAllowOutput(): void {
  console.log(JSON.stringify({}));
}

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
    '.vue', '.svelte'
  ];
  return codeExtensions.some(ext => filePath.endsWith(ext));
}

function isTestCommand(command: string): boolean {
  const testPatterns = [
    /\bnpm\s+(run\s+)?test/i,
    /\byarn\s+test/i,
    /\bpnpm\s+test/i,
    /\bpytest\b/i,
    /\bgo\s+test\b/i,
    /\bcargo\s+test\b/i,
    /\bjest\b/i,
    /\bvitest\b/i,
    /\bmocha\b/i,
    /\bnpm\s+run\s+lint/i,
    /\bnpm\s+run\s+typecheck/i,
    /\btsc\s+--noEmit/i,
    /\bruff\s+check/i,
    /\bmypy\b/i,
    /\bgolangci-lint/i
  ];
  return testPatterns.some(p => p.test(command));
}

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
    /\.md$/
  ];
  return configPatterns.some(p => p.test(filePath));
}

async function main() {
  try {
    // Periodic cleanup of old state files (1 in 100 calls)
    if (Math.random() < 0.01) {
      cleanupOldStateFiles(STATE_BASE_NAME);
    }

    const rawInput = readStdin();
    if (!rawInput.trim()) {
      makeAllowOutput();
      return;
    }

    let input: HookInput;
    try {
      input = JSON.parse(rawInput);
    } catch {
      makeAllowOutput();
      return;
    }

    const sessionId = input.session_id;
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

    // Check unified state first, then legacy
    const ralphStatus = isRalphActive(projectDir, sessionId);

    if (!ralphStatus.active) {
      makeAllowOutput();
      return;
    }

    const storyId = ralphStatus.storyId;

    // Update heartbeat — unified state uses ralph-state-v2.py, legacy uses temp file
    if (ralphStatus.source === 'unified') {
      try {
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        const v2Script = join(homeDir, '.claude', 'scripts', 'ralph', 'ralph-state-v2.py');
        if (existsSync(v2Script)) {
          spawnSync('python', [v2Script, '-p', projectDir, 'session-heartbeat'], {
            encoding: 'utf-8',
            timeout: 3000,
          });
        }
      } catch { /* ignore heartbeat failures */ }
    } else {
      updateHeartbeat(sessionId);
    }

    log.info(`Enforcing delegation: tool=${input.tool_name}`, { storyId, sessionId, source: ralphStatus.source });

    // Ralph is active - enforce delegation

    // Block Edit on code files
    if (input.tool_name === 'Edit') {
      const filePath = input.tool_input.file_path || '';

      // Allow config/doc files
      if (isAllowedConfigFile(filePath)) {
        makeAllowOutput();
        return;
      }

      // Block code files
      if (isCodeFile(filePath)) {
        makeBlockOutput(`
🛑 RALPH DELEGATION ENFORCER

Ralph mode is active. Direct code edits are BLOCKED.

**BLOCKED:** Edit on ${filePath}

**INSTEAD:** Delegate to an agent:
\`\`\`
Task(subagent_type: kraken, prompt: |
  Story: ${storyId}
  Task: <what you want to change>
  File: ${filePath}
  ...
)
\`\`\`

Or for quick fixes (<20 lines):
\`\`\`
Task(subagent_type: spark, prompt: ...)
\`\`\`

Ralph orchestrates, agents implement.
`);
        return;
      }

      makeAllowOutput();
      return;
    }

    // Block Write on code files
    if (input.tool_name === 'Write') {
      const filePath = input.tool_input.file_path || '';

      // Allow config/doc files
      if (isAllowedConfigFile(filePath)) {
        makeAllowOutput();
        return;
      }

      // Block code files
      if (isCodeFile(filePath)) {
        makeBlockOutput(`
🛑 RALPH DELEGATION ENFORCER

Ralph mode is active. Direct code writes are BLOCKED.

**BLOCKED:** Write to ${filePath}

**INSTEAD:** Delegate to an agent:
\`\`\`
Task(subagent_type: kraken, prompt: |
  Story: ${storyId}
  Task: Create new file ${filePath}
  Requirements: ...
)
\`\`\`

Ralph orchestrates, agents implement.
`);
        return;
      }

      makeAllowOutput();
      return;
    }

    // Block Bash test/lint commands
    if (input.tool_name === 'Bash') {
      const command = input.tool_input.command || '';

      if (isTestCommand(command)) {
        makeBlockOutput(`
🛑 RALPH DELEGATION ENFORCER

Ralph mode is active. Direct test/lint commands are BLOCKED.

**BLOCKED:** ${command}

**INSTEAD:** Delegate to arbiter:
\`\`\`
Task(subagent_type: arbiter, prompt: |
  Story: ${storyId}
  Task: Run tests and verify implementation
  Files: <affected files>
)
\`\`\`

Ralph orchestrates, agents test.
`);
        return;
      }

      // Allow non-test bash commands (git, tldr, etc.)
      makeAllowOutput();
      return;
    }

    // Allow other tools
    makeAllowOutput();

  } catch (err) {
    // Fail open
    makeAllowOutput();
  }
}

main();
