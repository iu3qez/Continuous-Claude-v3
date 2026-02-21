#!/usr/bin/env node

// src/ralph-delegation-enforcer.ts
import { readFileSync as readFileSync4, existsSync as existsSync6 } from "fs";
import { join as join6 } from "path";
import { spawnSync } from "child_process";

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
import { existsSync as existsSync4, readFileSync as readFileSync2 } from "fs";
import { join as join4 } from "path";
var log2 = createLogger("state-schema");
function validateRalphState(obj, sessionId) {
  if (!obj || typeof obj !== "object") {
    log2.warn("Ralph state is not an object", { received: typeof obj, sessionId });
    return null;
  }
  const s = obj;
  if (typeof s.active !== "boolean") {
    log2.warn('Ralph state missing or invalid "active" field', { value: s.active, sessionId });
    return null;
  }
  if (typeof s.storyId !== "string" || s.storyId.length === 0) {
    log2.warn('Ralph state missing or invalid "storyId" field', { value: s.storyId, sessionId });
    return null;
  }
  if (typeof s.activatedAt !== "number" || s.activatedAt <= 0) {
    log2.warn('Ralph state missing or invalid "activatedAt" field', { value: s.activatedAt, sessionId });
    return null;
  }
  if (s.lastActivity !== void 0 && typeof s.lastActivity !== "number") {
    log2.warn('Ralph state invalid "lastActivity" field', { value: s.lastActivity, sessionId });
    return null;
  }
  if (s.sessionId !== void 0 && typeof s.sessionId !== "string") {
    log2.warn('Ralph state invalid "sessionId" field', { value: s.sessionId, sessionId });
    return null;
  }
  return obj;
}
function readRalphUnifiedState(projectDir) {
  const dir = projectDir || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const statePath = join4(dir, ".ralph", "state.json");
  if (!existsSync4(statePath)) return null;
  try {
    const content = readFileSync2(statePath, "utf-8");
    const state = JSON.parse(content);
    if (!state.version || !state.version.startsWith("2.")) {
      log2.warn("Ralph unified state has unexpected version", { version: state.version });
      return null;
    }
    return state;
  } catch (err) {
    log2.warn("Failed to read Ralph unified state", { error: String(err) });
    return null;
  }
}
function isRalphActive(projectDir, _sessionId) {
  const unified = readRalphUnifiedState(projectDir);
  if (unified?.session?.active) {
    return { active: true, storyId: unified.story_id, source: "unified" };
  }
  return { active: false, storyId: "", source: "none" };
}

