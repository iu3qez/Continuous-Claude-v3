#!/bin/bash
# ClaudeKit Checkpoint System
# Git stash-based checkpoints with claude-checkpoint: prefix

CHECKPOINT_PREFIX="claude-checkpoint:"

get_timestamp() {
    date "+%Y-%m-%d_%H-%M-%S"
}

create_checkpoint() {
    local msg="$1"
    local timestamp=$(get_timestamp)
    local stash_msg

    if [ -n "$msg" ]; then
        stash_msg="$CHECKPOINT_PREFIX $msg ($timestamp)"
    else
        stash_msg="$CHECKPOINT_PREFIX auto-save ($timestamp)"
    fi

    # Check if there are changes to stash
    if [ -z "$(git status --porcelain)" ]; then
        echo "[CHECKPOINT] No changes to checkpoint"
        return
    fi

    # Stash all changes including untracked
    git stash push -u -m "$stash_msg"
    echo "[CHECKPOINT] Created: $stash_msg"
}

list_checkpoints() {
    echo ""
    echo "[CHECKPOINTS]"
    echo "============="
    local stashes=$(git stash list | grep "$CHECKPOINT_PREFIX")
    if [ -n "$stashes" ]; then
        echo "$stashes"
    else
        echo "No checkpoints found"
    fi
    echo ""
}

restore_checkpoint() {
    local index="$1"

    if [ -z "$index" ]; then
        # Find most recent checkpoint
        index=$(git stash list | grep -n "$CHECKPOINT_PREFIX" | head -1 | cut -d: -f1)
        if [ -z "$index" ]; then
            echo "[CHECKPOINT] No checkpoints found to restore"
            return
        fi
        index=$((index - 1))
    fi

    echo "[CHECKPOINT] Restoring stash@{$index}..."
    git stash pop "stash@{$index}"
}

clear_checkpoints() {
    local removed=0

    # Get indices of checkpoints (in reverse order)
    local indices=$(git stash list | grep -n "$CHECKPOINT_PREFIX" | cut -d: -f1 | sort -rn)

    for line_num in $indices; do
        local stash_index=$((line_num - 1))
        git stash drop "stash@{$stash_index}" 2>/dev/null
        removed=$((removed + 1))
    done

    echo "[CHECKPOINT] Cleared $removed checkpoint(s)"
}

# Main execution
case "${1:-create}" in
    create)
        create_checkpoint "$2"
        ;;
    list)
        list_checkpoints
        ;;
    restore)
        restore_checkpoint "$2"
        ;;
    clear)
        clear_checkpoints
        ;;
    *)
        echo "Usage: checkpoint.sh [create|list|restore|clear] [message|index]"
        echo "  create [message] - Create checkpoint with optional message"
        echo "  list            - List all checkpoints"
        echo "  restore [index] - Restore checkpoint (default: most recent)"
        echo "  clear           - Remove all checkpoints"
        ;;
esac
