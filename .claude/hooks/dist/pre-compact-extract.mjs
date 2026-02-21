#!/usr/bin/env node

// src/pre-compact-extract.ts
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
function getOpcDir() {
  return process.env.CLAUDE_OPC_DIR || path.join(process.env.HOME || process.env.USERPROFILE || "", "continuous-claude", "opc");
}
function getStateFilePath(projectDir) {
  return path.join(projectDir, ".claude", "extraction-state.json");
}
function loadState(stateFile) {
  if (!fs.existsSync(stateFile)) {
    return { last_extracted_line: 0, recent_hashes: [] };
  }
  try {
    const data = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
    return {
      last_extracted_line: data.last_extracted_line || 0,
      recent_hashes: data.recent_hashes || []
    };
  } catch {
    return { last_extracted_line: 0, recent_hashes: [] };
  }
}
function runBackgroundExtraction(transcriptPath, sessionId, startLine, stateFile, projectDir) {
  const opcDir = getOpcDir();
  const extractScript = path.join(opcDir, "scripts", "core", "incremental_extract.py");
  if (!fs.existsSync(extractScript)) {
    console.error(`incremental_extract.py not found at ${extractScript}`);
    return false;
  }
  try {
    const child = spawn("uv", [
      "run",
      "python",
      "scripts/core/incremental_extract.py",
      "--transcript",
      transcriptPath,
      "--session-id",
      sessionId,
      "--start-line",
      startLine.toString(),
      "--state-file",
      stateFile,
      "--project-dir",
      projectDir,
      "--max-learnings",
      "5",
      "--json"
    ], {
      cwd: opcDir,
      detached: true,
      stdio: "ignore",
      env: { ...process.env, PYTHONPATH: opcDir }
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}
async function main() {
  const input = await readStdin();
  if (!input.trim()) {
    console.log(JSON.stringify({ continue: true }));
    return;
  }
  let data;
  try {
    data = JSON.parse(input);
  } catch {
    console.log(JSON.stringify({ continue: true }));
    return;
  }
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const sessionId = data.session_id;
  const transcriptPath = data.transcript_path;
  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    const output2 = {
      continue: true,
      systemMessage: "[PreCompact] No transcript available for extraction"
    };
    console.log(JSON.stringify(output2));
    return;
  }
  const stateFile = getStateFilePath(projectDir);
  const state = loadState(stateFile);
  const COOLDOWN_MS = 5 * 60 * 1e3;
  const stateWithMeta = state;
  if (stateWithMeta.last_launched && Date.now() - stateWithMeta.last_launched < COOLDOWN_MS) {
    console.log(JSON.stringify({ continue: true, systemMessage: "[PreCompact:L0] Cooldown active, skipping extraction" }));
    return;
  }
  try {
    const stateData = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, "utf-8")) : {};
    stateData.last_launched = Date.now();
    fs.writeFileSync(stateFile, JSON.stringify(stateData));
  } catch {
  }
  const launched = runBackgroundExtraction(
    transcriptPath,
    sessionId,
    state.last_extracted_line,
    stateFile,
    projectDir
  );
  const message = launched ? "[PreCompact:L0] Memory extraction launched (background)" : "[PreCompact:L0] Memory extraction unavailable";
  const output = {
    continue: true,
    systemMessage: message
  };
  console.log(JSON.stringify(output));
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
  console.error("pre-compact-extract error:", err);
  console.log(JSON.stringify({ continue: true }));
});
