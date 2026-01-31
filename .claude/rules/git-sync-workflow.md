# Git Sync Workflow: ~/.claude ↔ continuous-claude

## Quick Sync (simple changes)
```bash
bash ~/continuous-claude/scripts/sync-claude.sh --to-repo
cd ~/continuous-claude && git add .claude/ && git status
git commit -m "feat(sync): Description"
git push
```

## When to Branch in ~/.claude

| Scenario | Branch? |
|----------|---------|
| Quick fix, simple skill/rule | No |
| New hook development | Yes |
| Major refactor | Yes |
| Experimental feature | Yes |

## Branching Workflow
```bash
# Start feature
cd ~/.claude && git checkout -b feature/name

# Develop, test, auto-commits capture changes

# Merge when done
git checkout main && git merge feature/name
git branch -d feature/name

# Then sync
bash ~/continuous-claude/scripts/sync-claude.sh --to-repo
```

## Pull from Team
```bash
cd ~/continuous-claude && git pull
bash ~/continuous-claude/scripts/sync-claude.sh --from-repo
```

## Key Commands
| Task | Command |
|------|---------|
| Check branch | `cd ~/.claude && git branch` |
| See local commits | `cd ~/.claude && git log --oneline -5` |
| Abandon feature | `git checkout main && git branch -D feature/name` |
| Compare to main | `git diff main` |
