# TASKS-004: AI Agent Integration - Implementation Tasks

**Feature:** AI Agent Integration with Claude SDK
**PRD:** PRD-004-agent-integration.md
**Architecture Docs**:
- ARCHITECTURE-agent-sidebar.md
- ARCHITECTURE-event-hooks.md
- ARCHITECTURE-agent-skills.md
- ARCHITECTURE-mcp-server.md
**Created:** 2026-01-21

---

## Phase 1: Foundation (Weeks 1-2)

### Dependencies & SDK Setup

- [ ] **TASK-A001**: Install Claude Agent SDK
  - Install `@anthropic-ai/agent-sdk` (verify package name)
  - Add Anthropic API key to environment variables
  - **Files**: `apps/web/package.json`, `.env`
  - **Dependencies**: None
  - **Complexity**: S
  - **Acceptance**: SDK installed, API key configured

- [ ] **TASK-A002**: Create agent client wrapper
  - Initialize Agent with model, tools, system prompt
  - Export streaming function
  - **Files**: `apps/web/lib/agent/client.ts` (new)
  - **Dependencies**: TASK-A001
  - **Complexity**: M
  - **Acceptance**: Client wrapper exports `streamAgentResponse` function

- [ ] **TASK-A003**: Create agent TypeScript types
  - Define `AgentMode`, `AgentContext`, `Message`, `Proposal`, `Conversation`
  - **Files**: `apps/web/lib/agent/types.ts` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: Types compile, exported correctly

### Database Schema

- [ ] **TASK-A004**: Create agent database migrations
  - Tables: `agent_conversations`, `agent_messages`, `agent_events`, `agent_hook_configs`, `agent_pending_approvals`
  - **Files**: `packages/db/migrations/YYYYMMDD_agent_tables.sql` (new)
  - **Dependencies**: None
  - **Complexity**: L
  - **Acceptance**: Migrations run successfully, tables created

- [ ] **TASK-A005**: Create Drizzle schema for agent tables
  - Define schemas for all agent tables
  - Set up relations
  - **Files**: `packages/db/src/schema/agent.ts` (new)
  - **Dependencies**: TASK-A004
  - **Complexity**: M
  - **Acceptance**: Schema compiles, types generated

### Streaming API Route

- [ ] **TASK-A006**: Create /api/agent/chat route
  - Accept POST with messages, mode, context
  - Implement streaming response with TransformStream
  - Handle errors gracefully
  - **Files**: `apps/web/app/api/agent/chat/route.ts` (new)
  - **Dependencies**: TASK-A002
  - **Complexity**: L
  - **Acceptance**: Route streams responses, handles errors

- [ ] **TASK-A007**: Test streaming with simple prompt
  - Send test request to /api/agent/chat
  - Verify tokens stream correctly
  - Check error handling
  - **Files**: N/A (testing task)
  - **Dependencies**: TASK-A006
  - **Complexity**: S
  - **Acceptance**: Streaming works, first token < 1s

### Basic Sidebar Shell

- [ ] **TASK-A008**: Create AgentSidebar component shell
  - Collapsible panel container
  - Toggle button
  - Basic layout structure
  - **Files**: `apps/web/components/agent/AgentSidebar.tsx` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: Sidebar renders, toggles open/close

- [ ] **TASK-A009**: Create Zustand store for agent state
  - State: isOpen, width, mode, context, messages, isStreaming, pendingApprovals
  - Actions: toggle, setMode, addMessage, appendToStream, etc.
  - **Files**: `apps/web/components/agent/hooks/useAgentStore.ts` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: Store compiles, state management works

- [ ] **TASK-A010**: Add sidebar to root layout
  - Integrate AgentSidebar into app layout
  - Position on right side
  - **Files**: `apps/web/app/layout.tsx` or dashboard layout
  - **Dependencies**: TASK-A008
  - **Complexity**: S
  - **Acceptance**: Sidebar appears on all authenticated pages

