---
name: complete-skill
description: E2E testing workflow — preflight, browser validation, Playwright setup, and data tests. Use for comprehensive end-to-end testing of web applications.
allowed-tools: [Bash, Read, Write, Task]
user-invocable: false
---

# E2E Testing Skill

Proven 4-phase pattern for comprehensive end-to-end testing of web applications with authentication, database backing, and multi-role access.

## When to Use

- Full E2E test suite creation for a web app
- Adding Playwright tests alongside existing Jest unit tests
- Validating authenticated flows across multiple user roles
- Testing CRUD operations through the browser

## Phase 1: Preflight

Verify the environment before any test work begins. All of these are common blockers.

1. **DB up:** Verify database is running and accepting connections
2. **Seed data:** Confirm test data exists — query counts for key tables
3. **Dev server fresh:** If uptime > 4h, restart. Connection pools die silently after ~16h.
4. **Env vars correct:** `NEXTAUTH_URL` / `AUTH_URL` must match the actual running port
5. **Hit a data endpoint:** `curl <baseURL>/api/<endpoint>` — a 200 on `/` does NOT prove the DB works
6. **DATABASE_URL pinned:** If multiple Postgres instances on the host, pass `DATABASE_URL` explicitly

## Phase 2: Manual Browser Pass (atlas agent)

Visual validation of each page using browser automation tools.

**Agent:** atlas (or equivalent browser agent)
**Tools:** `ab` CLI or Claude-in-Chrome MCP

1. Login as each role (admin, member, viewer)
2. Navigate to every major page
3. Verify page renders, data displays, navigation works
4. Screenshot key states for visual record
5. Document any failures for Phase 3 input

**Requirement:** Agent MUST use browser automation tools (ab open + ab snapshot, or navigate + read_page). If it falls back to API calls, label output as "API Integration Tests", not "Browser Tests".

## Phase 3: Playwright Setup (kraken agent)

Scaffold Playwright config and convert manual test observations into specs.

**Agent:** kraken

### Config Pattern

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 4,  // 4 locally — 8 exhausts DB pools
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    env: {
      DATABASE_URL: 'postgresql://...',  // PIN explicitly
    },
  },
});
```

### Auth Setup Pattern

```typescript
// e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const roles = ['admin', 'member', 'viewer'];

for (const role of roles) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', `${role}@example.com`);
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.context().storageState({ path: `e2e/.auth/${role}.json` });
  });
}
```

### Jest Coexistence

Add to `jest.config.js`:
```javascript
testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
```

## Phase 4: Playwright Data Tests (kraken agent)

CRUD specs, role-based access tests, cross-feature validation.

**Agent:** kraken

### Selector Priority

1. `data-testid` (most stable)
2. ARIA role (semantic)
3. CSS selector (last resort)
4. Use `.or()` fallbacks for resilience

### Test Patterns

```typescript
// Role-based test
test.describe('admin dashboard', () => {
  test.use({ storageState: 'e2e/.auth/admin.json' });

  test('can see admin panel', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('admin-panel')).toBeVisible();
  });
});

// CRUD test
test('create and delete item', async ({ page }) => {
  await page.goto('/items');
  await page.click('[data-testid="add-item"]');
  await page.fill('[name="title"]', 'Test Item');
  await page.click('button[type="submit"]');
  await expect(page.getByText('Test Item')).toBeVisible();
  // cleanup
  await page.click('[data-testid="delete-item"]');
  await expect(page.getByText('Test Item')).not.toBeVisible();
});
```

## Verification

After all phases:

1. Run Jest suite: `npx jest` — confirm no regressions
2. Run Playwright: `npx playwright test` — confirm all green
3. Combined count: Jest + Playwright = total E2E coverage
4. Check for flakes: run Playwright twice; if flakes appear, reduce workers or add retries

## Key Patterns Summary

| Pattern | Detail |
|---------|--------|
| Auth | `storageState` per role (admin.json, member.json, viewer.json) |
| Config | `webServer.env` pins `DATABASE_URL`, workers: 4, retries: 1 |
| Jest coexistence | `/e2e/` in `testPathIgnorePatterns` |
| Selectors | `data-testid` > role > CSS, with `.or()` fallbacks |
| DB isolation | Always pass `DATABASE_URL` explicitly — don't rely on `.env.local` |
| Server freshness | Restart if uptime > 4h before testing |
