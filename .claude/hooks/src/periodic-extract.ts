/**
 * Periodic Mid-Session Memory Extraction Hook (PostToolUse)
 *
 * Runs on every tool use. Increments a session-specific counter and triggers
 * a lightweight memory extraction every INTERVAL (50) tool uses.
 *
 * This supplements pre-compact extraction (which only fires on context
 * compression) with periodic extraction during long sessions.
 *
 * State file: $TEMP/claude-periodic-extract-{sessionId}.json
 *
 * On extraction (every 50th call):
 *   - Spawns `uv run python scripts/core/store_learning.py` detached
 *   - Returns a small system message noting extraction occurred
 *
 * All other calls:
 *   - Returns empty {} (no-op)
 */

import { readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawn } from 'child_process';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const INTERVAL = 50;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PeriodicState {
  count: number;
  lastExtract: number;
  tools: string[];
}

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

/**
 * Load state from disk. Returns default state if file is missing or corrupt.
 */
export function loadState(stateFile: string): PeriodicState {
  const defaults: PeriodicState = { count: 0, lastExtract: 0, tools: [] };
  try {
    const raw = readFileSync(stateFile, 'utf-8');
    if (!raw.trim()) return defaults;
    const parsed = JSON.parse(raw);
    return {
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      lastExtract: typeof parsed.lastExtract === 'number' ? parsed.lastExtract : 0,
      tools: Array.isArray(parsed.tools) ? parsed.tools : [],
    };
  } catch {
    return defaults;
  }
}

/**
 * Save state to disk. Fails silently (fail-open design).
 */
export function saveState(stateFile: string, state: PeriodicState): void {
  try {
    writeFileSync(stateFile, JSON.stringify(state));
  } catch {
    // Fail open -- don't block tool responses
  }
}

// ---------------------------------------------------------------------------
// Tool tracking
// ---------------------------------------------------------------------------

/**
 * Track a tool use: increment counter, append tool name, bound array.
 * Returns a NEW state object (does not mutate input).
 */
export function trackTool(state: PeriodicState, toolName: string, interval: number): PeriodicState {
  const tools = [...state.tools, toolName];
  return {
    count: state.count + 1,
    lastExtract: state.lastExtract,
    tools: tools.length > interval ? tools.slice(-interval) : tools,
  };
}

/**
 * Returns true if extraction should trigger (count is a nonzero multiple of interval).
 */
export function shouldExtract(state: PeriodicState, interval: number): boolean {
  return state.count > 0 && state.count % interval === 0;
}

// ---------------------------------------------------------------------------
// Summary & content builders
// ---------------------------------------------------------------------------

/**
 * Build a human-readable summary of tool usage from the tools array.
 * Returns the top 5 tools by frequency, e.g. "Bash(3), Read(2), Glob(1)".
 */
export function buildSummary(tools: string[]): string {
  if (tools.length === 0) return '';

  const counts: Record<string, number> = {};
  for (const t of tools) {
    counts[t] = (counts[t] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => `${name}(${count})`)
    .join(', ');
}

/**
 * Build the content string for store_learning.py.
 */
export function buildLearningContent(state: PeriodicState, sessionId: string): string {
  const summary = buildSummary(state.tools);
  const activity = summary ? ` Recent activity: ${summary}.` : '';
  return `Mid-session checkpoint at ${state.count} tool uses.${activity} Session ${sessionId}.`;
}

/**
 * Build the JSON output for stdout.
 *
 * @param state - Current state
 * @param extracted - Whether extraction was triggered this call
 */
export function buildOutput(state: PeriodicState, extracted: boolean): Record<string, unknown> {
  if (!extracted) return {};
  return {
    values: {
      system: `Periodic extraction checkpoint: ${state.count} tool uses this session.`,
    },
  };
}

// ---------------------------------------------------------------------------
// Main entrypoint (stdin-driven)
// ---------------------------------------------------------------------------

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  let data: { session_id?: string; tool_name?: string };
  try {
    data = JSON.parse(input);
  } catch {
    console.log(JSON.stringify({}));
    return;
  }

  const sessionId = data.session_id || 'unknown';
  const toolName = data.tool_name || '';

  // State file for this session
  const stateFile = join(tmpdir(), `claude-periodic-extract-${sessionId}.json`);

  // Load, track, check
  let state = loadState(stateFile);
  state = trackTool(state, toolName, INTERVAL);

  if (!shouldExtract(state, INTERVAL)) {
    saveState(stateFile, state);
    console.log(JSON.stringify({}));
    return;
  }

  // Time for extraction
  const opcDir = process.env.CLAUDE_OPC_DIR;
  if (!opcDir) {
    saveState(stateFile, state);
    console.log(JSON.stringify({}));
    return;
  }

  const content = buildLearningContent(state, sessionId);

  try {
    const child = spawn('uv', [
      'run', 'python', 'scripts/core/store_learning.py',
      '--session-id', sessionId,
      '--type', 'CODEBASE_PATTERN',
      '--content', content,
      '--context', 'periodic mid-session extraction',
      '--tags', 'periodic,extraction,scope:project',
      '--confidence', 'low',
    ], {
      cwd: opcDir,
      detached: true,
      stdio: 'ignore',
      env: { ...process.env, PYTHONPATH: '.' },
    });
    child.unref();
  } catch {
    // Fail open -- extraction is best-effort
  }

  state.lastExtract = Date.now();
  saveState(stateFile, state);

  console.log(JSON.stringify(buildOutput(state, true)));
}

main().catch(() => {
  console.log(JSON.stringify({}));
});
