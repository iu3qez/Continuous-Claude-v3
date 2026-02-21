/**
 * Pattern Selector
 *
 * Selects appropriate patterns for tasks and validates pattern compositions.
 * Uses a TypeScript compatibility matrix — no Python dependency.
 */

/**
 * All supported orchestration patterns.
 */
export const SUPPORTED_PATTERNS = [
  'swarm',
  'jury',
  'pipeline',
  'generator_critic',
  'hierarchical',
  'map_reduce',
  'blackboard',
  'circuit_breaker',
  'chain_of_responsibility',
  'adversarial',
  'event_driven',
  'consensus',
  'aggregator',
  'broadcast',
] as const;

export type PatternType = (typeof SUPPORTED_PATTERNS)[number];

/**
 * State sharing scope types.
 */
export type ScopeType = 'iso' | 'shared' | 'fed' | 'handoff';

/**
 * Composition operators.
 */
export type OperatorType = ';' | '|' | '+';

/**
 * Result of pattern composition validation.
 */
export interface ValidationResult {
  valid: boolean;
  composition: string;
  errors: string[];
  warnings: string[];
  scopeTrace: string[];
}

/**
 * Result of pattern inference from task description.
 */
export interface PatternInferenceResult {
  pattern: PatternType;
  confidence: number;
  signals: string[];
  needsClarification: boolean;
  clarificationProbe: string | null;
  ambiguityType: string | null;
  alternatives: PatternType[];
  workBreakdown: string;
}

export interface PatternSelection {
  pattern: PatternType;
  confidence: number;
  reason: string;
}

export interface Task {
  description: string;
  complexity: 'low' | 'medium' | 'high';
  parallelizable: boolean;
  requiresValidation: boolean;
}

/**
 * Pattern scope compatibility matrix.
 * Each pattern lists the scopes it supports for composition.
 */
const PATTERN_SCOPES: Record<string, ScopeType[]> = {
  pipeline: ['handoff', 'shared'],
  aggregator: ['handoff', 'shared'],
  swarm: ['iso', 'shared'],
  jury: ['iso'],
  hierarchical: ['shared', 'fed'],
  map_reduce: ['shared', 'fed'],
  blackboard: ['shared'],
  generator_critic: ['shared', 'handoff'],
  circuit_breaker: ['iso', 'shared'],
  chain_of_responsibility: ['handoff'],
  adversarial: ['iso'],
  consensus: ['shared', 'fed'],
  broadcast: ['shared', 'fed'],
  event_driven: ['shared'],
};

/**
 * Keyword-to-pattern inference rules.
 * Each entry: [keywords, pattern, confidence, reason].
 */
const INFERENCE_RULES: Array<[string[], PatternType, number, string]> = [
  [['implement', 'build', 'create', 'add', 'develop'], 'hierarchical', 0.7, 'Coordinated implementation with specialists'],
  [['research', 'investigate', 'explore', 'analyze', 'understand'], 'swarm', 0.7, 'Parallel exploration across sources'],
  [['process', 'stage', 'pipeline', 'transform', 'etl'], 'map_reduce', 0.7, 'Data processing through stages'],
  [['review', 'evaluate', 'judge', 'assess', 'critique'], 'jury', 0.7, 'Independent evaluation and scoring'],
];

/**
 * Validate a single pair of patterns for scope compatibility.
 */
function validatePair(
  patternA: string,
  patternB: string,
  scope: ScopeType,
  operator: OperatorType
): ValidationResult {
  const scopesA = PATTERN_SCOPES[patternA];
  const scopesB = PATTERN_SCOPES[patternB];
  const expr = `${patternA} ${operator}[${scope}] ${patternB}`;

  // Unknown pattern check
  if (!scopesA) {
    return {
      valid: false,
      composition: expr,
      errors: [`Unknown pattern: ${patternA}`],
      warnings: [],
      scopeTrace: [],
    };
  }
  if (!scopesB) {
    return {
      valid: false,
      composition: expr,
      errors: [`Unknown pattern: ${patternB}`],
      warnings: [],
      scopeTrace: [],
    };
  }

  // Scope compatibility check
  if (!scopesA.includes(scope)) {
    return {
      valid: false,
      composition: expr,
      errors: [`Scope mismatch: ${patternA} does not support scope '${scope}' (supports: ${scopesA.join(', ')})`],
      warnings: [],
      scopeTrace: [`${patternA}[${scope}] -> FAIL`],
    };
  }
  if (!scopesB.includes(scope)) {
    return {
      valid: false,
      composition: expr,
      errors: [`Scope mismatch: ${patternB} does not support scope '${scope}' (supports: ${scopesB.join(', ')})`],
      warnings: [],
      scopeTrace: [`${patternB}[${scope}] -> FAIL`],
    };
  }

  return {
    valid: true,
    composition: expr,
    errors: [],
    warnings: [],
    scopeTrace: [`${patternA}[${scope}] -> ${patternB}[${scope}]`],
  };
}

/**
 * Select the best pattern for a given task via keyword matching.
 */
export function selectPattern(task: Task): PatternSelection {
  const desc = task.description.toLowerCase();

  for (const [keywords, pattern, confidence, reason] of INFERENCE_RULES) {
    if (keywords.some(kw => desc.includes(kw))) {
      return { pattern, confidence, reason };
    }
  }

  // Default fallback
  return {
    pattern: 'hierarchical',
    confidence: 0.3,
    reason: 'Coordinated task decomposition with specialists',
  };
}

/**
 * Validate that a composition of patterns is valid.
 *
 * For chains of 3+ patterns, validates pairwise left-to-right.
 *
 * @param patterns - Array of pattern names to compose
 * @param scope - State sharing scope (default: 'handoff')
 * @param operator - Composition operator (default: ';' sequential)
 * @returns ValidationResult with validity, errors, warnings, and trace
 */
export function validateComposition(
  patterns: PatternType[] | string[],
  scope: ScopeType = 'handoff',
  operator: OperatorType = ';'
): ValidationResult {
  if (patterns.length === 0) {
    return {
      valid: true,
      composition: '',
      errors: [],
      warnings: [],
      scopeTrace: [],
    };
  }

  if (patterns.length === 1) {
    const p = patterns[0];
    const scopes = PATTERN_SCOPES[p];
    if (!scopes) {
      return {
        valid: false,
        composition: p,
        errors: [`Unknown pattern: ${p}`],
        warnings: [],
        scopeTrace: [],
      };
    }
    return {
      valid: true,
      composition: p,
      errors: [],
      warnings: [],
      scopeTrace: [],
    };
  }

  // Validate pairwise (left-associative)
  const allWarnings: string[] = [];
  const allTraces: string[] = [];
  let compositionStr = patterns[0];

  for (let i = 0; i < patterns.length - 1; i++) {
    const result = validatePair(patterns[i], patterns[i + 1], scope, operator);

    if (!result.valid) {
      return {
        valid: false,
        composition: compositionStr,
        errors: result.errors,
        warnings: result.warnings,
        scopeTrace: result.scopeTrace,
      };
    }

    allWarnings.push(...result.warnings);
    allTraces.push(...result.scopeTrace);
    compositionStr = result.composition;
  }

  return {
    valid: true,
    composition: compositionStr,
    errors: [],
    warnings: allWarnings,
    scopeTrace: allTraces,
  };
}
