#!/usr/bin/env bash
# Sync script for Continuous Claude
# Syncs shareable files between ~/.claude and continuous-claude/.claude

set -e

# Get script directory (works on Windows Git Bash)
SCRIPT_DIR="$( cd "$( dirname "$0" )" && pwd )"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
REPO_CLAUDE="$REPO_ROOT/.claude"
USER_CLAUDE="$HOME/.claude"

# Colors (works in Git Bash)
RED='\e[31m'
GREEN='\e[32m'
YELLOW='\e[33m'
BLUE='\e[34m'
NC='\e[0m'

# Parse args
DIRECTION="to-repo"
DRY_RUN=false
VERBOSE=false

show_help() {
    echo "Usage: bash $0 [--to-repo|--from-repo] [--dry-run] [--verbose]"
    echo ""
    echo "Options:"
    echo "  --to-repo     Copy from ~/.claude TO continuous-claude/.claude (default)"
    echo "  --from-repo   Copy from continuous-claude/.claude TO ~/.claude"
    echo "  --dry-run     Show what would be copied without copying"
    echo "  --verbose     Show all files being synced"
    echo "  --help        Show this help"
    echo ""
    echo "Shareable files synced:"
    echo "  - hooks/*.sh, hooks/*.py, hooks/src/*.ts, hooks/dist/*.mjs"
    echo "  - rules/*.md, agents/*.md, skills/*/, scripts/*"
    echo ""
    echo "Never synced (personal):"
    echo "  - CLAUDE.md, RULES.md, settings.json, .env, cache/, node_modules/"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --to-repo) DIRECTION="to-repo"; shift ;;
        --from-repo) DIRECTION="from-repo"; shift ;;
        --dry-run) DRY_RUN=true; shift ;;
        --verbose) VERBOSE=true; shift ;;
        --help|-h) show_help; exit 0 ;;
        *) echo -e "${RED}Unknown option: $1${NC}"; show_help; exit 1 ;;
    esac
done

# Set source and destination
if [[ "$DIRECTION" == "to-repo" ]]; then
    SRC="$USER_CLAUDE"
    DST="$REPO_CLAUDE"
    echo -e "${BLUE}Syncing: ~/.claude → continuous-claude/.claude${NC}"
else
    SRC="$REPO_CLAUDE"
    DST="$USER_CLAUDE"
    echo -e "${BLUE}Syncing: continuous-claude/.claude → ~/.claude${NC}"
fi

$DRY_RUN && echo -e "${YELLOW}DRY RUN - no files will be modified${NC}"
echo ""

# Counters
synced=0
skipped=0

# Never sync these patterns
is_never_sync() {
    local file="$1"
    local basename=$(basename "$file")
    local patterns="CLAUDE.md RULES.md .credentials.json .env history.jsonl knowledge-tree.json mcp_config.json settings.json.bak"
    patterns="$patterns cache node_modules backup chrome plugins runtime servers transcripts .tldr .tldrignore"

    for p in $patterns; do
        [[ "$basename" == "$p" ]] && return 0
        [[ "$file" == *"/$p/"* ]] && return 0
    done

    # Pattern matches
    [[ "$basename" == *.pid ]] && return 0
    [[ "$basename" == *.lock ]] && return 0
    [[ "$basename" == tmp* ]] && return 0

    return 1
}

# Sync a directory
sync_dir() {
    local dir="$1"
    local src_dir="$SRC/$dir"
    local dst_dir="$DST/$dir"

    [[ ! -d "$src_dir" ]] && return

    $DRY_RUN || mkdir -p "$dst_dir"

    find "$src_dir" -type f 2>/dev/null | while read -r file; do
        local rel_path="${file#$src_dir/}"
        local dst_file="$dst_dir/$rel_path"

        if is_never_sync "$file"; then
            ((skipped++)) || true
            $VERBOSE && echo -e "${YELLOW}SKIP${NC} $dir/$rel_path"
            continue
        fi

        if $DRY_RUN; then
            echo -e "${GREEN}COPY${NC} $dir/$rel_path"
        else
            mkdir -p "$(dirname "$dst_file")"
            cp "$file" "$dst_file"
            $VERBOSE && echo -e "${GREEN}COPY${NC} $dir/$rel_path"
        fi
        ((synced++)) || true
    done
}

# Sync specific file patterns
sync_files() {
    local pattern="$1"

    for file in $SRC/$pattern; do
        [[ ! -f "$file" ]] && continue

        local rel_path="${file#$SRC/}"
        local dst_file="$DST/$rel_path"

        if is_never_sync "$file"; then
            ((skipped++)) || true
            $VERBOSE && echo -e "${YELLOW}SKIP${NC} $rel_path"
            continue
        fi

        if $DRY_RUN; then
            echo -e "${GREEN}COPY${NC} $rel_path"
        else
            mkdir -p "$(dirname "$dst_file")"
            cp "$file" "$dst_file"
            $VERBOSE && echo -e "${GREEN}COPY${NC} $rel_path"
        fi
        ((synced++)) || true
    done
}

# Sync directories
for dir in hooks/src hooks/dist rules agents skills scripts; do
    sync_dir "$dir"
done

# Sync hook files
for pattern in "hooks/*.sh" "hooks/*.py" "hooks/package.json" "hooks/tsconfig.json" "hooks/CONFIG.md" "hooks/README.md" "hooks/build.sh"; do
    sync_files "$pattern"
done

# Handle settings.json specially - convert paths
if [[ "$DIRECTION" == "to-repo" ]]; then
    settings_src="$USER_CLAUDE/settings.json"
    settings_dst="$REPO_CLAUDE/settings.json"

    if [[ -f "$settings_src" ]]; then
        echo ""
        echo -e "${BLUE}Converting settings.json paths to portable \$HOME format...${NC}"

        if $DRY_RUN; then
            echo -e "${GREEN}CONVERT${NC} settings.json (Windows paths → \$HOME)"
        else
            # Convert Windows paths to $HOME
            # Pattern: C:/Users/username/.claude or C:\Users\username\.claude
            sed -E 's|C:[/\\]+Users[/\\]+[^"/\\]+[/\\]+\.claude|\$HOME/.claude|g' "$settings_src" > "$settings_dst"
            echo -e "${GREEN}CONVERTED${NC} settings.json"
        fi
        ((synced++)) || true
    fi
fi

echo ""
echo -e "${GREEN}Synced: $synced files${NC}"
echo -e "${YELLOW}Skipped: $skipped files${NC}"

$DRY_RUN && echo -e "\n${YELLOW}Re-run without --dry-run to apply changes${NC}"

echo ""
echo "Done!"
