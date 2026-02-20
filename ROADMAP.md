# Project Roadmap

## Current Focus

_No current goal. Next planned item will be promoted on next planning session._

## Completed
- [x] [feat](hooks) add plan-to-ralph enforcement hooks (2026-02-20) `560cbcb`
- [x] [fix](settings) remove broken statusLine PowerShell wrapper from project config (2026-02-19) `dd0c611`
- [x] [test](ralph) add 211 regression tests for all 11 bug fixes + state backbone (2026-02-19) `2422a62`
- [x] [fix](ralph) fix 11 bugs across hooks, scripts, and state schema (2026-02-19) `c635d93`
- [x] [fix](ralph) make /ralph work in new projects without manual setup (2026-02-19) `f8c19b1`
- [x] [docs](ops) add reviews, E2E runbook, stress-test handoff, and ralph preproduction results (2026-02-19) `b4a1839`
- [x] [feat](skills) add browser-dev-cycle, create-better-skills, excalidraw-mcp, full-test-suite, weekly-report skills + pageindex-watch hook + TDD reference docs (2026-02-19) `159ba4e`
- [x] [fix](memory) cleanup garbage learnings + add ingestion/recall quality gates (2026-02-19) `05abf54`
- [x] [feat](ralph) integrate TDD workflow with atomic task sizing (2026-02-18) `35428b7`
- [x] PRD: NorthStar Transformation Site MVP [prd-northstar-transformation.md] (2026-02-18)
- [x] [docs](rules) add Git Bash drive letter and parallel cascade rules (2026-02-18) `edaeac3`
- [x] [docs](rules) add Windows platform rules for .claude.json, python3, npx (2026-02-18) `f3ec104`
- [x] [fix](nexus) CEO demo QA — dark mode alignment, Workbook rebrand, CSS var fixes (2026-02-15) `153377a`
- [x] [fix](nexus) remove screen zoom/magnify animation on click (2026-02-15) `4fcd9db`
- [x] [fix](nexus) update sidebar/nav test counts for workspaces addition (2026-02-15) `698c872`
- [x] [feat](nexus) implement TASK-002 through TASK-010 audit items (2026-02-15) `1c3b89a`
- [x] PRD: CLI Task Tracker [prd-cli-task-tracker.md] (2026-02-14)
- [x] Platform Quality Upgrade — Implementation Plan (2026-02-14)
- [x] [docs] update agent-browser skill for v0.10 (2026-02-13) `388860c`
- [x] [docs] add new project setup guide for Continuous Claude (2026-02-13) `c0634b7`
- [x] [feat] v3.0 production-grade presentation (2026-02-11) `d0afba5`
- [x] [feat] premium production polish v2.0 (2026-02-11) `bdcac09`
- [x] Major update: reframe narrative with Continuous Claude as headline (2026-02-11) `7b41781`
- [x] [fix] restructure skills with YAML frontmatter + add orchestrator skill (2026-02-11) `07e775e`
- [x] [feat] expand content library to 34 docs (43K words) + Claude.ai project + Phase 2 doc (2026-02-11) `3b6baf2`
- [x] [fix] accept both v1.0 and v2.0 Azure AD token formats (2026-02-11) `2a86e03`
- [x] [fix] override correct method (load_access_token) for debug logging (2026-02-11) `0ecd3dc`
- [x] [fix] set accessTokenAcceptedVersion=2 and add debug JWT logging (2026-02-11) `07cfb64`
- [x] [fix] use custom app scope so Azure AD token audience matches our app (2026-02-11) `81ba563`
- [x] [fix] harden knowledge tree reliability (2026-02-11) `36fb119`
- [x] [fix] strip resource param from Azure AD authorize URL (2026-02-11) `d4c1663`
- [x] [fix] use httpx directly for Notion API (notion-client v2.7 lacks query) (2026-02-11) `d716ec2`
- [x] [docs] add Streamdown implementation guide (2026-02-10) `0fbd8be`
- [x] [fix] 6 hooks output valid JSON instead of raw text to stdout (2026-02-10) `9819347`
- [x] [fix] task-router hook outputs valid JSON instead of mixed stdout (2026-02-10) `1de6398`
- [x] [docs] add Edge CDP browser automation setup guide (2026-02-10) `3908973`
- [x] [feat] fast PageIndex search via FTS + hybrid RRF (2026-02-10) `1729de4`
- [x] [fix] PageIndex CLI Windows compatibility and project root detection (2026-02-09) `ddd84b7`
- [x] [docs] add Ralph quickstart guide (2026-02-09) `c4f916e`
- [x] Knowledge tree & ROADMAP audit + repair (2026-02-09)
- [x] Comprehensive README update with Ralph, browser automation, and corrected counts (2026-02-09) ed034eb
- [x] Ralph 8-phase scale hardening for 100+ task reliability (2026-02-07) cc4fe68
- [x] PRD-001: Session Status Dashboard [PRD-001-session-status-dashboard.md] (2026-02-05)
- [x] Agent Integration [PRD-004] (2026-02-04)
- [x] Dark Mode [PRD-003] (2026-02-04)
- [x] Decisions Filter [PRD-002] (2026-02-04)
- [x] Actions Kanban Board [PRD-001] (2026-02-04)
- [x] ROADMAP as Source of Truth Implementation (2026-02-03)
- [x] Git commit ROADMAP sync hook (2026-02-03)
- [x] ROADMAP auto-update mechanism fix (2026-02-03)
- [x] Memory & Braintrust systems health check (2026-02-03)
- [x] Agent delegation improvements (2026-02-02)
- [x] Documentation consolidation (2026-02-02)
- [x] Memory system performance optimization (2026-02-02)
- [x] Finalize session isolation patterns (2026-02-02)
- [x] Complete stress testing for enforcer hooks (2026-02-02)
- [x] Hook System Improvements (2026-02-02)
- [x] Core memory system with PostgreSQL + pgvector (2026-01)
- [x] Defense-in-depth extraction architecture (2026-01)
- [x] Session hooks infrastructure (2026-01)
- [x] Skill system with v5 hybrid format (2026-01)
- [x] Agent orchestration (maestro, ralph workflows) (2026-01)
- [x] Knowledge tree integration (2026-01)
- [x] Cross-terminal coordination database (2026-01)
- [x] Memory unit tests in opc/tests/ (2026-02)

