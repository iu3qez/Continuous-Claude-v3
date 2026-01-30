# ARCHITECTURE-mcp-server.md
**Feature:** MCP Server Architecture
**Created:** 2026-01-21
**Author:** architect-agent

---

## Overview

The Platform MCP Server exposes SPARK data to the Claude Agent SDK via standardized tool interfaces. It handles authentication, authorization, query optimization, and proposal workflows.

---

## Server Setup

### Architecture: Embedded vs Standalone

| Option | Pros | Cons |
|--------|------|------|
| **Embedded** (Next.js API routes) | Single deployment, shared auth | Tightly coupled |
| Standalone Node.js | Independent scaling | Additional infra |

**Recommendation: Embedded** - Start with Next.js API routes for simplicity.

---

## Tool Implementations

### getMeetings
- Params: startDate, endDate, seriesId, attendeeId, limit
- Returns: Meeting[] with series and attendees
- Auth: member, admin

### getMeetingDetails
- Params: meetingId
- Returns: Full meeting with notes, actions, decisions
- Auth: member, admin

### getActionItems
- Params: status, ownerId, meetingId, dueDateRange, limit
- Returns: ActionItem[] with owner and meeting
- Auth: member, admin

### getDecisions
- Params: search, meetingId, decidedById, dateRange, limit
- Returns: Decision[] with decidedBy and meeting
- Auth: member, admin

### searchContent
- Params: query, contentTypes, limit
- Returns: SearchResult[] with score
- Uses: pg_trgm for fuzzy text search
- Auth: member, admin

### getPersonContext
- Params: personId
- Returns: User with recent actions, decisions, meetings
- Auth: member, admin

### proposeActionItem
- Params: title, description, ownerId, dueDate, priority, sourceQuote
- Returns: Proposal (pending approval)
- Creates: pendingApprovals record
- Auth: member, admin

### proposeDecision
- Params: title, description, rationale, decidedById, sourceQuote
- Returns: Proposal (pending approval)
- Creates: pendingApprovals record
- Auth: admin only

---

## Database Queries - N+1 Prevention

1. **Eager Loading**: Use Drizzle with relations
2. **DataLoader**: Batch lookups for related entities
3. **Cursor Pagination**: Avoid offset for large lists
4. **pg_trgm Index**: Fast fuzzy text search

---

## Authorization

Tool-level permission matrix:

| Tool | Roles |
|------|-------|
| getMeetings | member, admin |
| getMeetingDetails | member, admin |
| getActionItems | member, admin |
| getDecisions | member, admin |
| searchContent | member, admin |
| getPersonContext | member, admin |
| proposeActionItem | member, admin |
| proposeDecision | admin |

---

## Proposal Workflow

1. Agent calls proposeActionItem/proposeDecision
2. Creates pendingApprovals record (status: pending)
3. User sees ApprovalCard in sidebar
4. User can: Approve, Edit + Approve, or Reject
5. On approve: Create actual item, tag AI-assisted
6. On reject: Log feedback, mark rejected

### Approval API Endpoints

- POST /api/agent/approvals/[id] - Resolve approval
- GET /api/agent/approvals - List pending approvals
- DELETE /api/agent/approvals/[id] - Cancel (same as reject)

---

## Trade-offs

| Decision | Rationale |
|----------|-----------|
| Embedded MCP | Simpler deployment, shared auth |
| Drizzle ORM | Type-safe, good relations |
| 24hr expiry | Prevent stale approvals |
| Tool permissions | Fine-grained access |
| pg_trgm | Simpler than pgvector |

---

## Detailed Tool Schemas

### getMeetings Schema

```typescript
import { z } from 'zod';

export const getMeetingsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  seriesId: z.string().uuid().optional(),
  attendeeId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});
```

### proposeActionItem Schema

```typescript
export const proposeActionItemSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(1000).optional(),
  ownerId: z.string().uuid().optional(),
  ownerName: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  meetingId: z.string().uuid().optional(),
  sourceQuote: z.string().max(500).optional(),
});
```

### proposeDecision Schema

```typescript
export const proposeDecisionSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(2000),
  rationale: z.string().max(1000).optional(),
  decidedById: z.string().uuid().optional(),
  meetingId: z.string().uuid().optional(),
  sourceQuote: z.string().max(500).optional(),
});
```

---

## Implementation Examples

### getMeetings Implementation

```typescript
export async function getMeetings(
  params: z.infer<typeof getMeetingsSchema>,
  ctx: AgentContext
): Promise<Meeting[]> {
  return db.query.meetings.findMany({
    where: and(
      eq(meetings.organizationId, ctx.organizationId),
      params.startDate ? gte(meetings.date, new Date(params.startDate)) : undefined,
      params.endDate ? lte(meetings.date, new Date(params.endDate)) : undefined,
      params.seriesId ? eq(meetings.seriesId, params.seriesId) : undefined,
    ),
    limit: params.limit,
    orderBy: desc(meetings.date),
    with: { 
      series: true, 
      attendees: { with: { user: true } } 
    },
  });
}
```

### searchContent Implementation

