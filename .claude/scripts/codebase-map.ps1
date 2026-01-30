# ClaudeKit Codebase Map Generator
# Generates structured codebase overview for Claude context

param(
    [Parameter(Position=0)]
    [string]$OutputPath = ".claude/CODEBASE_MAP.md",

    [Parameter(Position=1)]
    [string]$ProjectRoot = ".",

    [switch]$Minimal,
    [switch]$Full
)

function Get-ProjectType {
    param([string]$Root)

    $types = @()
    if (Test-Path "$Root/package.json") { $types += "node" }
    if ((Test-Path "$Root/requirements.txt") -or (Test-Path "$Root/pyproject.toml")) { $types += "python" }
    if (Test-Path "$Root/Cargo.toml") { $types += "rust" }
    if (Test-Path "$Root/go.mod") { $types += "go" }
    if (Test-Path "$Root/*.sln") { $types += "dotnet" }
    return $types -join ", "
}

function Get-DirectoryTree {
    param(
        [string]$Path,
        [int]$Depth = 3,
        [int]$CurrentDepth = 0,
        [string]$Prefix = ""
    )

    if ($CurrentDepth -ge $Depth) { return @() }

    $output = @()
    $items = Get-ChildItem -Path $Path -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notmatch '^(node_modules|\.git|__pycache__|\.next|dist|build|\.venv|venv|coverage|\.pytest_cache)$' } |
        Sort-Object { -not $_.PSIsContainer }, Name

    foreach ($item in $items) {
        $isLast = $item -eq $items[-1]
        $connector = if ($isLast) { "+-- " } else { "|-- " }
        $childPrefix = if ($isLast) { "    " } else { "|   " }

        if ($item.PSIsContainer) {
            $output += "$Prefix$connector$($item.Name)/"
            $output += Get-DirectoryTree -Path $item.FullName -Depth $Depth -CurrentDepth ($CurrentDepth + 1) -Prefix "$Prefix$childPrefix"
        } else {
            $output += "$Prefix$connector$($item.Name)"
        }
    }
    return $output
}

function Get-FileStats {
    param([string]$Root)

    $extensions = @{}
    $totalFiles = 0
    $totalLines = 0

    Get-ChildItem -Path $Root -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.DirectoryName -notmatch '(node_modules|\.git|__pycache__|\.next|dist|build|\.venv)' } |
        ForEach-Object {
            $ext = if ($_.Extension) { $_.Extension.ToLower() } else { "(no ext)" }
            if (-not $extensions.ContainsKey($ext)) {
                $extensions[$ext] = @{ count = 0; lines = 0 }
            }
            $extensions[$ext].count++
            $totalFiles++

            if ($_.Extension -match '\.(ts|tsx|js|jsx|py|rs|go|cs|java|md|json|yaml|yml)$') {
                try {
                    $lines = (Get-Content $_.FullName -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
                    $extensions[$ext].lines += $lines
                    $totalLines += $lines
                } catch {}
            }
        }

    return @{
        extensions = $extensions
        totalFiles = $totalFiles
        totalLines = $totalLines
    }
}

function Get-EntryPoints {
    param([string]$Root)

    $entries = @()

    if (Test-Path "$Root/package.json") {
        $pkg = Get-Content "$Root/package.json" -Raw | ConvertFrom-Json
        if ($pkg.main) { $entries += "Main: $($pkg.main)" }
        if ($pkg.scripts) {
            $scripts = $pkg.scripts.PSObject.Properties | Select-Object -First 5
            $entries += "Scripts: $($scripts.Name -join ', ')"
        }
    }

    $commonEntries = @("src/index.ts", "src/index.js", "src/main.ts", "src/main.py", "main.py", "app.py", "index.ts", "index.js")
    foreach ($entry in $commonEntries) {
        if (Test-Path "$Root/$entry") {
            $entries += "Entry: $entry"
            break
        }
    }

    return $entries
}

function Get-KeyDirectories {
    param([string]$Root)

    $keyDirs = @()
    $patterns = @{
        "src" = "Source code"
        "lib" = "Library code"
        "app" = "Application (Next.js/similar)"
        "pages" = "Pages (Next.js)"
        "components" = "UI Components"
        "api" = "API routes"
        "services" = "Services layer"
        "utils" = "Utilities"
        "hooks" = "React hooks"
        "models" = "Data models"
        "controllers" = "Controllers"
        "routes" = "Routes"
        "middleware" = "Middleware"
        "tests" = "Tests"
        "__tests__" = "Tests"
        "test" = "Tests"
        "docs" = "Documentation"
        "scripts" = "Scripts"
        "config" = "Configuration"
        ".claude" = "Claude config"
        "frontend" = "Frontend application"
        "backend" = "Backend application"
    }

    foreach ($dir in $patterns.Keys) {
        if (Test-Path "$Root/$dir") {
            $fileCount = (Get-ChildItem -Path "$Root/$dir" -Recurse -File -ErrorAction SilentlyContinue |
                Where-Object { $_.DirectoryName -notmatch 'node_modules' }).Count
            $keyDirs += "- **$dir/**: $($patterns[$dir]) ($fileCount files)"
        }
    }

    return $keyDirs
}

# Main execution
$Root = Resolve-Path $ProjectRoot
$projectName = Split-Path $Root -Leaf
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$treeDepth = 3
if ($Full) { $treeDepth = 5 }
if ($Minimal) { $treeDepth = 2 }

$treeOutput = Get-DirectoryTree -Path $Root -Depth $treeDepth
$keyDirsOutput = Get-KeyDirectories -Root $Root
$entryPointsOutput = Get-EntryPoints -Root $Root

$map = @"
# Codebase Map: $projectName

> Generated: $timestamp
> Project Type: $(Get-ProjectType -Root $Root)

## Directory Structure

``````
$($treeOutput -join "`n")
``````

## Key Directories

$($keyDirsOutput -join "`n")

## Entry Points

$($entryPointsOutput | ForEach-Object { "- $_" })

"@

if (-not $Minimal) {
    $stats = Get-FileStats -Root $Root
    $topExtensions = $stats.extensions.GetEnumerator() |
        Sort-Object { $_.Value.count } -Descending |
        Select-Object -First 10

    $statsTable = "| Extension | Files | Lines |`n|-----------|-------|-------|`n"
    foreach ($ext in $topExtensions) {
        $statsTable += "| $($ext.Key) | $($ext.Value.count) | $($ext.Value.lines) |`n"
    }

    $map += @"

## File Statistics

- **Total Files**: $($stats.totalFiles)
- **Total Lines**: $($stats.totalLines)

$statsTable
"@
}

$map += @"

---
*Generated by ClaudeKit Codebase Map | Use with caution - may be outdated*
"@

# Ensure output directory exists
$outputDir = Split-Path $OutputPath -Parent
if ($outputDir -and -not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$map | Out-File -FilePath $OutputPath -Encoding UTF8
Write-Host "[CODEBASE MAP] Generated: $OutputPath"
