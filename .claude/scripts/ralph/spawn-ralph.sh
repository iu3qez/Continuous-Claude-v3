#!/bin/bash
# spawn-ralph.sh - Spawn a Ralph loop in Docker container
#
# Usage: spawn-ralph.sh <project_path> <story_id> [worktree_name]
#
# This script:
# 1. Creates a git worktree for isolated Ralph work
# 2. Sets up .ralph/ state directory
# 3. Spawns Docker container with proper mounts
# 4. Captures exit status and output
# 5. Cleans up worktree on completion (optional)

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLAUDE_HOME="${CLAUDE_HOME:-$HOME/.claude}"
RALPH_DOCKER_DIR="$CLAUDE_HOME/docker/ralph"
WORKTREE_BASE="../ralph-worktrees"

# Arguments
PROJECT_PATH="${1:-}"
STORY_ID="${2:-}"
WORKTREE_NAME="${3:-ralph-$(date +%Y%m%d-%H%M%S)}"

# Flags
DRY_RUN=false
KEEP_WORKTREE=false
VERBOSE=false

# Parse flags
for arg in "$@"; do
    case $arg in
        --dry-run) DRY_RUN=true ;;
        --keep-worktree) KEEP_WORKTREE=true ;;
        --verbose|-v) VERBOSE=true ;;
    esac
done

log() {
    echo -e "${BLUE}[ralph]${NC} $1"
}

error() {
    echo -e "${RED}[ralph ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[ralph]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[ralph]${NC} $1"
}

usage() {
    cat << EOF
Usage: spawn-ralph.sh <project_path> <story_id> [worktree_name] [flags]

Arguments:
    project_path    Path to the project directory (must be a git repo)
    story_id        Story ID from PRD (e.g., "STORY-001")
    worktree_name   Optional name for the worktree (default: ralph-<timestamp>)

Flags:
    --dry-run       Show what would be done without executing
    --keep-worktree Don't clean up worktree after completion
    --verbose, -v   Show detailed output

Example:
    spawn-ralph.sh ~/Projects/my-app STORY-001 ralph-auth

EOF
}

validate_inputs() {
    if [[ -z "$PROJECT_PATH" ]]; then
        error "Project path required"
        usage
        exit 1
    fi

    if [[ -z "$STORY_ID" ]]; then
        error "Story ID required"
        usage
        exit 1
    fi

    # Convert to absolute path
    PROJECT_PATH=$(cd "$PROJECT_PATH" && pwd)

    if [[ ! -d "$PROJECT_PATH/.git" ]]; then
        error "Project must be a git repository: $PROJECT_PATH"
        exit 1
    fi

    if [[ ! -f "$PROJECT_PATH/.ralph/IMPLEMENTATION_PLAN.md" ]]; then
        warn "No .ralph/IMPLEMENTATION_PLAN.md found - will need to be created"
    fi
}

check_prerequisites() {
    log "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker not found. Install Docker Desktop."
        exit 1
    fi

    # Check Docker is running
    if ! docker info &> /dev/null; then
        error "Docker daemon not running. Start Docker Desktop."
        exit 1
    fi

    # Check Ralph Docker image exists, build if not
    if ! docker images | grep -q "ralph-ralph"; then
        log "Building Ralph Docker image..."
        if [[ "$DRY_RUN" == "true" ]]; then
            log "[DRY RUN] Would build: docker-compose -f $RALPH_DOCKER_DIR/docker-compose.yml build"
        else
            docker-compose -f "$RALPH_DOCKER_DIR/docker-compose.yml" build
        fi
    fi

    # Check PostgreSQL is accessible
    if ! pg_isready -h localhost -p 5432 &> /dev/null; then
        warn "PostgreSQL not accessible on localhost:5432 - learnings may not work"
    fi
}

create_worktree() {
    log "Creating git worktree: $WORKTREE_NAME"

    cd "$PROJECT_PATH"
    WORKTREE_PATH="$WORKTREE_BASE/$WORKTREE_NAME"

    if [[ "$DRY_RUN" == "true" ]]; then
        log "[DRY RUN] Would run: git worktree add -b ralph/$WORKTREE_NAME $WORKTREE_PATH"
        return 0
    fi

    # Create worktree directory if needed
    mkdir -p "$WORKTREE_BASE"

    # Create worktree on new branch
    git worktree add -b "ralph/$WORKTREE_NAME" "$WORKTREE_PATH"

    # Copy .ralph/ state to worktree
    if [[ -d ".ralph" ]]; then
        cp -r .ralph "$WORKTREE_PATH/"
        log "Copied .ralph/ state to worktree"
    fi

    success "Worktree created at: $WORKTREE_PATH"
}

