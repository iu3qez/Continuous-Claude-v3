#!/usr/bin/env node

// src/maestro-enforcer.ts
import { readFileSync, writeFileSync, existsSync as existsSync2, unlinkSync as unlinkSync2 } from "fs";

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

// src/maestro-enforcer.ts
var STATE_BASE_NAME = "maestro-state";
var STATE_TTL = 4 * 60 * 60 * 1e3;
function getStateFile(sessionId) {
  return getStatePathWithMigration(STATE_BASE_NAME, sessionId);
}
function readState(sessionId) {
  const stateFile = getStateFile(sessionId);
  if (!existsSync2(stateFile)) {
    return null;
  }
  try {
    const content = readFileSync(stateFile, "utf-8");
    const state = JSON.parse(content);
    const lastTime = state.lastActivity || state.activatedAt;
    if (Date.now() - lastTime > STATE_TTL) {
      unlinkSync2(stateFile);
      return null;
    }
    return state;
  } catch {
    return null;
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
async function main() {
  try {
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
    if (input.tool_name !== "Task") {
      makeAllowOutput();
      return;
    }
    const sessionId = input.session_id;
    const state = readState(sessionId);
    if (!state || !state.active) {
      makeAllowOutput();
      return;
    }
    const agentType = input.tool_input.subagent_type?.toLowerCase() || "general-purpose";
    const isScoutAgent = agentType === "scout" || agentType === "explore";
    if (!state.reconComplete) {
      if (isScoutAgent) {
        makeAllowOutput();
        return;
      } else {
        makeBlockOutput(`
\u{1F6D1} MAESTRO WORKFLOW: Recon Phase

Currently in **Codebase Recon** phase.

**ALLOWED:** scout agents only (to explore codebase)
**BLOCKED:** ${agentType} agent

**WHY:** Need to understand the codebase before asking informed questions.

**TO PROCEED:**
1. Use scout agents to explore relevant code
2. Say "recon complete" when done
3. Then conduct discovery interview

Current agent "${agentType}" is blocked until recon complete.
`);
        return;
      }
    }
    if (!state.interviewComplete) {
      makeBlockOutput(`
\u{1F6D1} MAESTRO WORKFLOW: Interview Phase

Recon complete. Now in **Discovery Interview** phase.

**REQUIRED:** Use AskUserQuestion to ask informed questions:
- Based on recon findings
- About scope, approach, constraints
- To clarify requirements

**BLOCKED:** All agents until interview complete.

**TO PROCEED:**
1. Ask discovery questions using AskUserQuestion
2. Say "interview complete" when done
3. Then propose orchestration plan
`);
      return;
    }
    if (!state.planApproved) {
      makeBlockOutput(`
\u{1F6D1} MAESTRO WORKFLOW: Awaiting Approval

Interview complete. Plan presented.

**WAITING FOR:** User to approve the plan.

**BLOCKED:** All agents until user says "yes" or "approve".

**DO NOT spawn agents until explicit approval.**
`);
      return;
    }
    makeAllowOutput();
  } catch (err) {
    makeAllowOutput();
  }
}
main();
