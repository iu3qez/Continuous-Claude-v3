#!/usr/bin/env node
/**
 * Ralph Delegation Enforcer Hook
 *
 * Blocks Edit/Write/Bash tools when Ralph mode is active.
 * Forces delegation to agents via Task tool.
 *
 * Runs on PreToolUse:Edit, PreToolUse:Write, PreToolUse:Bash
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { cleanupOldStateFiles } from './shared/session-isolation.js';
import { createLogger } from './shared/logger.js';
import { isRalphActive } from './shared/state-schema.js';
import { logHook } from './shared/session-activity.js';
import { isCodeFile, isAllowedConfigFile } from './shared/file-classification.js';

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

// Use session-specific state files to prevent cross-terminal collision
const STATE_BASE_NAME = 'ralph-state';

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
    const ralphStatus = isRalphActive(projectDir);

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
    }

    log.info(`Enforcing delegation: tool=${input.tool_name}`, { storyId, sessionId, source: ralphStatus.source });
    try { logHook(sessionId || '', 'ralph-delegation-enforcer'); } catch { /* never break */ }

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
