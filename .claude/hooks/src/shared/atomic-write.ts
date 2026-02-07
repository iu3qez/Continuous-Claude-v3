/**
 * Atomic Write Utilities for Claude Code Hooks
 *
 * Prevents state corruption from:
 * - Crash during write (partial JSON)
 * - Race conditions between terminals (concurrent writes)
 *
 * Strategy:
 * - atomicWriteSync: write to temp file, then rename (atomic on POSIX/NTFS)
 * - acquireLockSync: O_EXCL lock file with stale detection
 * - writeStateWithLock: combined atomic + locked write
 *
 * Usage:
 *   import { writeStateWithLock, readStateWithLock } from './shared/atomic-write.js';
 *   writeStateWithLock(stateFilePath, JSON.stringify(state, null, 2));
 */

import {
  writeFileSync,
  renameSync,
  unlinkSync,
  existsSync,
  openSync,
  closeSync,
  readFileSync,
  statSync,
  constants,
} from 'fs';
import { dirname, basename, join } from 'path';
import { createLogger } from './logger.js';

const log = createLogger('atomic-write');

const LOCK_STALE_MS = 10_000; // Lock older than 10s is considered stale
const LOCK_RETRY_MS = 50;     // Retry interval when waiting for lock
const LOCK_TIMEOUT_MS = 5_000; // Max time to wait for lock

/**
 * Write a file atomically: write to temp, then rename.
 * If the process crashes mid-write, the original file is untouched.
 */
export function atomicWriteSync(filePath: string, content: string): void {
  const dir = dirname(filePath);
  const tmpFile = join(dir, `.${basename(filePath)}.tmp.${process.pid}`);

  try {
    writeFileSync(tmpFile, content, 'utf-8');
    renameSync(tmpFile, filePath);
  } catch (err) {
    // Clean up temp file on failure
    try {
      if (existsSync(tmpFile)) unlinkSync(tmpFile);
    } catch { /* ignore cleanup errors */ }
    throw err;
  }
}

/**
 * Acquire an exclusive lock file.
 * Uses O_EXCL (create-only) flag — fails if lock already exists.
 * Includes stale lock detection: if lock file is older than LOCK_STALE_MS, remove it.
 *
 * @returns true if lock acquired, false if timed out
 */
export function acquireLockSync(filePath: string, timeoutMs: number = LOCK_TIMEOUT_MS): boolean {
  const lockFile = filePath + '.lock';
  const startTime = Date.now();

  while (true) {
    try {
      // O_CREAT | O_EXCL | O_WRONLY — fails if file exists
      const fd = openSync(lockFile, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY);
      // Write PID for debugging
      writeFileSync(fd, `${process.pid}\n${Date.now()}`, 'utf-8');
      closeSync(fd);
      return true;
    } catch (err: any) {
      if (err.code === 'EEXIST') {
        // Lock exists — check if stale
        try {
          const stat = statSync(lockFile);
          if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
            log.warn('Removing stale lock', { lockFile, ageMs: Date.now() - stat.mtimeMs });
            unlinkSync(lockFile);
            continue; // Retry immediately after removing stale lock
          }
        } catch {
          // Lock file disappeared between check and stat — retry
          continue;
        }

        // Lock is fresh — wait and retry
        if (Date.now() - startTime > timeoutMs) {
          log.error('Lock acquisition timed out', { lockFile, timeoutMs });
          return false;
        }

        // Busy wait (synchronous context — no setTimeout available)
        const waitUntil = Date.now() + LOCK_RETRY_MS;
        while (Date.now() < waitUntil) { /* spin */ }
      } else {
        // Unexpected error
        log.error('Lock acquisition failed', { lockFile, error: String(err) });
        return false;
      }
    }
  }
}

/**
 * Release a lock file.
 */
export function releaseLockSync(filePath: string): void {
  const lockFile = filePath + '.lock';
  try {
    if (existsSync(lockFile)) {
      unlinkSync(lockFile);
    }
  } catch (err) {
    log.warn('Failed to release lock', { lockFile, error: String(err) });
  }
}

/**
 * Write state with both locking and atomic write.
 * This is the primary API for hooks writing state files.
 *
 * If the lock cannot be acquired, falls back to direct atomic write
 * (better than losing state entirely).
 */
export function writeStateWithLock(filePath: string, content: string): void {
  const locked = acquireLockSync(filePath);

  try {
    atomicWriteSync(filePath, content);
  } catch (err) {
    log.error('State write failed', { filePath, error: String(err) });
  } finally {
    if (locked) {
      releaseLockSync(filePath);
    }
  }
}

/**
 * Read state with locking to prevent reading mid-write.
 * Falls back to direct read if lock can't be acquired.
 */
export function readStateWithLock(filePath: string): string | null {
  if (!existsSync(filePath)) return null;

  const locked = acquireLockSync(filePath, 2000); // Shorter timeout for reads

  try {
    return readFileSync(filePath, 'utf-8');
  } catch (err) {
    log.error('State read failed', { filePath, error: String(err) });
    return null;
  } finally {
    if (locked) {
      releaseLockSync(filePath);
    }
  }
}