// src/shared/session-activity.ts
import { existsSync as existsSync5, mkdirSync as mkdirSync2, readFileSync as readFileSync3, writeFileSync as writeFileSync2 } from "fs";
import { join as join5 } from "path";
function getHomeDir() {
  return process.env.HOME || process.env.USERPROFILE || "/tmp";
}
function getActivityPath(sessionId) {
  const dir = join5(getHomeDir(), ".claude", "cache", "session-activity");
  try {
    mkdirSync2(dir, { recursive: true });
  } catch {
  }
  return join5(dir, `${sessionId}.json`);
}
function readActivity(sessionId) {
  const filePath = getActivityPath(sessionId);
  try {
    if (!existsSync5(filePath)) {
      return null;
    }
    const raw = readFileSync3(filePath, "utf-8");
    if (!raw.trim()) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function loadOrCreate(sessionId) {
  const existing = readActivity(sessionId);
  if (existing) {
    return existing;
  }
  return {
    session_id: sessionId,
    started_at: (/* @__PURE__ */ new Date()).toISOString(),
    skills: [],
    hooks: []
  };
}
function upsertEntry(entries, name) {
  const existing = entries.find((e) => e.name === name);
  if (existing) {
    existing.count++;
  } else {
    entries.push({
      name,
      first_seen: (/* @__PURE__ */ new Date()).toISOString(),
      count: 1
    });
  }
}
function logHook(sessionId, hookName) {
  const activity = loadOrCreate(sessionId);
  upsertEntry(activity.hooks, hookName);
  const filePath = getActivityPath(sessionId);
  writeFileSync2(filePath, JSON.stringify(activity), { encoding: "utf-8" });
}

// src/ralph-delegation-enforcer.ts
var log3 = createLogger("ralph-delegation-enforcer");
var STATE_BASE_NAME = "ralph-state";
var STATE_TTL = 12 * 60 * 60 * 1e3;
function getRalphStateFile(sessionId) {
  return getStatePathWithMigration(STATE_BASE_NAME, sessionId);
}
function updateHeartbeat(sessionId) {
  const stateFile = getRalphStateFile(sessionId);
  if (!existsSync6(stateFile)) return;
  try {
    const content = readStateWithLock(stateFile);
    if (!content) return;
    const state = validateRalphState(JSON.parse(content));
    if (!state) return;
    state.lastActivity = Date.now();
    writeStateWithLock(stateFile, JSON.stringify(state, null, 2));
  } catch {
  }
}
function readStdin() {
  return readFileSync4(0, "utf-8");
}
function makeBlockOutput(reason) {
  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason
    }
  };
  console.log(JSON.stringify(output));
}
function makeAllowOutput() {
  console.log(JSON.stringify({}));
}
function isCodeFile(filePath) {
  const codeExtensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".py",
    ".pyi",
    ".go",
    ".rs",
    ".java",
    ".kt",
    ".scala",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".rb",
    ".php",
    ".swift",
    ".vue",
    ".svelte"
  ];
  return codeExtensions.some((ext) => filePath.endsWith(ext));
}
function isTestCommand(command) {
  const testPatterns = [
    /\bnpm\s+(run\s+)?test/i,
    /\byarn\s+test/i,
    /\bpnpm\s+test/i,
    /\bpytest\b/i,
    /\bgo\s+test\b/i,
    /\bcargo\s+test\b/i,
    /\bjest\b/i,
    /\bvitest\b/i,
    /\bmocha\b/i,
    /\bnpm\s+run\s+lint/i,
    /\bnpm\s+run\s+typecheck/i,
    /\btsc\s+--noEmit/i,
    /\bruff\s+check/i,
    /\bmypy\b/i,
    /\bgolangci-lint/i
  ];
  return testPatterns.some((p) => p.test(command));
}
function isAllowedConfigFile(filePath) {
  const configPatterns = [
    /\.ralph\//,
    /IMPLEMENTATION_PLAN\.md$/,
    /tasks\/.*\.md$/,
    /\.json$/,
    /\.yaml$/,
    /\.yml$/,
    /\.env/,
    /\.gitignore$/,
    /package\.json$/,
    /tsconfig\.json$/,
    /\.md$/
  ];
  return configPatterns.some((p) => p.test(filePath));
}
async function main() {
  try {
    if (Math.random() < 0.01) {
      cleanupOldStateFiles(STATE_BASE_NAME);
    }
    const rawInput = readStdin();
    if (!rawInput.trim()) {
      makeAllowOutput();
      return;
    }
    let input;
    try {
      input = JSON.parse(rawInput);
    } catch {
      makeAllowOutput();
      return;
    }
    const sessionId = input.session_id;
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const ralphStatus = isRalphActive(projectDir, sessionId);
    if (!ralphStatus.active) {
      makeAllowOutput();
      return;
    }
    const storyId = ralphStatus.storyId;
    if (ralphStatus.source === "unified") {
      try {
        const homeDir = process.env.HOME || process.env.USERPROFILE || "";
        const v2Script = join6(homeDir, ".claude", "scripts", "ralph", "ralph-state-v2.py");
        if (existsSync6(v2Script)) {
          spawnSync("python", [v2Script, "-p", projectDir, "session-heartbeat"], {
            encoding: "utf-8",
            timeout: 3e3
          });
        }
      } catch {
      }
    } else {
      updateHeartbeat(sessionId);
    }
    log3.info(`Enforcing delegation: tool=${input.tool_name}`, { storyId, sessionId, source: ralphStatus.source });
    try {
      logHook(sessionId || "", "ralph-delegation-enforcer");
    } catch {
    }
    if (input.tool_name === "Edit") {
      const filePath = input.tool_input.file_path || "";
      if (isAllowedConfigFile(filePath)) {
        makeAllowOutput();
        return;
      }
      if (isCodeFile(filePath)) {
        makeBlockOutput(`
\u{1F6D1} RALPH DELEGATION ENFORCER

Ralph mode is active. Direct code edits are BLOCKED.

**BLOCKED:** Edit on ${filePath}

**INSTEAD:** Delegate to an agent:
\`\`\`
Task(subagent_type: kraken, prompt: |
  Story: ${storyId}
  Task: <what you want to change>
  File: ${filePath}
  ...
)
\`\`\`

Or for quick fixes (<20 lines):
\`\`\`
Task(subagent_type: spark, prompt: ...)
\`\`\`

Ralph orchestrates, agents implement.
`);
        return;
      }
      makeAllowOutput();
      return;
    }
    if (input.tool_name === "Write") {
      const filePath = input.tool_input.file_path || "";
      if (isAllowedConfigFile(filePath)) {
        makeAllowOutput();
        return;
      }
      if (isCodeFile(filePath)) {
        makeBlockOutput(`
\u{1F6D1} RALPH DELEGATION ENFORCER

Ralph mode is active. Direct code writes are BLOCKED.

**BLOCKED:** Write to ${filePath}

**INSTEAD:** Delegate to an agent:
\`\`\`
Task(subagent_type: kraken, prompt: |
  Story: ${storyId}
  Task: Create new file ${filePath}
  Requirements: ...
)
\`\`\`

Ralph orchestrates, agents implement.
`);
        return;
      }
      makeAllowOutput();
      return;
    }
    if (input.tool_name === "Bash") {
      const command = input.tool_input.command || "";
      if (isTestCommand(command)) {
        makeBlockOutput(`
\u{1F6D1} RALPH DELEGATION ENFORCER

Ralph mode is active. Direct test/lint commands are BLOCKED.

**BLOCKED:** ${command}

**INSTEAD:** Delegate to arbiter:
\`\`\`
Task(subagent_type: arbiter, prompt: |
  Story: ${storyId}
  Task: Run tests and verify implementation
  Files: <affected files>
)
\`\`\`

Ralph orchestrates, agents test.
`);
        return;
      }
      makeAllowOutput();
      return;
    }
    makeAllowOutput();
  } catch (err) {
    makeAllowOutput();
  }
}
main();
