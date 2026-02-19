# Issues to Fix - Session Dashboard Backend

**Branch:** feature/status-dashboard
**Date:** 2026-02-04

---

## Critical (Fix First - BLOCKS DEPLOYMENT)

- [ ] **CRIT-001: Path Traversal Vulnerability** - Est: M (2 hours)
  - **File:** `opc/scripts/dashboard/routers/handoffs.py:163-174`
  - **Description:** `get_handoff` endpoint accepts user-controlled `handoff_id` with `file:` prefix and concatenates directly to filesystem path without validation. Attacker can read arbitrary files via `GET /api/pillars/handoffs/file:../../../etc/passwd`
  - **Fix Steps:**
    1. Add regex validation: `^[A-Z0-9_-]+\.md$` for filename portion
    2. Use `Path.resolve()` to get absolute path
    3. Verify resolved path is within `PROJECT_ROOT / ".claude"` directory
    4. Add whitelist check: only allow `HANDOFF-*.md` pattern
  - **Test:** `curl localhost:8000/api/pillars/handoffs/file:../../../etc/passwd` should return 400 Bad Request
  - **Code Example:**
    ```python
    import re

    if handoff_id.startswith("file:"):
        filename = handoff_id[5:]

        # Validate filename pattern
        if not re.match(r'^[A-Z0-9_-]+\.md$', filename):
            raise HTTPException(status_code=400, detail="Invalid filename")

        claude_dir = PROJECT_ROOT / ".claude"
        file_path = (claude_dir / filename).resolve()

        # Verify containment
        if not file_path.is_relative_to(claude_dir):
            raise HTTPException(status_code=403, detail="Access denied")
    ```

---

## High Priority (Fix Before Production)

- [ ] **HIGH-001: Information Disclosure via Error Messages** - Est: M (2 hours)
  - **Files:** `routers/handoffs.py:186,234`, `routers/roadmap.py:72`, `services/knowledge.py:64`
  - **Description:** Error messages expose filesystem paths, database schema details, and Python exceptions to clients
  - **Fix Steps:**
    1. Create generic error messages for all `HTTPException` responses
    2. Add server-side logging with full exception details
    3. Define error codes instead of raw messages
  - **Code Pattern:**
    ```python
    try:
        # operation
    except Exception as e:
        logger.error(f"Handoff read failed: {e}", exc_info=True)  # Server log
        raise HTTPException(status_code=500, detail="Internal server error")  # Client
    ```
  - **Files to update:**
    - `routers/handoffs.py` lines 186, 234
    - `routers/roadmap.py` line 72
    - `services/knowledge.py` line 64

- [ ] **HIGH-002: WebSocket Message Validation Missing** - Est: M (1 hour)
  - **File:** `opc/scripts/dashboard/main.py:96-167`
  - **Description:** No message size limits, rate limiting, or project validation in WebSocket handler
  - **Fix Steps:**
    1. Add max message size check (1MB recommended)
    2. Implement per-connection rate limiting (10 msg/sec)
    3. Validate `project` field against known projects
    4. Add message schema validation
  - **Code Example:**
    ```python
    MAX_MESSAGE_SIZE = 1_000_000  # 1MB
    RATE_LIMIT = 10  # msgs per second

    # In websocket_endpoint:
    if len(data) > MAX_MESSAGE_SIZE:
        await websocket.send_json({"error": "Message too large"})
        continue

    # Rate limiting (needs Redis or in-memory counter)
    # Project validation
    ALLOWED_PROJECTS = ["continuous-claude", "opc"]
    if project not in ALLOWED_PROJECTS:
        await websocket.send_json({"error": "Invalid project"})
        continue
    ```

- [ ] **HIGH-003: Unbounded Database Queries** - Est: L (3 hours)
  - **Files:** `services/handoffs.py:68`, `services/knowledge.py:105`, `routers/memory.py:22`
  - **Description:** Filesystem globs and JSON reads have no size/timeout limits. Large directories or files cause memory exhaustion
  - **Fix Steps:**
    1. Add timeout decorator for all file operations (10s recommended)
    2. Add file size checks before reading (max 10MB)
    3. Implement streaming for large files
    4. Add result limits at service level
  - **Code Example:**
    ```python
    import asyncio
    from functools import wraps

    def async_timeout(seconds=10):
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                return await asyncio.wait_for(func(*args, **kwargs), timeout=seconds)
            return wrapper
        return decorator

    @async_timeout(10)
    async def read_file_safe(path: Path, max_size: int = 10_000_000):
        if path.stat().st_size > max_size:
            raise ValueError("File too large")
        return await asyncio.to_thread(path.read_text)
    ```

