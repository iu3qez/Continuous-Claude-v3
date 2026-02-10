#!/usr/bin/env node
/**
 * Ralph Task Monitor Hook
 *
 * PostToolUse hook for Task tool that monitors agent results.
 * When a Task tool agent completes, checks for success/failure patterns
 * and updates the unified Ralph state accordingly.
 *
 * This creates visibility for agents spawned via Task tool,
 * which ralph-monitor.ts (Bash-only) cannot see.
 *
 * Runs on PostToolUse:Task
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { createLogger } from './shared/logger.js';
import { readRalphUnifiedState } from './shared/state-schema.js';

const log = createLogger('ralph-task-monitor');

interface HookInput {
  session_id?: string;
  tool_name?: string;
  tool_input?: {
    prompt?: string;
    subagent_type?: string;
    description?: string;
  };
  tool_result?: {
    stdout?: string;
    stderr?: string;
    content?: string;
    text?: string;
  };
}

// Patterns indicating agent success
const SUCCESS_PATTERNS = [
  /task\s+(?:is\s+)?complete/i,
  /implementation\s+(?:is\s+)?complete/i,
  /all\s+tests?\s+pass/i,
  /successfully\s+(?:implemented|completed|created|fixed)/i,
  /changes?\s+(?:have been|were)\s+(?:made|applied|committed)/i,
  /<TASK_COMPLETE\s*\/?>/i,
  /<COMPLETE\s*\/?>/i,
];

// Patterns indicating agent failure
const FAILURE_PATTERNS = [
  /(?:test|build|compilation)\s+(?:failed|failing|errors?)/i,
  /could\s+not\s+(?:complete|fix|resolve)/i,
  /blocked\s+(?:by|on|due)/i,
  /<BLOCKED(?:\s+reason="([^"]+)")?\s*\/?>/i,
  /<ERROR(?:\s+reason="([^"]+)")?\s*\/?>/i,
  /unable\s+to\s+(?:complete|resolve|implement)/i,
];

function readStdin(): string {
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    return '{}';
  }
}

function detectOutcome(text: string): { success: boolean; reason?: string } | null {
  // Check failure first (more specific)
  for (const pattern of FAILURE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return { success: false, reason: match[1] || match[0] };
    }
  }

  // Check success
  for (const pattern of SUCCESS_PATTERNS) {
    if (pattern.test(text)) {
      return { success: true };
    }
  }

  return null;
}

function getV2ScriptPath(): string | null {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const v2Script = join(homeDir, '.claude', 'scripts', 'ralph', 'ralph-state-v2.py');
  return existsSync(v2Script) ? v2Script : null;
}

async function main() {
  let input: HookInput = {};
  try {
    input = JSON.parse(readStdin());
  } catch {
    return;
  }

  // Only process Task tool results
  if (input.tool_name !== 'Task') return;

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  // Check if Ralph is active with unified state
  const unified = readRalphUnifiedState(projectDir);
  if (!unified?.session?.active) return;

  const v2Script = getV2ScriptPath();
  if (!v2Script) return;

  // Get the agent result text
  const resultText = input.tool_result?.stdout
    || input.tool_result?.content
    || input.tool_result?.text
    || '';

  if (!resultText) return;

  const agentType = input.tool_input?.subagent_type || 'unknown';
  const description = input.tool_input?.description || '';

  // Detect outcome from agent output
  const outcome = detectOutcome(resultText);

  if (!outcome) {
    log.info('No clear outcome detected from agent', { agentType, description });
    return;
  }

  // Find in-progress tasks to update
  const listResult = spawnSync('python', [
    v2Script, '-p', projectDir, 'task-list'
  ], { encoding: 'utf-8', timeout: 5000 });

  if (listResult.status !== 0) return;

  let tasks: Record<string, any> = {};
  try {
    tasks = JSON.parse(listResult.stdout);
  } catch {
    return;
  }

  // Find in-progress tasks (likely the one this agent was working on)
  const inProgressTasks = Object.entries(tasks)
    .filter(([, t]) => t.status === 'in_progress');

  if (inProgressTasks.length === 0) {
    log.info('No in-progress tasks to update', { agentType });
    return;
  }

  for (const [taskId, task] of inProgressTasks) {
    if (outcome.success) {
      log.info(`Agent completed task ${taskId}`, { agentType, taskName: task.name });
      spawnSync('python', [
        v2Script, '-p', projectDir, 'task-complete', '--id', taskId
      ], { encoding: 'utf-8', timeout: 5000 });
    } else {
      log.warn(`Agent failed task ${taskId}`, { agentType, reason: outcome.reason, taskName: task.name });
      spawnSync('python', [
        v2Script, '-p', projectDir, 'task-fail', '--id', taskId,
        '--error', outcome.reason || 'Agent reported failure'
      ], { encoding: 'utf-8', timeout: 5000 });
    }
  }

  // Generate status output
  const statusLines = [
    '',
    '─'.repeat(40),
    `📋 RALPH TASK MONITOR: ${agentType} agent ${outcome.success ? 'completed' : 'failed'}`,
    '─'.repeat(40),
  ];

  for (const [taskId] of inProgressTasks) {
    if (outcome.success) {
      statusLines.push(`  ✓ Task ${taskId} marked complete`);
    } else {
      statusLines.push(`  ✗ Task ${taskId} marked failed: ${outcome.reason || 'unknown'}`);
    }
  }

  statusLines.push('─'.repeat(40));
  const message = statusLines.join('\n');
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: message } }));
}

main().catch(() => {
  // Fail silently — monitoring is non-critical
});
