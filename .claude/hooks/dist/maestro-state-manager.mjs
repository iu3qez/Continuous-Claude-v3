#!/usr/bin/env node

// src/maestro-state-manager.ts
import { readFileSync as readFileSync2, existsSync as existsSync4, unlinkSync as unlinkSync3 } from "fs";

// src/shared/output.ts
function outputContinue() {
  console.log(JSON.stringify({ result: "continue" }));
}

// src/shared/session-isolation.ts
import { tmpdir, hostname } from "os";
import { join } from "path";
import { existsSync, readdirSync, statSync, unlinkSync } from "fs";
function getSessionId() {
  if (process.env.CLAUDE_SESSION_ID) {
    return process.env.CLAUDE_SESSION_ID;
  }
  const host = hostname().replace(/[^a-zA-Z0-9]/g, "").substring(0, 8);
  return `${host}-${process.pid}`;
}
function getSessionStatePath(baseName, sessionId) {
  const sid = sessionId || getSessionId();
  const safeSid = sid.replace(/[^a-zA-Z0-9-_]/g, "_").substring(0, 32);
  return join(tmpdir(), `claude-${baseName}-${safeSid}.json`);
}
function getLegacyStatePath(baseName) {
  return join(tmpdir(), `claude-${baseName}.json`);
}
function getStatePathWithMigration(baseName, sessionId) {
  const sessionPath = getSessionStatePath(baseName, sessionId);
  const legacyPath = getLegacyStatePath(baseName);
  if (existsSync(sessionPath)) {
    return sessionPath;
  }
  if (existsSync(legacyPath)) {
    try {
      const stat = statSync(legacyPath);
      const oneHourAgo = Date.now() - 60 * 60 * 1e3;
      if (stat.mtimeMs > oneHourAgo) {
        return legacyPath;
      }
    } catch {
    }
  }
  return sessionPath;
}
function cleanupOldStateFiles(baseName, maxAgeMs = 24 * 60 * 60 * 1e3) {
  const tmpDir = tmpdir();
  const pattern = new RegExp(`^claude-${baseName}-.*\\.json$`);
  let cleaned = 0;
  try {
    const files = readdirSync(tmpDir);
    const now = Date.now();
    for (const file of files) {
      if (!pattern.test(file)) continue;
      const fullPath = join(tmpDir, file);
      try {
        const stat = statSync(fullPath);
        if (now - stat.mtimeMs > maxAgeMs) {
          unlinkSync(fullPath);
          cleaned++;
        }
      } catch {
      }
    }
  } catch {
  }
  return cleaned;
}

