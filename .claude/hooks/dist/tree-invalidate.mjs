#!/usr/bin/env node

// src/tree-invalidate.ts
import * as fs from "fs";
import * as path from "path";
var SIGNIFICANT_FILES = /* @__PURE__ */ new Set([
  "README.md",
  "readme.md",
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "ROADMAP.md",
  "CLAUDE.md",
  "tsconfig.json",
  "docker-compose.yml",
  "Dockerfile"
]);
var SIGNIFICANT_DIRS = /* @__PURE__ */ new Set([
  "src",
  "lib",
  "components",
  "pages",
  "api",
  "routes",
  "models",
  "services",
  "hooks",
  "skills",
  "agents"
]);
function isSignificantFile(filePath) {
  const fileName = path.basename(filePath);
  const dirName = path.dirname(filePath).split(path.sep).pop() || "";
  if (SIGNIFICANT_FILES.has(fileName)) {
    return true;
  }
  if (SIGNIFICANT_DIRS.has(dirName)) {
    return true;
  }
  const ext = path.extname(fileName);
  if ((ext === ".ts" || ext === ".py") && !filePath.includes("node_modules")) {
    const depth = filePath.split(path.sep).length;
    if (depth <= 4) {
      return true;
    }
  }
  return false;
}
function invalidateTree(projectDir) {
  const treePath = path.join(projectDir, ".claude", "knowledge-tree.json");
  if (fs.existsSync(treePath)) {
    try {
      fs.unlinkSync(treePath);
      return true;
    } catch {
      return false;
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
  if (!["Write", "Edit"].includes(data.tool_name)) {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  if (data.tool_result?.success === false) {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  const filePath = data.tool_input?.file_path;
  if (!filePath) {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  if (!isSignificantFile(filePath)) {
    console.log(JSON.stringify({ result: "continue" }));
    return;
  }
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const invalidated = invalidateTree(projectDir);
  if (invalidated) {
    console.error(`\u2713 Knowledge tree invalidated (${path.basename(filePath)} changed)`);
  }
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
  console.error("tree-invalidate error:", err);
  console.log(JSON.stringify({ result: "continue" }));
});
