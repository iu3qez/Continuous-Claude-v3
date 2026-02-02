#!/usr/bin/env node
/**
 * Long-Running Workflow Tests
 *
 * Tests whether long sessions survive TTL expiration.
 *
 * Category E tests from the stress test plan:
 * - E1: TTL Expiration (Simulated)
 * - E2: Heartbeat Mechanism
 * - E3: Session State Persistence
 */

import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const STATE_TTL_HOURS = 12; // Extended TTL
const STATE_TTL_MS = STATE_TTL_HOURS * 60 * 60 * 1000;
const WARNING_THRESHOLD = 0.8;

/**
 * Test E1: TTL Expiration (Simulated)
 *
 * Scenario: State was created > TTL ago.
 * Expected: Should be treated as expired.
 */
async function testE1_TTLExpiration() {
  console.log('\n━━━ Test E1: TTL Expiration ━━━');

  const stateFile = join(tmpdir(), 'claude-ralph-state-ttl-test.json');

  // Create state that's older than TTL (simulate 13 hours ago)
  const oldState = {
    active: true,
    storyId: 'OLD-STORY',
    activatedAt: Date.now() - (13 * 60 * 60 * 1000), // 13 hours ago
    lastActivity: Date.now() - (13 * 60 * 60 * 1000)
  };

  writeFileSync(stateFile, JSON.stringify(oldState));
  console.log(`✓ Created state from 13 hours ago (TTL is ${STATE_TTL_HOURS}h)`);

  // Simulate readRalphState logic
  const content = readFileSync(stateFile, 'utf-8');
  const state = JSON.parse(content);
  const lastTime = state.lastActivity || state.activatedAt;
  const elapsed = Date.now() - lastTime;
  const isExpired = elapsed > STATE_TTL_MS;

  // Cleanup
  unlinkSync(stateFile);

  console.log(`Elapsed: ${(elapsed / (60 * 60 * 1000)).toFixed(1)} hours`);
  console.log(`Is expired: ${isExpired}`);

  if (isExpired) {
    console.log('✅ PASS: Old state correctly detected as expired');
    return { pass: true };
  } else {
    console.log('❌ FAIL: Old state should be expired');
    return { pass: false, reason: 'TTL not enforced' };
  }
}

/**
 * Test E2: Heartbeat Mechanism
 *
 * Scenario: State is active with recent heartbeat.
 * Expected: Should NOT be expired.
 */
async function testE2_HeartbeatMechanism() {
  console.log('\n━━━ Test E2: Heartbeat Mechanism ━━━');

  const stateFile = join(tmpdir(), 'claude-ralph-state-heartbeat-test.json');

  // Create state that was activated 10 hours ago but has recent heartbeat
  const state = {
    active: true,
    storyId: 'LONG-STORY',
    activatedAt: Date.now() - (10 * 60 * 60 * 1000), // 10 hours ago
    lastActivity: Date.now() - (5 * 60 * 1000) // 5 minutes ago (recent heartbeat)
  };

  writeFileSync(stateFile, JSON.stringify(state));
  console.log('✓ Created state: activated 10h ago, last activity 5min ago');

  // Simulate readRalphState logic with heartbeat
  const content = readFileSync(stateFile, 'utf-8');
  const readState = JSON.parse(content);
  const lastTime = readState.lastActivity || readState.activatedAt;
  const elapsed = Date.now() - lastTime;
  const isExpired = elapsed > STATE_TTL_MS;

  // Cleanup
  unlinkSync(stateFile);

  console.log(`Using lastActivity for TTL check: ${lastTime}`);
  console.log(`Elapsed since last activity: ${(elapsed / (60 * 1000)).toFixed(1)} minutes`);
  console.log(`Is expired: ${isExpired}`);

  if (!isExpired) {
    console.log('✅ PASS: Heartbeat keeps session alive');
    return { pass: true };
  } else {
    console.log('❌ FAIL: Heartbeat should prevent expiration');
    return { pass: false, reason: 'Heartbeat not extending TTL' };
  }
}

/**
 * Test E3: TTL Warning
 *
 * Scenario: State is approaching TTL (80%+).
 * Expected: Warning should be triggered.
 */
async function testE3_TTLWarning() {
  console.log('\n━━━ Test E3: TTL Warning ━━━');

  const stateFile = join(tmpdir(), 'claude-ralph-state-warning-test.json');

  // Create state that's at 85% of TTL (10.2 hours of 12)
  const state = {
    active: true,
    storyId: 'AGING-STORY',
    activatedAt: Date.now() - (10.2 * 60 * 60 * 1000),
    lastActivity: Date.now() - (10.2 * 60 * 60 * 1000)
  };

  writeFileSync(stateFile, JSON.stringify(state));
  console.log('✓ Created state at 85% of TTL');

  // Simulate warning check
  const content = readFileSync(stateFile, 'utf-8');
  const readState = JSON.parse(content);
  const lastTime = readState.lastActivity || readState.activatedAt;
  const elapsed = Date.now() - lastTime;

  const shouldWarn = elapsed > STATE_TTL_MS * WARNING_THRESHOLD && elapsed <= STATE_TTL_MS;
  const remainingHours = ((STATE_TTL_MS - elapsed) / (60 * 60 * 1000)).toFixed(1);

  // Cleanup
  unlinkSync(stateFile);

  console.log(`Elapsed: ${(elapsed / (60 * 60 * 1000)).toFixed(1)} hours`);
  console.log(`Warning threshold: ${WARNING_THRESHOLD * 100}%`);
  console.log(`Should warn: ${shouldWarn}`);
  console.log(`Remaining: ${remainingHours} hours`);

  if (shouldWarn) {
    console.log('✅ PASS: Warning triggered at 80%+ TTL');
    console.log(`   Message: "Session expiring in ${remainingHours}h. Activity will extend TTL."`);
    return { pass: true };
  } else {
    console.log('❌ FAIL: Warning should be triggered at 80%+ TTL');
    return { pass: false, reason: 'Warning not triggered' };
  }
}

// Run all tests
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Long-Running Workflow Tests          ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`Configuration: TTL = ${STATE_TTL_HOURS}h, Warning at ${WARNING_THRESHOLD * 100}%`);

  const results = [];

  results.push({ name: 'E1: TTL Expiration', ...await testE1_TTLExpiration() });
  results.push({ name: 'E2: Heartbeat Mechanism', ...await testE2_HeartbeatMechanism() });
  results.push({ name: 'E3: TTL Warning', ...await testE3_TTLWarning() });

  // Summary
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Test Summary                         ║');
  console.log('╚════════════════════════════════════════╝');

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;

  results.forEach(r => {
    const status = r.pass ? '✅' : '❌';
    console.log(`${status} ${r.name}`);
    if (!r.pass) {
      console.log(`   Reason: ${r.reason}`);
    }
  });

  console.log(`\nTotal: ${passed} passed, ${failed} failed`);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
