---
name: agent-browser
description: Browser automation using Vercel's agent-browser CLI. Use when you need to interact with web pages, fill forms, take screenshots, or scrape data. Uses Bash commands with ref-based element selection. Triggers on "browse website", "fill form", "click button", "take screenshot", "scrape page", "web automation".
---

# agent-browser: CLI Browser Automation

Vercel's headless browser automation CLI designed for AI agents. Uses ref-based selection (@e1, @e2) from accessibility snapshots.

## Windows Setup

The official Rust CLI has daemon startup issues on Windows (GitHub #89, #90). A Node.js workaround (`ab`) bypasses this:

```powershell
# Use 'ab' command (fast Node.js wrapper)
ab open https://example.com
ab snapshot -i
ab click '@e1'      # Quote the @ symbol in PowerShell!
ab close
```

**Performance:** ~1s per command (first command ~4s for daemon startup)

**From Bash environments (git bash, WSL):**
```bash
powershell.exe -Command "ab open https://example.com"
powershell.exe -Command "ab click '@e1'"
```

**Location:** `%APPDATA%\npm\node_modules\agent-browser\bin\ab-cli.mjs`

> **PowerShell Note:** Always quote `@e1` as `'@e1'` - the `@` symbol is special in PowerShell.

## Setup Check

```powershell
# Windows: Check ab wrapper
ab --help

# Linux/Mac: Check agent-browser
command -v agent-browser && agent-browser --help
```

### Install if needed

```bash
npm install -g agent-browser
agent-browser install  # Downloads Chromium (Linux/Mac)
```

> **Note:** On Windows, use `ab` command. On Linux/Mac, use `agent-browser`.

## Core Workflow

**The snapshot + ref pattern is optimal for LLMs:**

1. **Navigate** to URL
2. **Snapshot** to get interactive elements with refs
3. **Interact** using refs (@e1, @e2, etc.)
4. **Re-snapshot** after navigation or DOM changes

```bash
# Step 1: Open URL
agent-browser open https://example.com

# Step 2: Get interactive elements with refs
agent-browser snapshot -i --json

# Step 3: Interact using refs
agent-browser click @e1
agent-browser fill @e2 "search query"

# Step 4: Re-snapshot after changes
agent-browser snapshot -i
```

## Key Commands

### Navigation

```bash
agent-browser open <url>       # Navigate to URL
agent-browser back             # Go back
agent-browser forward          # Go forward
agent-browser reload           # Reload page
agent-browser close            # Close browser
```

### Snapshots (Essential for AI)

```bash
agent-browser snapshot              # Full accessibility tree
agent-browser snapshot -i           # Interactive elements only (recommended)
agent-browser snapshot -i --json    # JSON output for parsing
agent-browser snapshot -c           # Compact (remove empty elements)
agent-browser snapshot -d 3         # Limit depth
```

### Interactions

```bash
agent-browser click @e1                    # Click element
agent-browser dblclick @e1                 # Double-click
agent-browser fill @e1 "text"              # Clear and fill input
agent-browser type @e1 "text"              # Type without clearing
agent-browser press Enter                  # Press key
agent-browser hover @e1                    # Hover element
agent-browser check @e1                    # Check checkbox
agent-browser uncheck @e1                  # Uncheck checkbox
agent-browser select @e1 "option"          # Select dropdown option
agent-browser scroll down 500              # Scroll (up/down/left/right)
agent-browser scrollintoview @e1           # Scroll element into view
```

### Get Information

```bash
agent-browser get text @e1          # Get element text
agent-browser get html @e1          # Get element HTML
agent-browser get value @e1         # Get input value
agent-browser get attr href @e1     # Get attribute
agent-browser get title             # Get page title
agent-browser get url               # Get current URL
agent-browser get count "button"    # Count matching elements
```

### Screenshots & PDFs

```bash
agent-browser screenshot                      # Viewport screenshot
agent-browser screenshot --full               # Full page
agent-browser screenshot output.png           # Save to file
agent-browser screenshot --full output.png    # Full page to file
agent-browser pdf output.pdf                  # Save as PDF
```

### Wait

```bash
agent-browser wait @e1              # Wait for element (selector)
agent-browser wait "text"           # Wait for text to appear
```

> **Note:** Timed waits (`wait 2000`) may not work reliably. Use element/text waits or re-snapshot loops instead.

## Semantic Locators (Alternative to Refs)

```bash
agent-browser find role button click --name "Submit"
agent-browser find text "Sign up" click
agent-browser find label "Email" fill "user@example.com"
agent-browser find placeholder "Search..." fill "query"
```

## Sessions (Parallel Browsers)

```bash
# Run multiple independent browser sessions
agent-browser --session browser1 open https://site1.com
agent-browser --session browser2 open https://site2.com

# List active sessions
agent-browser session list
```

## Examples

### Login Flow

```bash
agent-browser open https://app.example.com/login
agent-browser snapshot -i
# Output shows: textbox "Email" [ref=e1], textbox "Password" [ref=e2], button "Sign in" [ref=e3]
agent-browser fill @e1 "user@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser wait 2000
agent-browser snapshot -i  # Verify logged in
```

### Search and Extract

```bash
agent-browser open https://news.ycombinator.com
agent-browser snapshot -i --json
# Parse JSON to find story links
agent-browser get text @e12  # Get headline text
agent-browser click @e12     # Click to open story
```

### Form Filling

```bash
agent-browser open https://forms.example.com
agent-browser snapshot -i
agent-browser fill @e1 "John Doe"
agent-browser fill @e2 "john@example.com"
agent-browser select @e3 "United States"
agent-browser check @e4  # Agree to terms
agent-browser click @e5  # Submit button
agent-browser screenshot confirmation.png
```

### Debug Mode

```bash
# Run with visible browser window
agent-browser --headed open https://example.com
agent-browser --headed snapshot -i
agent-browser --headed click @e1
```

## JSON Output

Add `--json` for structured output:

```bash
agent-browser snapshot -i --json
```

Returns:
```json
{
  "success": true,
  "data": {
    "refs": {
      "e1": {"name": "Submit", "role": "button"},
      "e2": {"name": "Email", "role": "textbox"}
    },
    "snapshot": "- button \"Submit\" [ref=e1]\n- textbox \"Email\" [ref=e2]"
  }
}
```

## vs claude-in-chrome (MCP)

| Feature | ab (CLI) | claude-in-chrome (MCP) |
|---------|----------|------------------------|
| Speed | ~1s/cmd | ~1-2s/cmd |
| Interface | PowerShell/Bash | MCP tools |
| Selection | `'@e1'` | `ref_1` |
| Output | Text/JSON | Tool responses |
| Parallel | Sessions | Tabs |
| GIF recording | No | Yes |
| Visual debugging | No (headless) | Yes |
| Console/Network | Yes | Yes |

### Decision Framework

```
Is this CI/CD or headless server?
├─ YES → ab (no browser window needed)
└─ NO → Do you need to see the browser?
        ├─ YES → claude-in-chrome
        └─ NO → Do you need GIF recording?
                ├─ YES → claude-in-chrome
                └─ NO → Either works (prefer ab for scripting)
```

**Use ab when:**
- Headless/CI/CD environments
- Shell scripting and chaining
- Parallel sessions needed
- Simple scrape/fill/submit tasks

**Use claude-in-chrome when:**
- Need to see what's happening
- Recording demos (GIF)
- Complex multi-tab workflows
- Debugging automation issues