### Chat Message Display

- [ ] **TASK-A011**: Create ChatMessages component
  - Scrollable message list
  - Auto-scroll to latest
  - **Files**: `apps/web/components/agent/ChatMessages.tsx` (new)
  - **Dependencies**: TASK-A009
  - **Complexity**: M
  - **Acceptance**: Messages display, scroll works

- [ ] **TASK-A012**: Create ChatMessage component
  - Display user/assistant messages
  - Markdown rendering
  - Streaming cursor during generation
  - **Files**: `apps/web/components/agent/ChatMessage.tsx` (new)
  - **Dependencies**: TASK-A011
  - **Complexity**: M
  - **Acceptance**: Messages render, markdown works, streaming shows cursor

- [ ] **TASK-A013**: Create ChatInput component
  - Textarea with auto-resize
  - Send button
  - Enter to send, Shift+Enter for newline
  - **Files**: `apps/web/components/agent/ChatInput.tsx` (new)
  - **Dependencies**: None
  - **Complexity**: S
  - **Acceptance**: Input works, keyboard shortcuts function

- [ ] **TASK-A014**: Implement useAgentChat hook
  - Send message function
  - Handle streaming response
  - Update messages in real-time
  - **Files**: `apps/web/components/agent/hooks/useAgentChat.ts` (new)
  - **Dependencies**: TASK-A009, TASK-A006
  - **Complexity**: L
  - **Acceptance**: Sending message triggers streaming, messages update live

---

## Phase 2: Core Interaction (Weeks 3-4)

### Mode Selector

- [ ] **TASK-A015**: Create ModeSelector component
  - Dropdown with 5 modes: General, Meeting Prep, Action Extractor, Decision Analyzer, Follow-up Nudger
  - Visual indicator of current mode
  - **Files**: `apps/web/components/agent/ModeSelector.tsx` (new)
  - **Dependencies**: TASK-A009
  - **Complexity**: M
  - **Acceptance**: Dropdown shows modes, selection updates store

- [ ] **TASK-A016**: Create system prompts for each mode
  - Write system prompts for all 5 modes
  - Store in separate files for easy editing
  - **Files**: `apps/web/lib/agent/prompts/*.ts` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: All prompts written, exported correctly

- [ ] **TASK-A017**: Integrate mode into chat API
  - Build system prompt based on selected mode
  - Pass to agent client
  - **Files**: `apps/web/app/api/agent/chat/route.ts`
  - **Dependencies**: TASK-A016
  - **Complexity**: S
  - **Acceptance**: Mode affects agent behavior

### Context Selector

- [ ] **TASK-A018**: Create ContextSelector component
  - Dropdown with options: Current page, Specific meeting, Meeting series, Date range, All data
  - Auto-detect current page context
  - **Files**: `apps/web/components/agent/ContextSelector.tsx` (new)
  - **Dependencies**: TASK-A009
  - **Complexity**: M
  - **Acceptance**: Dropdown shows options, selection updates store

- [ ] **TASK-A019**: Implement page context detection hook
  - Detect if on meeting/action/decision page
  - Auto-populate context based on page
  - **Files**: `apps/web/components/agent/hooks/usePageContext.ts` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: Hook detects page type, returns relevant context

- [ ] **TASK-A020**: Integrate context into chat API
  - Scope tool responses based on context
  - Pass context to MCP tools
  - **Files**: `apps/web/app/api/agent/chat/route.ts`
  - **Dependencies**: TASK-A018
  - **Complexity**: M
  - **Acceptance**: Context restricts data access correctly

### Platform MCP Tools (Read-Only)

- [ ] **TASK-A021**: Create tool schemas with Zod
  - Define schemas for getMeetings, getMeetingDetails, getActionItems, getDecisions, searchContent, getPersonContext
  - **Files**: `apps/web/lib/agent/tools/schemas.ts` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: Schemas validate correctly

