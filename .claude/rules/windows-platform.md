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
