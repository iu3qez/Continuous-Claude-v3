#!/usr/bin/env node
/**
 * Ralph Watchdog Hook
 *
 * Monitors active Ralph/Maestro workflows for staleness.
 * Fires on UserPromptSubmit — checks lastActivity timestamp.
 * If a workflow has been idle >30 minutes, warns the user.
 *
 * This catches hung agents, forgotten workflows, and stuck pipelines.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getStatePathWithMigration } from './shared/session-isolation.js';
import { createLogger } from './shared/logger.js';
import { readRalphUnifiedState } from './shared/state-schema.js';

const log = createLogger('ralph-watchdog');

interface HookInput {
  session_id?: string;
  prompt?: string;
}

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes
const STATE_FILES = [
  { baseName: 'ralph-state', label: 'Ralph' },
  { baseName: 'maestro-state', label: 'Maestro' },
];

function readStdin(): string {
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    return '{}';
  }
}

function checkStaleWorkflow(baseName: string, label: string, sessionId?: string): string | null {
  try {
    const stateFile = getStatePathWithMigration(baseName, sessionId);
    if (!existsSync(stateFile)) return null;

    const content = readFileSync(stateFile, 'utf-8');
    const state = JSON.parse(content);

    if (!state.active) return null;

    const lastTime = state.lastActivity || state.activatedAt;
    if (!lastTime) return null;

    const elapsed = Date.now() - lastTime;
    if (elapsed < STALE_THRESHOLD_MS) return null;

    const minutes = Math.round(elapsed / 60000);
    const storyId = state.storyId || '';
    const taskType = state.taskType || '';

    log.warn(`Stale ${label} workflow detected`, {
      minutes,
      storyId,
      taskType,
      sessionId,
    });

    const details = [storyId, taskType].filter(Boolean).join(', ');
    return `**${label}**${details ? ` (${details})` : ''} — idle for ${minutes} minutes`;
  } catch {
    return null;
  }
}

async function main() {
  let input: HookInput = {};
  try {
    input = JSON.parse(readStdin());
  } catch {
    // Continue
  }

  const sessionId = input.session_id;
  const staleWorkflows: string[] = [];
  let unifiedRalphChecked = false;

  // Check unified state first
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const unified = readRalphUnifiedState(projectDir);
  if (unified?.session?.active) {
    const lastHeartbeat = new Date(unified.session.last_heartbeat).getTime();
    const elapsed = Date.now() - lastHeartbeat;
    if (elapsed >= STALE_THRESHOLD_MS) {
      const minutes = Math.round(elapsed / 60000);
      log.warn('Stale unified Ralph workflow detected', { minutes, storyId: unified.story_id, sessionId });
      const details = unified.story_id || '';
      staleWorkflows.push(`**Ralph**${details ? ` (${details})` : ''} — idle for ${minutes} minutes`);
    }
    unifiedRalphChecked = true;
  }

  for (const { baseName, label } of STATE_FILES) {
    // Skip legacy ralph-state if unified already checked
    if (baseName === 'ralph-state' && unifiedRalphChecked) continue;
    const warning = checkStaleWorkflow(baseName, label, sessionId);
    if (warning) staleWorkflows.push(warning);
  }

  if (staleWorkflows.length === 0) {
    console.log(JSON.stringify({ result: 'continue' }));
    return;
  }

  const message = [
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '⚠️ STALE WORKFLOW DETECTED',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    ...staleWorkflows.map(w => `  ${w}`),
    '',
    '**Actions:**',
    '  - Check for blocked/hung agents',
    '  - Say "cancel ralph" or "cancel maestro" to stop',
    '  - Or continue working (workflow may need manual intervention)',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  ].join('\n');

  console.log(JSON.stringify({ result: 'continue', message }));
}

main().catch(() => {
  console.log(JSON.stringify({ result: 'continue' }));
});
