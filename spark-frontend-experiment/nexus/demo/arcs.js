/**
 * Demo Arc Definitions - 5 guided demo pathways through Workbook.
 * Each arc defines a sequence of steps with page navigation,
 * narration text, and element highlights.
 */

export const DEMO_ARCS = [
  {
    id: 1,
    title: 'New Customer Journey',
    audience: 'customers',
    summary: 'Experience the complete onboarding flow from sign-up to first AI insight',
    steps: [
      { page: 'index.html', narration: 'Welcome to Workbook - the AI layer for your business. Let me show you how it works.', highlight: '.hero-cta', duration: 5000 },
      { page: 'index.html#pricing', narration: 'Choose a plan that fits your team. Most businesses start with Growth.', highlight: '.pricing-growth', duration: 5000 },
      { page: 'onboarding/step-1-company.html', narration: 'First, tell us about your company. This helps our AI understand your context.', highlight: '#company-form', duration: 6000 },
      { page: 'onboarding/step-2-departments.html', narration: 'We auto-detect your department structure and suggest relevant workspaces.', highlight: '.dept-cards', duration: 5000 },
      { page: 'onboarding/step-3-tools.html', narration: 'Select the tools your team already uses. We integrate with all of them.', highlight: '.tool-grid', duration: 5000 },
      { page: 'onboarding/step-4-connect.html', narration: 'Connect your tools with one click. Secure OAuth - we never store passwords.', highlight: '.connect-grid', duration: 6000 },
      { page: 'onboarding/step-5-scanning.html', narration: 'Watch as Workbook scans your connected tools and builds your workspace.', highlight: '.scan-viz', duration: 8000 },
      { page: 'onboarding/step-6-insight.html', narration: 'Here is the magic moment - your first AI-powered insight, personalized to your business.', highlight: '.insight-reveal', duration: 8000 },
      { page: 'dashboard.html', narration: 'And here is your fully configured workspace. Everything you need, one place.', highlight: '#main-content', duration: 6000 },
    ],
  },
  {
    id: 2,
    title: 'Day in the Life',
    audience: 'team',
    summary: 'Follow a typical morning workflow: check dashboard, prep for meetings, manage actions',
    steps: [
      { page: 'dashboard.html', narration: 'Start your day with your AI-powered dashboard. Key metrics, upcoming meetings, and AI briefing.', highlight: '.ai-briefing', duration: 6000 },
      { page: 'my-work.html', narration: 'Check My Work for your personal task list, prioritized by AI.', highlight: '.my-actions', duration: 5000 },
      { page: 'meetings.html', narration: 'Your meetings are enriched with AI context - prep notes, related actions, attendee insights.', highlight: '.meeting-list', duration: 5000 },
      { page: 'meeting-detail.html', narration: 'Click into a meeting for full AI prep. Ask the AI anything about this meeting.', highlight: '.ai-chat', duration: 6000 },
      { page: 'actions.html', narration: 'After meetings, AI captures action items and assigns them to the right people.', highlight: '.kanban-board', duration: 5000 },
      { page: 'proposals.html', narration: 'Review AI proposals - things the system thinks you should do based on patterns.', highlight: '.proposal-list', duration: 5000 },
      { page: 'decisions.html', narration: 'Track every decision with full context, rationale, and linked actions.', highlight: '.timeline', duration: 5000 },
      { page: 'dashboard.html', narration: 'Back to the dashboard - your single source of truth. Everything connected.', highlight: '.roi-widget', duration: 5000 },
    ],
  },
  {
    id: 3,
    title: 'Executive Rollup',
    audience: 'investors',
    summary: 'See how executives get a complete view of organizational health and decisions',
    steps: [
      { page: 'dashboard.html', narration: 'The CEO starts here. AI surfaces what matters most across all departments.', highlight: '.ceo-greeting', duration: 5000 },
      { page: 'elt-rollup.html', narration: 'The Executive Rollup gives a complete view of organizational health.', highlight: '.exec-summary', duration: 6000 },
      { page: 'elt-rollup.html#health', narration: 'Department health scores are calculated from activity, completion rates, and AI analysis.', highlight: '.health-grid', duration: 6000 },
      { page: 'elt-rollup.html#risks', narration: 'The risk heat map surfaces cross-department dependencies and potential issues.', highlight: '.risk-map', duration: 6000 },
      { page: 'decisions.html', narration: 'Every strategic decision is tracked with full context and outcomes.', highlight: '.timeline', duration: 5000 },
      { page: 'dashboard.html', narration: 'AI has saved this team 12 hours this week. That is the ROI of Workbook.', highlight: '.roi-widget', duration: 5000 },
    ],
  },
  {
    id: 4,
    title: 'AI Agent Showcase',
    audience: 'investors',
    summary: 'Demonstrate the autonomous AI agent system - the future of work',
    steps: [
      { page: 'agents.html', narration: 'Meet your AI team. 6 autonomous agents working alongside your people.', highlight: '.agent-grid', duration: 6000 },
      { page: 'agents.html#activity', narration: 'Watch the real-time activity feed. Agents are always working in the background.', highlight: '.activity-feed', duration: 5000 },
      { page: 'agents.html#scheduled', narration: 'Schedule recurring tasks. The AI handles the routine so your team can focus on strategy.', highlight: '.scheduled-tasks', duration: 5000 },
      { page: 'marketplace.html', narration: 'The Agent Marketplace lets you add specialized AI agents for any workflow.', highlight: '.marketplace-grid', duration: 6000 },
      { page: 'marketplace.html#custom', narration: 'Build custom agents for your unique processes. No code required.', highlight: '.custom-builder', duration: 5000 },
      { page: 'dashboard.html', narration: 'Agents report back to your dashboard. Full transparency, full control.', highlight: '.ai-briefing', duration: 5000 },
    ],
  },
  {
    id: 5,
    title: 'Integration Story',
    audience: 'customers',
    summary: 'Show how Workbook connects to existing tools and creates value from day one',
    steps: [
      { page: 'connections.html', narration: 'Workbook connects to the tools you already use. No data migration needed.', highlight: '.connection-grid', duration: 6000 },
      { page: 'connections.html#flow', narration: 'Data flows continuously between your tools and Workbook, keeping everything in sync.', highlight: '.data-flow', duration: 5000 },
      { page: 'meeting-detail.html', narration: 'See how CRM data enriches your meeting prep. Everything your sales team needs.', highlight: '.crm-context', duration: 6000 },
      { page: 'dashboard.html', narration: 'The dashboard synthesizes data from all connected tools into actionable insights.', highlight: '#main-content', duration: 5000 },
      { page: 'settings.html', narration: 'Full control over integrations, permissions, and AI behavior in Settings.', highlight: '.integrations-tab', duration: 5000 },
    ],
  },
];

/**
 * Get a demo arc by ID.
 * @param {number} arcId - Arc ID (1-5)
 * @returns {object|null} The arc definition or null
 */
export function getArc(arcId) {
  return DEMO_ARCS.find(a => a.id === arcId) || null;
}

/**
 * Get all arcs for a given audience.
 * @param {string} audience - 'customers' | 'team' | 'investors'
 * @returns {object[]} Matching arcs
 */
export function getArcsForAudience(audience) {
  return DEMO_ARCS.filter(a => a.audience === audience);
}

/**
 * Validate arc structure.
 * @param {object} arc - Arc to validate
 * @returns {boolean} True if valid
 */
export function validateArc(arc) {
  if (!arc || !arc.id || !arc.title || !arc.audience || !arc.steps) return false;
  if (!Array.isArray(arc.steps) || arc.steps.length === 0) return false;
  return arc.steps.every(step =>
    step.page && step.narration && step.duration > 0
  );
}
