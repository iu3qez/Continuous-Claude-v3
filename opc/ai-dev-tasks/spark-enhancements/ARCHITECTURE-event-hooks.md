# ARCHITECTURE-event-hooks.md
**Feature:** Event-Driven Hook System Architecture
**Created:** 2026-01-21
**Author:** architect-agent

---

## Overview

The event hook system enables automated agent actions triggered by platform events (meeting completion, due dates, stale items). Hooks operate asynchronously, queue proposals for approval, and respect user-configurable settings.

---

## Event Types and Payloads

```typescript
// types/events.ts
type SparkEvent =
  | MeetingCompletedEvent
  | ActionItemCreatedEvent
  | DueDateApproachingEvent
  | StaleItemDetectedEvent
  | WeeklyDigestEvent;

interface MeetingCompletedEvent {
  type: 'MEETING_COMPLETED';
  meetingId: string;
  userId: string;
  organizationId: string;
  timestamp: Date;
  payload: {
    title: string;
    attendeeIds: string[];
    hasNotes: boolean;
    duration: number;
  };
}

interface ActionItemCreatedEvent {
  type: 'ACTION_ITEM_CREATED';
  actionId: string;
  meetingId: string;
  userId: string;
  organizationId: string;
  timestamp: Date;
  payload: {
    title: string;
    ownerId: string;
    createdBy: string;
    isManual: boolean;
  };
}

interface DueDateApproachingEvent {
  type: 'DUE_DATE_APPROACHING';
  actionId: string;
  userId: string;
  organizationId: string;
  timestamp: Date;
  payload: {
    title: string;
    ownerId: string;
    dueDate: Date;
    daysUntilDue: number;
  };
}

interface StaleItemDetectedEvent {
  type: 'STALE_ITEM_DETECTED';
  actionId: string;
  userId: string;
  organizationId: string;
  timestamp: Date;
  payload: {
    title: string;
    ownerId: string;
    lastUpdated: Date;
    daysSinceUpdate: number;
  };
}

interface WeeklyDigestEvent {
  type: 'WEEKLY_DIGEST';
  userId: string;
  organizationId: string;
  timestamp: Date;
  payload: {
    periodStart: Date;
    periodEnd: Date;
  };
}
```

---

## Event Emitter Design

### Emission Points

Events are fired from API routes and server actions after successful mutations.

```
API Routes / Server Actions
      |
      v
EventBus.emit(event)
      |
      +---> In-Memory Handlers (dev)
      +---> Queue (Inngest) (production)
      +---> Webhook (future)
```

### Event Bus Implementation

```typescript
// lib/events/event-bus.ts
import { EventEmitter } from 'events';
import { inngest } from '@/lib/inngest';

class SparkEventBus {
  private emitter = new EventEmitter();
  private useQueue: boolean;

  constructor() {
    this.useQueue = process.env.USE_INNGEST === 'true';
  }

  async emit(event: SparkEvent): Promise<void> {
    await logEvent(event);

    if (this.useQueue) {
      await inngest.send({
        name: `spark/${event.type.toLowerCase()}`,
        data: event,
      });
    } else {
      this.emitter.emit(event.type, event);
    }
  }

  on(type: string, handler: (event: SparkEvent) => Promise<void>) {
    this.emitter.on(type, handler);
  }
}

export const eventBus = new SparkEventBus();
```

---

## Hook Handlers

### Handler Registration

```typescript
// lib/events/handlers/index.ts
export const hookHandlers: Record<string, HookHandler> = {
  MEETING_COMPLETED: handleMeetingCompleted,
  ACTION_ITEM_CREATED: handleActionCreated,
  DUE_DATE_APPROACHING: handleDueDateApproaching,
  STALE_ITEM_DETECTED: handleStaleItem,
  WEEKLY_DIGEST: handleWeeklyDigest,
};
```

### Meeting Completed Handler

```typescript
// lib/events/handlers/meeting-completed.ts
export async function handleMeetingCompleted(
  event: MeetingCompletedEvent
): Promise<void> {
  const settings = await getHookSettings(event.userId);
  if (!settings.autoExtractActions) return;

  const meeting = await getMeetingWithNotes(event.meetingId);
  if (!meeting.notes) return;

  const proposals = await agentClient.extractActions({
    meetingId: meeting.id,
    notes: meeting.notes,
    attendees: meeting.attendees,
  });

  await createPendingApprovals(event.userId, proposals);

  await notifyUser(event.userId, {
    type: 'PROPOSALS_READY',
    count: proposals.length,
    meetingTitle: meeting.title,
  });
}
```

---

## Queue/Job System Recommendation

| Option | Pros | Cons |
|--------|------|------|
| **Inngest** | Managed, retries, observability | Vendor dependency |
| Trigger.dev | OSS, self-hostable | Less mature |
| BullMQ + Redis | Full control | More infra |
| Simple cron | No dependencies | No retries |

**Recommendation: Inngest** - managed queue with retries, rate limiting, dashboard. Falls back to in-process for simple deployments.

---

## Database Schema Changes

```sql
-- agent_events: Audit log
CREATE TABLE agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- agent_hook_configs: User settings
CREATE TABLE agent_hook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  hook_type VARCHAR(50) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, hook_type)
);

-- agent_pending_approvals: Proposal queue
CREATE TABLE agent_pending_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  conversation_id UUID REFERENCES agent_conversations(id),
  proposal_type VARCHAR(20) NOT NULL,
  proposal_data JSONB NOT NULL,
  source_event_id UUID REFERENCES agent_events(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

---

## Inngest Integration

```typescript
// lib/inngest/functions/meeting-completed.ts
export const handleMeetingCompletedFn = inngest.createFunction(
  { id: 'meeting-completed-handler' },
  { event: 'spark/meeting_completed' },
  async ({ event, step }) => {
    const { meetingId, userId } = event.data;

    const settings = await step.run('check-settings', async () => {
      return getHookSettings(userId);
    });

    if (!settings.autoExtractActions) {
      return { skipped: true };
    }

    const proposals = await step.run('extract-actions', async () => {
      return agentClient.extractActions({ meetingId });
    });

    await step.run('create-approvals', async () => {
      return createPendingApprovals(userId, proposals);
    });

    return { proposalsCreated: proposals.length };
  }
);

// Scheduled weekly digest
export const weeklyDigestFn = inngest.createFunction(
  { id: 'weekly-digest' },
  { cron: '0 18 * * 0' },
  async ({ step }) => {
    const users = await step.run('get-users', getUsersWithDigestEnabled);
    
    await step.sendEvent('send-digests',
      users.map(u => ({
        name: 'spark/weekly_digest',
        data: { userId: u.id, organizationId: u.organizationId },
      }))
    );
  }
);
```

---

## Trade-offs

| Decision | Rationale |
|----------|-----------|
| Inngest over BullMQ | Managed service, less ops burden |
| JSONB for config | Flexible per-hook settings |
| Approval expiration | Prevents stale proposals |
| Event sourcing light | Audit without full CQRS |

---

## Integration with Continuous Claude

Mirrors ~/.claude/hooks/ patterns:
- Event types similar to PreToolUse/PostToolUse
- Handler registration like hook JSON configs
- Could share infrastructure for developer workflows