spawn_container() {
    log "Spawning Ralph container for story: $STORY_ID"

    cd "$PROJECT_PATH"
    WORKTREE_PATH="$(pwd)/$WORKTREE_BASE/$WORKTREE_NAME"

    # Build environment
    export WORKSPACE="$WORKTREE_PATH"
    export RALPH_STATE="$WORKTREE_PATH/.ralph"
    export STORY_ID="$STORY_ID"
    export RALPH_PROJECT="$(basename $PROJECT_PATH)"
    export CLAUDE_HOME="$CLAUDE_HOME"

    # Read the prompt template
    PROMPT_FILE="$CLAUDE_HOME/templates/ralph/PROMPT_BUILD.md"
    if [[ ! -f "$PROMPT_FILE" ]]; then
        error "Prompt template not found: $PROMPT_FILE"
        exit 1
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log "[DRY RUN] Would run Docker container with:"
        log "  WORKSPACE=$WORKSPACE"
        log "  STORY_ID=$STORY_ID"
        log "  Prompt: $PROMPT_FILE"
        return 0
    fi

    # Run the container
    log "Starting Ralph loop..."

    docker run --rm \
        --network host \
        -e "ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}" \
        -e "DATABASE_URL=${DATABASE_URL:-postgresql://claude:claude_dev@localhost:5432/continuous_claude}" \
        -e "STORY_ID=$STORY_ID" \
        -e "RALPH_PROJECT=$RALPH_PROJECT" \
        -v "$CLAUDE_HOME/hooks:/home/node/.claude/hooks:ro" \
        -v "$CLAUDE_HOME/settings.json:/home/node/.claude/settings.json:ro" \
        -v "$CLAUDE_HOME/scripts/core:/home/node/.claude/scripts/core:ro" \
        -v "$WORKTREE_PATH:/workspace" \
        -w /workspace \
        -it \
        ralph-ralph \
        claude --dangerously-skip-permissions -p "$(cat $PROMPT_FILE | sed "s/{{STORY_ID}}/$STORY_ID/g")"

    EXIT_STATUS=$?
    return $EXIT_STATUS
}

capture_results() {
    local exit_status=$1
    log "Capturing results (exit status: $exit_status)"

    cd "$PROJECT_PATH"
    WORKTREE_PATH="$WORKTREE_BASE/$WORKTREE_NAME"

    if [[ "$DRY_RUN" == "true" ]]; then
        log "[DRY RUN] Would capture results from $WORKTREE_PATH"
        return 0
    fi

    # Create runs directory if needed
    mkdir -p .ralph/runs

    # Write completion report
    REPORT_FILE=".ralph/runs/${WORKTREE_NAME}-$(date +%Y%m%d-%H%M%S).md"
    cat > "$REPORT_FILE" << EOF
# Ralph Loop Report

**Story:** $STORY_ID
**Worktree:** $WORKTREE_NAME
**Exit Status:** $exit_status
**Completed:** $(date -Iseconds)

## Git Status
\`\`\`
$(cd "$WORKTREE_PATH" && git log --oneline -5 2>/dev/null || echo "No commits")
\`\`\`

## Changes
\`\`\`
$(cd "$WORKTREE_PATH" && git diff --stat HEAD~1 2>/dev/null || echo "No diff available")
\`\`\`
EOF

    log "Report written to: $REPORT_FILE"
}

cleanup_worktree() {
    if [[ "$KEEP_WORKTREE" == "true" ]]; then
        log "Keeping worktree as requested: $WORKTREE_PATH"
        return 0
    fi

    log "Cleaning up worktree..."

    cd "$PROJECT_PATH"

    if [[ "$DRY_RUN" == "true" ]]; then
        log "[DRY RUN] Would remove worktree: $WORKTREE_BASE/$WORKTREE_NAME"
        return 0
    fi

    # Remove worktree
    git worktree remove "$WORKTREE_BASE/$WORKTREE_NAME" --force 2>/dev/null || true

    # Delete the branch
    git branch -D "ralph/$WORKTREE_NAME" 2>/dev/null || true

    success "Worktree cleaned up"
}

main() {
    log "Ralph Spawn Script v1.0"
    log "========================"

    validate_inputs
    check_prerequisites

    if [[ "$DRY_RUN" == "true" ]]; then
        warn "DRY RUN MODE - No changes will be made"
    fi

    create_worktree

    # Spawn container and capture exit status
    set +e
    spawn_container
    EXIT_STATUS=$?
    set -e

    capture_results $EXIT_STATUS

    if [[ $EXIT_STATUS -eq 0 ]]; then
        success "Ralph loop completed successfully!"
        cleanup_worktree
    else
        error "Ralph loop failed with exit status: $EXIT_STATUS"
        warn "Worktree preserved for debugging: $WORKTREE_BASE/$WORKTREE_NAME"
    fi

    return $EXIT_STATUS
}

# Run main
main "$@"
