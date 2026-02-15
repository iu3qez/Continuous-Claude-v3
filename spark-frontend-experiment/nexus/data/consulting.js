import { registerDataset } from '../components/industry.js';

// ── Helpers ─────────────────────────────────────────────────

const today = new Date();

function daysFromNow(offset) {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
}

function hoursFromNow(offset) {
  const d = new Date(today);
  d.setHours(d.getHours() + offset);
  return d.toISOString();
}

// ── Company ─────────────────────────────────────────────────

const company = {
  name: 'Meridian Consulting Group',
  size: 48,
  industry: 'consulting',
  founded: 2018,
  hq: 'Austin, TX',
  description: 'Full-service management consulting firm specializing in digital transformation, operational excellence, and strategic advisory for mid-market enterprises.',
};

// ── Team (8 members) ────────────────────────────────────────

const team = [
  {
    name: 'Jay Altizer',
    role: 'CEO',
    department: 'Executive',
    avatarColor: '#7C3AED',
    email: 'jay@meridian.co',
    joined: '2018-03-01',
  },
  {
    name: 'Sarah Chen',
    role: 'COO',
    department: 'Operations',
    avatarColor: '#4F46E5',
    email: 'sarah@meridian.co',
    joined: '2018-06-15',
  },
  {
    name: 'Marcus Johnson',
    role: 'VP Engineering',
    department: 'Client Services',
    avatarColor: '#059669',
    email: 'marcus@meridian.co',
    joined: '2019-01-10',
  },
  {
    name: 'Lisa Park',
    role: 'BD Director',
    department: 'Business Development',
    avatarColor: '#2563EB',
    email: 'lisa@meridian.co',
    joined: '2019-08-20',
  },
  {
    name: 'David Hayes',
    role: 'Senior Consultant',
    department: 'Client Services',
    avatarColor: '#D97706',
    email: 'david@meridian.co',
    joined: '2020-02-01',
  },
  {
    name: 'Priya Sharma',
    role: 'Finance Director',
    department: 'Finance',
    avatarColor: '#DC2626',
    email: 'priya@meridian.co',
    joined: '2020-05-15',
  },
  {
    name: 'Tom Wilson',
    role: 'HR Manager',
    department: 'Operations',
    avatarColor: '#EC4899',
    email: 'tom@meridian.co',
    joined: '2021-01-10',
  },
  {
    name: 'Anna Rodriguez',
    role: 'Client Manager',
    department: 'Client Services',
    avatarColor: '#0D9488',
    email: 'anna@meridian.co',
    joined: '2021-06-01',
  },
];

// ── Meetings (10) ───────────────────────────────────────────

