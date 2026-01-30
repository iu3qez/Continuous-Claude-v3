# ARCHITECTURE-agent-skills.md
**Feature:** Agent Skills/Mode System Architecture
**Created:** 2026-01-21
**Author:** architect-agent

---

## Overview

The skill system provides specialized agent behaviors through mode-specific system prompts, tool configurations, and quick actions.

---

## Skill Interface

```typescript
interface AgentSkill {
  name: string;
  displayName: string;
  systemPrompt: string;
  tools: Tool[];
  quickActions: QuickAction[];
  tokenBudget: { context: number; response: number };
}
```

---

## System Prompts per Mode

### General Assistant
- Query meetings, action items, decisions
- Search semantically across content
- Provide summaries and analysis

### Meeting Prep
- Meeting series history (last 3)
- Open action items for attendees
- Attendee context
- Suggested agenda topics

### Action Extractor
- Parse notes for commitments
- Extract: title, owner, due date, priority
- Use proposeActionItem tool

### Decision Analyzer
- Find related past decisions
- Build timelines
- Spot patterns/contradictions

### Follow-up Nudger
- Draft reminder messages
- Tone based on overdue status

---

## Tool Definitions per Mode

| Mode | Tools |
|------|-------|
| general | getMeetings, getMeetingDetails, getActionItems, getDecisions, searchContent |
| meeting-prep | getMeetings, getMeetingDetails, getActionItems, getDecisions |
| action-extractor | getMeetings, getMeetingDetails, proposeActionItem |
| decision-analyzer | getMeetings, getDecisions, searchContent, proposeDecision |
| follow-up-nudger | getActionItems, getPersonContext |

---

## Token Budgets

| Mode | Context | Response |
|------|---------|----------|
| general | 6000 | 2000 |
| meeting-prep | 6000 | 3000 |
| action-extractor | 6000 | 1500 |
| decision-analyzer | 6000 | 2500 |
| follow-up-nudger | 4000 | 500 |

---

## Directory Structure

```
apps/web/lib/agent/
+-- skills/
|   +-- index.ts
|   +-- general.ts
|   +-- meeting-prep.ts
|   +-- action-extractor.ts
|   +-- decision-analyzer.ts
|   +-- follow-up-nudger.ts
+-- tools/
|   +-- index.ts
|   +-- schemas.ts
|   +-- get-meetings.ts
|   +-- propose-action.ts
+-- context/
    +-- serializer.ts
    +-- token-counter.ts
```

---

## Trade-offs

| Decision | Rationale |
|----------|-----------|
| Separate prompt files | Easier to iterate |
| Tool subsets per mode | Enforce boundaries |
| Token budgets | Predictable costs |

## Full System Prompts

### General Assistant Prompt

```
You are SPARK Assistant, an AI helping executives and EAs manage meetings, actions, and decisions.

CAPABILITIES:
- Query meetings, action items, and decisions within user context
- Search across platform content semantically
- Provide summaries and analysis
- Answer questions about organizational activity

GUIDELINES:
- Be concise and actionable
- Cite sources (meeting names, dates) when referencing data
- Ask clarifying questions for ambiguous requests
- Never fabricate data not returned by tools
```

### Meeting Prep Prompt

```
You are SPARK Meeting Prep Assistant, specialized in preparing executives for meetings.

YOUR TASK:
Generate comprehensive meeting briefings including:
1. Meeting series history (last 3 meetings summary)
2. Open action items for attendees
3. Relevant recent decisions
4. Attendee context (role, recent contributions)
5. Suggested agenda topics based on open items

OUTPUT FORMAT:
- Meeting Context: Series info, cadence, duration
- Previous Meeting Summary: Key outcomes
- Open Actions: Table by owner
- Recent Decisions: Last 30 days
- Suggested Topics: Based on stale actions

Keep output under 1000 words.
```

### Action Extractor Prompt

```
You are SPARK Action Extractor, specialized in identifying commitments.

EXTRACTION RULES:
1. Look for: will, going to, need to, action:, TODO
2. Identify owners from @mentions or X will...
3. Infer dates from: by Friday, next week, before Q2
4. Distinguish actions (tasks) from decisions

OUTPUT:
Use proposeActionItem tool with:
- title: Verb-noun, max 60 chars
- description: 1-2 sentences
- owner: Person name or ID
- dueDate: ISO date or null
- priority: high/medium/low
- sourceQuote: Exact text
```

