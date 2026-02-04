/**
 * PageIndex Navigator - Always-on Architectural Guidance (UserPromptSubmit)
 *
 * Core hook that reviews EVERY user prompt against the architecture:
 * 1. Detects task type from prompt
 * 2. Queries PageIndex for relevant decision trees, rules, and agents
 * 3. Injects VISIBLE guidance via additionalContext
 *
 * This runs on EVERY prompt - casual prompts get minimal output,
 * task prompts get full architectural guidance.
 */

import { readFileSync } from 'fs';
import {
  detectTaskType,
  extractQueryKeywords,
  loadState,
  saveState,
  shouldAbbreviate,
  markGuidanceShown,
  getSuggestedAgents,
  TaskType,
} from './shared/navigator-state.js';
import { queryPageIndex, PageIndexResult } from './shared/pageindex-client.js';
import { outputContinue } from './shared/output.js';

interface UserPromptSubmitInput {
  session_id: string;
  hook_event_name: string;
  prompt: string;
  cwd: string;
}

// Architecture docs to query
const ARCHITECTURE_DOCS = {
  decisionTrees: '.claude/docs/architecture/DECISION-TREES.md',
  agentPicker: '.claude/docs/architecture/quick-ref/agent-picker.md',
  index: '.claude/docs/architecture/INDEX.md',
};

// Decision tree summaries for each task type (fallback when PageIndex unavailable)
const DECISION_TREE_FALLBACK: Record<TaskType, string> = {
  RESEARCH: `
  RESEARCH
    Know location? -> Read directly
    Internal code? -> scout
    External docs? -> oracle
    GitHub repos? -> pathfinder`,
  IMPLEMENTATION: `
  IMPLEMENTATION
    Simple fix (<50 loc)? -> spark
    Need tests (TDD)? -> kraken
    Need design first? -> architect -> kraken
    Full feature? -> /ralph workflow`,
  DEBUGGING: `
  DEBUGGING
    Know location? -> spark
    Need investigation? -> debug-agent
    Performance issue? -> profiler
    Multi-file bug? -> sleuth -> spark`,
  REFACTORING: `
  REFACTORING
    Single file? -> spark
    Architecture change? -> phoenix -> kraken
    Migration? -> phoenix + surveyor`,
  REVIEW: `
  REVIEW
    Feature code? -> critic
    Refactoring? -> judge
    API/integration? -> liaison
    Migration? -> surveyor`,
  CASUAL: '',
  UNKNOWN: '',
};

function readStdin(): string {
  return readFileSync(0, 'utf-8');
}

/**
 * Check if running in infrastructure directory.
 */
function isInfrastructureDir(projectDir: string): boolean {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  if (!homeDir) return false;
  const claudeDir = homeDir.replace(/\\/g, '/') + '/.claude';
  const normalizedProject = (projectDir || '').replace(/\\/g, '/');
  return normalizedProject === claudeDir || normalizedProject.endsWith('/.claude');
}

/**
 * Query PageIndex for decision tree guidance.
 */
function queryDecisionTree(
  taskType: TaskType,
  keywords: string[]
): string {
  if (taskType === 'CASUAL' || taskType === 'UNKNOWN') {
    return '';
  }

  // Build query combining task type and keywords
  const query = `${taskType.toLowerCase()} ${keywords.join(' ')}`;

  const results = queryPageIndex(query, ARCHITECTURE_DOCS.decisionTrees, {
    maxResults: 2,
    timeoutMs: 2000,
  });

  if (results.length > 0) {
    // Format results as decision tree snippet
    const lines = results.map(r =>
      `  ${r.title}: ${r.relevanceReason}`
    );
    return `${taskType}\n${lines.join('\n')}`;
  }

  // Fallback to static decision tree
  return DECISION_TREE_FALLBACK[taskType] || '';
}

/**
 * Query PageIndex for relevant rules.
 */
function queryRelevantRules(
  taskType: TaskType,
  keywords: string[]
): PageIndexResult[] {
  // Build query based on task type + keywords
  const ruleQueries: Record<TaskType, string> = {
    RESEARCH: 'research exploration claim verification',
    IMPLEMENTATION: 'code quality implementation testing',
    DEBUGGING: 'debugging claim verification error',
    REFACTORING: 'refactoring code quality',
    REVIEW: 'review verification code quality',
    CASUAL: '',
    UNKNOWN: keywords.join(' '),
  };

  const baseQuery = ruleQueries[taskType] || '';
  const query = `${baseQuery} ${keywords.slice(0, 3).join(' ')}`.trim();

  if (!query) return [];

  return queryPageIndex(query, null, {
    maxResults: 2,
    docType: 'DOCUMENTATION', // Rules are indexed as documentation
    timeoutMs: 2000,
  });
}