const meetings = [
  {
    title: 'OPS Weekly Standup',
    type: 'recurring',
    time: hoursFromNow(-2),
    duration: 30,
    attendees: ['Sarah Chen', 'Tom Wilson', 'Anna Rodriguez'],
    workspace: 'Operations',
    aiSummary: 'Reviewed Q2 onboarding timeline. Tom flagged two open headcount reqs. Anna raised client staffing conflict on Acme account. Sarah to escalate resource allocation to ELT.',
  },
  {
    title: 'Client Services Review',
    type: 'recurring',
    time: hoursFromNow(4),
    duration: 60,
    attendees: ['Marcus Johnson', 'David Hayes', 'Anna Rodriguez'],
    workspace: 'Client Services',
    aiSummary: 'Deep dive on active engagement health. Three accounts flagged amber on delivery timeline. Marcus proposed shifting two junior consultants from bench to Acme workstream.',
  },
  {
    title: 'Emergency: Campaign Blocker Resolution',
    type: 'ad-hoc',
    time: hoursFromNow(-26),
    duration: 45,
    attendees: ['Jay Altizer', 'Marcus Johnson', 'David Hayes', 'Anna Rodriguez'],
    workspace: 'Client Services',
    aiSummary: 'Critical blocker on Acme Corp digital campaign. Data integration failing due to API version mismatch. Marcus to coordinate hotfix with engineering. David to manage client communication.',
  },
  {
    title: 'BD Pipeline Review',
    type: 'recurring',
    time: hoursFromNow(24),
    duration: 60,
    attendees: ['Jay Altizer', 'Lisa Park', 'Priya Sharma'],
    workspace: 'Business Development',
    aiSummary: 'Pipeline stands at $2.4M across 28 active opportunities. Lisa highlighted 3 deals at risk of slipping to Q3. Priya flagged cash flow timing concern if two large deals close simultaneously.',
  },
  {
    title: 'Q2 Planning Workshop',
    type: 'one-time',
    time: daysFromNow(3),
    duration: 180,
    attendees: ['Jay Altizer', 'Sarah Chen', 'Marcus Johnson', 'Lisa Park', 'Priya Sharma'],
    workspace: 'Executive',
    aiSummary: 'Full-day workshop to finalize Q2 targets and resource allocation. Key topics: hiring plan, client portfolio rebalancing, and technology platform investments.',
  },
  {
    title: 'Finance Monthly Close',
    type: 'recurring',
    time: daysFromNow(-3),
    duration: 90,
    attendees: ['Priya Sharma', 'Sarah Chen', 'Jay Altizer'],
    workspace: 'Finance',
    aiSummary: 'January close complete. Revenue tracking 6% above forecast. Two invoices outstanding >60 days on Beacon Health and TerraForm accounts. Priya to initiate collections process.',
  },
  {
    title: 'All-Hands',
    type: 'recurring',
    time: daysFromNow(5),
    duration: 60,
    attendees: ['Jay Altizer', 'Sarah Chen', 'Marcus Johnson', 'Lisa Park', 'David Hayes', 'Priya Sharma', 'Tom Wilson', 'Anna Rodriguez'],
    workspace: 'Executive',
    aiSummary: 'Monthly all-hands covering company performance, new client wins, team recognition, and Q2 outlook. Jay to present strategic priorities.',
  },
  {
    title: 'Client: Acme Corp Check-in',
    type: 'external',
    time: hoursFromNow(28),
    duration: 45,
    attendees: ['David Hayes', 'Anna Rodriguez', 'Marcus Johnson'],
    workspace: 'Client Services',
    aiSummary: 'Weekly sync with Acme Corp stakeholders. Review deliverable status, discuss upcoming phase 2 scope, and address API integration concerns raised in emergency session.',
  },
  {
    title: 'Hiring Committee',
    type: 'recurring',
    time: daysFromNow(2),
    duration: 60,
    attendees: ['Tom Wilson', 'Sarah Chen', 'Marcus Johnson'],
    workspace: 'Operations',
    aiSummary: 'Review 12 candidates in pipeline for 3 open positions. Two senior consultant roles and one analyst position. Tom to schedule final rounds for top 4 candidates.',
  },
  {
    title: 'ELT Strategic Review',
    type: 'recurring',
    time: daysFromNow(7),
    duration: 120,
    attendees: ['Jay Altizer', 'Sarah Chen', 'Marcus Johnson', 'Lisa Park', 'Priya Sharma'],
    workspace: 'Executive',
    aiSummary: 'Quarterly executive leadership review. Topics: market positioning, competitive landscape, partnership opportunities, and org design for scale.',
  },
];

// ── Actions (23 total: 5 overdue, 5 in_progress, 4 blocked, 9 completed) ──

