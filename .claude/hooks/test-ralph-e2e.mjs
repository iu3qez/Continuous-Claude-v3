#!/usr/bin/env node
/**
 * Ralph Delegation E2E Test
 * Tests Ralph mode enforcement for Edit/Write/Bash
 */

import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';

const RALPH_STATE = join(tmpdir(), 'claude-ralph-state.json');

function setRalphState(storyId = 'TEST-001') {
  writeFileSync(RALPH_STATE, JSON.stringify({
    active: true,
    storyId,
    activatedAt: Date.now()
  }));
}

function cleanState() {
  if (existsSync(RALPH_STATE)) unlinkSync(RALPH_STATE);
}

async function runHook(hookName, input) {
  return new Promise((resolve) => {
    const proc = spawn('node', [`dist/${hookName}.mjs`], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let stdout = '';
    proc.stdout.on('data', d => stdout += d);
    proc.on('close', () => resolve(stdout.trim()));
    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}

async function runE2E() {
  console.log('\n========================================');
  console.log('    RALPH DELEGATION E2E TEST');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  const check = (name, condition, msg = '') => {
    if (condition) {
      console.log(`PASS: ${name}`);
      passed++;
    } else {
      console.log(`FAIL: ${name} ${msg}`);
      failed++;
    }
  };

  // Activate Ralph mode
  setRalphState('E2E-STORY-001');

  // Test 1: Edit on code file blocked
  let output = await runHook('ralph-delegation-enforcer', {
    tool_name: 'Edit',
    tool_input: { file_path: 'src/auth.ts', old_string: 'x', new_string: 'y' }
  });
  check('Edit on .ts blocked', output.includes('deny'));

  // Test 2: Edit on config allowed
  output = await runHook('ralph-delegation-enforcer', {
    tool_name: 'Edit',
    tool_input: { file_path: 'package.json', old_string: 'v1', new_string: 'v2' }
  });
  check('Edit on package.json allowed', !output.includes('deny'));

  // Test 3: Write to .ralph/ allowed
  output = await runHook('ralph-delegation-enforcer', {
    tool_name: 'Write',
    tool_input: { file_path: '.ralph/PLAN.md', content: '# Plan' }
  });
  check('Write to .ralph/ allowed', !output.includes('deny'));

  // Test 4: Write to code file blocked
  output = await runHook('ralph-delegation-enforcer', {
    tool_name: 'Write',
    tool_input: { file_path: 'src/new.tsx', content: 'code' }
  });
  check('Write to .tsx blocked', output.includes('deny'));

  // Test 5: npm test blocked
  output = await runHook('ralph-delegation-enforcer', {
    tool_name: 'Bash',
    tool_input: { command: 'npm run test' }
  });
  check('npm test blocked', output.includes('deny'));

  // Test 6: pytest blocked
  output = await runHook('ralph-delegation-enforcer', {
    tool_name: 'Bash',
    tool_input: { command: 'pytest src/' }
  });
  check('pytest blocked', output.includes('deny'));

  // Test 7: git status allowed
  output = await runHook('ralph-delegation-enforcer', {
    tool_name: 'Bash',
    tool_input: { command: 'git status' }
  });
  check('git status allowed', !output.includes('deny'));

  // Test 8: tldr allowed
  output = await runHook('ralph-delegation-enforcer', {
    tool_name: 'Bash',
    tool_input: { command: 'tldr structure src/' }
  });
  check('tldr allowed', !output.includes('deny'));

  // Test 9: Markdown write allowed
  output = await runHook('ralph-delegation-enforcer', {
    tool_name: 'Write',
    tool_input: { file_path: 'docs/README.md', content: '# Docs' }
  });
  check('Markdown write allowed', !output.includes('deny'));

  // Test 10: Task tool not affected
  output = await runHook('ralph-delegation-enforcer', {
    tool_name: 'Task',
    tool_input: { subagent_type: 'kraken', prompt: 'implement' }
  });
  check('Task tool allowed (wrong hook)', !output.includes('deny'));

  // Cleanup
  cleanState();

  console.log('\n========================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runE2E();
