#!/usr/bin/env node

// src/session-end-extract.ts
import { execSync, spawn } from "child_process";
import * as path from "path";
import * as fs from "fs";
var MIN_TURNS = 10;
function getOpcDir() {
  return process.env.CLAUDE_OPC_DIR || path.join(process.env.HOME || process.env.USERPROFILE || "", "continuous-claude", "opc");
}
function shouldExtract(sessionId, projectDir) {
  const opcDir = getOpcDir();
  const lazyMemoryPath = path.join(opcDir, "scripts", "core", "lazy_memory.py");
  if (!fs.existsSync(lazyMemoryPath)) {
    console.error("lazy_memory.py not found");
    return false;
  }
  try {
    const result = execSync(
      `cd "${opcDir}" && uv run python scripts/core/lazy_memory.py check --session-id "${sessionId}" --project "${projectDir}" --min-turns ${MIN_TURNS} --json`,
      { encoding: "utf-8", timeout: 1e4, stdio: ["pipe", "pipe", "pipe"] }
    );
    const data = JSON.parse(result.trim());
    return data.should_extract === true;
  } catch (err) {
    return true;
  }
}
function extractLearnings(sessionId, projectDir) {
  const opcDir = getOpcDir();
  const lazyMemoryPath = path.join(opcDir, "scripts", "core", "lazy_memory.py");
  if (!fs.existsSync(lazyMemoryPath)) {
    console.error("lazy_memory.py not found, skipping extraction");
    return;
  }
  const child = spawn(
    "uv",
    [
      "run",
      "python",
      "scripts/core/lazy_memory.py",
      "extract",
      "--session-id",
      sessionId,
      "--project",
      projectDir,
      "--max-learnings",
      "10"
    ],
    {
      cwd: opcDir,
      detached: true,
      stdio: "ignore"
    }
  );
  child.unref();
  console.error(`\u2713 Memory extraction started for session ${sessionId.slice(0, 8)}...`);
}
async function main() {
  const input = await readStdin();
  if (!input.trim()) {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  let data;
  try {
    data = JSON.parse(input);
  } catch {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  const sessionId = data.session_id;
  if (!sessionId) {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  if (!shouldExtract(sessionId, projectDir)) {
    console.error(`\u2139 Session too short for extraction (< ${MIN_TURNS} turns)`);
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  extractLearnings(sessionId, projectDir);
  console.log(JSON.stringify({ result: "continue" }));
}
async function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => data += chunk);
    process.stdin.on("end", () => resolve(data));
  });
}
main().catch((err) => {
  console.error("session-end-extract error:", err);
  console.log(JSON.stringify({ result: "continue" }));
});