// src/shared/logger.ts
import { appendFileSync, existsSync as existsSync2, mkdirSync, statSync as statSync2, renameSync } from "fs";
import { join as join2 } from "path";
import { homedir } from "os";
var LOG_DIR = join2(homedir(), ".claude", "logs");
var LOG_FILE = join2(LOG_DIR, "hooks.log");
var MAX_LOG_SIZE = 5 * 1024 * 1024;
var MIN_LEVEL = process.env.CLAUDE_HOOK_LOG_LEVEL || "info";
var LEVEL_ORDER = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};
function shouldLog(level) {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL];
}
function ensureLogDir() {
  if (!existsSync2(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}
function rotateIfNeeded() {
  try {
    if (existsSync2(LOG_FILE)) {
      const stat = statSync2(LOG_FILE);
      if (stat.size > MAX_LOG_SIZE) {
        const rotated = LOG_FILE + ".1";
        renameSync(LOG_FILE, rotated);
      }
    }
  } catch {
  }
}
function getSessionId2() {
  return process.env.CLAUDE_SESSION_ID || void 0;
}
function writeLog(entry) {
  try {
    ensureLogDir();
    rotateIfNeeded();
    appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
  } catch {
  }
}
function createLogger(hookName) {
  function log4(level, msg, data) {
    if (!shouldLog(level)) return;
    const entry = {
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      level,
      hook: hookName,
      msg,
      sessionId: getSessionId2()
    };
    if (data && Object.keys(data).length > 0) {
      entry.data = data;
    }
    writeLog(entry);
    if (level === "error" || level === "warn") {
      console.error(`[${hookName}] ${level.toUpperCase()}: ${msg}`);
    }
  }
  return {
    debug: (msg, data) => log4("debug", msg, data),
    info: (msg, data) => log4("info", msg, data),
    warn: (msg, data) => log4("warn", msg, data),
    error: (msg, data) => log4("error", msg, data)
  };
}

// src/shared/atomic-write.ts
import {
  writeFileSync,
  renameSync as renameSync2,
  unlinkSync as unlinkSync2,
  existsSync as existsSync3,
  openSync,
  closeSync,
  readFileSync,
  statSync as statSync3,
  constants
} from "fs";
import { dirname, basename as basename2, join as join3 } from "path";
var log = createLogger("atomic-write");
var LOCK_STALE_MS = 1e4;
var LOCK_RETRY_MS = 50;
var LOCK_TIMEOUT_MS = 5e3;
function atomicWriteSync(filePath, content) {
  const dir = dirname(filePath);
  const tmpFile = join3(dir, `.${basename2(filePath)}.tmp.${process.pid}`);
  try {
    writeFileSync(tmpFile, content, "utf-8");
    renameSync2(tmpFile, filePath);
  } catch (err) {
    try {
      if (existsSync3(tmpFile)) unlinkSync2(tmpFile);
    } catch {
    }
    throw err;
  }
}
function acquireLockSync(filePath, timeoutMs = LOCK_TIMEOUT_MS) {
  const lockFile = filePath + ".lock";
  const startTime = Date.now();
  while (true) {
    try {
      const fd = openSync(lockFile, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY);
      writeFileSync(fd, `${process.pid}
${Date.now()}`, "utf-8");
      closeSync(fd);
      return true;
    } catch (err) {
      if (err.code === "EEXIST") {
        try {
          const stat = statSync3(lockFile);
          if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
            log.warn("Removing stale lock", { lockFile, ageMs: Date.now() - stat.mtimeMs });
            unlinkSync2(lockFile);
            continue;
          }
        } catch {
          continue;
        }
        if (Date.now() - startTime > timeoutMs) {
          log.error("Lock acquisition timed out", { lockFile, timeoutMs });
          return false;
        }
        const waitUntil = Date.now() + LOCK_RETRY_MS;
        while (Date.now() < waitUntil) {
        }
      } else {
        log.error("Lock acquisition failed", { lockFile, error: String(err) });
        return false;
      }
    }
  }
}
function releaseLockSync(filePath) {
  const lockFile = filePath + ".lock";
  try {
    if (existsSync3(lockFile)) {
      unlinkSync2(lockFile);
    }
  } catch (err) {
    log.warn("Failed to release lock", { lockFile, error: String(err) });
  }
}
function writeStateWithLock(filePath, content) {
  const locked = acquireLockSync(filePath);
  try {
    atomicWriteSync(filePath, content);
  } catch (err) {
    log.error("State write failed", { filePath, error: String(err) });
  } finally {
    if (locked) {
      releaseLockSync(filePath);
    }
  }
}
function readStateWithLock(filePath) {
  if (!existsSync3(filePath)) return null;
  const locked = acquireLockSync(filePath, 2e3);
  try {
    return readFileSync(filePath, "utf-8");
  } catch (err) {
    log.error("State read failed", { filePath, error: String(err) });
    return null;
  } finally {
    if (locked) {
      releaseLockSync(filePath);
    }
  }
}

// src/shared/state-schema.ts
var log2 = createLogger("state-schema");
var VALID_TASK_TYPES = ["implementation", "research", "unknown"];
function validateMaestroState(obj, sessionId) {
  if (!obj || typeof obj !== "object") {
    log2.warn("Maestro state is not an object", { received: typeof obj, sessionId });
    return null;
  }
  const s = obj;
  if (typeof s.active !== "boolean") {
    log2.warn('Maestro state missing or invalid "active" field', { value: s.active, sessionId });
    return null;
  }
  if (typeof s.taskType !== "string" || !VALID_TASK_TYPES.includes(s.taskType)) {
    log2.warn('Maestro state missing or invalid "taskType" field', { value: s.taskType, sessionId });
    return null;
  }
  for (const field of ["reconComplete", "interviewComplete", "planApproved"]) {
    if (typeof s[field] !== "boolean") {
      log2.warn(`Maestro state missing or invalid "${field}" field`, { value: s[field], sessionId });
      return null;
    }
  }
  if (typeof s.activatedAt !== "number" || s.activatedAt <= 0) {
    log2.warn('Maestro state missing or invalid "activatedAt" field', { value: s.activatedAt, sessionId });
    return null;
  }
  if (s.lastActivity !== void 0 && typeof s.lastActivity !== "number") {
    log2.warn('Maestro state invalid "lastActivity" field', { value: s.lastActivity, sessionId });
    return null;
  }
  if (s.sessionId !== void 0 && typeof s.sessionId !== "string") {
    log2.warn('Maestro state invalid "sessionId" field', { value: s.sessionId, sessionId });
    return null;
  }
  return obj;
}

// src/maestro-state-manager.ts
var log3 = createLogger("maestro-state-manager");
var STATE_BASE_NAME = "maestro-state";
var STATE_TTL = 4 * 60 * 60 * 1e3;
function getStateFile(sessionId) {
  return getStatePathWithMigration(STATE_BASE_NAME, sessionId);
}
function defaultState() {
  return {
    active: false,
    taskType: "unknown",
    reconComplete: false,
    interviewComplete: false,
    planApproved: false,
    activatedAt: 0
  };
}
function readState(sessionId) {
  const stateFile = getStateFile(sessionId);
  if (!existsSync4(stateFile)) {
    return defaultState();
  }
  try {
    const content = readStateWithLock(stateFile);
    if (!content) return defaultState();
    const state = validateMaestroState(JSON.parse(content), sessionId);
    if (!state) return defaultState();
    const lastTime = state.lastActivity || state.activatedAt;
    if (Date.now() - lastTime > STATE_TTL) {
      return defaultState();
    }
    return state;
  } catch (err) {
    log3.error("State file corrupted", { error: String(err), sessionId });
    return defaultState();
  }
}
function writeState(state, sessionId) {
  const stateFile = getStateFile(sessionId);
  try {
    state.lastActivity = Date.now();
    state.sessionId = sessionId;
    writeStateWithLock(stateFile, JSON.stringify(state, null, 2));
  } catch {
  }
}
function clearState(sessionId) {
  const stateFile = getStateFile(sessionId);
  try {
    if (existsSync4(stateFile)) {
      unlinkSync3(stateFile);
    }
  } catch {
  }
}
function readStdin() {
  return readFileSync2(0, "utf-8");
}
var ACTIVATION_PATTERNS = [
  /\b(yes,?\s*)?use\s+maestro\b/i,
  /\borchestrate\s+(this|it)\b/i,
  /\bstart\s+maestro\b/i,
  /\bmaestro\s+mode\b/i,
  /^\/maestro$/i
];
var RECON_COMPLETE_PATTERNS = [
  /\brecon\s+complete\b/i,
  /\bexploration\s+complete\b/i,
  /\bscouting\s+(is\s+)?complete\b/i,
  /\bdone\s+(with\s+)?(recon|exploration|scouting)\b/i
];
var INTERVIEW_COMPLETE_PATTERNS = {
  positive: [
    /^interview\s+complete[\s\.!]*$/i,
    /^discovery\s+complete[\s\.!]*$/i,
    /^done\s+(with\s+)?(interview|questions)[\s\.!]*$/i,
    /\bthe\s+interview\s+is\s+complete\b/i
  ],
  negative: [
    /\?/,
    /\bnot\b/i,
    /\bmore\s+questions\b/i,
    /\bstill\b/i,
    /\bwhen\b/i,
    /\blet\s+me\s+know\b/i,
    /\bshould\b/i,
    /\bsignal\b/i
  ]
};
var IMPLEMENTATION_PATTERNS = [
  /\b(build|create|implement|add|develop|make|write)\b/i,
  /\b(feature|component|service|api|endpoint|module)\b/i,
  /\b(fix|debug|refactor|update|change)\b/i
];
var RESEARCH_PATTERNS = [
  /\b(research|understand|learn|explore|how\s+does|what\s+is)\b/i,
  /\b(best\s+practices|documentation|docs|patterns)\b/i
];
var PLAN_APPROVAL_PATTERNS = {
  positive: [
    /^(yes|approve|approved|proceed|go\s*ahead|looks\s*good|do\s*it|lgtm)[\s,\.!]*$/i,
    /^yes,?\s*(proceed|go\s*ahead|do\s*it|let'?s?\s*(do|go))[\s\.!]*$/i,
    /\bapprove\s+(the\s+)?plan\b/i,
    /\bplan\s+approved\b/i,
    /\bproceed\s+with\s+(the\s+)?plan\b/i
  ],
  negative: [
    /\bbut\b/i,
    /\bhowever\b/i,
    /\bwait\b/i,
    /\bhold\s+on\b/i,
    /\?/,
    /\bfirst\b/i,
    /\bbefore\b/i,
    /\bconcern/i,
    /\bquestion/i,
    /\bmaybe\b/i,
    /\bnot\s+yet\b/i
  ]
};
var CANCEL_PATTERNS = {
  positive: [
    /\bcancel\s+maestro\b/i,
    /\bstop\s+orchestrat/i,
    /\bexit\s+maestro\b/i,
    /\bdisable\s+maestro\b/i
  ],
  negative: [
    /\bdon'?t\b/i,
    /\bdo\s+not\b/i,
    /\bkeep\b/i,
    /\bwait\b/i,
    /\bnot\s+yet\b/i,
    /\bshould\s+i\b/i,
    /\bif\s+(this|it|we|I)\b/i,
    /\bI'?ll\b/i,
    /\?/
  ]
};
function matchesAny(text, patterns) {
  return patterns.some((p) => p.test(text));
}
function matchesPattern(text, patternSet) {
  if (Array.isArray(patternSet)) {
    return matchesAny(text, patternSet);
  }
  if (patternSet.negative && matchesAny(text, patternSet.negative)) {
    return false;
  }
  return matchesAny(text, patternSet.positive);
}
async function main() {
  try {
    if (Math.random() < 0.01) {
      cleanupOldStateFiles(STATE_BASE_NAME);
    }
    const rawInput = readStdin();
    if (!rawInput.trim()) {
      outputContinue();
      return;
    }
    let input;
    try {
      input = JSON.parse(rawInput);
    } catch {
      outputContinue();
      return;
    }
    if (!input.prompt || typeof input.prompt !== "string") {
      outputContinue();
      return;
    }
    const sessionId = input.session_id;
    const prompt = input.prompt.trim();
    const state = readState(sessionId);
    if (matchesPattern(prompt, CANCEL_PATTERNS)) {
      log3.info("Maestro deactivated by user", { sessionId });
      clearState(sessionId);
      console.log(`
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F3BC} MAESTRO DEACTIVATED
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
Maestro orchestration mode disabled.
Returning to normal operation.
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
`);
      outputContinue();
      return;
    }
    if (!state.active && matchesAny(prompt, ACTIVATION_PATTERNS)) {
      const isResearch = matchesAny(prompt, RESEARCH_PATTERNS) && !matchesAny(prompt, IMPLEMENTATION_PATTERNS);
      const taskType = isResearch ? "research" : "implementation";
      log3.info(`Maestro activated: type=${taskType}`, { sessionId });
      writeState({
        active: true,
        taskType,
        reconComplete: isResearch,
        // Research tasks skip recon
        interviewComplete: false,
        planApproved: false,
        activatedAt: Date.now()
      }, sessionId);
      if (isResearch) {
        console.log(`
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F3BC} MAESTRO ACTIVATED (Research Mode)
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

Task Type: **RESEARCH** (external docs, best practices)

**WORKFLOW:**
1. \u23F3 Discovery Interview (CURRENT)
2. \u23F3 Propose Plan
3. \u23F3 Await Approval
4. \u23F3 Execute

**YOUR FIRST ACTION:**
Use AskUserQuestion to clarify:
- What specifically to research?
- What format for findings?
- Any constraints or preferences?

Task tool BLOCKED until interview complete.
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
`);
      } else {
        console.log(`
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F3BC} MAESTRO ACTIVATED (Implementation Mode)
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

Task Type: **IMPLEMENTATION** (coding, building, fixing)

**WORKFLOW:**
1. \u23F3 Codebase Recon (CURRENT) \u2190 scout allowed
2. \u23F3 Discovery Interview
3. \u23F3 Propose Plan
4. \u23F3 Await Approval
5. \u23F3 Execute

**YOUR FIRST ACTION:**
Spawn 1-2 scout agents to understand codebase:
- Existing patterns relevant to task
- File structure and conventions
- Related code that might be affected

Only scout agents allowed. Other agents BLOCKED.
Say "recon complete" when done exploring.
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
`);
      }
      outputContinue();
      return;
    }
    if (state.active) {
      if (!state.reconComplete && matchesAny(prompt, RECON_COMPLETE_PATTERNS)) {
        state.reconComplete = true;
        log3.info("State transition: recon complete", { sessionId });
        writeState(state, sessionId);
        console.log(`
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F3BC} MAESTRO: Recon Complete
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

**WORKFLOW PROGRESS:**
1. \u2705 Codebase Recon
2. \u23F3 Discovery Interview (CURRENT)
3. \u23F3 Propose Plan
4. \u23F3 Await Approval
5. \u23F3 Execute

**YOUR NEXT ACTION:**
Use AskUserQuestion with INFORMED questions based on recon:
- "I found X pattern, should we follow it?"
- "Existing code uses Y approach, continue or change?"
- "This will affect N files, confirm scope?"

Task tool BLOCKED until interview complete.
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
`);
        outputContinue();
        return;
      }
      if (state.reconComplete && !state.interviewComplete && matchesPattern(prompt, INTERVIEW_COMPLETE_PATTERNS)) {
        state.interviewComplete = true;
        log3.info("State transition: interview complete", { sessionId });
        writeState(state, sessionId);
        const step = state.taskType === "research" ? 1 : 2;
        console.log(`
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F3BC} MAESTRO: Interview Complete
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

**WORKFLOW PROGRESS:**
${state.taskType === "implementation" ? "1. \u2705 Codebase Recon\n2. \u2705 Discovery Interview" : "1. \u2705 Discovery Interview"}
${state.taskType === "implementation" ? "3" : "2"}. \u23F3 Propose Plan (CURRENT)
${state.taskType === "implementation" ? "4" : "3"}. \u23F3 Await Approval
${state.taskType === "implementation" ? "5" : "4"}. \u23F3 Execute

**YOUR NEXT ACTION:**
Present orchestration plan to user.
Task tool still BLOCKED until plan approved.
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
`);
        outputContinue();
        return;
      }
      if (state.interviewComplete && !state.planApproved && matchesPattern(prompt, PLAN_APPROVAL_PATTERNS)) {
        state.planApproved = true;
        log3.info("State transition: plan approved", { sessionId });
        writeState(state, sessionId);
        console.log(`
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F3BC} MAESTRO: Plan Approved
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

**WORKFLOW PROGRESS:**
1. \u2705 Discovery Interview
2. \u2705 Propose Plan
3. \u2705 Await Approval
4. \u23F3 Execute (CURRENT)

**Task tool is now UNBLOCKED.**
You may spawn agents to execute the plan.
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
`);
        outputContinue();
        return;
      }
      if (!state.interviewComplete) {
        const looksLikeAnswers = /\b(build|fix|research|refactor|single|module|system|full|code|plan|understanding|all)\b/i.test(prompt) && prompt.length < 200;
        if (looksLikeAnswers) {
          state.interviewComplete = true;
          writeState(state);
          console.log(`
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
\u{1F3BC} MAESTRO: Answers Received
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

Discovery answers received.

**YOUR NEXT ACTION:**
1. Classify task type based on answers
2. Present orchestration plan
3. Wait for approval

Task tool still BLOCKED until plan approved.
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
`);
          outputContinue();
          return;
        }
      }
    }
    outputContinue();
  } catch (err) {
    outputContinue();
  }
}
main();
