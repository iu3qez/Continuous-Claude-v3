# Rule: Generating a Task List from User Requirements

## Goal

To guide an AI assistant in creating a detailed, step-by-step task list in Markdown format based on user requirements, feature requests, or existing documentation. The task list should guide a developer through implementation.

## Task Atomicity Rules [C:10]

Every task MUST satisfy these constraints for reliable subagent delegation:

| Constraint | Limit | Why |
|------------|-------|-----|
| Source files | Max 3-5 per task | Subagent context budget (~150k tokens) |
| Behavior | 1 observable behavior per task | Focus prevents scope creep |
| Description | Under 2000 words | Concise prompts produce better agent output |
| Test cases | 1-3 per behavior slice | Sufficient coverage without overload |

### Splitting Examples

**WRONG -- monolithic task:**
```markdown
- [ ] 3.0 Implement authentication middleware
  - [ ] 3.1 Create JWT validation, session management, role-based access,
        rate limiting, token refresh, and error handling
```

**RIGHT -- behavior slices:**
```markdown
- [ ] 3.0 Parent: Authentication Middleware
  - [ ] 3.1 Validate JWT tokens on protected routes {RED: arbiter, GREEN: kraken}
    - Behavior: Requests with invalid/expired JWT get 401 response
    - Tests: valid token passes, expired token rejected, missing token rejected
    - Files: src/middleware/auth.ts, src/middleware/auth.test.ts
  - [ ] 3.2 Extract user context from valid JWT {RED: arbiter, GREEN: kraken}
    - Behavior: Valid JWT populates req.user with id, email, roles
    - Tests: user object populated, roles array present, email matches token
    - Files: src/middleware/auth.ts, src/types/user.ts
  - [ ] 3.3 Enforce role-based access on admin routes {RED: arbiter, GREEN: kraken}
    - Behavior: Non-admin users get 403 on admin endpoints
    - Tests: admin role passes, user role rejected, missing role rejected
    - Files: src/middleware/rbac.ts, src/middleware/rbac.test.ts
  - [ ] 3.4 Handle token refresh flow {RED: arbiter, GREEN: kraken}
    - Behavior: Expired access token with valid refresh token gets new pair
    - Tests: refresh succeeds, expired refresh rejected, invalid refresh rejected
    - Files: src/middleware/refresh.ts, src/middleware/refresh.test.ts
```

## Output

- **Format:** Markdown (`.md`)
- **Location:** `/tasks/`
- **Filename:** `tasks-[feature-name].md` (e.g., `tasks-user-profile-editing.md`)

## Process

1.  **Recall Implementation Patterns (Memory):** Before generating tasks, query memory for similar past implementations:
    ```bash
    cd ~/.claude && PYTHONPATH=. uv run python scripts/core/recall_learnings.py \
      --query "<feature type> implementation tasks" --k 3 --text-only
    ```
    Look for: task breakdown patterns, common subtasks, testing approaches.

2.  **Receive Requirements:** The user provides a feature request, task description, or points to existing documentation

3.  **Analyze Requirements:** The AI analyzes the functional requirements, user needs, and implementation scope from the provided information. **Include insights from memory recall.**

4.  **Phase 1: Generate Parent Tasks:** Based on the requirements analysis and memory context, create the file and generate the main, high-level tasks required to implement the feature. **IMPORTANT: Always include task 0.0 "Create feature branch" as the first task, unless the user specifically requests not to create a branch.** **For UI features: Always include task 0.5 "Setup frontend design tooling" immediately after the branch task.** Use your judgement on how many additional high-level tasks to use. It's likely to be about 5. Present these tasks to the user in the specified format (without sub-tasks yet). Inform the user: "I have generated the high-level tasks based on your requirements. Ready to generate the sub-tasks? Respond with 'Go' to proceed."

5.  **Wait for Confirmation:** Pause and wait for the user to respond with "Go".

6.  **Phase 2: Generate Sub-Tasks:** Once the user confirms, break down each parent task into smaller, actionable sub-tasks necessary to complete the parent task. Ensure sub-tasks logically follow from the parent task and cover the implementation details implied by the requirements. **If memory recall found relevant patterns, follow them.**

7.  **Identify Relevant Files:** Based on the tasks, requirements, and **knowledge tree** (if available at `${PROJECT}/.claude/knowledge-tree.json`), identify potential files that will need to be created or modified. List these under the `Relevant Files` section, including corresponding test files if applicable.

8.  **Generate Final Output:** Combine the parent tasks, sub-tasks, relevant files, and notes into the final Markdown structure.

9.  **Save Task List:** Save the generated document in the `/tasks/` directory with the filename `tasks-[feature-name].md`, where `[feature-name]` describes the main feature or task being implemented. **Note:** The `prd-roadmap-sync` hook will automatically update ROADMAP.md when this file is saved.

## Output Format

The generated task list _must_ follow this structure:

