#!/bin/bash
# SessionStart Hook - Auto-start Knowledge Tree Daemon
#
# Starts the tree daemon for the current project directory.
# The daemon watches for file changes and updates .claude/knowledge-tree.json.

# Get project directory from hook input or use current working directory
PROJECT_DIR="${PWD}"

# Get OPC directory from environment
OPC_DIR="${CLAUDE_OPC_DIR:-$HOME/continuous-claude/opc}"

# Check if daemon script exists
DAEMON_SCRIPT="$OPC_DIR/scripts/core/tree_daemon.py"
if [ ! -f "$DAEMON_SCRIPT" ]; then
    # Daemon not available, continue silently
    echo '{"result":"continue"}'
    exit 0
fi

# Check if daemon is already running for this project
cd "$OPC_DIR" 2>/dev/null || exit 0
STATUS=$(PYTHONPATH=. uv run python scripts/core/tree_daemon.py --project "$PROJECT_DIR" --status 2>/dev/null)

if [[ "$STATUS" == *"running"* ]]; then
    # Already running, continue
    echo '{"result":"continue"}'
    exit 0
fi

# Start daemon in background (suppress output)
PYTHONPATH=. uv run python scripts/core/tree_daemon.py --project "$PROJECT_DIR" --background >/dev/null 2>&1 &

# Return success
echo '{"result":"continue"}'
