// ── Schema Field Definitions ───────────────────────────────

const TEAM_MEMBER_FIELDS = ['name', 'role', 'department', 'avatarColor'];
const MEETING_FIELDS = ['title', 'type', 'time', 'attendees', 'workspace'];
const ACTION_FIELDS = ['title', 'status', 'assignee', 'workspace', 'priority'];
const DECISION_FIELDS = ['title', 'status', 'rationale', 'workspace'];
const DATASET_SECTIONS = ['company', 'team', 'meetings', 'actions', 'decisions', 'financials', 'insights'];

// ── Validation Functions ───────────────────────────────────

function hasAllFields(obj, fields) {
  if (!obj || typeof obj !== 'object') return false;
  return fields.every((field) => field in obj);
}

export function validateTeamMember(member) {
  return hasAllFields(member, TEAM_MEMBER_FIELDS);
}

export function validateMeeting(meeting) {
  return hasAllFields(meeting, MEETING_FIELDS);
}

export function validateAction(action) {
  return hasAllFields(action, ACTION_FIELDS);
}

export function validateDecision(decision) {
  return hasAllFields(decision, DECISION_FIELDS);
}

export function validateDataset(data) {
  return hasAllFields(data, DATASET_SECTIONS);
}

// ── Formatters ─────────────────────────────────────────────

export function formatCurrency(amount) {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    // Remove trailing zero: 1.0M -> $1M, 1.2M -> $1.2M
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `$${formatted}M`;
  }
  return `$${amount.toLocaleString('en-US')}`;
}

export function formatPercentage(decimal) {
  const pct = Math.round(decimal * 100);
  return `${pct}%`;
}

export function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeTime(dateInput) {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) === 1 ? '' : 's'} ago`;
}

// ── Constants ──────────────────────────────────────────────

export const STATUS_VALUES = {
  overdue: 'overdue',
  in_progress: 'in_progress',
  blocked: 'blocked',
  completed: 'completed',
};

export const PRIORITY_LEVELS = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

export const WORKSPACE_COLORS = {
  Engineering: '#4F46E5',
  Product: '#7C3AED',
  Design: '#EC4899',
  Marketing: '#F59E0B',
  Sales: '#10B981',
  Operations: '#6366F1',
  Finance: '#0EA5E9',
  'Human Resources': '#8B5CF6',
};