- [ ] **TASK-A022**: Implement getMeetings tool
  - Query meetings with filters (startDate, endDate, seriesId, attendeeId)
  - Return Meeting[] with relations
  - **Files**: `apps/web/lib/agent/tools/get-meetings.ts` (new)
  - **Dependencies**: TASK-A021, TASK-A005
  - **Complexity**: M
  - **Acceptance**: Tool returns filtered meetings

- [ ] **TASK-A023**: Implement getMeetingDetails tool
  - Query single meeting with notes, actions, decisions
  - **Files**: `apps/web/lib/agent/tools/get-meeting-details.ts` (new)
  - **Dependencies**: TASK-A021, TASK-A005
  - **Complexity**: S
  - **Acceptance**: Tool returns full meeting data

- [ ] **TASK-A024**: Implement getActionItems tool
  - Query actions with filters (status, ownerId, meetingId, dueDateRange)
  - **Files**: `apps/web/lib/agent/tools/get-actions.ts` (new)
  - **Dependencies**: TASK-A021, TASK-A005
  - **Complexity**: M
  - **Acceptance**: Tool returns filtered actions

- [ ] **TASK-A025**: Implement getDecisions tool
  - Query decisions with filters (search, meetingId, decidedById, dateRange)
  - **Files**: `apps/web/lib/agent/tools/get-decisions.ts` (new)
  - **Dependencies**: TASK-A021, TASK-A005
  - **Complexity**: M
  - **Acceptance**: Tool returns filtered decisions

- [ ] **TASK-A026**: Implement searchContent tool
  - Full-text search across meetings, actions, decisions
  - Use pg_trgm or tsvector
  - **Files**: `apps/web/lib/agent/tools/search-content.ts` (new)
  - **Dependencies**: TASK-A021, TASK-A005
  - **Complexity**: L
  - **Acceptance**: Tool returns relevant search results

- [ ] **TASK-A027**: Implement getPersonContext tool
  - Return user with recent actions, decisions, meetings
  - **Files**: `apps/web/lib/agent/tools/get-person-context.ts` (new)
  - **Dependencies**: TASK-A021, TASK-A005
  - **Complexity**: M
  - **Acceptance**: Tool returns person context

- [ ] **TASK-A028**: Register tools with agent client
  - Create tool registry
  - Pass tools to Agent SDK
  - **Files**: `apps/web/lib/agent/tools/index.ts` (new), `client.ts`
  - **Dependencies**: TASK-A022-A027
  - **Complexity**: M
  - **Acceptance**: Agent can invoke all tools

### Chat History Persistence

- [ ] **TASK-A029**: Implement conversation save mutation
  - Save conversation to database
  - Store messages, mode, context
  - **Files**: `apps/web/lib/api/agent-conversations.ts` (new)
  - **Dependencies**: TASK-A005
  - **Complexity**: M
  - **Acceptance**: Conversations save to database

- [ ] **TASK-A030**: Create ConversationList component
  - Display past conversations
  - Click to load conversation
  - **Files**: `apps/web/components/agent/ConversationList.tsx` (new)
  - **Dependencies**: TASK-A029
  - **Complexity**: M
  - **Acceptance**: List shows conversations, loading works

- [ ] **TASK-A031**: Implement New Conversation button
  - Clear current conversation
  - Start fresh context
  - **Files**: `apps/web/components/agent/AgentSidebar.tsx`
  - **Dependencies**: TASK-A009
  - **Complexity**: S
  - **Acceptance**: Button clears messages, starts new chat

- [ ] **TASK-A032**: Auto-title conversations
  - Generate title from first message
  - Update conversation record
  - **Files**: `apps/web/lib/api/agent-conversations.ts`
  - **Dependencies**: TASK-A029
  - **Complexity**: S
  - **Acceptance**: Conversations get auto-generated titles

---

## Phase 3: Approval Workflow (Week 5)