### Decision Analyzer Prompt

```
You are SPARK Decision Analyzer, finding patterns in organizational decisions.

YOUR TASK:
1. Find related past decisions (semantic search)
2. Build decision timelines for topics
3. Identify key participants
4. Spot patterns or contradictions
5. Provide context for new decisions

OUTPUT FORMAT:
- Related Decisions: Table with date, title, outcome
- Timeline: Chronological topic evolution
- Key Stakeholders: Who has been involved
- Patterns: Recurring themes
- Considerations: Questions for new decisions
```

### Follow-up Nudger Prompt

```
You are SPARK Follow-up Assistant, drafting professional reminders.

TONE CALIBRATION:
- 1-3 days before due: Friendly reminder
- On due date: Polite check-in
- 1-7 days overdue: Firm but professional
- 7+ days overdue: Escalation-ready

OUTPUT:
- Subject line
- Context paragraph
- Specific request
- Deadline reference
- Offer of assistance

Keep under 150 words. Never shame or blame.
```

---

## Context Injection

### Serialization Pattern

```typescript
interface SerializedContext {
  scope: ContextScope;
  data: string;
  tokenCount: number;
}

function serializeMeetingContext(meeting: Meeting): SerializedContext {
  const data = [
    `## Meeting: ${meeting.title}`,
    `- Date: ${formatDate(meeting.date)}`,
    `- Series: ${meeting.series?.name || 'One-off'}`,
    `- Attendees: ${meeting.attendees.map(a => a.name).join(', ')}`,
    '',
    '### Notes',
    truncateToTokens(meeting.notes, 2000),
    '',
    `### Actions (${meeting.actions.length})`,
    meeting.actions.slice(0, 5).map(a => 
      `- [${a.status}] ${a.title} (${a.owner?.name})`
    ).join('\n'),
  ].join('\n');
  
  return { scope: 'meeting', data, tokenCount: countTokens(data) };
}
```

### Budget Allocation

Priority order for context:
1. Current meeting context (3000 tokens)
2. Related actions (1500 tokens)
3. Related decisions (1500 tokens)
4. Person context (500 tokens)

---

## Quick Actions per Mode

| Mode | Quick Actions |
|------|---------------|
| general | Search, Recent Meetings, My Actions |
| meeting-prep | Generate Briefing, Show History, Attendee Summary |
| action-extractor | Extract All, Extract from Selection |
| decision-analyzer | Find Related, Show Timeline, Pattern Analysis |
| follow-up-nudger | Draft Reminder, Gentle Nudge, Escalation Draft |

---

## Adding New Skills

```typescript
// lib/agent/skills/strategic-insights.ts
export const strategicInsightsSkill: AgentSkill = {
  name: 'strategic-insights',
  displayName: 'Strategic Insights',
  description: 'Analyze patterns across meetings and decisions',
  icon: 'TrendingUp',
  systemPrompt: STRATEGIC_INSIGHTS_PROMPT,
  tools: [getMeetings, getDecisions, searchContent, getPersonContext],
  quickActions: [
    { id: 'velocity', label: 'Decision Velocity', prompt: 'Show decision velocity trends' },
    { id: 'completion', label: 'Completion Rates', prompt: 'Analyze action completion rates' },
  ],
  contextRequirements: ['dateRange'],
  tokenBudget: { context: 8000, response: 3000 },
};

// Register in skills/index.ts
export const skills = {
  general: generalSkill,
  'meeting-prep': meetingPrepSkill,
  'action-extractor': actionExtractorSkill,
  'decision-analyzer': decisionAnalyzerSkill,
  'follow-up-nudger': followUpNudgerSkill,
  'strategic-insights': strategicInsightsSkill,
};
```

---

## Integration with Continuous Claude

Compatible with ~/.claude/skills/ pattern:
- YAML frontmatter possible for metadata
- System prompts can be externalized to .md files
- Could load custom skills from user config directory
- Skill activation similar to /skill: command pattern
