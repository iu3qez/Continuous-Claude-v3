#!/usr/bin/env node

// src/session-start-init-check.ts
import * as fs from "fs";
import * as path from "path";
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
  if (projectDir.includes(".claude") || projectDir.includes("continuous-claude")) {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  const status = isInitialized(projectDir);
  if (status.tree && status.roadmap) {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  if (!hasCodeFiles(projectDir)) {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  const missing = [];
  if (!status.tree) missing.push("knowledge-tree.json");
  if (!status.roadmap) missing.push("ROADMAP.md");
  const message = `\u{1F4CB} Project not initialized. Missing: ${missing.join(", ")}. Run /init-project for Continuous Claude setup.`;
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
