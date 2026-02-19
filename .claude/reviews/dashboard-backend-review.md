# Session Dashboard Backend - Comprehensive Review

**Date:** 2026-02-04
**Branch:** feature/status-dashboard
**Reviewers:** aegis (security), profiler (performance)

---

## Executive Summary

The Session Dashboard backend implements a FastAPI-based status monitoring system with 5 core pillars (memory, knowledge, pageindex, handoffs, roadmap). Two specialized reviews have been completed covering security and performance aspects.

**Overall Assessment:** The implementation is functional but has **1 critical security vulnerability** that must be fixed before any deployment, plus significant performance optimization opportunities.

---

## Review Methodology

### Completed Reviews
- **aegis**: Security audit focusing on vulnerabilities, attack vectors, secrets exposure
- **profiler**: Performance audit analyzing bottlenecks, I/O patterns, concurrency

### Missing Reviews
The following reviews mentioned in the task were not found in cache:
- **critic**: Code quality review
- **judge**: Architecture review
- **liaison**: API design review

This report synthesizes findings from available reviews only.

---

## Findings by Severity

### CRITICAL (Block Release)

| ID | Issue | Source | File:Line | Est Fix |
|----|-------|--------|-----------|---------|
| CRIT-001 | Path Traversal Vulnerability | aegis | routers/handoffs.py:163-174 | M |

**CRIT-001 Details:**
The `get_handoff` endpoint accepts `handoff_id` with `file:` prefix and directly concatenates to filesystem path without validation. Attacker can read arbitrary files:
- `/api/pillars/handoffs/file:../../../etc/passwd`
- `/api/pillars/handoffs/file:../../../opc/.env`

**Impact:** Complete filesystem read access within server permissions.

**Fix Required:**
1. Validate filename contains no path separators (/, \, ..)
2. Use `Path.resolve()` and verify result is within allowed directory
3. Whitelist allowed filename patterns (e.g., `HANDOFF-*.md` only)

---

### HIGH (Must Fix Before Production)

| ID | Issue | Source | File:Line | Est Fix |
|----|-------|--------|-----------|---------|
| HIGH-001 | Information Disclosure via Error Messages | aegis | Multiple files | M |
| HIGH-002 | WebSocket Message Validation Missing | aegis | main.py:96-167 | M |
| HIGH-003 | Unbounded Database Queries | aegis | Multiple services | L |
| PERF-001 | Sequential Health Checks (3-5x slower) | profiler | tasks/health_monitor.py:49-68 | S |
| PERF-002 | Blocking I/O in Async Context | profiler | Multiple services | L |
| PERF-003 | Filesystem Scan on Every Request | profiler | routers/handoffs.py:26-53 | M |

**HIGH-001: Information Disclosure**
Error messages expose filesystem paths, database schema, Python exceptions to clients.
- Example: `detail=f"Error reading handoff file: {e}"` (line 186)
- Fix: Return generic errors to client, log details server-side only

**HIGH-002: WebSocket Validation**
No message size limits, rate limiting, or project validation in WebSocket handler.
- Fix: Add max message size, rate limiting, project whitelist validation

**HIGH-003: Unbounded Queries**
Filesystem globs and JSON file reads have no size/timeout limits.
- services/handoffs.py:68 - `glob(HANDOFF_PATTERN)` scans entire directory
- services/knowledge.py:105 - `read_text()` loads entire file into memory
- Fix: Add timeouts, file size checks, streaming for large files

**PERF-001: Sequential Health Checks**
~50-100ms latency because 5 health checks run sequentially.
- Fix: Use `asyncio.gather()` for parallel execution → ~20ms
- **Quick win:** 5 lines of code, 5x faster

**PERF-002: Blocking I/O**
Synchronous file operations (`glob()`, `stat()`, `read_text()`) block event loop.
- Impact: Request queuing under concurrent load
- Fix: Wrap in `asyncio.to_thread()` or use `aiofiles`

**PERF-003: No Caching**
Filesystem scans run on every request with no TTL cache.
- Impact: 95%+ unnecessary I/O
- Fix: Add 30s TTL cache for file listings

