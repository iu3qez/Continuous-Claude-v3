#!/usr/bin/env node

// src/session-start-init-check.ts
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
var TREE_MAX_AGE_SECONDS = 300;
function getOpcDir() {
  return process.env.CLAUDE_OPC_DIR || path.join(process.env.HOME || process.env.USERPROFILE || "", "continuous-claude", "opc");
}
function isTreeStale(projectDir) {
  const treePath = path.join(projectDir, ".claude", "knowledge-tree.json");
  if (!fs.existsSync(treePath)) {
    return true;
  }
  try {
    const stats = fs.statSync(treePath);
    const ageSeconds = (Date.now() - stats.mtimeMs) / 1e3;
    return ageSeconds >= TREE_MAX_AGE_SECONDS;
  } catch {
    return true;
  }
}
function generateTree(projectDir) {
  const opcDir = getOpcDir();
  const lazyTreePath = path.join(opcDir, "scripts", "core", "lazy_tree.py");
  if (!fs.existsSync(lazyTreePath)) {
    const knowledgeTreePath = path.join(opcDir, "scripts", "core", "knowledge_tree.py");
    if (!fs.existsSync(knowledgeTreePath)) {
      return false;
    }
    try {
      execSync(
        `cd "${opcDir}" && uv run python scripts/core/knowledge_tree.py --project "${projectDir}"`,
        { encoding: "utf-8", timeout: 1e4, stdio: ["pipe", "pipe", "pipe"] }
      );
      return true;
    } catch {
      return false;
    }
  }
  try {
    execSync(
      `cd "${opcDir}" && uv run python scripts/core/lazy_tree.py regenerate --project "${projectDir}"`,
      { encoding: "utf-8", timeout: 1e4, stdio: ["pipe", "pipe", "pipe"] }
    );
    return true;
  } catch {
    return false;
  }
}
function isInitialized(projectDir) {
  const treePath = path.join(projectDir, ".claude", "knowledge-tree.json");
  const roadmapPath = path.join(projectDir, "ROADMAP.md");
  return {
    tree: fs.existsSync(treePath),
    roadmap: fs.existsSync(roadmapPath)
  };
}
function hasCodeFiles(projectDir) {
  const codeIndicators = [
    "package.json",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    "requirements.txt",
    "pom.xml",
    "build.gradle",
    "Gemfile",
    "README.md",
    "readme.md",
    ".git"
  ];
  for (const indicator of codeIndicators) {
    if (fs.existsSync(path.join(projectDir, indicator))) {
      return true;
    }
  }
  return false;
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
  const sessionType = data.source || data.type || "startup";
  if (sessionType !== "startup") {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  if (projectDir.includes(".claude") && !projectDir.includes("continuous-claude")) {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  const status = isInitialized(projectDir);
  if (!status.tree || isTreeStale(projectDir)) {
    if (hasCodeFiles(projectDir)) {
      console.error("\u{1F4CA} Generating knowledge tree...");
      const generated = generateTree(projectDir);
      if (generated) {
        console.error("\u2713 Knowledge tree generated");
        status.tree = true;
      } else {
        console.error("\u26A0 Failed to generate knowledge tree");
      }
    }
  }
  if (status.tree && status.roadmap) {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  if (!hasCodeFiles(projectDir)) {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  const missing = [];
  if (!status.roadmap) missing.push("ROADMAP.md");
  if (missing.length === 0) {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  const message = `\u{1F4CB} Project partially initialized. Missing: ${missing.join(", ")}. Run /init-project for full Continuous Claude setup.`;
  console.error(`\u2139 ${message}`);
  const output = {
    result: "continue",
    message
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
  console.error("session-start-init-check error:", err);
  console.log(JSON.stringify({ result: "continue" }));
});
