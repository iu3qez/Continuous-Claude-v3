import WorkbookDemo from '../components/state.js';

// Tier 1 trigger phrases (exact match via substring)
const TIER1_TRIGGERS = [
  { phrase: 'prep me', context: 'meeting-detail', responseId: 'meeting-prep' },
  { phrase: 'status of q2', context: null, responseId: 'q2-status' },
  {
    phrase: 'cross-department blockers',
    context: null,
    responseId: 'blockers',
  },
  { phrase: 'focus on today', context: null, responseId: 'today-focus' },
  { phrase: 'analyze this pipeline', context: null, responseId: 'pipeline' },
  {
    phrase: 'why is this deal stalled',
    context: null,
    responseId: 'deal-stalled',
  },
  {
    phrase: 'summary for the board',
    context: null,
    responseId: 'board-summary',
  },
  { phrase: 'yesterday meetings', context: null, responseId: 'yesterday' },
  {
    phrase: 'compare department',
    context: null,
    responseId: 'dept-compare',
  },
  {
    phrase: 'draft a follow-up',
    context: null,
    responseId: 'follow-up-email',
  },
];

// Tier 2 categories with keywords
const TIER2_CATEGORIES = {
  finance: ['budget', 'cost', 'spend', 'revenue', 'p&l', 'financial'],
  timeline: ['when', 'deadline', 'due', 'schedule', 'timeline'],
  risk: ['risk', 'problem', 'issue', 'concern', 'blocker'],
  team: ['who', 'team', 'assign', 'delegate', 'hire'],
  performance: ['metrics', 'kpi', 'performance', 'tracking'],
  client: ['client', 'customer', 'account', 'deal'],
  meeting: ['meeting', 'agenda', 'prep', 'follow-up'],
  action: ['action', 'task', 'to-do', 'next steps'],
  decision: ['decide', 'decision', 'approve', 'choose'],
  strategy: ['strategy', 'plan', 'roadmap', 'vision'],
  comparison: ['compare', 'vs', 'difference', 'better'],
  trend: ['trend', 'pattern', 'change', 'growth'],
  forecast: ['predict', 'forecast', 'expect', 'project'],
  summary: ['summary', 'recap', 'overview', 'brief'],
  search: ['find', 'look for', 'search', 'where'],
  create: ['create', 'make', 'draft', 'write'],
  update: ['update', 'change', 'modify', 'edit'],
  report: ['report', 'analysis', 'deep dive'],
  notify: ['notify', 'alert', 'tell', 'remind'],
  help: ['help', 'how', 'explain', 'what is'],
};

// Pre-built Tier 1 response content keyed by responseId
const TIER1_RESPONSES = {
  'meeting-prep': {
    content:
      'I have pulled together the key context for your upcoming meeting. Here are the attendees, recent discussion threads, and action items from last session.',
    toolChips: [
      'View attendees',
      'Past meeting notes',
      'Open action items',
      'Set agenda',
    ],
    followUpSuggestions: [
      'Draft an agenda',
      'Summarize last meeting',
      'Who owes action items?',
    ],
    category: 'meeting',
  },
  'q2-status': {
    content:
      'Q2 is tracking at 78% of target. Revenue is on pace, but two key deals slipped from June into July. Operations spending is 4% under budget.',
    toolChips: ['Q2 dashboard', 'Revenue breakdown', 'Deal pipeline'],
    followUpSuggestions: [
      'Which deals slipped?',
      'Show department breakdown',
      'Compare to Q1',
    ],
    category: 'performance',
  },
  blockers: {
    content:
      'There are 3 active cross-department blockers: Engineering awaits design specs, Sales needs updated pricing, and Marketing is blocked on brand assets.',
    toolChips: ['Blocker board', 'Escalation log', 'Team assignments'],
    followUpSuggestions: [
      'Escalate the top blocker',
      'Who owns each blocker?',
      'Timeline for resolution?',
    ],
    category: 'risk',
  },
  'today-focus': {
    content:
      'Your top priorities today: 1) Finalize Q2 board deck, 2) Review pipeline with sales lead, 3) Sign off on new hire offer.',
    toolChips: ['Today view', 'Calendar', 'Task list'],
    followUpSuggestions: [
      'Reschedule something',
      'Delegate a task',
      'What is overdue?',
    ],
    category: 'action',
  },
  pipeline: {
    content:
      'Pipeline analysis: 42 active opportunities worth $2.1M. Win rate trending at 34%. Average deal cycle is 47 days, up from 39 last quarter.',
    toolChips: ['Pipeline chart', 'Deal list', 'Win/loss analysis'],
    followUpSuggestions: [
      'Which deals are at risk?',
      'Top 5 by value',
      'Compare to last quarter',
    ],
    category: 'client',
  },
  'deal-stalled': {
    content:
      'This deal has been in the negotiation stage for 23 days with no activity. Last contact was an email on Feb 3. The champion may have gone dark.',
    toolChips: ['Deal timeline', 'Contact history', 'Similar deals'],
    followUpSuggestions: [
      'Draft a check-in email',
      'Find another contact',
      'Should we discount?',
    ],
    category: 'client',
  },
  'board-summary': {
    content:
      'Board summary draft: Revenue +12% YoY, headcount at 94% plan, two strategic initiatives on track, one flagged amber for timeline risk.',
    toolChips: ['Board deck', 'Financial summary', 'Initiative tracker'],
    followUpSuggestions: [
      'Expand on the amber initiative',
      'Add competitive landscape',
      'Include hiring plan',
    ],
    category: 'summary',
  },
  yesterday: {
    content:
      'Yesterday you had 4 meetings: Product sync (30 min), Sales review (45 min), 1:1 with CTO (30 min), and Client call with Acme Corp (60 min).',
    toolChips: ['Meeting notes', 'Action items', 'Calendar view'],
    followUpSuggestions: [
      'Summarize the client call',
      'What action items came out?',
      'Any follow-ups needed?',
    ],
    category: 'meeting',
  },
  'dept-compare': {
    content:
      'Department comparison: Engineering is at 92% sprint velocity, Sales at 87% quota attainment, Marketing at 105% lead gen target, Ops at 96% SLA compliance.',
    toolChips: [
      'Department dashboard',
      'Detailed metrics',
      'Historical trend',
    ],
    followUpSuggestions: [
      'Why is Sales below target?',
      'Show trend over 6 months',
      'Who are top performers?',
    ],
    category: 'comparison',
  },
  'follow-up-email': {
    content:
      'Here is a draft follow-up email based on your most recent meeting notes and action items. Review and send when ready.',
    toolChips: ['Edit draft', 'Add recipients', 'Attach notes'],
    followUpSuggestions: [
      'Make it more formal',
      'Add the action items',
      'Send it now',
    ],
    category: 'create',
  },
};