```typescript
export async function searchContent(
  params: z.infer<typeof searchContentSchema>,
  ctx: AgentContext
): Promise<SearchResult[]> {
  const { query, contentTypes = ['meeting', 'action', 'decision'], limit } = params;
  
  const results = await db.execute(sql\`
    SELECT 
      id, type, title, 
      substring(content, 1, 300) as excerpt,
      similarity(content, \${query}) as score
    FROM search_index
    WHERE organization_id = \${ctx.organizationId}
      AND type = ANY(\${contentTypes})
      AND content % \${query}
    ORDER BY score DESC
    LIMIT \${limit}
  \`);
  
  return results.rows;
}
```

### proposeActionItem Implementation

```typescript
export async function proposeActionItem(
  params: z.infer<typeof proposeActionItemSchema>,
  ctx: AgentContext
): Promise<Proposal> {
  // Validate owner exists if provided
  if (params.ownerId) {
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.id, params.ownerId),
        eq(users.organizationId, ctx.organizationId)
      ),
    });
    if (!user) throw new ValidationError('Owner not found');
  }
  
  // Create pending approval
  const [proposal] = await db.insert(pendingApprovals).values({
    userId: ctx.userId,
    conversationId: ctx.conversationId,
    proposalType: 'action',
    proposalData: params,
    status: 'pending',
    expiresAt: addHours(new Date(), 24),
  }).returning();
  
  return {
    id: proposal.id,
    type: 'action',
    data: params,
    status: 'pending',
  };
}
```

---

## Authorization Middleware

```typescript
export interface AgentContext {
  userId: string;
  organizationId: string;
  roles: string[];
  conversationId?: string;
}

export async function authorizeAgentContext(
  req: Request,
  toolName: string
): Promise<AgentContext> {
  const session = await getSession(req);
  if (!session) throw new UnauthorizedError('Not authenticated');
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    with: { organization: true },
  });
  
  if (!user) throw new UnauthorizedError('User not found');
  
  const toolPermissions: Record<string, string[]> = {
    getMeetings: ['member', 'admin'],
    getMeetingDetails: ['member', 'admin'],
    getActionItems: ['member', 'admin'],
    getDecisions: ['member', 'admin'],
    searchContent: ['member', 'admin'],
    getPersonContext: ['member', 'admin'],
    proposeActionItem: ['member', 'admin'],
    proposeDecision: ['admin'],
  };
  
  const required = toolPermissions[toolName] || ['admin'];
  const userRoles = user.roles || ['member'];
  
  if (!required.some(r => userRoles.includes(r))) {
    throw new ForbiddenError('Insufficient permissions');
  }
  
  return {
    userId: user.id,
    organizationId: user.organizationId,
    roles: userRoles,
    conversationId: req.headers.get('x-conversation-id') || undefined,
  };
}
```

---

## Approval Resolution API

```typescript
// app/api/agent/approvals/[id]/route.ts
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { action, edits, feedback } = await req.json();
  const ctx = await authorizeAgentContext(req, 'approvals');
  
  const approval = await db.query.pendingApprovals.findFirst({
    where: and(
      eq(pendingApprovals.id, params.id),
      eq(pendingApprovals.userId, ctx.userId),
      eq(pendingApprovals.status, 'pending'),
    ),
  });
  
  if (!approval) throw new NotFoundError('Approval not found');
  
  switch (action) {
    case 'approve': {
      const data = edits || approval.proposalData;
      
      if (approval.proposalType === 'action') {
        await db.insert(actionItems).values({
          ...data,
          organizationId: ctx.organizationId,
          createdBy: ctx.userId,
          aiAssisted: true,
        });
      } else if (approval.proposalType === 'decision') {
        await db.insert(decisions).values({
          ...data,
          organizationId: ctx.organizationId,
          createdBy: ctx.userId,
          aiAssisted: true,
        });
      }
      
      await db.update(pendingApprovals)
        .set({ status: 'approved', resolvedAt: new Date() })
        .where(eq(pendingApprovals.id, params.id));
      break;
    }
    
    case 'reject': {
      await db.update(pendingApprovals)
        .set({ status: 'rejected', resolvedAt: new Date(), feedback })
        .where(eq(pendingApprovals.id, params.id));
      break;
    }
  }
  
  return Response.json({ success: true });
}
```

---

## File Structure

```
apps/web/
+-- lib/
|   +-- agent/
|       +-- tools/
|       |   +-- index.ts           # Tool registry
|       |   +-- schemas.ts         # Zod schemas
|       |   +-- get-meetings.ts
|       |   +-- get-meeting-details.ts
|       |   +-- get-actions.ts
|       |   +-- get-decisions.ts
|       |   +-- search-content.ts
|       |   +-- get-person-context.ts
|       |   +-- propose-action.ts
|       |   +-- propose-decision.ts
|       +-- auth/
|           +-- agent-context.ts   # Authorization middleware
+-- app/
    +-- api/
        +-- agent/
            +-- chat/
            |   +-- route.ts       # Streaming chat endpoint
            +-- approvals/
                +-- route.ts       # List approvals
                +-- [id]/
                    +-- route.ts   # Resolve approval
```