## Planned

## Recent Planning Sessions
### 2026-02-14: Platform Quality Upgrade — Implementation Plan
**Summary:** Comprehensive testing against the live Railway deployment (https://web-production-2c64.up.railway.app) graded the platform **B- (74/100)**. Route stability (100) and performance (100) are excellent, but **accessibility (55/100)** and **design quality (55/100)** drag the score. Three routes — `/`, `/...

**Key Decisions:**
- Goal: Raise overall score from 74 → 85-90 (B+/A-) by fixing WCAG blockers, improving design quality, and cleaning up polish items.
- Branch: `platform-updates` (off `master`)
- Source reports: `workbook-platform-audit.md` (prioritized fixes), `workbook-test-report.md` (raw graded data)
- Fixes: Skip link (5 routes), focus indicators (16-24 elements/route), touch targets (90%+ elements)
- Risk: MEDIUM — button/input size cascades everywhere. Visual verify all routes.

**Files:** workbook-platform-audit.md, workbook-test-report.md, apps/web/app/layout.tsx, apps/web/app/(dashboard)/layout.tsx, apps/web/app/globals.css, apps/web/components/ui/button.tsx, apps/web/components/ui/input.tsx, apps/web/components/ui/nexus-card.tsx

### 2026-02-02: ROADMAP.md Creation
**Key Decisions:**
- Created roadmap file for hook integration
- Enables post-plan-roadmap hook to track planning decisions
- Knowledge tree can now reference goals.source