// Tier 2 category response templates
const TIER2_RESPONSES = {
  finance: {
    content:
      'Based on the latest financial data, here is a summary of {{company}} budget and spending trends. Key areas to watch include operational costs and revenue projections.',
    followUpSuggestions: [
      'Show me the P&L',
      'Compare to last quarter',
      'Where are we overspending?',
    ],
  },
  timeline: {
    content:
      'Here are the upcoming deadlines and milestones. The nearest due date is within this week, and there are 3 items requiring attention.',
    followUpSuggestions: [
      'What is overdue?',
      'Push back a deadline',
      'Show full calendar',
    ],
  },
  risk: {
    content:
      'I have identified several active risks and issues across the organization. The highest priority items are flagged for immediate review.',
    followUpSuggestions: [
      'Show risk matrix',
      'Escalate the top risk',
      'Who owns mitigation?',
    ],
  },
  team: {
    content:
      'Here is the current team allocation and assignments. Several team members have bandwidth available for new work.',
    followUpSuggestions: [
      'Who is available?',
      'Show workload balance',
      'Reassign tasks',
    ],
  },
  performance: {
    content:
      'Performance metrics are tracking as follows. Most KPIs are on target with a few areas needing attention.',
    followUpSuggestions: [
      'Show KPI dashboard',
      'Which metrics are off track?',
      'Compare to benchmark',
    ],
  },
  client: {
    content:
      'Client and account overview is ready. Active accounts and recent deal activity are summarized below.',
    followUpSuggestions: [
      'Show top accounts',
      'Recent deal activity',
      'At-risk clients',
    ],
  },
  meeting: {
    content:
      'Meeting information compiled. Here are relevant agenda items, past notes, and action items.',
    followUpSuggestions: [
      'Create agenda',
      'Review past notes',
      'List action items',
    ],
  },
  action: {
    content:
      'Here are the current action items and tasks requiring attention. Priority items are listed first.',
    followUpSuggestions: [
      'Show overdue items',
      'Assign to someone',
      'Mark complete',
    ],
  },
  decision: {
    content:
      'Decision points have been identified. Here are the options with trade-offs for each.',
    followUpSuggestions: [
      'Show pros and cons',
      'What do others recommend?',
      'Set a deadline to decide',
    ],
  },
  strategy: {
    content:
      'Strategic overview prepared. Current initiatives, roadmap items, and vision alignment are summarized.',
    followUpSuggestions: [
      'Show roadmap',
      'Priority initiatives',
      'Resource allocation',
    ],
  },
  comparison: {
    content:
      'Comparison analysis ready. Key differences and similarities are highlighted for review.',
    followUpSuggestions: [
      'Show side by side',
      'What changed?',
      'Recommend the best option',
    ],
  },
  trend: {
    content:
      'Trend analysis shows notable patterns over the selected time period. Growth areas and declining metrics are flagged.',
    followUpSuggestions: [
      'Show chart',
      'Extend time range',
      'What caused the change?',
    ],
  },
  forecast: {
    content:
      'Forecast projections are ready based on current trajectory and historical data.',
    followUpSuggestions: [
      'Best case scenario',
      'Worst case scenario',
      'Adjust assumptions',
    ],
  },
  summary: {
    content:
      'Executive summary compiled from the latest data and activity across all departments.',
    followUpSuggestions: [
      'Expand on specifics',
      'Export as PDF',
      'Share with team',
    ],
  },
  search: {
    content:
      'Search results compiled. Here are the most relevant items matching your query.',
    followUpSuggestions: [
      'Narrow the search',
      'Sort by date',
      'Show all results',
    ],
  },
  create: {
    content:
      'Draft created based on available context and templates. Review and customize as needed.',
    followUpSuggestions: ['Edit draft', 'Use a template', 'Preview'],
  },
  update: {
    content:
      'Update summary prepared. Here are the changes and their impact.',
    followUpSuggestions: [
      'Apply changes',
      'Review history',
      'Notify stakeholders',
    ],
  },
  report: {
    content:
      'Report generated with the latest data. Key insights and visualizations are included.',
    followUpSuggestions: [
      'Show visualizations',
      'Export report',
      'Schedule recurring',
    ],
  },
  notify: {
    content:
      'Notification prepared. Recipients and message content are ready for review.',
    followUpSuggestions: [
      'Send now',
      'Edit message',
      'Add recipients',
    ],
  },
  help: {
    content:
      'Here is an explanation of the topic you asked about. Let me know if you need more detail on any specific aspect.',
    followUpSuggestions: [
      'Show examples',
      'Go deeper',
      'Related topics',
    ],
  },
};

