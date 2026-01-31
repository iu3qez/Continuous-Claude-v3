#!/usr/bin/env bash
# Sync continuous-claude/.claude/ → ~/.claude/ (forward sync)
# Run after git pull or local edits in continuous-claude

set -e

SCRIPT_DIR="$( cd "$( dirname "$0" )" && pwd )"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
REPO_CLAUDE="$REPO_ROOT/.claude"
ACTIVE_CLAUDE="$HOME/.claude"

DRY_RUN=false
VERBOSE=false
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run) DRY_RUN=true; shift ;;
        --verbose) VERBOSE=true; shift ;;
        --skip-build) SKIP_BUILD=true; shift ;;
        --help|-h)
            echo "Usage: $0 [--dry-run] [--verbose] [--skip-build]"
            echo ""
            echo "Syncs continuous-claude/.claude/ → ~/.claude/"
            echo ""
            echo "Options:"
            echo "  --dry-run     Show what would be copied without copying"
            echo "  --verbose     Show detailed progress"
            echo "  --skip-build  Skip npm build for hooks"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

$VERBOSE && echo "Syncing: $REPO_CLAUDE → $ACTIVE_CLAUDE"

SYNC_DIRS="hooks/src rules agents skills"

NEVER_SYNC="CLAUDE.md RULES.md .env .credentials.json settings.json history.jsonl knowledge-tree.json"

copy_dir() {
    local dir="$1"
    local src_path="$REPO_CLAUDE/$dir"
    local dst_path="$ACTIVE_CLAUDE/$dir"

    [[ ! -d "$src_path" ]] && return 0

    $DRY_RUN || mkdir -p "$dst_path"

    while IFS= read -r src_file; do
        local rel="${src_file#$src_path/}"
        local dst_file="$dst_path/$rel"

        local base=$(basename "$src_file")
        local skip_file=false
        for skip in $NEVER_SYNC; do
            [[ "$base" == "$skip" ]] && skip_file=true && break
        done
        $skip_file && continue

        if $DRY_RUN; then
            echo "Would copy: $dir/$rel"
        else
            mkdir -p "$(dirname "$dst_file")"
            cp "$src_file" "$dst_file"
            $VERBOSE && echo "Copied: $dir/$rel"
        fi
    done < <(find "$src_path" -type f ! -name "*.pid" ! -name "*.lock" ! -path "*/.tldr/*" ! -path "*/node_modules/*" ! -path "*/cache/*" ! -path "*/dist/*" 2>/dev/null)
}

for dir in $SYNC_DIRS; do
    copy_dir "$dir"
done

for pattern in "hooks/*.sh" "hooks/*.py" "hooks/*.mjs" "hooks/*.ps1" "hooks/package.json" "hooks/tsconfig.json"; do
    for src_file in $REPO_CLAUDE/$pattern; do
        [[ ! -f "$src_file" ]] && continue
        rel="${src_file#$REPO_CLAUDE/}"
        dst_file="$ACTIVE_CLAUDE/$rel"

        if $DRY_RUN; then
            echo "Would copy: $rel"
        else
            mkdir -p "$(dirname "$dst_file")"
            cp "$src_file" "$dst_file"
            $VERBOSE && echo "Copied: $rel"
        fi
    done
done

if ! $DRY_RUN && ! $SKIP_BUILD; then
    if [[ -f "$ACTIVE_CLAUDE/hooks/package.json" ]]; then
        echo "Rebuilding hooks..."
        cd "$ACTIVE_CLAUDE/hooks"
        if [[ -f "build.sh" ]]; then
            bash build.sh
        elif command -v npm &> /dev/null; then
            npm run build 2>/dev/null || echo "Warning: Hook build failed"
        fi
    fi
fi

$VERBOSE && echo "Sync complete: continuous-claude → ~/.claude"
