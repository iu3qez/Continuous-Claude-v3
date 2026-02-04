# PageIndex Subsystem

## Overview

PageIndex provides **reasoning-based retrieval** over structured documents using hierarchical tree indexes. Achieves 98.7% accuracy vs ~50% for vector similarity.

## Architecture

```
Query → Tree Outline (titles only, ~500 tokens)
  ↓
LLM Reasoning ("Which nodes relevant?")
  ↓
Node Retrieval (fetch full content)
```

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     PAGEINDEX FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Document → page_index_md.py → Tree JSON                     │
│                                                                  │
│  2. Query → tree_search.py → LLM selects nodes                  │
│                                                                  │
│  3. Nodes → pageindex_service.py → Full content                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Components

| Component | File | Purpose |
|-----------|------|---------|
| Tree Generator | `pageindex/page_index_md.py` | Parse markdown → tree |
| Tree Search | `pageindex/tree_search.py` | LLM-based node selection |
| Claude Adapter | `pageindex/claude_llm.py` | Anthropic API calls |
| CRUD Service | `pageindex/pageindex_service.py` | PostgreSQL storage |
| CLI | `pageindex/cli/pageindex_cli.py` | User commands |

## Database Schema

Table: `pageindex_trees`
```sql
CREATE TABLE pageindex_trees (
    id SERIAL PRIMARY KEY,
    doc_path TEXT NOT NULL UNIQUE,
    project_name TEXT,
    tree_json JSONB NOT NULL,
    content_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## CLI Commands

```bash
# Generate tree for document
cd $CLAUDE_OPC_DIR && uv run python scripts/pageindex/cli/pageindex_cli.py generate <file> --project <name>

# Search indexed documents
cd $CLAUDE_OPC_DIR && uv run python scripts/pageindex/cli/pageindex_cli.py search "<query>" --project <name>

# List indexed documents
cd $CLAUDE_OPC_DIR && uv run python scripts/pageindex/cli/pageindex_cli.py list --project <name>

# Delete tree
cd $CLAUDE_OPC_DIR && uv run python scripts/pageindex/cli/pageindex_cli.py delete <doc_path>

# Show stats
cd $CLAUDE_OPC_DIR && uv run python scripts/pageindex/cli/pageindex_cli.py stats
```

## Integration Points

| System | Integration |
|--------|-------------|
| recall_learnings.py | `--pageindex` and `--hybrid` flags |
| memory-awareness hook | Can surface PageIndex results |
| init-project skill | Auto-generates Tier 1 trees |
| pageindex-watch hook | Regenerates on .md edits |
| **pageindex-navigator** | Always-on architectural guidance |
| navigator-validate | Agent selection validation |
| navigator-safety | Destructive command warnings |

## Navigator System

The PageIndex Navigator provides **always-on architectural guidance** for every user prompt.

### Components

| Hook | Event | Purpose |
|------|-------|---------|
| `pageindex-navigator.mjs` | UserPromptSubmit | Detect task type, query architecture, inject guidance |
| `navigator-validate.mjs` | PreToolUse:Task | Validate agent matches task type |
| `navigator-safety.mjs` | PreToolUse:Bash | Surface safety rules for destructive commands |

### Task Types

| Type | Keywords | Suggested Agents |
|------|----------|------------------|
| RESEARCH | explore, understand, find | scout, oracle, pathfinder |
| IMPLEMENTATION | build, create, implement | kraken, spark, architect |
| DEBUGGING | fix, debug, error, bug | debug-agent, sleuth, profiler |
| REFACTORING | refactor, clean, migrate | phoenix, spark |
| REVIEW | review, audit, check | critic, judge, liaison |

### Output Format

```
NAVIGATOR

**Task Type:** DEBUGGING

**Decision Tree:**
  Know location? -> spark
  Need investigation? -> debug-agent
  Performance issue? -> profiler

**Suggested Agents:**
  debug-agent, sleuth, profiler, spark
```

### Shared Modules

- `shared/pageindex-client.ts` - TypeScript wrapper for PageIndex queries (3s timeout)
- `shared/navigator-state.ts` - Session state, task detection, agent validation

## Search Mode Comparison

| Mode | Command Flag | Best For |
|------|--------------|----------|
| Vector (default) | `--query "topic"` | Learnings, patterns |
| PageIndex | `--pageindex` | Large structured docs |
| Hybrid | `--hybrid` | Best accuracy (recommended) |
| Text-only | `--text-only` | Fast keyword search |

## When to Use

**Good for:**
- ROADMAP.md (goals, plans)
- ARCHITECTURE.md (system design)
- Large skills (>300 lines)
- Any hierarchical document

**Not for:**
- Code patterns → use vector memory
- Session learnings → use vector memory
- Small files → just read directly

## Auto-Update Hook

The `pageindex-watch.mjs` hook automatically regenerates trees when markdown files are edited:

| Event | Trigger | Action |
|-------|---------|--------|
| Write .md | PostToolUse:Write | Regenerate tree |
| Edit .md | PostToolUse:Edit | Regenerate tree |

## Quick Usage

```bash
# 1. Generate tree for a large doc
cd $CLAUDE_OPC_DIR && uv run python scripts/pageindex/cli/pageindex_cli.py generate ROADMAP.md

# 2. Search with hybrid mode (recommended)
cd $CLAUDE_OPC_DIR && PYTHONPATH=. uv run python scripts/core/recall_learnings.py --query "current goals" --hybrid

# 3. PageIndex-only search (for doc-specific queries)
cd $CLAUDE_OPC_DIR && PYTHONPATH=. uv run python scripts/core/recall_learnings.py --query "architecture decisions" --pageindex
```

## Deep Dive

For implementation details:
→ `~/continuous-claude/opc/scripts/pageindex/` (source code)
→ `~/continuous-claude/opc/scripts/pageindex/tutorials/` (usage examples)
