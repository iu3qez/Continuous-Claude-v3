#!/bin/bash
# Session Register Hook - cross-terminal coordination
set -e
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR"
cat | node dist/session-register.mjs
