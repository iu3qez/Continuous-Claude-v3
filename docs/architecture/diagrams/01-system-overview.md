# System Overview

High-level map of all Continuous Claude subsystems and how they connect.

```mermaid
graph TB
    subgraph Session["Claude Session"]
        UP[User Prompt] --> HL[Hook Layer<br/>90+ hooks]
        HL --> CC[Claude Core]
        CC --> TE[Tool Execution]
    end

    subgraph Capabilities["Core Capabilities"]
        SK[Skills<br/>119+]
        AG[Agents<br/>31 specialized]
        TLDR[TLDR Code Analysis<br/>95% token savings]
    end

    subgraph Persistence["Persistence Layer"]
        MS[Memory System<br/>PostgreSQL + pgvector]
        CL[Continuity<br/>Ledgers + Handoffs]
        CO[Coordination<br/>Cross-terminal]
        RM[ROADMAP<br/>Auto-sync]
    end

    subgraph Orchestration["Orchestration"]
        MA[Maestro<br/>Multi-step tasks]
        RA[Ralph<br/>Autonomous dev]
    end

    CC --> SK
    CC --> AG
    CC --> TLDR
    CC --> MS
    CC --> CL
    SK --> AG
    AG --> TE
    TE --> TLDR
    MS --> CL
    CO --> MS
    RM --> CL
    MA --> AG
    RA --> AG
    CC --> MA
    CC --> RA
```

## Subsystem Summary

| Subsystem | Components | Purpose |
|-----------|-----------|---------|
| Hook Layer | 90+ TypeScript hooks | Intercept events, inject context, enforce rules |
| Skills | 119+ workflows | Pre-built task flows triggered by natural language |
| Agents | 31 specialized | Focused AI assistants for delegation |
| TLDR | 5-layer AST analysis | Structural code understanding at 95% token savings |
| Memory | PostgreSQL + BGE embeddings | Persistent learnings across sessions |
| Continuity | Ledgers + handoffs | State transfer between sessions |
| Coordination | Session + file_claims tables | Multi-terminal conflict prevention |
| ROADMAP | 4 auto-sync hooks | Goal tracking and progress visibility |

Last verified: 2026-02-20
