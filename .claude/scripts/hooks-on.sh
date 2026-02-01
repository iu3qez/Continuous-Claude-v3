#!/bin/bash
# Restore full hooks configuration
cd ~/.claude
cp settings.json.full settings.json
echo "✓ Hooks restored from settings.json.full"