const actions = [
  // --- Overdue (5) ---
  {
    title: 'Submit Acme Corp phase 1 deliverables',
    status: 'overdue',
    assignee: 'David Hayes',
    workspace: 'Client Services',
    priority: 'critical',
    dueDate: daysFromNow(-5),
    source: 'Client Services Review',
  },
  {
    title: 'Finalize Q1 revenue reconciliation',
    status: 'overdue',
    assignee: 'Priya Sharma',
    workspace: 'Finance',
    priority: 'high',
    dueDate: daysFromNow(-3),
    source: 'Finance Monthly Close',
  },
  {
    title: 'Send updated SOW to Beacon Health',
    status: 'overdue',
    assignee: 'Lisa Park',
    workspace: 'Business Development',
    priority: 'high',
    dueDate: daysFromNow(-2),
    source: 'BD Pipeline Review',
  },
  {
    title: 'Complete hiring manager intake forms',
    status: 'overdue',
    assignee: 'Tom Wilson',
    workspace: 'Operations',
    priority: 'medium',
    dueDate: daysFromNow(-4),
    source: 'Hiring Committee',
  },
  {
    title: 'Update client satisfaction survey results',
    status: 'overdue',
    assignee: 'Anna Rodriguez',
    workspace: 'Client Services',
    priority: 'medium',
    dueDate: daysFromNow(-1),
    source: 'Client Services Review',
  },

  // --- In Progress (5) ---
  {
    title: 'Resolve API integration blocker for Acme',
    status: 'in_progress',
    assignee: 'Marcus Johnson',
    workspace: 'Client Services',
    priority: 'critical',
    dueDate: daysFromNow(1),
    source: 'Emergency: Campaign Blocker Resolution',
  },
  {
    title: 'Draft Q2 hiring plan and budget',
    status: 'in_progress',
    assignee: 'Tom Wilson',
    workspace: 'Operations',
    priority: 'high',
    dueDate: daysFromNow(5),
    source: 'Q2 Planning Workshop',
  },
  {
    title: 'Prepare BD pipeline forecast presentation',
    status: 'in_progress',
    assignee: 'Lisa Park',
    workspace: 'Business Development',
    priority: 'high',
    dueDate: daysFromNow(3),
    source: 'BD Pipeline Review',
  },
  {
    title: 'Build client health dashboard prototype',
    status: 'in_progress',
    assignee: 'David Hayes',
    workspace: 'Client Services',
    priority: 'medium',
    dueDate: daysFromNow(7),
    source: 'Client Services Review',
  },
  {
    title: 'Schedule candidate final rounds',
    status: 'in_progress',
    assignee: 'Tom Wilson',
    workspace: 'Operations',
    priority: 'medium',
    dueDate: daysFromNow(4),
    source: 'Hiring Committee',
  },

  // --- Blocked (4) ---
  {
    title: 'Migrate client data to new CRM platform',
    status: 'blocked',
    assignee: 'Marcus Johnson',
    workspace: 'Client Services',
    priority: 'high',
    dueDate: daysFromNow(10),
    source: 'ELT Strategic Review',
  },
  {
    title: 'Launch hybrid engagement pilot program',
    status: 'blocked',
    assignee: 'Sarah Chen',
    workspace: 'Operations',
    priority: 'high',
    dueDate: daysFromNow(14),
    source: 'Q2 Planning Workshop',
  },
  {
    title: 'Finalize partnership agreement with TechNova',
    status: 'blocked',
    assignee: 'Lisa Park',
    workspace: 'Business Development',
    priority: 'medium',
    dueDate: daysFromNow(8),
    source: 'BD Pipeline Review',
  },
  {
    title: 'Implement new expense approval workflow',
    status: 'blocked',
    assignee: 'Priya Sharma',
    workspace: 'Finance',
    priority: 'medium',
    dueDate: daysFromNow(12),
    source: 'Finance Monthly Close',
  },

  // --- Completed (9) ---
  {
    title: 'Onboard three new junior consultants',
    status: 'completed',
    assignee: 'Tom Wilson',
    workspace: 'Operations',
    priority: 'high',
    dueDate: daysFromNow(-7),
    source: 'Hiring Committee',
  },
  {
    title: 'Close Ridgeline Manufacturing deal',
    status: 'completed',
    assignee: 'Lisa Park',
    workspace: 'Business Development',
    priority: 'critical',
    dueDate: daysFromNow(-10),
    source: 'BD Pipeline Review',
  },
  {
    title: 'Deliver Acme Corp discovery report',
    status: 'completed',
    assignee: 'David Hayes',
    workspace: 'Client Services',
    priority: 'high',
    dueDate: daysFromNow(-8),
    source: 'Client: Acme Corp Check-in',
  },
  {
    title: 'Complete January financial close',
    status: 'completed',
    assignee: 'Priya Sharma',
    workspace: 'Finance',
    priority: 'high',
    dueDate: daysFromNow(-6),
    source: 'Finance Monthly Close',
  },
  {
    title: 'Publish updated employee handbook',
    status: 'completed',
    assignee: 'Tom Wilson',
    workspace: 'Operations',
    priority: 'medium',
    dueDate: daysFromNow(-12),
    source: 'All-Hands',
  },
  {
    title: 'Set up client feedback automation',
    status: 'completed',
    assignee: 'Anna Rodriguez',
    workspace: 'Client Services',
    priority: 'medium',
    dueDate: daysFromNow(-9),
    source: 'Client Services Review',
  },
  {
    title: 'Negotiate office lease renewal',
    status: 'completed',
    assignee: 'Sarah Chen',
    workspace: 'Operations',
    priority: 'low',
    dueDate: daysFromNow(-14),
    source: 'OPS Weekly Standup',
  },
  {
    title: 'Run Q1 client NPS survey',
    status: 'completed',
    assignee: 'Anna Rodriguez',
    workspace: 'Client Services',
    priority: 'medium',
    dueDate: daysFromNow(-11),
    source: 'Client Services Review',
  },
  {
    title: 'Update company pitch deck for Q2',
    status: 'completed',
    assignee: 'Jay Altizer',
    workspace: 'Executive',
    priority: 'medium',
    dueDate: daysFromNow(-5),
    source: 'ELT Strategic Review',
  },
];

