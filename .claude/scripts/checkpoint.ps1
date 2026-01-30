# ClaudeKit Checkpoint System
# Git stash-based checkpoints with claude-checkpoint: prefix

param(
    [Parameter(Position=0)]
    [string]$Action = "create",

    [Parameter(Position=1)]
    [string]$Message = ""
)

$CHECKPOINT_PREFIX = "claude-checkpoint:"

function Get-Timestamp {
    return Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
}

function Create-Checkpoint {
    param([string]$Msg)

    $timestamp = Get-Timestamp
    $stashMsg = if ($Msg) { "$CHECKPOINT_PREFIX $Msg ($timestamp)" } else { "$CHECKPOINT_PREFIX auto-save ($timestamp)" }

    # Check if there are changes to stash
    $status = git status --porcelain
    if (-not $status) {
        Write-Host "[CHECKPOINT] No changes to checkpoint"
        return
    }

    # Stash all changes including untracked
    git stash push -u -m $stashMsg
    Write-Host "[CHECKPOINT] Created: $stashMsg"
}

function List-Checkpoints {
    Write-Host "`n[CHECKPOINTS]"
    Write-Host "============="
    $stashes = git stash list | Where-Object { $_ -match $CHECKPOINT_PREFIX }
    if ($stashes) {
        $stashes | ForEach-Object { Write-Host $_ }
    } else {
        Write-Host "No checkpoints found"
    }
    Write-Host ""
}

function Restore-Checkpoint {
    param([string]$Index)

    if (-not $Index) {
        # Find most recent checkpoint
        $stashes = git stash list
        $checkpointIndex = -1
        for ($i = 0; $i -lt $stashes.Count; $i++) {
            if ($stashes[$i] -match $CHECKPOINT_PREFIX) {
                $checkpointIndex = $i
                break
            }
        }

        if ($checkpointIndex -eq -1) {
            Write-Host "[CHECKPOINT] No checkpoints found to restore"
            return
        }
        $Index = $checkpointIndex
    }

    Write-Host "[CHECKPOINT] Restoring stash@{$Index}..."
    git stash pop "stash@{$Index}"
}

function Clear-Checkpoints {
    $stashes = git stash list
    $removed = 0

    # Remove from highest index to lowest to avoid index shifting
    for ($i = $stashes.Count - 1; $i -ge 0; $i--) {
        if ($stashes[$i] -match $CHECKPOINT_PREFIX) {
            git stash drop "stash@{$i}" 2>$null
            $removed++
        }
    }

    Write-Host "[CHECKPOINT] Cleared $removed checkpoint(s)"
}

# Main execution
switch ($Action.ToLower()) {
    "create" { Create-Checkpoint -Msg $Message }
    "list" { List-Checkpoints }
    "restore" { Restore-Checkpoint -Index $Message }
    "clear" { Clear-Checkpoints }
    default {
        Write-Host "Usage: checkpoint.ps1 [create|list|restore|clear] [message|index]"
        Write-Host "  create [message] - Create checkpoint with optional message"
        Write-Host "  list            - List all checkpoints"
        Write-Host "  restore [index] - Restore checkpoint (default: most recent)"
        Write-Host "  clear           - Remove all checkpoints"
    }
}