```markdown
## Relevant Files

- `path/to/potential/file1.ts` - Brief description of why this file is relevant (e.g., Contains the main component for this feature).
- `path/to/file1.test.ts` - Unit tests for `file1.ts`.
- `path/to/another/file.tsx` - Brief description (e.g., API route handler for data submission).
- `path/to/another/file.test.tsx` - Unit tests for `another/file.tsx`.
- `lib/utils/helpers.ts` - Brief description (e.g., Utility functions needed for calculations).
- `lib/utils/helpers.test.ts` - Unit tests for `helpers.ts`.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/[feature-name]`)
- [ ] 0.5 Setup frontend design tooling (REQUIRED for UI features)
  - [ ] 0.5.1 Load frontend-design plugin: Read `~/.claude/plugins/frontend-design` patterns
  - [ ] 0.5.2 Load shadcn-create skill: Read `~/.claude/skills/shadcn-create/SKILL.md`
  - [ ] 0.5.3 Research components via shadcn MCP: Use `mcp__21st-dev-magic__search_components` to find relevant components
  - [ ] 0.5.4 Document component plan: List components to use from shadcn/ui library
- [ ] 1.0 Parent: [Feature Area]
  - [ ] 1.1 [Behavior description] {RED: arbiter, GREEN: kraken}
    - Behavior: [One sentence describing the observable behavior]
    - Tests: [1-3 test case descriptions]
    - Files: [Max 3-5 source files]
  - [ ] 1.2 [Behavior description] {RED: arbiter, GREEN: kraken}
    - Behavior: [One sentence]
    - Tests: [1-3 test cases]
    - Files: [Max 3-5 files]
- [ ] 2.0 Parent: [Feature Area]
  - [ ] 2.1 [Behavior description] {RED: arbiter, GREEN: kraken}
    - Behavior: [One sentence]
    - Tests: [1-3 test cases]
    - Files: [Max 3-5 files]
- [ ] 3.0 [Config/setup task] (no TDD annotation if purely structural)
```

### TDD Behavior Slice Format

The `{RED: arbiter, GREEN: kraken}` annotation tells Ralph's delegation loop to execute the 3-phase TDD sequence:
1. **RED** -- arbiter writes failing tests
2. **GREEN** -- kraken writes minimal code to pass
3. **VERIFY** -- arbiter runs full suite + typecheck + lint

Tasks without this annotation (config, setup, research) use single-agent dispatch.

## Frontend Design Tooling (MANDATORY for UI features)

If the PRD contains a "Frontend Design Stack" section or the feature includes UI components, task 0.5 is MANDATORY with these exact sub-tasks:

```markdown
- [ ] 0.5 Setup frontend design tooling
  - [ ] 0.5.1 Load frontend-design plugin: Read `~/.claude/plugins/frontend-design` for design system patterns
  - [ ] 0.5.2 Load shadcn-create skill: Read `~/.claude/skills/shadcn-create/SKILL.md` for theming guidance
  - [ ] 0.5.3 Research components via shadcn MCP: Use component search to find relevant shadcn/ui components
  - [ ] 0.5.4 Document component plan: Create list of shadcn/ui components to use
```

### Why This Matters

- **frontend-design plugin**: Provides design system rules, component patterns, and visual consistency guidelines
- **shadcn-create skill**: Contains 800+ lines of theming guidance, MCP tool usage, and component customization patterns
- **shadcn MCP**: Enables component discovery and implementation research before coding

### During Implementation

Each UI task should reference the design tooling:
- Before creating a component → Check shadcn/ui library via MCP
- When styling → Follow frontend-design plugin patterns
- When theming → Use shadcn-create skill guidance

## Agent Assignment Guidance

When generating tasks for Ralph-orchestrated builds, annotate each task with the appropriate agent pattern:

| Task Type | Pattern | Agents | Annotation |
|-----------|---------|--------|------------|
| Implementation (TDD) | RED-GREEN-VERIFY | arbiter, kraken, arbiter | `{RED: arbiter, GREEN: kraken}` |
| Test-only (add coverage) | Write + run | arbiter | `{TEST: arbiter}` |
| Config/setup | Direct execution | spark | `{SETUP: spark}` |
| Research/investigation | Explore + report | scout | `{RESEARCH: scout}` |
| Bug fix (with regression test) | RED-GREEN-VERIFY | arbiter, kraken, arbiter | `{RED: arbiter, GREEN: kraken}` |

### Rules
- Every implementation task SHOULD use TDD annotation unless it is pure config/setup
- Research tasks produce reports, not code -- use scout
- Config tasks (env vars, package.json, tsconfig) use spark for direct execution
- Bug fixes follow TDD: write failing test reproducing bug (RED), fix it (GREEN), verify (VERIFY)

## Interaction Model

The process explicitly requires a pause after generating parent tasks to get user confirmation ("Go") before proceeding to generate the detailed sub-tasks. This ensures the high-level plan aligns with user expectations before diving into details.

## Target Audience

Assume the primary reader of the task list is a **junior developer** who will implement the feature.
