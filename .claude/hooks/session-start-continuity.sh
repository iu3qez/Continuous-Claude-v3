#!/bin/bash
# Session Start Continuity Hook - load continuity ledger
set -e
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR"
cat | node dist/session-start-continuity.mjs
