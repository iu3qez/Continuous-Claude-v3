#!/usr/bin/env node
/**
 * Maestro E2E Workflow Test
 * Tests the full maestro cycle: activation → recon → interview → approval → execution
 */

import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, unlinkSync, existsSync, readFileSync, readdirSync } from 'fs';

const TEST_SESSION_ID = 'maestro-e2e-test';
const MAESTRO_STATE = join(tmpdir(), `claude-maestro-state-${TEST_SESSION_ID}.json`);
const LEGACY_STATE = join(tmpdir(), 'claude-maestro-state.json');

function cleanState() {
  if (existsSync(MAESTRO_STATE)) unlinkSync(MAESTRO_STATE);
  if (existsSync(LEGACY_STATE)) unlinkSync(LEGACY_STATE);
  // Also clean up any PID-based state files from child processes
  const tmp = tmpdir();
  for (const f of readdirSync(tmp)) {
    if (f.startsWith('claude-maestro-state-') && f.endsWith('.json')) {
      try { unlinkSync(join(tmp, f)); } catch {}
    }
  }
}

function getState() {
  // Check session-specific path first, then legacy
  for (const p of [MAESTRO_STATE, LEGACY_STATE]) {
    if (existsSync(p)) {
      try { return JSON.parse(readFileSync(p, 'utf-8')); } catch {}
    }
  }
  // Check for any maestro state files (child process may use PID-based name)
  const tmp = tmpdir();
  for (const f of readdirSync(tmp)) {
    if (f.startsWith('claude-maestro-state-') && f.endsWith('.json')) {
      try { return JSON.parse(readFileSync(join(tmp, f), 'utf-8')); } catch {}
    }
  }
  return null;
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
  console.log('    MAESTRO E2E WORKFLOW TEST');
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

  // Step 1: Clean state
  cleanState();
  check('Initial state clean', !existsSync(MAESTRO_STATE));

  // Step 2: Activate maestro (pass session_id for session isolation)
  let output = await runHook('maestro-state-manager', { session_id: TEST_SESSION_ID, prompt: 'yes use maestro' });
  let state = getState();
  check('Maestro activated', state?.active === true, JSON.stringify(state));
  check('Recon not complete', state?.reconComplete === false);
  check('Interview not complete', state?.interviewComplete === false);
  check('Plan not approved', state?.planApproved === false);

  // Step 3: Try kraken during recon (should block)
  output = await runHook('maestro-enforcer', {
    session_id: TEST_SESSION_ID,
    tool_name: 'Task',
    tool_input: { subagent_type: 'kraken', prompt: 'implement' }
  });
  check('kraken blocked during recon', output.includes('deny'));

  // Step 4: Scout allowed during recon
  output = await runHook('maestro-enforcer', {
    session_id: TEST_SESSION_ID,
    tool_name: 'Task',
    tool_input: { subagent_type: 'scout', prompt: 'explore' }
  });
  check('scout allowed during recon', !output.includes('deny'));

  // Step 5: Complete recon
  output = await runHook('maestro-state-manager', { session_id: TEST_SESSION_ID, prompt: 'recon complete' });
  state = getState();
  check('Recon marked complete', state?.reconComplete === true);

  // Step 6: Try kraken during interview (should block)
  output = await runHook('maestro-enforcer', {
    session_id: TEST_SESSION_ID,
    tool_name: 'Task',
    tool_input: { subagent_type: 'kraken', prompt: 'implement' }
  });
  check('kraken blocked during interview', output.includes('deny'));

  // Step 7: Complete interview
  output = await runHook('maestro-state-manager', { session_id: TEST_SESSION_ID, prompt: 'interview complete' });
  state = getState();
  check('Interview marked complete', state?.interviewComplete === true);

  // Step 8: Try kraken before approval (should block)
  output = await runHook('maestro-enforcer', {
    session_id: TEST_SESSION_ID,
    tool_name: 'Task',
    tool_input: { subagent_type: 'kraken', prompt: 'implement' }
  });
  check('kraken blocked before approval', output.includes('deny'));

  // Step 9: Approve plan
  output = await runHook('maestro-state-manager', { session_id: TEST_SESSION_ID, prompt: 'yes' });
  state = getState();
  check('Plan approved', state?.planApproved === true);

  // Step 10: kraken allowed after approval
  output = await runHook('maestro-enforcer', {
    session_id: TEST_SESSION_ID,
    tool_name: 'Task',
    tool_input: { subagent_type: 'kraken', prompt: 'implement feature' }
  });
  check('kraken allowed after approval', !output.includes('deny'));

  // Step 11: Cancel and verify cleanup
  output = await runHook('maestro-state-manager', { session_id: TEST_SESSION_ID, prompt: 'cancel maestro' });
  state = getState();
  check('State cleared on cancel', state === null);

  console.log('\n========================================');
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runE2E();
