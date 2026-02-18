import { updateBadge } from './sidebar.js';

// Badge count data per industry
const BADGE_DATA = {
  consulting: { actions: 3, proposals: 2, meetings: 4 },
  tech: { actions: 5, proposals: 3, meetings: 6 },
  hospitality: { actions: 2, proposals: 1, meetings: 3 },
};

/**
 * Get badge counts for a given industry.
 * Returns { actions, proposals, meetings } with integer counts.
 */
export function getBadgeCounts(industry) {
  return BADGE_DATA[industry] || BADGE_DATA.consulting;
}

/**
 * Initialize badges on the sidebar nav element for the given industry.
 * Applies counts to actions, proposals, and meetings nav items.
 */
export function initBadges(sidebarEl, industry) {
  const counts = getBadgeCounts(industry);
  updateBadge(sidebarEl, 'actions', counts.actions);
  updateBadge(sidebarEl, 'proposals', counts.proposals);
  updateBadge(sidebarEl, 'meetings', counts.meetings);
}
