# Windows Platform Rules

## Never Edit `.claude.json` with the Edit tool [C:10]

Claude Code writes to `~/.claude.json` continuously (session stats, tip counters, feature flag caches, timestamps). The Edit tool will almost always fail with "File has been modified since read."

**Use Node.js atomic read-modify-write instead:**

```bash
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/david.hayes/.claude.json', 'utf8'));
// ... modify data ...
fs.writeFileSync('C:/Users/david.hayes/.claude.json', JSON.stringify(data, null, 2) + '\n');
"
```

This reads, modifies, and writes in a single process — no race window.

## Python is not `python3` on Windows [H:8]

Windows does not have `python3` on PATH. The `python3` command triggers the Microsoft Store alias and fails.

| Platform | Command |
|----------|---------|
| Linux/macOS | `python3` |
| Windows | `python` or `node` (preferred) |

**Rule:** For cross-platform scripts, prefer `node` (always available in Claude Code). For Python specifically, use `python` not `python3`, or use `uv run python` which handles this correctly.

## MCP Servers: `npx` requires `cmd /c` wrapper [H:8]

On Windows, MCP server configs using `npx` directly will fail. Wrap with `cmd /c`:

```json
{
  "command": "cmd",
  "args": ["/c", "npx", "-y", "package-name@latest"]
}
```

NOT:

```json
{
  "command": "npx",
  "args": ["package-name@latest"]
}
```

Claude Code diagnostics will warn about this — fix immediately when seen.

## Git Bash paths require drive letter [H:9]

`/Users/david.hayes/...` does NOT work on Windows Git Bash — it resolves to `C:\Program Files\Git\Users\...` which doesn't exist.

Always use one of these formats:
- `/c/Users/david.hayes/...` (Git Bash native)
- `C:/Users/david.hayes/...` (Windows forward-slash)

| Wrong | Right |
|-------|-------|
| `cd /Users/david.hayes/project` | `cd /c/Users/david.hayes/project` |
| `cd "$HOME/project"` (if HOME unset) | `cd C:/Users/david.hayes/project` |

This is the #1 cause of `Exit code 1` errors across sessions. The `$HOME` variable works when set, but literal paths MUST include the drive letter.

## Parallel Bash commands: verify directory first [H:8]

When running multiple Bash commands in parallel that depend on a directory existing, verify access in a standalone command first. Otherwise one bad path cascades "Sibling tool call errored" to all parallel siblings.

**Pattern:**
1. First call: `ls C:/Users/david.hayes/project` (verify it exists)
2. Then parallel calls that use that directory

**Anti-pattern:** Launching 3 parallel `cd /Users/david.hayes/project && ...` commands — if the path is wrong, all 3 fail with cascade errors, tripling the noise.