### Proposal Tools

- [ ] **TASK-A033**: Implement proposeActionItem tool
  - Create pendingApprovals record
  - Return proposal object
  - **Files**: `apps/web/lib/agent/tools/propose-action.ts` (new)
  - **Dependencies**: TASK-A021, TASK-A005
  - **Complexity**: M
  - **Acceptance**: Tool creates pending approval, returns proposal

- [ ] **TASK-A034**: Implement proposeDecision tool
  - Create pendingApprovals record
  - Return proposal object
  - **Files**: `apps/web/lib/agent/tools/propose-decision.ts` (new)
  - **Dependencies**: TASK-A021, TASK-A005
  - **Complexity**: M
  - **Acceptance**: Tool creates pending approval, returns proposal

- [ ] **TASK-A035**: Register proposal tools with agent
  - Add to tool registry
  - Configure for specific modes
  - **Files**: `apps/web/lib/agent/tools/index.ts`
  - **Dependencies**: TASK-A033, TASK-A034
  - **Complexity**: S
  - **Acceptance**: Agent can invoke proposal tools

### Approval Card UI

- [ ] **TASK-A036**: Create ApprovalCard component
  - Display proposal type, title, key fields
  - Approve, Edit, Reject buttons
  - **Files**: `apps/web/components/agent/ApprovalCard.tsx` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: Card displays proposal data, buttons render

- [ ] **TASK-A037**: Implement approval actions
  - Approve: Create item, mark AI-assisted
  - Edit: Open edit modal, then approve
  - Reject: Dismiss proposal
  - **Files**: `apps/web/components/agent/ApprovalCard.tsx`, hooks
  - **Dependencies**: TASK-A036
  - **Complexity**: L
  - **Acceptance**: All actions work, items created correctly

- [ ] **TASK-A038**: Create /api/agent/approvals/[id] route
  - POST to resolve approval (approve/reject)
  - Handle edits before approval
  - **Files**: `apps/web/app/api/agent/approvals/[id]/route.ts` (new)
  - **Dependencies**: TASK-A005
  - **Complexity**: M
  - **Acceptance**: Route resolves approvals, creates items

- [ ] **TASK-A039**: Integrate approvals into chat messages
  - Display ApprovalCard for proposals in message stream
  - **Files**: `apps/web/components/agent/ChatMessage.tsx`
  - **Dependencies**: TASK-A036
  - **Complexity**: M
  - **Acceptance**: Proposals render as approval cards in chat

### AI-Assisted Tagging

- [ ] **TASK-A040**: Add aiAssisted field to action/decision schemas
  - Add boolean column to actionItems and decisions tables
  - Migration to add field
  - **Files**: `packages/db/migrations/YYYYMMDD_ai_assisted.sql` (new)
  - **Dependencies**: None
  - **Complexity**: S
  - **Acceptance**: Field exists, defaults to false

- [ ] **TASK-A041**: Add AI-assisted badge to action/decision cards
  - Display badge when aiAssisted = true
  - **Files**: `apps/web/components/actions/ActionCard.tsx`, decisions card
  - **Dependencies**: TASK-A040
  - **Complexity**: S
  - **Acceptance**: Badge appears on AI-created items

### Audit Logging

- [ ] **TASK-A042**: Implement agent event logging
  - Log all agent conversations to agent_events table
  - Include user, timestamp, messages, tools invoked
  - **Files**: `apps/web/lib/agent/audit.ts` (new)
  - **Dependencies**: TASK-A005
  - **Complexity**: M
  - **Acceptance**: All agent actions logged

---

## Phase 4: Specialized Modes (Weeks 6-7)

### Mode-Specific Prompts

- [ ] **TASK-A043**: Refine General Assistant prompt
  - Update with platform-specific context
  - Test with common queries
  - **Files**: `apps/web/lib/agent/prompts/general.ts`
  - **Dependencies**: TASK-A016
  - **Complexity**: M
  - **Acceptance**: General mode handles queries well

