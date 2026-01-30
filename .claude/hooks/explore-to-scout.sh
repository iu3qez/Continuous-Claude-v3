#!/bin/bash
# Explore to Scout Redirect Hook
# Intercepts Task(Explore) → redirects to scout (Sonnet)
set -e
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR"
cat | node dist/explore-to-scout.js
