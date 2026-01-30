#!/usr/bin/env node

// src/telemetry-tracker.ts
import { readFileSync, appendFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
function getTelemetryPath() {
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const telemetryDir = join(homeDir, ".claude", "cache");
  if (!existsSync(telemetryDir)) {
    mkdirSync(telemetryDir, { recursive: true });
  }
  return join(telemetryDir, "skill-telemetry.jsonl");
}
function logEvent(event) {
  const telemetryPath = getTelemetryPath();
  const line = JSON.stringify(event) + "\n";
  appendFileSync(telemetryPath, line, "utf-8");
}
function determineSource(toolInput) {
  const skill = toolInput.skill || "";
  if (skill.startsWith("/")) {
    return "explicit";
  }
  return "llm";
}
async function main() {
  try {
    const input = readFileSync(0, "utf-8");
    const data = JSON.parse(input);
    if (data.tool_name === "Skill") {
      const skillName = data.tool_input?.skill || "unknown";
      const success = data.tool_response?.status !== "error";
      const event = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: data.session_id,
        type: "skill_used",
        name: skillName,
        trigger_source: determineSource(data.tool_input),
        success
      };
      logEvent(event);
    } else if (data.tool_name === "Task") {
      const agentType = data.tool_input?.subagent_type || "unknown";
      const success = data.tool_response?.status !== "error";
      const event = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        session_id: data.session_id,
        type: "agent_spawned",
        name: agentType,
        trigger_source: "llm",
        success
      };
      logEvent(event);
    }
    process.exit(0);
  } catch {
    process.exit(0);
  }
}
main();