// Tier 3 fallback responses
const TIER3_FALLBACKS = [
  "I'm not sure I have specific data for that query, but I can help you explore related areas. Try asking about budgets, timelines, team status, or meeting prep.",
  "That's an interesting question. I don't have a pre-built answer, but I can search across your connected data sources for relevant information.",
  'I can help with that. Let me pull together what I can find from your meetings, tasks, and reports.',
];

/**
 * Match a query against Tier 1 trigger phrases.
 * Returns the matching trigger object or null.
 */
export function matchTier1(query, pageContext) {
  const normalizedQuery = query.toLowerCase().trim();

  for (const trigger of TIER1_TRIGGERS) {
    if (normalizedQuery.includes(trigger.phrase)) {
      // If trigger requires specific context, check it
      if (trigger.context && pageContext && pageContext !== trigger.context) {
        continue;
      }
      return trigger;
    }
  }

  return null;
}

/**
 * Match a query against Tier 2 keyword categories.
 * Returns the matched category name or null.
 */
export function matchTier2Keywords(query) {
  const normalizedQuery = query.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(TIER2_CATEGORIES)) {
    for (const keyword of keywords) {
      if (normalizedQuery.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
}

/**
 * Adapt a response by replacing {{placeholder}} tokens with context values.
 * Returns a new response object with substituted content.
 */
export function adaptResponse(response, context) {
  let content = response.content;

  for (const [key, value] of Object.entries(context)) {
    const placeholder = `{{${key}}}`;
    content = content.split(placeholder).join(value);
  }

  return { ...response, content };
}

/**
 * Get tool chips for a given responseId.
 * Returns an array of chip label strings.
 */
export function getToolChips(responseId) {
  const response = TIER1_RESPONSES[responseId];
  if (response && response.toolChips) {
    return [...response.toolChips];
  }
  return [];
}

/**
 * Main entry point: get a response for a user query.
 * Tries Tier 1 (exact triggers), then Tier 2 (keyword categories),
 * then falls back to Tier 3 (generic).
 */
export function getResponse(query, context = {}) {
  const pageContext = context.page || null;

  // Tier 1: check for trigger phrase match
  const tier1Match = matchTier1(query, pageContext);
  if (tier1Match) {
    const responseData = TIER1_RESPONSES[tier1Match.responseId];
    if (responseData) {
      const adapted = adaptResponse(responseData, {
        company: WorkbookDemo.industry || 'your company',
        ...context,
      });
      return {
        tier: 1,
        content: adapted.content,
        toolChips: adapted.toolChips || [],
        followUpSuggestions: adapted.followUpSuggestions || [],
        category: adapted.category || tier1Match.responseId,
        typingSpeed: 40,
      };
    }
  }

  // Tier 2: check for keyword category match
  const tier2Category = matchTier2Keywords(query);
  if (tier2Category) {
    const categoryResponse = TIER2_RESPONSES[tier2Category];
    if (categoryResponse) {
      const adapted = adaptResponse(categoryResponse, {
        company: WorkbookDemo.industry || 'your company',
        ...context,
      });
      return {
        tier: 2,
        content: adapted.content,
        toolChips: [],
        followUpSuggestions: adapted.followUpSuggestions || [],
        category: tier2Category,
        typingSpeed: 40,
      };
    }
  }

  // Tier 3: fallback
  const fallbackIndex = Math.abs(hashCode(query)) % TIER3_FALLBACKS.length;
  return {
    tier: 3,
    content: TIER3_FALLBACKS[fallbackIndex],
    toolChips: [],
    followUpSuggestions: [
      'Show me my dashboard',
      'What meetings do I have today?',
      'Summarize recent activity',
    ],
    category: 'general',
    typingSpeed: 40,
  };
}

/**
 * Simple string hash for deterministic fallback selection.
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return hash;
}
