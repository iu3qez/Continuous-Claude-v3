# Dangerous Mode Skill

## Activation
- `/dangerous` | `/skip` | `/spawn-dangerous` commands
- "dangerous mode" | "skip permissions" context
- `/skill:dangerous-mode` explicit

## Iron Law
NEVER use dangerous mode on production systems, shared computers, or with sensitive data.

---

## Available Commands

| Command | Purpose | Effect |
|---------|---------|--------|
| `/skip` | Quick restart | Replaces current session with dangerous mode |
| `/spawn-dangerous` | New window | Opens new dangerous session, keeps current |
| `/dangerous` | Full guide | Shows complete implementation with warnings |

---

## Quick Usage

### `/skip` (Fastest)
```bash
echo 🚨 RESTARTING CLAUDE IN DANGEROUS MODE...
set CLAUDE_CODE_GIT_BASH_PATH=C:\Users\david.hayes\AppData\Local\Programs\Git\bin\bash.exe
claude --dangerously-skip-permissions
```

### `/spawn-dangerous` (New Window)
```bash
start cmd /k "set CLAUDE_CODE_GIT_BASH_PATH=C:\Users\david.hayes\AppData\Local\Programs\Git\bin\bash.exe && echo 🚨 DANGEROUS MODE ACTIVE && claude --dangerously-skip-permissions"
```

---

## When to Use

**Safe Scenarios:**
- Personal development projects
- Isolated test environments
- Rapid prototyping sessions
- Automated testing workflows

**Never Use:**
- Production systems
- Shared computers
- Systems with sensitive data
- Unknown or untrusted projects

---

## Workflow Patterns

### Quick Switch
1. Type `/skip` and press Enter
2. Copy and execute the provided command
3. Claude restarts in dangerous mode

### Multi-Session
1. Keep main Claude session for planning/research
2. Use `/spawn-dangerous` for rapid implementation
3. Switch between sessions as needed

---

## Troubleshooting

**Command Not Found:**
- Ensure commands are in `~/.claude/commands/`
- Restart Claude Code to refresh command registry

**Git Bash Path Issues:**
- Verify Git installation path
- Update path in command files if Git installed elsewhere
- Test with: `where bash`

**Permission Errors:**
- Run Command Prompt as Administrator if needed
- Check Windows execution policy
- Verify Claude Code installation: `claude --version`

---

**REMEMBER**: Dangerous mode bypasses ALL safety checks. Use responsibly.
