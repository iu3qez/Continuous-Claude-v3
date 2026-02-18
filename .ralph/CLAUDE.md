# Ralph TDD Enforcement Contract

This file auto-loads into any agent session working in a project with `.ralph/`. It enforces test-driven development discipline during Ralph-orchestrated builds.

## TDD Contract [C:10]

**Iron Law: No production code without a failing test first.**

Every implementation task follows the RED-GREEN-VERIFY cycle. Agents that skip RED are violating the contract. Ralph MUST NOT mark a task complete unless all three phases succeed.

## Agent Role Contracts

| Phase | Agent | Allowed Actions | Forbidden Actions |
|-------|-------|-----------------|-------------------|
| RED | arbiter | Write failing tests, confirm RED state | Write production code, modify source files |
| GREEN | kraken | Write minimal code to pass tests | Add features beyond failing tests, refactor |
| VERIFY | arbiter | Run full suite, typecheck, lint | Modify any code or tests |

### RED Phase (arbiter)
- Write test file(s) for the behavior described in the task
- Run tests and confirm they FAIL (RED state)
- Output: test file path, test names, RED confirmation
- If tests pass immediately, the behavior already exists -- report back, do not proceed

### GREEN Phase (kraken)
- Receive: test file path, failing test names, count of previously passing tests
- Write the minimum production code to make failing tests pass
- Do NOT add functionality beyond what the tests require
- Do NOT refactor -- that comes later
- Output: files modified, GREEN confirmation (all tests pass)

### VERIFY Phase (arbiter)
- Run the full test suite (not just new tests)
- Run typecheck (`tsc --noEmit` / `pyright`)
- Run linter (`eslint` / `ruff`)
- Output: total pass/fail counts, typecheck result, lint result, verdict (PASS/FAIL)
- Do NOT modify any code or tests

## Task Atomicity Constraints

Every task delegated to agents MUST satisfy:
- Max 3-5 source files touched
- Exactly 1 observable behavior per task
- Task description under 2000 words
- 1-3 test cases per behavior slice

If a task violates these constraints, Ralph MUST split it before delegating.

## Context Budget Rule

If a task description references more than 5 files, split it into smaller behavior slices before delegating. Subagents have ~150k token context windows -- overloading them causes quality degradation.

## Vertical Slice Structure

Each behavior slice follows this 3-phase pattern:

```
Behavior: "User can submit contact form with valid email"

Phase 1 (RED):
  Agent: arbiter
  Action: Write test asserting form submission succeeds with valid email
  Exit: Tests fail (RED)

Phase 2 (GREEN):
  Agent: kraken
  Action: Implement form handler + email validation to pass tests
  Exit: All tests pass (GREEN)

Phase 3 (VERIFY):
  Agent: arbiter
  Action: Run full suite + typecheck + lint
  Exit: All checks pass (VERIFIED)
```

## Mocking Doctrine

Follow `.claude/skills/tdd/mocking-boundaries.md`:
- Mock at system boundaries (network, database, filesystem, time)
- Never mock internal implementation details
- Litmus test: if implementation changes without behavior change, would the test break? If yes, mocked too deep.

## Deep Modules

Follow `.claude/skills/tdd/deep-modules.md`:
- Test through the interface, not the plumbing
- Small interface = few test cases
- Deep modules are easier to test correctly

## Retry Discipline

If VERIFY fails after GREEN:
1. Pass error context back to kraken (retry 1)
2. If still failing, spawn debug-agent for root cause (retry 2)
3. If still failing, escalate to user as BLOCKED (retry 3 max)

Never retry the same failing approach more than 3 times.