// ── Decisions (8) ───────────────────────────────────────────

const decisions = [
  {
    title: 'Approved: Switch to hybrid client engagement model',
    status: 'approved',
    rationale: 'Client feedback indicates 40% prefer a mix of on-site and remote delivery. Reduces travel costs by 25% while maintaining relationship quality.',
    workspace: 'Executive',
    linkedMeeting: 'ELT Strategic Review',
    linkedActions: 3,
    date: daysFromNow(-10),
  },
  {
    title: 'Pending: Q2 hiring freeze',
    status: 'pending',
    rationale: 'Pipeline uncertainty may require holding 3 open positions until Q2 revenue visibility improves. Finance recommends caution given $180K gap to target.',
    workspace: 'Executive',
    linkedMeeting: 'Q2 Planning Workshop',
    linkedActions: 2,
    date: daysFromNow(-2),
  },
  {
    title: 'Approved: Acme Corp contract extension',
    status: 'approved',
    rationale: 'Phase 2 scope validated with client stakeholders. 6-month extension at $45K/month. Staffing plan covers resource needs from existing bench.',
    workspace: 'Client Services',
    linkedMeeting: 'Client: Acme Corp Check-in',
    linkedActions: 2,
    date: daysFromNow(-7),
  },
  {
    title: 'Approved: Adopt new CRM platform',
    status: 'approved',
    rationale: 'Current CRM lacks pipeline analytics and client health scoring. New platform integrates with existing tools and provides AI-powered forecasting.',
    workspace: 'Business Development',
    linkedMeeting: 'BD Pipeline Review',
    linkedActions: 1,
    date: daysFromNow(-14),
  },
  {
    title: 'Pending: Establish strategic partnership with TechNova',
    status: 'pending',
    rationale: 'TechNova offers complementary cloud migration capabilities. Joint proposals could unlock enterprise segment. Legal review of partnership terms in progress.',
    workspace: 'Business Development',
    linkedMeeting: 'ELT Strategic Review',
    linkedActions: 1,
    date: daysFromNow(-5),
  },
  {
    title: 'Approved: Implement new expense approval workflow',
    status: 'approved',
    rationale: 'Current paper-based process causes 5-day delays. Digital workflow reduces approval time to 24 hours and improves audit trail compliance.',
    workspace: 'Finance',
    linkedMeeting: 'Finance Monthly Close',
    linkedActions: 1,
    date: daysFromNow(-8),
  },
  {
    title: 'Rejected: Outsource recruiting to external agency',
    status: 'rejected',
    rationale: 'Agency fees of 20% per hire are prohibitive at current scale. Internal recruiting with improved tooling is more cost-effective for our volume.',
    workspace: 'Operations',
    linkedMeeting: 'Hiring Committee',
    linkedActions: 0,
    date: daysFromNow(-12),
  },
  {
    title: 'Approved: Quarterly client satisfaction benchmarking',
    status: 'approved',
    rationale: 'NPS scores need regular tracking against industry benchmarks. Quarterly cadence balances survey fatigue with actionable data frequency.',
    workspace: 'Client Services',
    linkedMeeting: 'Client Services Review',
    linkedActions: 2,
    date: daysFromNow(-6),
  },
];