---

### MEDIUM (Should Fix)

| ID | Issue | Source | File:Line | Est Fix |
|----|-------|--------|-----------|---------|
| MED-001 | SQL Query Building Pattern | aegis | routers/memory.py:43-69 | L |
| MED-002 | Missing CORS Configuration | aegis | main.py | S |
| MED-003 | No Authentication/Authorization | aegis | All endpoints | L |
| MED-004 | Hardcoded Dev Database Credentials | aegis | config.py:63 | S |
| PERF-004 | No Health Check Result Caching | profiler | routers/health.py:27-48 | S |
| PERF-005 | Sequential DB Queries in get_details() | profiler | services/memory.py:62-118 | M |

**MED-001: SQL Query Building**
Uses parameterized queries (safe) but pattern is error-prone for maintenance.
- Recommendation: Consider query builder or ORM for complex queries

**MED-002: CORS Missing**
No CORS middleware configured. Not an immediate security issue for localhost, but needs explicit policy.

**MED-003: No Authentication**
All endpoints are open. Acceptable for local development, required for production.
- Recommendation: Add auth middleware before production deployment

**MED-004: Hardcoded Credentials**
Dev credentials `claude:claude_dev@localhost:5434` in config.py.
- Assessment: Acceptable for development, env vars required for production

**PERF-004: Redundant Health Checks**
HealthMonitor runs every 10s but `/api/health` endpoint re-checks instead of using cached results.
- Fix: Return cached results from monitor → instant responses

**PERF-005: Sequential DB Queries**
Three queries in sequence: type_rows, scope_rows, recent_rows.
- Fix: Combine into single CTE query or parallelize → 2x faster

---

### LOW (Nice to Have)

| ID | Issue | Source | Notes | Est Fix |
|----|-------|--------|-------|---------|
| PERF-006 | WebSocket Broadcast Sequential Sends | profiler | Only matters at 100+ connections | S |
| OPT-001 | Missing Database Indexes | profiler | 2-5x query speedup potential | S |
| OPT-002 | Connection Pool Tuning | profiler | Reduce latency spikes | S |
| OPT-003 | Adaptive Health Monitor Intervals | profiler | Reduce DB load when idle | M |

---

## Positive Patterns

### Security
- ✅ Parameterized SQL queries prevent SQL injection
- ✅ Production mode checks for DATABASE_URL env var
- ✅ No API keys found in code

### Performance
- ✅ JSON serialization happens once before WebSocket broadcast
- ✅ Connection pooling configured (max_size=10)
- ✅ Async/await used throughout

### Architecture
- ✅ Clean separation: routers → services → database
- ✅ Pillar-based organization matches continuous-claude structure
- ✅ WebSocket manager centralizes connection handling

---

## Recommendations

### Immediate (Before Any Deployment)

1. **[CRITICAL]** Fix path traversal in `routers/handoffs.py:163-174`
   - Add filename validation regex: `^[A-Z0-9_-]+\.md$`
   - Use `Path.resolve()` with directory containment check
   - Estimated effort: 30 minutes

2. **[HIGH]** Sanitize all error messages before returning to clients
   - Generic messages to client: "Internal server error", "Invalid request"
   - Full details to server logs only
   - Estimated effort: 2 hours (across multiple files)

3. **[HIGH]** Add WebSocket message validation
   - Max message size: 1MB
   - Rate limiting: 10 msg/sec per connection
   - Project whitelist validation
   - Estimated effort: 1 hour

### Short-term (Before Production)

4. **[PERF-001]** Parallelize health checks with `asyncio.gather()`
   - File: `tasks/health_monitor.py`
   - Impact: 5x faster health checks (~100ms → ~20ms)
   - Estimated effort: 15 minutes

5. **[PERF-004]** Use cached health check results in `/api/health`
   - Return HealthMonitor's `_previous_states`
   - Impact: Near-instant responses (<5ms)
   - Estimated effort: 30 minutes

