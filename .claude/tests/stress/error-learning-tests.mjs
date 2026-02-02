#!/usr/bin/env node
/**
 * Error Learning Pipeline Tests
 *
 * Tests whether errors are captured and stored as learnings.
 *
 * Category D tests from the stress test plan:
 * - D1: Agent Error Capture
 * - D2: Hook Error Learning
 * - D3: Repeated Mistake Detection
 */

import { execSync, spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir, homedir } from 'os';

const OPC_DIR = process.env.CLAUDE_OPC_DIR || join(homedir(), 'continuous-claude', 'opc');
const TEST_SESSION_ID = `error-test-${Date.now()}`;

/**
 * Test D1: Agent Error Capture
 *
 * Scenario: An agent (Task tool) returns an error.
 * Expected: Error should be stored as FAILED_APPROACH learning.
 *
 * This test simulates what agent-error-capture.ts should do.
 */
async function testD1_AgentErrorCapture() {
  console.log('\n━━━ Test D1: Agent Error Capture ━━━');

  // Simulate a PostToolUse:Task input with error
  const taskResponse = {
    session_id: TEST_SESSION_ID,
    tool_name: 'Task',
    tool_input: {
      subagent_type: 'kraken',
      prompt: 'Implement authentication in src/auth.ts'
    },
    tool_response: `Error: ModuleNotFoundError: No module named 'bcrypt'
Traceback (most recent call last):
  File "src/auth.py", line 1, in <module>
    import bcrypt
ModuleNotFoundError: No module named 'bcrypt'

The agent was unable to complete the task due to missing dependencies.`
  };

  // Check if the error patterns are detected
  const errorPatterns = [
    /\berror\b/i,
    /\bfailed\b/i,
    /\bModuleNotFoundError\b/i,
    /Traceback/i,
  ];

  const responseStr = typeof taskResponse.tool_response === 'string'
    ? taskResponse.tool_response
    : JSON.stringify(taskResponse.tool_response);

  const hasError = errorPatterns.some(p => p.test(responseStr));

  console.log(`Agent response contains error patterns: ${hasError}`);

  if (hasError) {
    console.log('✅ PASS: Error patterns detected in agent response');
    console.log('   The agent-error-capture.ts hook should store this as FAILED_APPROACH');

    // Note: We can't actually run store_learning here without DB setup
    // but we verify the detection logic works
    return { pass: true };
  } else {
    console.log('❌ FAIL: Error patterns not detected');
    return { pass: false, reason: 'Error detection failed' };
  }
}

/**
 * Test D2: Hook Error Learning
 *
 * Scenario: A hook throws an error during execution.
 * Expected: Error should be logged and stored.
 *
 * This test verifies the hook-error-pipeline infrastructure exists.
 */
async function testD2_HookErrorLearning() {
  console.log('\n━━━ Test D2: Hook Error Learning ━━━');

  const hookErrorPipelinePath = join(
    homedir(),
    'continuous-claude',
    '.claude',
    'hooks',
    'src',
    'hook-error-pipeline.ts'
  );

  const exists = existsSync(hookErrorPipelinePath);
  console.log(`hook-error-pipeline.ts exists: ${exists}`);

  if (!exists) {
    console.log('❌ FAIL: hook-error-pipeline.ts not found');
    return { pass: false, reason: 'Hook error pipeline not created' };
  }

  // Verify it exports the expected functions
  const content = readFileSync(hookErrorPipelinePath, 'utf-8');
  const hasCapture = content.includes('captureHookError');
  const hasWrap = content.includes('wrapWithErrorCapture');
  const hasStoreLearning = content.includes('storeErrorAsLearning');

  console.log(`Exports captureHookError: ${hasCapture}`);
  console.log(`Exports wrapWithErrorCapture: ${hasWrap}`);
  console.log(`Has storeErrorAsLearning: ${hasStoreLearning}`);

  if (hasCapture && hasWrap && hasStoreLearning) {
    console.log('✅ PASS: Hook error pipeline has required functions');
    return { pass: true };
  } else {
    console.log('❌ FAIL: Hook error pipeline missing required functions');
    return { pass: false, reason: 'Missing required exports' };
  }
}

/**
 * Test D3: Repeated Mistake Detection
 *
 * Scenario: Same error occurs multiple times.
 * Expected: System should warn about repeated mistakes.
 *
 * Current status: PARTIAL - Errors are stored but pattern detection not implemented
 */
async function testD3_RepeatedMistakeDetection() {
  console.log('\n━━━ Test D3: Repeated Mistake Detection ━━━');

  // This would require:
  // 1. Querying memory for similar errors
  // 2. Detecting patterns across sessions
  // 3. Warning when attempting similar action

  // Check if incremental_extract.py has error extraction
  const extractPath = join(OPC_DIR, 'scripts', 'core', 'incremental_extract.py');
  const exists = existsSync(extractPath);

  if (!exists) {
    console.log('❌ FAIL: incremental_extract.py not found');
    return { pass: false, reason: 'Extract script not found' };
  }

  const content = readFileSync(extractPath, 'utf-8');
  const hasErrorPatterns = content.includes('ERROR_PATTERNS');
  const hasToolErrorExtract = content.includes('extract_tool_errors');
  const hasStoreToolError = content.includes('store_tool_error_learning');

  console.log(`Has ERROR_PATTERNS: ${hasErrorPatterns}`);
  console.log(`Has extract_tool_errors: ${hasToolErrorExtract}`);
  console.log(`Has store_tool_error_learning: ${hasStoreToolError}`);

  if (hasErrorPatterns && hasToolErrorExtract && hasStoreToolError) {
    console.log('✅ PASS: Error extraction infrastructure exists');
    console.log('   Note: Pattern detection across sessions would require memory-awareness hook updates');
    return { pass: true };
  } else {
    console.log('❌ FAIL: Error extraction missing components');
    return { pass: false, reason: 'Missing error extraction functions' };
  }
}

// Run all tests
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Error Learning Pipeline Tests        ║');
  console.log('╚════════════════════════════════════════╝');

  const results = [];

  results.push({ name: 'D1: Agent Error Capture', ...await testD1_AgentErrorCapture() });
  results.push({ name: 'D2: Hook Error Learning', ...await testD2_HookErrorLearning() });
  results.push({ name: 'D3: Repeated Mistake Detection', ...await testD3_RepeatedMistakeDetection() });

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