- [ ] **TASK-A044**: Refine Meeting Prep prompt
  - Briefing format, meeting history logic
  - Test with sample meeting
  - **Files**: `apps/web/lib/agent/prompts/meeting-prep.ts`
  - **Dependencies**: TASK-A016
  - **Complexity**: M
  - **Acceptance**: Meeting Prep generates comprehensive briefings

- [ ] **TASK-A045**: Refine Action Extractor prompt
  - Extraction rules, owner detection, date inference
  - Test with sample meeting notes
  - **Files**: `apps/web/lib/agent/prompts/action-extractor.ts`
  - **Dependencies**: TASK-A016
  - **Complexity**: M
  - **Acceptance**: Action Extractor identifies commitments accurately

- [ ] **TASK-A046**: Refine Decision Analyzer prompt
  - Related decision search, timeline building
  - Test with historical data
  - **Files**: `apps/web/lib/agent/prompts/decision-analyzer.ts`
  - **Dependencies**: TASK-A016
  - **Complexity**: M
  - **Acceptance**: Decision Analyzer finds patterns, related decisions

- [ ] **TASK-A047**: Refine Follow-up Nudger prompt
  - Tone calibration by overdue status
  - Test draft messages
  - **Files**: `apps/web/lib/agent/prompts/follow-up-nudger.ts`
  - **Dependencies**: TASK-A016
  - **Complexity**: M
  - **Acceptance**: Follow-up Nudger drafts appropriate reminders

### Mode-Specific Tool Subsets

- [ ] **TASK-A048**: Configure tool availability per mode
  - Define which tools each mode can access
  - Enforce in agent client
  - **Files**: `apps/web/lib/agent/skills/index.ts` (new)
  - **Dependencies**: TASK-A028
  - **Complexity**: M
  - **Acceptance**: Each mode has correct tool subset

- [ ] **TASK-A049**: Set token budgets per mode
  - Define context and response token limits
  - Implement budget enforcement
  - **Files**: `apps/web/lib/agent/skills/index.ts`
  - **Dependencies**: TASK-A048
  - **Complexity**: S
  - **Acceptance**: Token budgets enforced per mode

---

## Phase 5: Event Hooks (Week 8)

### Event System

- [ ] **TASK-A050**: Create event bus
  - EventBus class with emit and on methods
  - Support in-memory or queue (Inngest) based on config
  - **Files**: `apps/web/lib/events/event-bus.ts` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: Event bus emits and handles events

- [ ] **TASK-A051**: Define event types
  - MeetingCompletedEvent, ActionItemCreatedEvent, DueDateApproachingEvent, StaleItemDetectedEvent, WeeklyDigestEvent
  - **Files**: `apps/web/lib/events/types.ts` (new)
  - **Dependencies**: None
  - **Complexity**: S
  - **Acceptance**: All event types defined

- [ ] **TASK-A052**: Install Inngest (optional, for production)
  - Install Inngest SDK
  - Configure Inngest client
  - **Files**: `apps/web/package.json`, `apps/web/lib/inngest/client.ts` (new)
  - **Dependencies**: None
  - **Complexity**: M
  - **Acceptance**: Inngest configured (or skip for dev)

### Hook Handlers

- [ ] **TASK-A053**: Implement handleMeetingCompleted
  - Check user settings for autoExtractActions
  - Call agent to extract actions
  - Create pending approvals
  - **Files**: `apps/web/lib/events/handlers/meeting-completed.ts` (new)
  - **Dependencies**: TASK-A050, TASK-A033
  - **Complexity**: L
  - **Acceptance**: Hook extracts actions when meeting completes

- [ ] **TASK-A054**: Implement handleActionCreated
  - Suggest due date and priority
  - Create proposal
  - **Files**: `apps/web/lib/events/handlers/action-created.ts` (new)
  - **Dependencies**: TASK-A050, TASK-A033
  - **Complexity**: M
  - **Acceptance**: Hook suggests due date/priority for new actions