// ── Financials ──────────────────────────────────────────────

const financials = {
  pipeline: 2400000,
  deals: 28,
  q2Target: 1800000,
  gap: 180000,
  monthlyRevenue: 320000,
  clientRetention: 0.94,
};

// ── AI Insights (10) ────────────────────────────────────────

const insights = [
  {
    id: 'ins-1',
    text: 'Acme Corp engagement health declining: 2 overdue deliverables and an unresolved API blocker. Recommend escalating resource allocation this week.',
    category: 'client-health',
    severity: 'high',
    source: 'Client Services Review + Emergency: Campaign Blocker Resolution',
  },
  {
    id: 'ins-2',
    text: 'Pipeline gap of $180K to Q2 target. Three deals at risk of slipping. BD team should prioritize Beacon Health and TerraForm closings.',
    category: 'pipeline',
    severity: 'high',
    source: 'BD Pipeline Review + Finance Monthly Close',
  },
  {
    id: 'ins-3',
    text: 'Hiring pipeline has 12 candidates for 3 positions, but Q2 freeze decision pending. Delay could lose top candidates to competitors.',
    category: 'talent',
    severity: 'medium',
    source: 'Hiring Committee + Q2 Planning Workshop',
  },
  {
    id: 'ins-4',
    text: 'Client retention at 94% exceeds industry average of 88%. Quarterly NPS benchmarking decision will help maintain this advantage.',
    category: 'client-health',
    severity: 'low',
    source: 'Client Services Review',
  },
  {
    id: 'ins-5',
    text: 'Two invoices outstanding >60 days ($85K combined). Collections process should be initiated before Q2 close to avoid revenue recognition issues.',
    category: 'financial',
    severity: 'high',
    source: 'Finance Monthly Close',
  },
  {
    id: 'ins-6',
    text: 'Hybrid engagement model approved but pilot program is blocked. Dependencies on CRM migration and client communication templates need resolution.',
    category: 'operations',
    severity: 'medium',
    source: 'ELT Strategic Review + Q2 Planning Workshop',
  },
  {
    id: 'ins-7',
    text: 'Cross-referencing BD Pipeline Review and Client Services Review: 3 active proposals reference consultants already at capacity. Resource conflict likely in Q2.',
    category: 'resource-conflict',
    severity: 'high',
    source: 'BD Pipeline Review + Client Services Review',
  },
  {
    id: 'ins-8',
    text: 'TechNova partnership could accelerate 4 pipeline deals worth $640K. Legal review is the only remaining blocker -- recommend expediting.',
    category: 'partnership',
    severity: 'medium',
    source: 'ELT Strategic Review + BD Pipeline Review',
  },
  {
    id: 'ins-9',
    text: 'January revenue 6% above forecast suggests conservative budgeting. Consider revising Q2 targets upward if February trend continues.',
    category: 'financial',
    severity: 'low',
    source: 'Finance Monthly Close',
  },
  {
    id: 'ins-10',
    text: 'All-Hands meeting agenda lacks project spotlight section. Team recognition and client win celebrations correlate with 12% higher engagement scores.',
    category: 'culture',
    severity: 'low',
    source: 'All-Hands + OPS Weekly Standup',
  },
];

// ── Proposals (7) ───────────────────────────────────────────