- [ ] **PERF-001: Sequential Health Checks** - Est: S (15 minutes) - **QUICK WIN**
  - **File:** `opc/scripts/dashboard/tasks/health_monitor.py:49-68`
  - **Description:** `check_all_pillars()` runs 5 health checks sequentially (~100ms total). Should parallelize for 5x speedup
  - **Fix Steps:**
    1. Wrap pillar checks in `asyncio.gather()`
    2. Handle individual failures gracefully
  - **Code Example:**
    ```python
    async def check_all_pillars(self) -> dict[str, PillarHealth]:
        results = await asyncio.gather(
            self.check_memory(),
            self.check_knowledge(),
            self.check_pageindex(),
            self.check_handoffs(),
            self.check_roadmap(),
            return_exceptions=True
        )

        # Map results to pillar names with error handling
        pillars = ["memory", "knowledge", "pageindex", "handoffs", "roadmap"]
        return {
            name: result if not isinstance(result, Exception)
                  else PillarHealth(status="error", error=str(result))
            for name, result in zip(pillars, results)
        }
    ```
  - **Impact:** 5x faster health checks (100ms → 20ms)

- [ ] **PERF-002: Blocking I/O in Async Context** - Est: L (4 hours)
  - **Files:** `services/handoffs.py:68,73,125,130,133`, `services/knowledge.py:68,78,105`, `services/roadmap.py:34`, `routers/handoffs.py:38-49,172-173`
  - **Description:** Synchronous file operations (`glob()`, `stat()`, `read_text()`) block event loop causing request queuing under concurrent load
  - **Fix Steps:**
    1. Wrap all blocking I/O in `asyncio.to_thread()`
    2. Or use `aiofiles` library for async file operations
  - **Code Pattern:**
    ```python
    # Before (blocking):
    files = list(self._claude_dir.glob(HANDOFF_PATTERN))

    # After (non-blocking):
    files = await asyncio.to_thread(lambda: list(self._claude_dir.glob(HANDOFF_PATTERN)))

    # Or with aiofiles:
    async with aiofiles.open(file_path, 'r') as f:
        content = await f.read()
    ```
  - **Impact:** Better concurrency under load, prevents event loop blocking

- [ ] **PERF-003: Filesystem Scan on Every Request** - Est: M (2 hours)
  - **File:** `opc/scripts/dashboard/routers/handoffs.py:26-53,133-134`
  - **Description:** `list_handoffs` endpoint calls `_scan_handoff_files()` on every request with no caching. 95%+ unnecessary I/O
  - **Fix Steps:**
    1. Add TTL-based cache (30s recommended)
    2. Use `functools.lru_cache` with timed expiry or `cachetools.TTLCache`
    3. Invalidate cache on file modifications (optional: watchdog)
  - **Code Example:**
    ```python
    from cachetools import TTLCache
    from datetime import datetime

    # At module level
    handoffs_cache = TTLCache(maxsize=1, ttl=30)

    async def list_handoffs() -> list[HandoffSummary]:
        cache_key = "handoffs_list"

        if cache_key in handoffs_cache:
            return handoffs_cache[cache_key]

        # Scan filesystem
        handoffs = await _scan_handoff_files()
        handoffs_cache[cache_key] = handoffs
        return handoffs
    ```
  - **Impact:** 95%+ reduction in filesystem I/O for cached requests

---

## Medium Priority (Should Fix)

- [ ] **MED-001: SQL Query Building Pattern** - Est: L (4 hours)
  - **File:** `opc/scripts/dashboard/routers/memory.py:43-69`
  - **Description:** Dynamic SQL query building is error-prone for maintenance. Uses parameterized queries (safe) but pattern is brittle
  - **Recommendation:** Consider using SQLAlchemy Core or query builder for complex queries
  - **Impact:** Improved maintainability, reduced risk of future SQL injection if pattern is extended

- [ ] **MED-002: Missing CORS Configuration** - Est: S (15 minutes)
  - **File:** `opc/scripts/dashboard/main.py`
  - **Description:** No CORS middleware configured. Required for cross-origin dashboard access
  - **Fix Steps:**
    ```python
    from fastapi.middleware.cors import CORSMiddleware

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],  # Frontend dev server
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    ```

- [ ] **MED-003: No Authentication/Authorization** - Est: L (8 hours for production)
  - **Files:** All endpoints
  - **Description:** All endpoints are open. Acceptable for local development, required for production
  - **Fix Steps (for production):**
    1. Add JWT or session-based authentication middleware
    2. Implement role-based access control (RBAC)
    3. Add audit logging for API access
  - **Not urgent for development deployment**

- [ ] **MED-004: Hardcoded Dev Database Credentials** - Est: S (10 minutes)
  - **File:** `opc/scripts/dashboard/config.py:63`
  - **Description:** `postgresql://claude:claude_dev@localhost:5434/continuous_claude` visible in source
  - **Assessment:** Acceptable for development, env vars already used in production mode
  - **Fix:** Add comment explaining dev-only usage