- [ ] **TASK-A055**: Implement handleDueDateApproaching
  - Notify owner N days before due
  - Send in-app notification and email
  - **Files**: `apps/web/lib/events/handlers/due-date-approaching.ts` (new)
  - **Dependencies**: TASK-A050
  - **Complexity**: M
  - **Acceptance**: Hook sends reminders before due date

- [ ] **TASK-A056**: Implement handleStaleItem
  - Alert when action not updated in X days
  - Notify assignee and stakeholders
  - **Files**: `apps/web/lib/events/handlers/stale-item.ts` (new)
  - **Dependencies**: TASK-A050
  - **Complexity**: M
  - **Acceptance**: Hook alerts on stale items

- [ ] **TASK-A057**: Implement handleWeeklyDigest
  - Send summary email of open items, upcoming meetings
  - Schedule Sunday evening (cron)
  - **Files**: `apps/web/lib/events/handlers/weekly-digest.ts` (new)
  - **Dependencies**: TASK-A050
  - **Complexity**: L
  - **Acceptance**: Digest emails sent weekly

### Hook Configuration

- [ ] **TASK-A058**: Create hook settings UI
  - User settings page section for hooks
  - Toggle each hook on/off
  - Configure thresholds (e.g., stale after X days)
  - **Files**: `apps/web/app/(dashboard)/settings/hooks/page.tsx` (new)
  - **Dependencies**: TASK-A005
  - **Complexity**: M
  - **Acceptance**: Users can configure hooks

- [ ] **TASK-A059**: Implement getHookSettings function
  - Query agent_hook_configs for user
  - Return settings object
  - **Files**: `apps/web/lib/api/hook-settings.ts` (new)
  - **Dependencies**: TASK-A005
  - **Complexity**: S
  - **Acceptance**: Settings retrieved correctly

### Event Emission Points

- [ ] **TASK-A060**: Emit MeetingCompleted event
  - Trigger when meeting marked complete
  - Add to meeting update API route
  - **Files**: `apps/web/app/api/meetings/[id]/route.ts`
  - **Dependencies**: TASK-A050
  - **Complexity**: S
  - **Acceptance**: Event emitted when meeting completed

- [ ] **TASK-A061**: Emit ActionItemCreated event
  - Trigger on action creation
  - Add to action create API route
  - **Files**: `apps/web/app/api/actions/route.ts`
  - **Dependencies**: TASK-A050
  - **Complexity**: S
  - **Acceptance**: Event emitted when action created

---

## Phase 6: Polish & Enhancements (Weeks 9-10)

### Quick Actions

- [ ] **TASK-A062**: Create QuickActions component
  - Context-aware buttons above chat input
  - Different actions per page and mode
  - **Files**: `apps/web/components/agent/QuickActions.tsx` (new)
  - **Dependencies**: TASK-A018
  - **Complexity**: M
  - **Acceptance**: Quick actions display, vary by context

- [ ] **TASK-A063**: Define quick actions per page
  - Meeting page: "Summarize", "Extract Actions", "Draft Follow-up"
  - Actions page: "Find Overdue", "Suggest Priorities"
  - Decisions page: "Find Related", "Analyze Patterns"
  - **Files**: `apps/web/components/agent/QuickActions.tsx`
  - **Dependencies**: TASK-A062
  - **Complexity**: S
  - **Acceptance**: Quick actions match page context

### Conversation Management

- [ ] **TASK-A064**: Add delete conversation
  - Delete button on conversation items
  - Confirm before delete
  - **Files**: `apps/web/components/agent/ConversationList.tsx`
  - **Dependencies**: TASK-A030
  - **Complexity**: S
  - **Acceptance**: Delete removes conversation

