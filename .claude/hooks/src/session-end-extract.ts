#!/usr/bin/env node
/**
 * Session End Extract Hook
 *
 * Triggers memory extraction when a session ends.
 * Replaces the polling memory daemon with on-demand extraction.
 *
 * Hook: SessionEnd
 * Condition: Session has enough turns (>= 10)
 */

import { execSync, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

interface SessionEndInput {
  session_id: string;
  type?: string;
}

const MIN_TURNS = 10;
const EXTRACTION_TIMEOUT = 60000; // 60 seconds

function getOpcDir(): string {
  return process.env.CLAUDE_OPC_DIR || path.join(process.env.HOME || process.env.USERPROFILE || '', 'continuous-claude', 'opc');
}

function shouldExtract(sessionId: string, projectDir: string): boolean {
  const opcDir = getOpcDir();
  const lazyMemoryPath = path.join(opcDir, 'scripts', 'core', 'lazy_memory.py');

  if (!fs.existsSync(lazyMemoryPath)) {
    console.error('lazy_memory.py not found');
    return false;
  }

  try {
    const result = execSync(
      `cd "${opcDir}" && uv run python scripts/core/lazy_memory.py check --session-id "${sessionId}" --project "${projectDir}" --min-turns ${MIN_TURNS} --json`,
      { encoding: 'utf-8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] }
    );

    const data = JSON.parse(result.trim());
    return data.should_extract === true;
  } catch (err) {
    // If check fails, assume we should try extraction anyway
    return true;
  }
}

function extractLearnings(sessionId: string, projectDir: string): void {
  const opcDir = getOpcDir();
  const lazyMemoryPath = path.join(opcDir, 'scripts', 'core', 'lazy_memory.py');

  if (!fs.existsSync(lazyMemoryPath)) {
    console.error('lazy_memory.py not found, skipping extraction');
    return;
  }

  // Run extraction in background (don't block session end)
  const child = spawn(
    'uv',
    ['run', 'python', 'scripts/core/lazy_memory.py', 'extract',
     '--session-id', sessionId,
     '--project', projectDir,
     '--max-learnings', '10'],
    {
      cwd: opcDir,
      detached: true,
      stdio: 'ignore',
    }
  );

  // Unref to allow parent to exit
  child.unref();

  console.error(`✓ Memory extraction started for session ${sessionId.slice(0, 8)}...`);
}

async function main() {
  const input = await readStdin();
  if (!input.trim()) {
    console.log(JSON.stringify({ result: 'continue' }));
    return;
  }

  let data: SessionEndInput;
  try {
    data = JSON.parse(input);
  } catch {
    console.log(JSON.stringify({ result: 'continue' }));
    return;
  }

  const sessionId = data.session_id;
  if (!sessionId) {
    console.log(JSON.stringify({ result: 'continue' }));
    return;
  }

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  // Check if session has enough content
  if (!shouldExtract(sessionId, projectDir)) {
    console.error(`ℹ Session too short for extraction (< ${MIN_TURNS} turns)`);
    console.log(JSON.stringify({ result: 'continue' }));
    return;
  }

  // Trigger extraction (runs in background)
  extractLearnings(sessionId, projectDir);

  console.log(JSON.stringify({ result: 'continue' }));
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
  });
}

main().catch(err => {
  console.error('session-end-extract error:', err);
  console.log(JSON.stringify({ result: 'continue' }));
});