const proposals = [
  {
    id: 'prop-1',
    title: 'Reallocate two bench consultants to Acme Corp immediately',
    reasoning: 'Acme has 2 overdue deliverables and an active API blocker. Adding resources now prevents contract penalty clauses from activating.',
    source: 'Emergency: Campaign Blocker Resolution',
    type: 'resource',
    urgency: 'critical',
  },
  {
    id: 'prop-2',
    title: 'Fast-track Beacon Health SOW to close pipeline gap',
    reasoning: 'At $320K, Beacon Health is the single largest opportunity that can close within Q2. SOW is overdue -- prioritizing it closes 60% of the $180K gap.',
    source: 'BD Pipeline Review',
    type: 'revenue',
    urgency: 'high',
  },
  {
    id: 'prop-3',
    title: 'Defer hiring freeze decision by 2 weeks pending February revenue data',
    reasoning: 'January ran 6% above forecast. Two more weeks of data will provide clarity without losing top candidates who have competing offers.',
    source: 'Q2 Planning Workshop',
    type: 'strategic',
    urgency: 'medium',
  },
  {
    id: 'prop-4',
    title: 'Expedite TechNova partnership legal review',
    reasoning: 'Partnership unlocks $640K in joint proposals. Current blocker is legal review with estimated 3-week timeline. External counsel could reduce to 1 week.',
    source: 'ELT Strategic Review',
    type: 'partnership',
    urgency: 'medium',
  },
  {
    id: 'prop-5',
    title: 'Initiate collections process for overdue invoices',
    reasoning: 'Two invoices totaling $85K are >60 days overdue. Industry best practice is 45-day escalation. Delaying risks Q2 cash flow issues.',
    source: 'Finance Monthly Close',
    type: 'financial',
    urgency: 'high',
  },
  {
    id: 'prop-6',
    title: 'Create resource capacity dashboard for BD team',
    reasoning: 'Three proposals reference at-capacity consultants. A real-time capacity view prevents over-commitment and improves proposal accuracy.',
    source: 'Client Services Review',
    type: 'operational',
    urgency: 'medium',
  },
  {
    id: 'prop-7',
    title: 'Add project spotlight segment to All-Hands agenda',
    reasoning: 'Research shows team recognition improves engagement by 12%. Current All-Hands lacks structured recognition. Low effort, high impact.',
    source: 'All-Hands',
    type: 'culture',
    urgency: 'low',
  },
];

// ── Calendar Events ─────────────────────────────────────────

const calendarEvents = [
  { title: 'OPS Weekly Standup', time: hoursFromNow(-2), type: 'past', workspace: 'Operations' },
  { title: 'Client Services Review', time: hoursFromNow(4), type: 'upcoming', workspace: 'Client Services' },
  { title: 'Client: Acme Corp Check-in', time: hoursFromNow(28), type: 'upcoming', workspace: 'Client Services' },
  { title: 'BD Pipeline Review', time: hoursFromNow(24), type: 'upcoming', workspace: 'Business Development' },
  { title: 'Hiring Committee', time: daysFromNow(2), type: 'upcoming', workspace: 'Operations' },
  { title: 'Q2 Planning Workshop', time: daysFromNow(3), type: 'upcoming', workspace: 'Executive' },
  { title: 'All-Hands', time: daysFromNow(5), type: 'upcoming', workspace: 'Executive' },
  { title: 'ELT Strategic Review', time: daysFromNow(7), type: 'upcoming', workspace: 'Executive' },
];

// ── Notifications ───────────────────────────────────────────

const notifications = [
  {
    id: 'notif-1',
    text: 'Acme Corp phase 1 deliverables are 5 days overdue',
    type: 'overdue',
    severity: 'critical',
    timestamp: hoursFromNow(-1),
    relatedAction: 'Submit Acme Corp phase 1 deliverables',
  },
  {
    id: 'notif-2',
    text: 'Q1 revenue reconciliation due date passed',
    type: 'overdue',
    severity: 'high',
    timestamp: hoursFromNow(-3),
    relatedAction: 'Finalize Q1 revenue reconciliation',
  },
  {
    id: 'notif-3',
    text: 'Client Services Review starts in 4 hours',
    type: 'reminder',
    severity: 'medium',
    timestamp: hoursFromNow(0),
    relatedMeeting: 'Client Services Review',
  },
  {
    id: 'notif-4',
    text: 'CRM migration blocked -- awaiting vendor API access',
    type: 'blocked',
    severity: 'high',
    timestamp: hoursFromNow(-6),
    relatedAction: 'Migrate client data to new CRM platform',
  },
  {
    id: 'notif-5',
    text: 'New AI insight: resource conflict detected for Q2 proposals',
    type: 'insight',
    severity: 'medium',
    timestamp: hoursFromNow(-1),
    relatedInsight: 'ins-7',
  },
];

// ── Assemble Dataset ────────────────────────────────────────

const consultingData = {
  company,
  team,
  meetings,
  actions,
  decisions,
  financials,
  insights,
  proposals,
  calendarEvents,
  notifications,
};

export default consultingData;

// Register with industry loader
registerDataset('consulting', consultingData);