- [ ] **TASK-A065**: Add search conversations
  - Search bar in conversation list
  - Filter by title or content
  - **Files**: `apps/web/components/agent/ConversationList.tsx`
  - **Dependencies**: TASK-A030
  - **Complexity**: M
  - **Acceptance**: Search finds conversations

### Keyboard Shortcuts

- [ ] **TASK-A066**: Implement Cmd/Ctrl + J to toggle sidebar
  - Global keyboard listener
  - Toggle sidebar open/close
  - **Files**: `apps/web/components/agent/hooks/useAgentShortcuts.ts` (new)
  - **Dependencies**: TASK-A009
  - **Complexity**: S
  - **Acceptance**: Shortcut toggles sidebar

- [ ] **TASK-A067**: Implement Cmd/Ctrl + Enter to send message
  - Shortcut in ChatInput
  - **Files**: `apps/web/components/agent/ChatInput.tsx`
  - **Dependencies**: TASK-A013
  - **Complexity**: S
  - **Acceptance**: Shortcut sends message

- [ ] **TASK-A068**: Implement Cmd/Ctrl + K to focus input
  - Global shortcut to focus chat input
  - **Files**: `apps/web/components/agent/hooks/useAgentShortcuts.ts`
  - **Dependencies**: TASK-A066
  - **Complexity**: S
  - **Acceptance**: Shortcut focuses input

- [ ] **TASK-A069**: Implement Escape to close sidebar
  - Close sidebar when focused and Escape pressed
  - **Files**: `apps/web/components/agent/AgentSidebar.tsx`
  - **Dependencies**: TASK-A008
  - **Complexity**: S
  - **Acceptance**: Escape closes sidebar

### Mobile Responsive

- [ ] **TASK-A070**: Implement mobile layout for sidebar
  - Full-screen takeover on < 768px
  - Swipe-to-close gesture
  - **Files**: `apps/web/components/agent/AgentSidebar.tsx`
  - **Dependencies**: TASK-A008
  - **Complexity**: M
  - **Acceptance**: Mobile shows full-screen sidebar, swipe works

- [ ] **TASK-A071**: Test all features on mobile
  - Mode selector, context selector, chat, approvals
  - **Files**: N/A (testing task)
  - **Dependencies**: TASK-A070
  - **Complexity**: M
  - **Acceptance**: All features work on mobile

### Error Handling & Loading States

- [ ] **TASK-A072**: Add loading indicators
  - Spinner/skeleton during agent thinking
  - Loading state for tool invocations
  - **Files**: `apps/web/components/agent/ChatMessage.tsx`
  - **Dependencies**: TASK-A012
  - **Complexity**: S
  - **Acceptance**: Loading states show during generation

- [ ] **TASK-A073**: Implement error states
  - Display error messages clearly
  - Retry button
  - **Files**: `apps/web/components/agent/ChatMessage.tsx`
  - **Dependencies**: TASK-A012
  - **Complexity**: S
  - **Acceptance**: Errors display, retry works

- [ ] **TASK-A074**: Add empty state for no conversations
  - Message when no conversation history
  - Suggestions to get started
  - **Files**: `apps/web/components/agent/ConversationList.tsx`
  - **Dependencies**: TASK-A030
  - **Complexity**: S
  - **Acceptance**: Empty state shows helpful message

### Performance Optimization

- [ ] **TASK-A075**: Implement virtual scrolling for messages
  - Use react-window or similar for long conversations
  - **Files**: `apps/web/components/agent/ChatMessages.tsx`
  - **Dependencies**: TASK-A011
  - **Complexity**: M
  - **Acceptance**: Long conversations scroll smoothly

- [ ] **TASK-A076**: Add token budget warnings
  - Warn user when approaching token limit
  - Truncate context if needed
  - **Files**: `apps/web/lib/agent/client.ts`
  - **Dependencies**: TASK-A002
  - **Complexity**: M
  - **Acceptance**: Token budget enforced, warnings shown

