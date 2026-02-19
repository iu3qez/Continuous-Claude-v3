#!/usr/bin/env node
/**
 * Session Start Init Check Hook
 *
 * Detects uninitialized projects and generates knowledge tree if missing.
 * Uses lazy tree generation - generates inline if missing, skips if fresh.
 * Lightweight check - only runs on startup, not resume/clear/compact.
 *
 * Hook: SessionStart (startup only)
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface SessionStartInput {
  type?: 'startup' | 'resume' | 'clear' | 'compact';
  source?: 'startup' | 'resume' | 'clear' | 'compact';
  session_id: string;
}

const TREE_MAX_AGE_SECONDS = 300; // 5 minutes

function getOpcDir(): string {
  return process.env.CLAUDE_OPC_DIR || path.join(process.env.HOME || process.env.USERPROFILE || '', 'continuous-claude', 'opc');
}

function isTreeStale(projectDir: string): boolean {
  const treePath = path.join(projectDir, '.claude', 'knowledge-tree.json');

  if (!fs.existsSync(treePath)) {
    return true;
  }

  try {
    const stats = fs.statSync(treePath);
    const ageSeconds = (Date.now() - stats.mtimeMs) / 1000;
    return ageSeconds >= TREE_MAX_AGE_SECONDS;
  } catch {
    return true;
  }
}

function generateTree(projectDir: string): boolean {
  const opcDir = getOpcDir();
  const lazyTreePath = path.join(opcDir, 'scripts', 'core', 'lazy_tree.py');

  if (!fs.existsSync(lazyTreePath)) {
    // Fall back to knowledge_tree.py
    const knowledgeTreePath = path.join(opcDir, 'scripts', 'core', 'knowledge_tree.py');
    if (!fs.existsSync(knowledgeTreePath)) {
      return false;
    }

    try {
      execSync(
        `cd "${opcDir}" && uv run python scripts/core/knowledge_tree.py --project "${projectDir}"`,
        { encoding: 'utf-8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] }
      );
      return true;
    } catch {
      return false;
    }
  }

  try {
    execSync(
      `cd "${opcDir}" && uv run python scripts/core/lazy_tree.py regenerate --project "${projectDir}"`,
      { encoding: 'utf-8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return true;
  } catch {
    return false;
  }
}

function isInitialized(projectDir: string): { tree: boolean; roadmap: boolean } {
  const treePath = path.join(projectDir, '.claude', 'knowledge-tree.json');
  const roadmapPath = path.join(projectDir, 'ROADMAP.md');

  return {
    tree: fs.existsSync(treePath),
    roadmap: fs.existsSync(roadmapPath)
  };
}

function hasCodeFiles(projectDir: string): boolean {
  const codeIndicators = [
    'package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod',
    'requirements.txt', 'pom.xml', 'build.gradle', 'Gemfile',
    'README.md', 'readme.md', '.git'
  ];

  for (const indicator of codeIndicators) {
    if (fs.existsSync(path.join(projectDir, indicator))) {
      return true;
    }
  }

  return false;
}

async function main() {
  const input = await readStdin();
  if (!input.trim()) {
    console.log(JSON.stringify({ result: 'continue' }));
    return;
  }

  let data: SessionStartInput;
  try {
    data = JSON.parse(input);
  } catch {
    console.log(JSON.stringify({ result: 'continue' }));
    return;
  }

  const sessionType = data.source || data.type || 'startup';

  if (sessionType !== 'startup') {
    console.log(JSON.stringify({ result: 'continue' }));
    return;
  }

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  if (projectDir.includes('.claude') && !projectDir.includes('continuous-claude')) {
    console.log(JSON.stringify({ result: 'continue' }));
    return;
  }

  const status = isInitialized(projectDir);
  let treeGenFailed = false;

  // Generate tree lazily if missing or stale
  if (!status.tree || isTreeStale(projectDir)) {
    if (hasCodeFiles(projectDir)) {
      console.error('📊 Generating knowledge tree...');
      const generated = generateTree(projectDir);
      if (generated) {
        console.error('✓ Knowledge tree generated');
        status.tree = true;
      } else {
        console.error('⚠ Failed to generate knowledge tree');
        treeGenFailed = true;
      }
    }
  }

  // If fully initialized and no failures, continue silently
  if (status.tree && status.roadmap && !treeGenFailed) {
    console.log(JSON.stringify({ result: 'continue' }));
    return;
  }

  if (!hasCodeFiles(projectDir)) {
    console.log(JSON.stringify({ result: 'continue' }));
    return;
  }

  // Collect missing/failed items
  const missing: string[] = [];
  if (!status.roadmap) missing.push('ROADMAP.md');
  if (treeGenFailed) missing.push('knowledge-tree.json (generation failed - agents will lack project context)');

  if (missing.length === 0) {
    console.log(JSON.stringify({ result: 'continue' }));
    return;
  }

  const message = `📋 Project partially initialized. Missing: ${missing.join(', ')}. Run /init-project for full Continuous Claude setup.`;

  console.error(`ℹ ${message}`);

  const output = {
    result: 'continue',
    message: message
  };

  console.log(JSON.stringify(output));
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
  console.error('session-start-init-check error:', err);
  console.log(JSON.stringify({ result: 'continue' }));
});
