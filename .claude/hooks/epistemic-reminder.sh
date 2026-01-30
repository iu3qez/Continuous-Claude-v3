#!/bin/bash
# Epistemic Reminder Hook - warns about claims after Grep/Read
set -e
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR"
cat | node dist/epistemic-reminder.mjs