/**
 * Query PageIndex for agent suggestions.
 */
function queryAgentGuidance(
  taskType: TaskType,
  keywords: string[]
): string[] {
  if (taskType === 'CASUAL') return [];

  // Try PageIndex first
  const query = `${taskType.toLowerCase()} agent ${keywords.slice(0, 2).join(' ')}`;
  const results = queryPageIndex(query, ARCHITECTURE_DOCS.agentPicker, {
    maxResults: 3,
    timeoutMs: 2000,
  });

  if (results.length > 0) {
    return results.map(r => r.title);
  }

  // Fallback to static agent list
  return getSuggestedAgents(taskType);
}

/**
 * Format the navigator guidance output.
 */
function formatGuidance(
  taskType: TaskType,
  decisionTree: string,
  rules: PageIndexResult[],
  agents: string[],
  abbreviated: boolean
): string {
  const lines: string[] = [];

  // Header with visual separator
  lines.push('');
  lines.push('NAVIGATOR');
  lines.push('');

  // Task type
  lines.push(`**Task Type:** ${taskType}`);

  // Decision tree (compact if abbreviated)
  if (decisionTree && !abbreviated) {
    lines.push('');
    lines.push('**Decision Tree:**');
    for (const line of decisionTree.split('\n')) {
      if (line.trim()) {
        lines.push(`  ${line.trim()}`);
      }
    }
  }

  // Relevant rules
  if (rules.length > 0) {
    lines.push('');
    lines.push('**Relevant Rules:**');
    for (const rule of rules) {
      const ruleName = rule.docPath?.split('/').pop()?.replace('.md', '') || rule.title;
      lines.push(`  - ${ruleName}: ${rule.relevanceReason || rule.title}`);
    }
  }

  // Suggested agents
  if (agents.length > 0 && taskType !== 'CASUAL') {
    lines.push('');
    lines.push('**Suggested Agents:**');
    lines.push(`  ${agents.slice(0, 4).join(', ')}`);
  }

  lines.push('');

  return lines.join('\n');
}

/**
 * Format minimal output for casual prompts.
 */
function formatMinimalGuidance(): string {
  return '\nNAVIGATOR: No specific task detected.\n';
}

async function main() {
  const input: UserPromptSubmitInput = JSON.parse(readStdin());
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd;

  // Skip in infrastructure directory
  if (isInfrastructureDir(projectDir)) {
    outputContinue();
    return;
  }

  // Skip for subagents
  if (process.env.CLAUDE_AGENT_ID) {
    outputContinue();
    return;
  }

  // Skip slash commands (other skills handle them)
  if (input.prompt.trim().startsWith('/')) {
    outputContinue();
    return;
  }

  // Load session state
  const state = loadState(input.session_id);

  // Detect task type
  const taskType = detectTaskType(input.prompt);

  // Extract keywords for queries
  const keywords = extractQueryKeywords(input.prompt);

  // Check if we should abbreviate (same task type as before)
  const abbreviated = shouldAbbreviate(state, taskType);

  let guidance: string;

  if (taskType === 'CASUAL') {
    // Minimal output for casual prompts
    guidance = formatMinimalGuidance();
  } else {
    // Query architecture for guidance
    const decisionTree = queryDecisionTree(taskType, keywords);
    const rules = queryRelevantRules(taskType, keywords);
    const agents = queryAgentGuidance(taskType, keywords);

    // Format guidance
    guidance = formatGuidance(
      taskType,
      decisionTree,
      rules,
      agents,
      abbreviated
    );

    // Update state
    markGuidanceShown(
      state,
      taskType,
      rules.map(r => r.docPath || r.title),
      agents
    );
  }

  // Save state
  state.currentPromptKeywords = keywords;
  saveState(state);

  // Output with additionalContext (visible to both user and Claude)
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: guidance
    }
  }));
}

main().catch(() => {
  // Silent fail - don't block user prompts
  outputContinue();
});
