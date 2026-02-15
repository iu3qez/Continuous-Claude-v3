/**
 * Tier 3 Generic Templates
 *
 * Fallback response templates used when no Tier 1 or Tier 2 match is found.
 * Each template uses {{company}} placeholders for personalization.
 */

export const GENERIC_TEMPLATES = {
  'data-table': {
    id: 'data-table',
    content:
      'I found relevant data across your {{company}} workspaces:\n\n' +
      '| Item | Status | Owner | Updated |\n' +
      '|------|--------|-------|--------|\n' +
      '| Project Alpha | In Progress | J. Smith | Today |\n' +
      '| Q2 Review | Pending | M. Chen | Yesterday |\n' +
      '| Budget Report | Complete | A. Patel | 2 days ago |\n' +
      '| Client Proposal | Draft | L. Garcia | 3 days ago |\n' +
      '| Sprint Retro | Scheduled | K. Wilson | This week |\n\n' +
      '*Showing top 5 results. Ask me to filter or sort differently.*',
    toolChips: ['Searching Workspaces'],
    followUpSuggestions: [
      'Show me more details',
      'Filter by department',
      'Export this data',
    ],
  },
  chart: {
    id: 'chart',
    content:
      'Here is a visual breakdown of {{company}} performance metrics for the current period:\n\n' +
      'Revenue: ======== 82%\n' +
      'Pipeline: ====== 67%\n' +
      'Retention: ========= 91%\n' +
      'NPS Score: ======= 74%\n\n' +
      'Overall trend is positive with retention leading. Pipeline coverage needs attention to hit end-of-quarter targets.',
    toolChips: ['Generating Chart', 'Pulling Metrics'],
    followUpSuggestions: [
      'Break down by region',
      'Compare to last quarter',
      'Show me the raw numbers',
    ],
  },
  'action-list': {
    id: 'action-list',
    content:
      'Here are the outstanding action items I found across your {{company}} workspace:\n\n' +
      '1. [Overdue] Finalize vendor contract -- assigned to you, due last Friday\n' +
      '2. [Due Today] Review marketing brief for Q3 campaign launch\n' +
      '3. [This Week] Submit headcount plan to finance for approval\n' +
      '4. [Next Week] Prepare board deck with updated projections\n' +
      '5. [Upcoming] Schedule quarterly all-hands meeting\n\n' +
      'Two items need immediate attention. Want me to help prioritize or delegate?',
    toolChips: ['Scanning Tasks', 'Checking Deadlines'],
    followUpSuggestions: [
      'Prioritize these for me',
      'Delegate the overdue item',
      'What else is coming up?',
    ],
  },
  'risk-assessment': {
    id: 'risk-assessment',
    content:
      'I have assessed the current risk landscape for {{company}} based on available signals:\n\n' +
      'HIGH: Two key deals ($340K combined) have gone silent for 14+ days\n' +
      'MEDIUM: Engineering sprint velocity dropped 15% this iteration\n' +
      'MEDIUM: Customer support ticket volume up 22% week-over-week\n' +
      'LOW: One vendor contract renewal approaching with 30 days remaining\n\n' +
      'Recommend focusing on the silent deals first -- they have the largest revenue impact.',
    toolChips: ['Analyzing Signals', 'Checking Alerts'],
    followUpSuggestions: [
      'Draft outreach for silent deals',
      'Show me the support tickets',
      'What caused the velocity drop?',
    ],
  },
  'executive-summary': {
    id: 'executive-summary',
    content:
      'Executive Summary for {{company}}:\n\n' +
      'This period showed steady progress across most functions. Revenue is tracking at 87% of plan ' +
      'with strong retention offsetting slower new business. The team shipped 3 major features and ' +
      'resolved 2 escalated client issues. Hiring is on pace with 4 offers extended and 2 accepted. ' +
      'Key risk: pipeline coverage for next quarter is below target at 2.1x (goal: 3x). ' +
      'Recommendation: prioritize outbound prospecting and revisit stalled opportunities this week.',
    toolChips: ['Compiling Reports', 'Aggregating Data'],
    followUpSuggestions: [
      'Expand on pipeline risk',
      'Show department details',
      'Prepare this for the board',
    ],
  },
};

let _fallbackIndex = 0;
const _ids = Object.keys(GENERIC_TEMPLATES);

/**
 * Get a generic template by id.
 * Returns the template object or undefined if not found.
 */
export function getGenericTemplate(id) {
  return GENERIC_TEMPLATES[id];
}

/**
 * Select a fallback template using round-robin.
 * Each call returns the next template in sequence.
 */
export function selectFallback() {
  const id = _ids[_fallbackIndex % _ids.length];
  _fallbackIndex++;
  return GENERIC_TEMPLATES[id];
}

/**
 * Get the list of all generic template ids.
 * Returns a new array each call.
 */
export function getGenericIds() {
  return [..._ids];
}
