#!/bin/bash
# Disable UserPromptSubmit and SessionStart hooks for fast startup
cd ~/.claude
# Use jq to empty the hook arrays while preserving everything else
jq '.hooks.UserPromptSubmit = [] | .hooks.SessionStart = []' settings.json.full > settings.json.tmp && mv settings.json.tmp settings.json
echo "✓ Hooks disabled (UserPromptSubmit + SessionStart emptied)"
