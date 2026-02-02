#!/usr/bin/env node

// src/ralph-delegation-enforcer.ts
import { readFileSync, existsSync as existsSync2, writeFileSync } from "fs";

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

// src/ralph-delegation-enforcer.ts
var STATE_BASE_NAME = "ralph-state";
var STATE_TTL = 12 * 60 * 60 * 1e3;
var TTL_WARNING_THRESHOLD = 0.8;
function getRalphStateFile(sessionId) {
  return getStatePathWithMigration(STATE_BASE_NAME, sessionId);
}
function readRalphState(sessionId) {
  const stateFile = getRalphStateFile(sessionId);
  if (!existsSync2(stateFile)) {
    return null;
  }
  try {
    const content = readFileSync(stateFile, "utf-8");
    const state = JSON.parse(content);
    const lastTime = state.lastActivity || state.activatedAt;
    const elapsed = Date.now() - lastTime;
    if (elapsed > STATE_TTL) {
      return null;
    }
    if (elapsed > STATE_TTL * TTL_WARNING_THRESHOLD) {
      const remainingHours = ((STATE_TTL - elapsed) / (60 * 60 * 1e3)).toFixed(1);
      console.error(`[Ralph] Warning: Session expiring in ${remainingHours}h. Activity will extend TTL.`);
    }
    return state;
  } catch (err) {
    console.error(`[Ralph] State file corrupted or invalid: ${err}. Enforcement remains active.`);
    return null;
  }
}
function updateHeartbeat(sessionId) {
  const stateFile = getRalphStateFile(sessionId);
  if (!existsSync2(stateFile)) return;
  try {
    const content = readFileSync(stateFile, "utf-8");
    const state = JSON.parse(content);
    state.lastActivity = Date.now();
    writeFileSync(stateFile, JSON.stringify(state, null, 2));
  } catch {
  }
}
function readStdin() {
  return readFileSync(0, "utf-8");
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
    const state = readRalphState(sessionId);
    if (!state || !state.active) {
      makeAllowOutput();
      return;
    }
    updateHeartbeat(sessionId);
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
  Story: ${state.storyId}
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
  Story: ${state.storyId}
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
  Story: ${state.storyId}
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
