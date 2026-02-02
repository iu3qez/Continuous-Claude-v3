#!/usr/bin/env node
/**
 * Maestro Session Isolation Tests
 *
 * Tests whether multiple terminals can run Maestro independently.
 *
 * Category G tests:
 * - G1: Two terminals run Maestro → independent state
 * - G2: Terminal A in interview, B activates → A unaffected
 * - G3: TTL alignment between enforcer and state-manager
 */

import { existsSync, writeFileSync, readFileSync, unlinkSync, readdirSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const STATE_BASE_NAME = 'maestro-state';

function getSessionStatePath(sessionId) {
  return join(tmpdir(), `claude-${STATE_BASE_NAME}-${sessionId}.json`);
}

function createMaestroState(sessionId, overrides = {}) {
  return {
    active: true,
    taskType: 'implementation',
    reconComplete: false,
    interviewComplete: false,
    planApproved: false,
    activatedAt: Date.now(),
    lastActivity: Date.now(),
    sessionId,
    ...overrides
  };
}

/**
 * Test G1: Independent Maestro State
 *
 * Scenario: Two terminals activate Maestro.
 * Expected: Each has independent state.
 */
async function testG1_IndependentMaestroState() {
  console.log('\n━━━ Test G1: Independent Maestro State ━━━');

  const sessionA = `maestro-test-${Date.now()}-A`;
  const sessionB = `maestro-test-${Date.now()}-B`;

  const stateFileA = getSessionStatePath(sessionA);
  const stateFileB = getSessionStatePath(sessionB);

  // Terminal A activates Maestro in recon phase
  writeFileSync(stateFileA, JSON.stringify(createMaestroState(sessionA, {
    reconComplete: false,
    taskType: 'implementation'
  })));

  // Terminal B activates Maestro in interview phase
  writeFileSync(stateFileB, JSON.stringify(createMaestroState(sessionB, {
    reconComplete: true,
    interviewComplete: false,
    taskType: 'research'
  })));

  // Verify isolation
  const stateA = JSON.parse(readFileSync(stateFileA, 'utf-8'));
  const stateB = JSON.parse(readFileSync(stateFileB, 'utf-8'));

  // Cleanup
  if (existsSync(stateFileA)) unlinkSync(stateFileA);
  if (existsSync(stateFileB)) unlinkSync(stateFileB);

  console.log(`Terminal A state file: ${existsSync(stateFileA) ? 'still exists' : 'cleaned'}`);
  console.log(`Terminal B state file: ${existsSync(stateFileB) ? 'still exists' : 'cleaned'}`);
  console.log(`Terminal A phase: recon=${stateA.reconComplete}, interview=${stateA.interviewComplete}`);
  console.log(`Terminal B phase: recon=${stateB.reconComplete}, interview=${stateB.interviewComplete}`);

  const isolated =
    stateA.sessionId === sessionA &&
    stateB.sessionId === sessionB &&
    stateA.reconComplete === false &&
    stateB.reconComplete === true &&
    stateA.taskType === 'implementation' &&
    stateB.taskType === 'research';

  if (isolated) {
    console.log('✅ PASS: Maestro states are properly isolated');
    return { pass: true };
  } else {
    console.log('❌ FAIL: Maestro states not isolated');
    return { pass: false, reason: 'State collision detected' };
  }
}

/**
 * Test G2: Interview Phase Isolation
 *
 * Scenario: Terminal A is in interview phase, Terminal B activates Maestro.
 * Expected: Terminal A's interview state is unaffected.
 */
async function testG2_InterviewPhaseIsolation() {
  console.log('\n━━━ Test G2: Interview Phase Isolation ━━━');

  const sessionA = `maestro-interview-${Date.now()}-A`;
  const sessionB = `maestro-interview-${Date.now()}-B`;

  const stateFileA = getSessionStatePath(sessionA);
  const stateFileB = getSessionStatePath(sessionB);

  // Terminal A is in interview phase
  writeFileSync(stateFileA, JSON.stringify(createMaestroState(sessionA, {
    reconComplete: true,
    interviewComplete: false
  })));

  // Read A's state before B activates
  const stateABefore = JSON.parse(readFileSync(stateFileA, 'utf-8'));

  // Terminal B activates (fresh start)
  writeFileSync(stateFileB, JSON.stringify(createMaestroState(sessionB, {
    reconComplete: false,
    interviewComplete: false
  })));

  // Read A's state after B activates
  const stateAAfter = JSON.parse(readFileSync(stateFileA, 'utf-8'));

  // Cleanup
  if (existsSync(stateFileA)) unlinkSync(stateFileA);
  if (existsSync(stateFileB)) unlinkSync(stateFileB);

  console.log(`Terminal A before: recon=${stateABefore.reconComplete}, interview=${stateABefore.interviewComplete}`);
  console.log(`Terminal A after B activates: recon=${stateAAfter.reconComplete}, interview=${stateAAfter.interviewComplete}`);

  const unaffected =
    stateABefore.reconComplete === stateAAfter.reconComplete &&
    stateABefore.interviewComplete === stateAAfter.interviewComplete &&
    stateABefore.sessionId === stateAAfter.sessionId;

  if (unaffected) {
    console.log('✅ PASS: Terminal A interview state unaffected by B');
    return { pass: true };
  } else {
    console.log('❌ FAIL: Terminal A state was affected by Terminal B');
    return { pass: false, reason: 'Cross-session interference detected' };
  }
}

/**
 * Test G3: TTL Alignment
 *
 * Scenario: Check that both maestro-enforcer and maestro-state-manager use same TTL.
 * Expected: Both use 4 hours (14400000ms).
 */
async function testG3_TTLAlignment() {
  console.log('\n━━━ Test G3: TTL Alignment ━━━');

  const hooksDir = join(
    process.env.HOME || process.env.USERPROFILE || '',
    'continuous-claude',
    '.claude',
    'hooks',
    'src'
  );

  const enforcerPath = join(hooksDir, 'maestro-enforcer.ts');
  const managerPath = join(hooksDir, 'maestro-state-manager.ts');

  const enforcerExists = existsSync(enforcerPath);
  const managerExists = existsSync(managerPath);

  console.log(`maestro-enforcer.ts exists: ${enforcerExists}`);
  console.log(`maestro-state-manager.ts exists: ${managerExists}`);

  if (!enforcerExists || !managerExists) {
    console.log('❌ FAIL: Missing hook files');
    return { pass: false, reason: 'Missing maestro hook files' };
  }

  const enforcerContent = readFileSync(enforcerPath, 'utf-8');
  const managerContent = readFileSync(managerPath, 'utf-8');

  // Extract TTL values
  const enforcerTTLMatch = enforcerContent.match(/STATE_TTL\s*=\s*(\d+)\s*\*\s*(\d+)\s*\*\s*(\d+)\s*\*\s*(\d+)/);
  const managerTTLMatch = managerContent.match(/STATE_TTL\s*=\s*(\d+)\s*\*\s*(\d+)\s*\*\s*(\d+)\s*\*\s*(\d+)/);

  let enforcerTTL = 0;
  let managerTTL = 0;

  if (enforcerTTLMatch) {
    enforcerTTL = enforcerTTLMatch.slice(1, 5).reduce((a, b) => a * parseInt(b), 1);
  }
  if (managerTTLMatch) {
    managerTTL = managerTTLMatch.slice(1, 5).reduce((a, b) => a * parseInt(b), 1);
  }

  const expectedTTL = 4 * 60 * 60 * 1000; // 4 hours in ms

  console.log(`Enforcer TTL: ${enforcerTTL}ms (${enforcerTTL / 1000 / 60 / 60}h)`);
  console.log(`Manager TTL: ${managerTTL}ms (${managerTTL / 1000 / 60 / 60}h)`);
  console.log(`Expected TTL: ${expectedTTL}ms (4h)`);

  const aligned = enforcerTTL === managerTTL && enforcerTTL === expectedTTL;

  if (aligned) {
    console.log('✅ PASS: TTL values are aligned at 4 hours');
    return { pass: true };
  } else {
    console.log('❌ FAIL: TTL values are misaligned');
    if (enforcerTTL !== expectedTTL) {
      console.log(`   Enforcer has ${enforcerTTL / 1000 / 60 / 60}h instead of 4h`);
    }
    if (managerTTL !== expectedTTL) {
      console.log(`   Manager has ${managerTTL / 1000 / 60 / 60}h instead of 4h`);
    }
    return { pass: false, reason: 'TTL mismatch between enforcer and manager' };
  }
}

/**
 * Test G4: Session Isolation Utility Usage
 *
 * Scenario: Check that both hooks use session-isolation utilities.
 * Expected: Both import from shared/session-isolation.
 */
async function testG4_SessionIsolationUsage() {
  console.log('\n━━━ Test G4: Session Isolation Utility Usage ━━━');

  const hooksDir = join(
    process.env.HOME || process.env.USERPROFILE || '',
    'continuous-claude',
    '.claude',
    'hooks',
    'src'
  );

  const enforcerPath = join(hooksDir, 'maestro-enforcer.ts');
  const managerPath = join(hooksDir, 'maestro-state-manager.ts');

  if (!existsSync(enforcerPath) || !existsSync(managerPath)) {
    console.log('❌ FAIL: Missing hook files');
    return { pass: false, reason: 'Missing maestro hook files' };
  }

  const enforcerContent = readFileSync(enforcerPath, 'utf-8');
  const managerContent = readFileSync(managerPath, 'utf-8');

  const enforcerUsesIsolation =
    enforcerContent.includes('session-isolation') ||
    enforcerContent.includes('getStatePathWithMigration') ||
    enforcerContent.includes('getSessionStatePath');

  const managerUsesIsolation =
    managerContent.includes('session-isolation') ||
    managerContent.includes('getStatePathWithMigration') ||
    managerContent.includes('getSessionStatePath');

  console.log(`Enforcer uses session-isolation: ${enforcerUsesIsolation}`);
  console.log(`Manager uses session-isolation: ${managerUsesIsolation}`);

  if (enforcerUsesIsolation && managerUsesIsolation) {
    console.log('✅ PASS: Both hooks use session isolation utilities');
    return { pass: true };
  } else {
    const issues = [];
    if (!enforcerUsesIsolation) issues.push('enforcer');
    if (!managerUsesIsolation) issues.push('manager');
    console.log(`❌ FAIL: ${issues.join(' and ')} missing session isolation`);
    return { pass: false, reason: `Missing session isolation in: ${issues.join(', ')}` };
  }
}

// Run all tests
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Maestro Session Isolation Tests      ║');
  console.log('╚════════════════════════════════════════╝');

  const results = [];

  results.push({ name: 'G1: Independent Maestro State', ...await testG1_IndependentMaestroState() });
  results.push({ name: 'G2: Interview Phase Isolation', ...await testG2_InterviewPhaseIsolation() });
  results.push({ name: 'G3: TTL Alignment', ...await testG3_TTLAlignment() });
  results.push({ name: 'G4: Session Isolation Usage', ...await testG4_SessionIsolationUsage() });

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