### Security & Authorization

- [ ] **TASK-A077**: Implement agent context authorization
  - Verify user has access to requested data
  - Scope tools by organization and permissions
  - **Files**: `apps/web/lib/agent/auth/agent-context.ts` (new)
  - **Dependencies**: TASK-A028
  - **Complexity**: L
  - **Acceptance**: Tools respect user permissions

- [ ] **TASK-A078**: Add rate limiting for agent requests
  - Limit requests per user (e.g., 100/hour)
  - Return 429 when exceeded
  - **Files**: `apps/web/app/api/agent/chat/route.ts`
  - **Dependencies**: TASK-A006
  - **Complexity**: M
  - **Acceptance**: Rate limiting enforced

- [ ] **TASK-A079**: Implement token budget per user
  - Track token usage per user per day
  - Warn or block when limit reached
  - **Files**: `apps/web/lib/agent/token-tracking.ts` (new)
  - **Dependencies**: TASK-A006
  - **Complexity**: M
  - **Acceptance**: Token budgets enforced per user

### Documentation

- [ ] **TASK-A080**: Document agent system architecture
  - README for agent directory
  - Explain components, tools, modes
  - **Files**: `apps/web/components/agent/README.md` (new)
  - **Dependencies**: All previous tasks
  - **Complexity**: M
  - **Acceptance**: Documentation exists, clear for developers

---

## Summary

### Total Task Count: 80

### Breakdown by Complexity
- **S (Small)**: 28 tasks
- **M (Medium)**: 41 tasks
- **L (Large)**: 11 tasks
- **XL (Extra Large)**: 0 tasks

### Estimated Timeline
- **Phase 1 (Foundation)**: Weeks 1-2 (14 tasks)
- **Phase 2 (Core Interaction)**: Weeks 3-4 (18 tasks)
- **Phase 3 (Approval Workflow)**: Week 5 (10 tasks)
- **Phase 4 (Specialized Modes)**: Weeks 6-7 (7 tasks)
- **Phase 5 (Event Hooks)**: Week 8 (12 tasks)
- **Phase 6 (Polish)**: Weeks 9-10 (19 tasks)

**Total Duration**: 10 weeks (2.5 months)

### Suggested Priority Order
1. **Phase 1** (foundation - SDK, database, basic sidebar)
2. **Phase 2** (core interaction - mode/context, tools, persistence)
3. **Phase 3** (approval workflow - critical for safety)
4. **Phase 6** (polish essentials - shortcuts, mobile, errors)
5. **Phase 4** (specialized modes - iterate on prompts)
6. **Phase 5** (event hooks - automation layer)

**Rationale**: Get basic chat working first (Phases 1-2), add approval safety (Phase 3), then polish UX (Phase 6). Specialized modes and hooks can be refined iteratively.

### Critical Path
```
TASK-A001 → TASK-A002 → TASK-A003 → TASK-A004 → TASK-A005 → TASK-A006 →
TASK-A008 → TASK-A009 → TASK-A014 → TASK-A021 → TASK-A028 → TASK-A033 →
TASK-A037 → TASK-A077
```

**Key Dependencies**: SDK → Client → API → Sidebar → Chat → Tools → Approvals → Security

### MVP Scope (4 weeks)
For a minimal viable agent in 4 weeks, prioritize:
- Phase 1: TASK-A001-A014 (foundation, basic chat)
- Phase 2: TASK-A015-A020, TASK-A021-A028 (mode, context, tools)
- Phase 3: TASK-A033-A039 (approvals)
- Phase 6: TASK-A066-A069, TASK-A072-A073 (shortcuts, errors)

**Defer to post-MVP**:
- Specialized prompts refinement (Phase 4)
- Event hooks (Phase 5)
- Advanced polish (conversation search, virtual scroll)

---

**Ready for implementation**: Begin with Phase 1 (SDK setup, database, basic sidebar).
