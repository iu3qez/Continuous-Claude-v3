#!/usr/bin/env node

// src/explore-to-scout.ts
async function main() {
  let input = {};
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  try {
    const rawInput = Buffer.concat(chunks).toString("utf-8").trim();
    if (rawInput) {
      input = JSON.parse(rawInput);
    }
  } catch {
    console.log("{}");
    return;
  }
  const tool = input.tool || input.tool_name;
  const subagentType = input.tool_input?.subagent_type;
  if (tool !== "Task" || subagentType?.toLowerCase() !== "explore") {
    console.log("{}");
    return;
  }
  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `\u{1F504} REDIRECT: Explore \u2192 scout

Per ~/.claude/rules/use-scout-not-explore.md:
- Explore uses Haiku (inaccurate for codebase exploration)
- Scout uses Sonnet with detailed prompt (accurate results)

**Fix:** Change subagent_type from "Explore" to "scout"

Or use tools directly (Grep, Glob, Read) for high-accuracy exploration.`
    }
  };
  console.log(JSON.stringify(output));
}
main().catch(() => {
  console.log("{}");
});
