# ARCHITECTURE-agent-sidebar.md
**Feature:** Agent Sidebar Component Architecture
**Created:** 2026-01-21
**Author:** architect-agent

---

## Overview

The Agent Sidebar is a persistent, collapsible panel providing AI-assisted functionality throughout SPARK Platform. It manages streaming conversations, mode switching, context scoping, and approval workflows for agent-proposed changes.

---

## Component Hierarchy

```
AgentSidebarProvider (React Context)
└── AgentSidebar
    ├── AgentHeader
    │   ├── ModeSelector (dropdown)
    │   └── ContextSelector (scope picker)
    ├── ConversationList (collapsible history)
    │   ├── ConversationItem[]
    │   └── NewConversationButton
    ├── ChatMessages (virtual scroll)
    │   ├── UserMessage
    │   ├── AgentMessage (streaming)
    │   │   └── MarkdownRenderer
    │   └── ApprovalCard
    │       ├── ProposalPreview
    │       └── ApprovalActions
    ├── QuickActions (context-aware)
    │   └── QuickActionButton[]
    └── ChatInput
        ├── TextArea (auto-resize)
        └── SendButton
```

---

## State Management Design

### Zustand Store Structure

```typescript
// stores/agent-store.ts
interface AgentStore {
  // Sidebar state
  isOpen: boolean;
  width: number;
  
  // Mode & context
  mode: AgentMode;
  context: AgentContext;
  
  // Conversation state
  activeConversationId: string | null;
  messages: Message[];
  isStreaming: boolean;
  streamingContent: string;
  
  // Approvals
  pendingApprovals: Proposal[];
  
  // Actions
  toggle: () => void;
  setMode: (mode: AgentMode) => void;
  setContext: (context: AgentContext) => void;
  addMessage: (message: Message) => void;
  appendToStream: (chunk: string) => void;
  finalizeStream: () => void;
  addProposal: (proposal: Proposal) => void;
  resolveProposal: (id: string, action: 'approve' | 'reject') => void;
}
```

### React Query for Persistence

```typescript
// Conversation history queries
const { data: conversations } = useQuery({
  queryKey: ['conversations', userId],
  queryFn: () => fetchConversations(userId),
  staleTime: 5 * 60 * 1000,
});

// Save conversation mutation
const saveMutation = useMutation({
  mutationFn: saveConversation,
  onSuccess: () => queryClient.invalidateQueries(['conversations']),
});
```

### Streaming State Machine

```
IDLE → WAITING → STREAMING → COMPLETE
  ↑                           │
  └───────────────────────────┘
```

States:
- **IDLE**: Ready for input
- **WAITING**: Request sent, awaiting first token
- **STREAMING**: Receiving tokens, appending to streamingContent
- **COMPLETE**: Stream finished, message finalized

---

## TypeScript Interfaces

```typescript
// types/agent.ts
type AgentMode = 
  | 'general'
  | 'meeting-prep'
  | 'action-extractor'
  | 'decision-analyzer'
  | 'follow-up-nudger';

interface AgentContext {
  type: 'page' | 'meeting' | 'series' | 'dateRange' | 'all';
  meetingId?: string;
  seriesId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  proposals?: Proposal[];
}

interface Proposal {
  id: string;
  type: 'action' | 'decision';
  data: ActionItemData | DecisionData;
  status: 'pending' | 'approved' | 'rejected';
  sourceQuote?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  mode: AgentMode;
  context: AgentContext;
  createdAt: Date;
  updatedAt: Date;
}
```

### Component Props

```typescript
interface AgentSidebarProps {
  defaultOpen?: boolean;
  onClose?: () => void;
}

interface ModeSelectorProps {
  value: AgentMode;
  onChange: (mode: AgentMode) => void;
}

interface ContextSelectorProps {
  value: AgentContext;
  onChange: (ctx: AgentContext) => void;
  currentPage: PageContext;
}

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

interface ApprovalCardProps {
  proposal: Proposal;
  onApprove: (id: string) => void;
  onEdit: (id: string) => void;
  onReject: (id: string) => void;
}

interface QuickActionsProps {
  mode: AgentMode;
  context: AgentContext;
  onAction: (prompt: string) => void;
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + J` | Toggle sidebar |
| `Cmd/Ctrl + Enter` | Send message |
| `Cmd/Ctrl + N` | New conversation |
| `Escape` | Close sidebar (when focused) |
| `Cmd/Ctrl + K` | Focus input |
| `Tab` (in ApprovalCard) | Cycle between Approve/Edit/Reject |

Implementation via `useHotkeys` or custom hook:

```typescript
// hooks/useAgentShortcuts.ts
export function useAgentShortcuts() {
  const { toggle, isOpen } = useAgentStore();
  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);
}
```

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1024px) | Side-by-side, resizable 320-600px, persists state |
| Tablet (768-1024px) | Overlay sheet, slides from right, backdrop blur |
| Mobile (<768px) | Full-screen takeover, swipe-to-close |

```typescript
// hooks/useAgentLayout.ts
export function useAgentLayout() {
  const { width: viewport } = useWindowSize();
  
  const layout = useMemo(() => {
    if (viewport < 768) return 'fullscreen';
    if (viewport < 1024) return 'overlay';
    return 'sidebar';
  }, [viewport]);
  
  return { layout };
}
```

---

## Integration Points

- **Layout Provider**: Wrap in root layout, manages width allocation
- **Page Context Hook**: Auto-detect meeting/action/decision pages
- **Auth Context**: User permissions for context scoping
- **Keyboard Shortcuts**: Global listener at app level

---

## Trade-offs

| Decision | Rationale |
|----------|-----------|
| Zustand over Redux | Simpler API, less boilerplate for local UI state |
| React Query for persistence | Automatic caching, background sync, optimistic updates |
| CSS-in-JS (Tailwind) | Consistent with SPARK codebase, co-located styles |
| Virtual scroll for messages | Performance with long conversation history |

---

## File Structure

```
apps/web/components/agent/
├── AgentSidebar.tsx
├── AgentHeader.tsx
├── AgentSidebarProvider.tsx
├── ChatMessages.tsx
├── ChatMessage.tsx
├── ChatInput.tsx
├── ModeSelector.tsx
├── ContextSelector.tsx
├── QuickActions.tsx
├── ApprovalCard.tsx
├── ConversationList.tsx
└── hooks/
    ├── useAgentStore.ts
    ├── useAgentChat.ts
    ├── useAgentShortcuts.ts
    ├── useAgentLayout.ts
    └── useApprovals.ts
```
