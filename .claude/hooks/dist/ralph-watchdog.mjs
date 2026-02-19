#!/usr/bin/env node

// src/ralph-watchdog.ts
import { readFileSync as readFileSync2, existsSync as existsSync4 } from "fs";

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
  function log3(level, msg, data) {
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
    debug: (msg, data) => log3("debug", msg, data),
    info: (msg, data) => log3("info", msg, data),
    warn: (msg, data) => log3("warn", msg, data),
    error: (msg, data) => log3("error", msg, data)
  };
}

// src/shared/state-schema.ts
import { existsSync as existsSync3, readFileSync } from "fs";
import { join as join3 } from "path";
var log = createLogger("state-schema");
function readRalphUnifiedState(projectDir) {
  const dir = projectDir || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const statePath = join3(dir, ".ralph", "state.json");
  if (!existsSync3(statePath)) return null;
  try {
    const content = readFileSync(statePath, "utf-8");
    const state = JSON.parse(content);
    if (!state.version || !state.version.startsWith("2.")) {
      log.warn("Ralph unified state has unexpected version", { version: state.version });
      return null;
    }
    return state;
  } catch (err) {
    log.warn("Failed to read Ralph unified state", { error: String(err) });
    return null;
  }
}

// src/ralph-watchdog.ts
var log2 = createLogger("ralph-watchdog");
var STALE_THRESHOLD_MS = 30 * 60 * 1e3;
var STATE_FILES = [
  { baseName: "ralph-state", label: "Ralph" },
  { baseName: "maestro-state", label: "Maestro" }
];
function readStdin() {
  try {
    return readFileSync2(0, "utf-8");
  } catch {
    return "{}";
  }
}
function checkStaleWorkflow(baseName, label, sessionId) {
  try {
    const stateFile = getStatePathWithMigration(baseName, sessionId);
    if (!existsSync4(stateFile)) return null;
    const content = readFileSync2(stateFile, "utf-8");
    const state = JSON.parse(content);
    if (!state.active) return null;
    const lastTime = state.lastActivity || state.activatedAt;
    if (!lastTime) return null;
    const elapsed = Date.now() - lastTime;
    if (elapsed < STALE_THRESHOLD_MS) return null;
    const minutes = Math.round(elapsed / 6e4);
    const storyId = state.storyId || "";
    const taskType = state.taskType || "";
    log2.warn(`Stale ${label} workflow detected`, {
      minutes,
      storyId,
      taskType,
      sessionId
    });
    const details = [storyId, taskType].filter(Boolean).join(", ");
    return `**${label}**${details ? ` (${details})` : ""} \u2014 idle for ${minutes} minutes`;
  } catch {
    return null;
  }
}
async function main() {
  let input = {};
  try {
    input = JSON.parse(readStdin());
  } catch {
  }
  const sessionId = input.session_id;
  const staleWorkflows = [];
  let unifiedRalphChecked = false;
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const unified = readRalphUnifiedState(projectDir);
  if (unified?.session?.active) {
    const lastHeartbeat = unified.session.last_activity || 0;
    const elapsed = Date.now() - lastHeartbeat;
    if (elapsed >= STALE_THRESHOLD_MS) {
      const minutes = Math.round(elapsed / 6e4);
      log2.warn("Stale unified Ralph workflow detected", { minutes, storyId: unified.story_id, sessionId });
      const details = unified.story_id || "";
      staleWorkflows.push(`**Ralph**${details ? ` (${details})` : ""} \u2014 idle for ${minutes} minutes`);
    }
    unifiedRalphChecked = true;
  }
  for (const { baseName, label } of STATE_FILES) {
    if (baseName === "ralph-state" && unifiedRalphChecked) continue;
    const warning = checkStaleWorkflow(baseName, label, sessionId);
    if (warning) staleWorkflows.push(warning);
  }
  if (staleWorkflows.length === 0) {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  const message = [
    "",
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    "\u26A0\uFE0F STALE WORKFLOW DETECTED",
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501",
    "",
    ...staleWorkflows.map((w) => `  ${w}`),
    "",
    "**Actions:**",
    "  - Check for blocked/hung agents",
    '  - Say "cancel ralph" or "cancel maestro" to stop',
    "  - Or continue working (workflow may need manual intervention)",
    "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501"
  ].join("\n");
  console.log(JSON.stringify({ result: "continue", message }));
}
main().catch(() => {
  console.log(JSON.stringify({ result: "continue" }));
});