6. **[OPT-001]** Add database indexes
   - `CREATE INDEX idx_handoffs_outcome ON handoffs(outcome);`
   - `CREATE INDEX idx_archival_memory_type ON archival_memory((metadata->>'type'));`
   - `CREATE INDEX idx_archival_memory_created ON archival_memory(created_at DESC);`
   - `CREATE INDEX idx_pageindex_updated ON pageindex_trees(updated_at DESC);`
   - Impact: 2-5x faster filtered queries
   - Estimated effort: 15 minutes

7. Add request timeout middleware (10s default)

8. Implement file size checks before reading (max 10MB)

9. Configure explicit CORS policy for production origins

10. Add basic authentication for production deployments

### Long-term (Technical Debt)

11. **[PERF-002]** Wrap all blocking I/O in `asyncio.to_thread()`
    - Files: All services with file operations
    - Impact: Better concurrency under load
    - Estimated effort: 4 hours

12. **[PERF-003]** Add TTL cache for filesystem scans
    - 30s TTL recommended
    - Impact: 95% reduction in filesystem I/O
    - Estimated effort: 2 hours

13. Add comprehensive logging/audit trail

14. Implement rate limiting on all endpoints

15. Add input validation with Pydantic models for all routes

16. Consider adding response caching layer (Redis)

17. Implement event-driven file updates using watchdog

---

## Performance Benchmarks (Estimated)

| Scenario | Current | After Quick Wins | After All Optimizations |
|----------|---------|------------------|------------------------|
| GET /api/health (cold) | ~100ms | ~20ms (5x) | ~5ms (20x) |
| GET /api/health (cached) | ~100ms | <5ms (20x) | <1ms (100x) |
| Health monitor cycle | ~100ms | ~20ms (5x) | ~10ms (10x) |
| GET /api/pillars/handoffs | ~50ms | ~50ms | ~10ms (5x) |
| Concurrent /health (10 req) | ~300ms | ~25ms (12x) | ~10ms (30x) |

---

## Files Analyzed

| File | Security Issues | Performance Issues |
|------|----------------|-------------------|
| routers/handoffs.py | CRIT-001, HIGH-001 | PERF-002, PERF-003 |
| routers/health.py | - | PERF-004 |
| routers/memory.py | MED-001 | - |
| routers/roadmap.py | HIGH-001 | - |
| services/handoffs.py | HIGH-003 | PERF-002, PERF-003 |
| services/knowledge.py | HIGH-001, HIGH-003 | PERF-002 |
| services/memory.py | - | PERF-005 |
| services/roadmap.py | - | PERF-002 |
| services/pageindex.py | - | No major issues |
| tasks/health_monitor.py | - | PERF-001 |
| websocket/manager.py | HIGH-002 | PERF-006 |
| main.py | MED-002 | - |
| config.py | MED-004 | - |
| core/db/postgres_pool.py | - | OPT-002 |

---

## Verification Checklist

After fixes are implemented, verify:

- [ ] **CRIT-001**: Path traversal fixed - test with `curl localhost:8000/api/pillars/handoffs/file:../../../etc/passwd` (should fail)
- [ ] **HIGH-001**: Error messages sanitized - trigger errors, check responses contain no paths/exceptions
- [ ] **HIGH-002**: WebSocket validation - send oversized message, rapid messages (should be rejected)
- [ ] **HIGH-003**: Query timeouts added - verify 10s timeout on file operations
- [ ] **PERF-001**: Health checks parallel - measure `/api/health` latency (should be <30ms)
- [ ] **PERF-004**: Health cache used - verify instant responses after first monitor cycle
- [ ] **OPT-001**: Database indexes created - check query plans, measure query times

---

## Notes

- This review is based on code analysis without production load testing
- Performance benchmarks are estimates - recommend profiling under realistic load
- Security audit focused on code patterns - recommend penetration testing before production
- Missing reviews (critic, judge, liaison) should be completed for full assessment

---

*Generated by Scribe Agent - Session Dashboard Review*
*Available reviews: aegis (security), profiler (performance)*
