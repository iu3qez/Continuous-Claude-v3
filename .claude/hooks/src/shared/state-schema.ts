/**
 * State Schema Validation for Claude Code Hooks
 *
 * Validates state objects before use to catch corruption early.
 * Invalid state is logged and treated as absent (fail open).
 *
 * Usage:
 *   import { validateRalphState, validateMaestroState } from './shared/state-schema.js';
 *   const state = JSON.parse(content);
 *   const valid = validateRalphState(state);
 *   if (!valid) return null; // treat as no state
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createLogger } from './logger.js';
import { getStatePathWithMigration } from './session-isolation.js';

const log = createLogger('state-schema');

// ─── Ralph State ─────────────────────────────────────────

export interface RalphState {
  active: boolean;
  storyId: string;
  activatedAt: number;
  lastActivity?: number;
  sessionId?: string;
}

/**
 * Validate a parsed object as RalphState.
 * Returns the typed state if valid, null if invalid.
 */
export function validateRalphState(obj: unknown, sessionId?: string): RalphState | null {
  if (!obj || typeof obj !== 'object') {
    log.warn('Ralph state is not an object', { received: typeof obj, sessionId });
    return null;
  }

  const s = obj as Record<string, unknown>;

  if (typeof s.active !== 'boolean') {
    log.warn('Ralph state missing or invalid "active" field', { value: s.active, sessionId });
    return null;
  }

  if (typeof s.storyId !== 'string' || s.storyId.length === 0) {
    log.warn('Ralph state missing or invalid "storyId" field', { value: s.storyId, sessionId });
    return null;
  }

  if (typeof s.activatedAt !== 'number' || s.activatedAt <= 0) {
    log.warn('Ralph state missing or invalid "activatedAt" field', { value: s.activatedAt, sessionId });
    return null;
  }

  // Optional fields — validate type if present
  if (s.lastActivity !== undefined && typeof s.lastActivity !== 'number') {
    log.warn('Ralph state invalid "lastActivity" field', { value: s.lastActivity, sessionId });
    return null;
  }

  if (s.sessionId !== undefined && typeof s.sessionId !== 'string') {
    log.warn('Ralph state invalid "sessionId" field', { value: s.sessionId, sessionId });
    return null;
  }

  return obj as RalphState;
}

// ─── Maestro State ───────────────────────────────────────

export interface MaestroState {
  active: boolean;
  taskType: 'implementation' | 'research' | 'unknown';
  reconComplete: boolean;
  interviewComplete: boolean;
  planApproved: boolean;
  activatedAt: number;
  lastActivity?: number;
  sessionId?: string;
}

const VALID_TASK_TYPES = ['implementation', 'research', 'unknown'];

/**
 * Validate a parsed object as MaestroState.
 * Returns the typed state if valid, null if invalid.
 */
export function validateMaestroState(obj: unknown, sessionId?: string): MaestroState | null {
  if (!obj || typeof obj !== 'object') {
    log.warn('Maestro state is not an object', { received: typeof obj, sessionId });
    return null;
  }

  const s = obj as Record<string, unknown>;

  if (typeof s.active !== 'boolean') {
    log.warn('Maestro state missing or invalid "active" field', { value: s.active, sessionId });
    return null;
  }

  if (typeof s.taskType !== 'string' || !VALID_TASK_TYPES.includes(s.taskType)) {
    log.warn('Maestro state missing or invalid "taskType" field', { value: s.taskType, sessionId });
    return null;
  }

  for (const field of ['reconComplete', 'interviewComplete', 'planApproved'] as const) {
    if (typeof s[field] !== 'boolean') {
      log.warn(`Maestro state missing or invalid "${field}" field`, { value: s[field], sessionId });
      return null;
    }
  }

  if (typeof s.activatedAt !== 'number' || s.activatedAt <= 0) {
    log.warn('Maestro state missing or invalid "activatedAt" field', { value: s.activatedAt, sessionId });
    return null;
  }

  // Optional fields
  if (s.lastActivity !== undefined && typeof s.lastActivity !== 'number') {
    log.warn('Maestro state invalid "lastActivity" field', { value: s.lastActivity, sessionId });
    return null;
  }

  if (s.sessionId !== undefined && typeof s.sessionId !== 'string') {
    log.warn('Maestro state invalid "sessionId" field', { value: s.sessionId, sessionId });
    return null;
  }

  return obj as MaestroState;
}

// ─── Ralph Unified State (v2) ────────────────────────────

export interface RalphSessionState {
  active: boolean;
  story_id: string;
  activated_at: string;
  last_heartbeat: string;
}

export interface RalphUnifiedState {
  version: string;
  story_id: string;
  session: RalphSessionState;
  tasks: Record<string, unknown>;
  retry_queue: unknown[];
  checkpoints: unknown[];
}

/**
 * Read the unified Ralph state from .ralph/state.json.
 * Returns null if file doesn't exist or is invalid.
 */
export function readRalphUnifiedState(projectDir?: string): RalphUnifiedState | null {
  const dir = projectDir || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const statePath = join(dir, '.ralph', 'state.json');

  if (!existsSync(statePath)) return null;

  try {
    const content = readFileSync(statePath, 'utf-8');
    const state = JSON.parse(content);
    if (!state.version || !state.version.startsWith('2.')) {
      log.warn('Ralph unified state has unexpected version', { version: state.version });
      return null;
    }
    return state as RalphUnifiedState;
  } catch (err) {
    log.warn('Failed to read Ralph unified state', { error: String(err) });
    return null;
  }
}

/**
 * Check if Ralph is active, checking unified state first, then legacy.
 * Returns { active, storyId, source } where source indicates which state file was used.
 */
export function isRalphActive(projectDir?: string, sessionId?: string): { active: boolean; storyId: string; source: string } {
  // Try unified state first
  const unified = readRalphUnifiedState(projectDir);
  if (unified?.session?.active) {
    return { active: true, storyId: unified.story_id, source: 'unified' };
  }

  // Fall back to legacy temp file state
  try {
    const legacyPath = getStatePathWithMigration('ralph-state', sessionId);
    if (existsSync(legacyPath)) {
      const content = readFileSync(legacyPath, 'utf-8');
      const state = JSON.parse(content);
      const valid = validateRalphState(state, sessionId);
      if (valid?.active) {
        return { active: true, storyId: valid.storyId, source: 'legacy' };
      }
    }
  } catch {
    // Legacy check failed, not active
  }

  return { active: false, storyId: '', source: 'none' };
}