- [ ] **PERF-004: No Health Check Result Caching** - Est: S (30 minutes) - **QUICK WIN**
  - **File:** `opc/scripts/dashboard/routers/health.py:27-48`
  - **Description:** `/api/health` endpoint re-checks all pillars instead of using HealthMonitor's cached results
  - **Fix Steps:**
    1. Inject HealthMonitor instance into router
    2. Return `monitor._previous_states` instead of re-checking
  - **Code Example:**
    ```python
    # In main.py, make monitor accessible:
    app.state.health_monitor = monitor

    # In routers/health.py:
    @router.get("")
    async def get_health(request: Request) -> HealthResponse:
        monitor = request.app.state.health_monitor
        return HealthResponse(
            status="ok",
            pillars=monitor._previous_states,
            timestamp=datetime.now().isoformat()
        )
    ```
  - **Impact:** Near-instant responses (<5ms) after first monitor cycle

- [ ] **PERF-005: Sequential DB Queries in get_details()** - Est: M (1 hour)
  - **File:** `opc/scripts/dashboard/services/memory.py:62-118`
  - **Description:** Three sequential queries: type_rows, scope_rows, recent_rows. Should parallelize or combine
  - **Fix Options:**
    1. Use `asyncio.gather()` for parallel execution
    2. Or combine into single CTE query
  - **Code Example (parallel):**
    ```python
    type_task = pool.fetch(type_query, project)
    scope_task = pool.fetch(scope_query, project)
    recent_task = pool.fetch(recent_query, project)

    type_rows, scope_rows, recent_rows = await asyncio.gather(
        type_task, scope_task, recent_task
    )
    ```
  - **Impact:** 2x faster (single round-trip)

---

## Low Priority (Nice to Have)

- [ ] **PERF-006: WebSocket Broadcast Sequential Sends** - Est: S (30 minutes)
  - **File:** `opc/scripts/dashboard/websocket/manager.py:55-69`
  - **Description:** WebSocket sends are sequential. Only matters at scale (100+ connections)
  - **Fix:** Use `asyncio.gather()` for parallel sends
  - **Impact:** Only noticeable at scale

- [ ] **OPT-001: Add Database Indexes** - Est: S (15 minutes) - **QUICK WIN**
  - **Description:** Missing indexes for common query patterns cause slow filtered queries
  - **Fix:** Run these migrations:
    ```sql
    CREATE INDEX idx_handoffs_outcome ON handoffs(outcome);
    CREATE INDEX idx_archival_memory_type ON archival_memory((metadata->>'type'));
    CREATE INDEX idx_archival_memory_created ON archival_memory(created_at DESC);
    CREATE INDEX idx_pageindex_updated ON pageindex_trees(updated_at DESC);
    ```
  - **Impact:** 2-5x faster filtered queries

- [ ] **OPT-002: Connection Pool Tuning** - Est: S (15 minutes)
  - **File:** `opc/core/db/postgres_pool.py`
  - **Description:** Current pool size (max=10) may be insufficient for 5 parallel health checks + concurrent requests
  - **Fix:**
    ```python
    max_size = 20  # Increased from 10
    max_inactive_connection_lifetime = 300  # Recycle stale connections
    ```

- [ ] **OPT-003: Adaptive Health Monitor Intervals** - Est: M (2 hours)
  - **File:** `opc/scripts/dashboard/tasks/health_monitor.py:30`
  - **Description:** Fixed 10s interval runs even when no WebSocket clients connected
  - **Fix:** Adaptive intervals:
    - 10s when clients connected
    - 60s when no clients
    - Immediate check on first client connect
  - **Impact:** Reduced DB load when dashboard idle

---

## Summary

| Priority | Count | Total Effort | Quick Wins |
|----------|-------|--------------|------------|
| Critical | 1 | 2 hours | 0 |
| High | 6 | 12 hours | 2 (PERF-001, PERF-004) |
| Medium | 6 | 15 hours | 1 (PERF-004) |
| Low | 3 | 3 hours | 1 (OPT-001) |
| **Total** | **16** | **32 hours** | **4 quick wins** |

---

## Recommended Fix Order

1. **Day 1: Critical + Quick Wins** (3-4 hours)
   - CRIT-001: Path traversal fix
   - PERF-001: Parallelize health checks (15 min)
   - PERF-004: Use cached health results (30 min)
   - OPT-001: Add database indexes (15 min)

2. **Day 2: High Priority Security** (3 hours)
   - HIGH-001: Sanitize error messages
   - HIGH-002: WebSocket validation

3. **Day 3: High Priority Performance** (5 hours)
   - HIGH-003: Add query timeouts and file size limits
   - PERF-003: Add filesystem scan caching

4. **Week 2: Medium Priority** (as needed)
   - MED-002: CORS configuration
   - PERF-002: Async I/O wrappers
   - PERF-005: Parallel DB queries

---

*Generated by Scribe Agent - 2026-02-04*
