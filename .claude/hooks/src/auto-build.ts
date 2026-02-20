#!/usr/bin/env node
/**
 * Auto-Build Hook
 *
 * PostToolUse hook that detects when hook source files (~/.claude/hooks/src/*.ts)
 * are modified via Write or Edit, and automatically runs `npm run build` in the
 * background to keep dist/ in sync.
 *
 * Hook: PostToolUse (Write|Edit)
 * Debounce: 5 seconds via temp file timestamp
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface PostToolUseInput {
  session_id: string;
  tool_name: string;
  tool_input: {
    file_path?: string;
    [key: string]: unknown;
  };
  tool_output?: string;
}

const DEBOUNCE_MS = 5000;
const STATE_FILE = path.join(os.tmpdir(), 'claude-auto-build-last.json');

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
  });
}

function isHookSourceFile(filePath: string): boolean {
  if (!filePath) return false;
  // Normalize to forward slashes for consistent matching
  const normalized = filePath.replace(/\\/g, '/');
  return normalized.includes('.claude/hooks/src/') && normalized.endsWith('.ts');
}

function isDebouncePassed(): boolean {
  let lastBuild = 0;
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    lastBuild = state.lastBuild || 0;
  } catch {
    // No state file or parse error -- treat as no recent build
  }
  return Date.now() - lastBuild >= DEBOUNCE_MS;
}

function updateDebounceState(): void {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({ lastBuild: Date.now() }));
  } catch {
    // Non-critical -- if we can't write state, worst case we rebuild more often
  }
}

function triggerBuild(): void {
  const hooksDir = path.join(os.homedir(), '.claude', 'hooks');
  // Use shell with single command string to avoid DEP0190 deprecation warning
  const child = spawn('npm run build', {
    cwd: hooksDir,
    detached: true,
    stdio: 'ignore',
    shell: true,
  });
  child.unref();
}

async function main() {
  const input = await readStdin();
  if (!input.trim()) {
    console.log(JSON.stringify({}));
    return;
  }

  let data: PostToolUseInput;
  try {
    data = JSON.parse(input);
  } catch {
    console.log(JSON.stringify({}));
    return;
  }

  // Only trigger on Write or Edit
  if (data.tool_name !== 'Write' && data.tool_name !== 'Edit') {
    console.log(JSON.stringify({}));
    return;
  }

  // Check if the edited file is a hook source file
  const filePath = data.tool_input?.file_path || '';
  if (!isHookSourceFile(filePath)) {
    console.log(JSON.stringify({}));
    return;
  }

  // Check debounce
  if (!isDebouncePassed()) {
    console.log(JSON.stringify({}));
    return;
  }

  // Update debounce state and trigger background build
  updateDebounceState();
  triggerBuild();

  const fileName = path.basename(filePath);
  console.error(`[auto-build] Triggered by ${fileName}`);
  console.log(
    JSON.stringify({
      values: {
        system: `Auto-building hooks dist/ (triggered by edit to ${fileName})...`,
      },
    })
  );
}

main().catch((err) => {
  console.error('[auto-build] Error:', err.message);
  console.log(JSON.stringify({}));
});
