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
  name: 'Harbor Restaurant Group',
  size: 95,
  industry: 'hospitality',
  founded: 2019,
  hq: 'Portland, OR',
  description:
    'Three-location restaurant group featuring harbor-side dining, waterfront casual, and full-service catering. Known for locally-sourced Pacific Northwest cuisine.',
};

// ── Locations ───────────────────────────────────────────────

const locations = [
  { name: 'Harbor Downtown', staff: 45, type: 'restaurant' },
  { name: 'Harbor Waterfront', staff: 30, type: 'restaurant' },
  { name: 'Harbor Catering', staff: 20, type: 'catering' },
];

// ── Team (8 members) ────────────────────────────────────────

const team = [
  {
    name: 'Maria Santos',
    role: 'Owner/GM',
    department: 'Management',
    avatarColor: '#7C3AED',
    email: 'maria@harborgroup.com',
    joined: '2019-01-15',
  },
  {
    name: "James O'Brien",
    role: 'Head Chef',
    department: 'Kitchen/Menu',
    avatarColor: '#F59E0B',
    email: 'james@harborgroup.com',
    joined: '2019-03-01',
  },
  {
    name: 'Sophie Laurent',
    role: 'FOH Manager (Downtown)',
    department: 'Front-of-House',
    avatarColor: '#4F46E5',
    email: 'sophie@harborgroup.com',
    joined: '2019-06-10',
  },
  {
    name: 'Carlos Mendez',
    role: 'Events Director',
    department: 'Events',
    avatarColor: '#10B981',
    email: 'carlos@harborgroup.com',
    joined: '2020-02-01',
  },
  {
    name: 'Aisha Williams',
    role: 'Operations Manager',
    department: 'Operations',
    avatarColor: '#3B82F6',
    email: 'aisha@harborgroup.com',
    joined: '2020-08-15',
  },
  {
    name: 'Ryan Park',
    role: 'FOH Manager (Waterfront)',
    department: 'Front-of-House',
    avatarColor: '#14B8A6',
    email: 'ryan@harborgroup.com',
    joined: '2021-04-01',
  },
  {
    name: 'Nina Petrov',
    role: 'Catering Lead',
    department: 'Events',
    avatarColor: '#EC4899',
    email: 'nina@harborgroup.com',
    joined: '2021-09-15',
  },
  {
    name: 'Ben Thompson',
    role: 'Sous Chef',
    department: 'Kitchen/Menu',
    avatarColor: '#EF4444',
    email: 'ben@harborgroup.com',
    joined: '2022-01-10',
  },
];

// ── Meetings (10) ───────────────────────────────────────────

const meetings = [
  {
    title: 'Weekly Menu Review',
    type: 'recurring',
    time: hoursFromNow(-3),
    duration: 60,
    attendees: ["James O'Brien", 'Ben Thompson', 'Maria Santos'],
    workspace: 'Kitchen/Menu',
    aiSummary:
      'Reviewed seasonal menu rotation for spring. James proposed adding three new seafood dishes using local halibut. Ben flagged prep time concerns for Friday dinner rush. Maria approved trial run next week.',
  },
  {
    title: 'Staff Scheduling Sync',
    type: 'recurring',
    time: hoursFromNow(2),
    duration: 45,
    attendees: ['Aisha Williams', 'Sophie Laurent', 'Ryan Park'],
    workspace: 'Operations',
    aiSummary:
      'Reviewed next two weeks of coverage across all three locations. Sophie flagged two callouts at Downtown for Saturday. Ryan needs one additional server for Waterfront patio opening. Aisha to post open shifts.',
  },
  {
    title: 'Event Planning - Corporate Gala',
    type: 'one-time',
    time: daysFromNow(5),
    duration: 90,
    attendees: ['Carlos Mendez', 'Nina Petrov', "James O'Brien", 'Maria Santos'],
    workspace: 'Events',
    aiSummary:
      'Planning 200-person corporate gala for March 15th. Carlos confirmed venue layout. Nina presented catering menu options. James to finalize custom dessert course. Maria approved preliminary budget of $28,000.',
  },
  {
    title: 'Supplier Call - Pacific Seafood',
    type: 'ad-hoc',
    time: hoursFromNow(-26),
    duration: 30,
    attendees: ["James O'Brien", 'Aisha Williams'],
    workspace: 'Kitchen/Menu',
    aiSummary:
      'Negotiated pricing for Q2 seafood deliveries. Pacific Seafood offering 5% discount on volume commitment. James wants to lock in salmon and halibut pricing. Aisha to review contract terms.',
  },
  {
    title: 'Monthly P&L Review',
    type: 'recurring',
    time: daysFromNow(-2),
    duration: 90,
    attendees: ['Maria Santos', 'Aisha Williams'],
    workspace: 'Management',
    aiSummary:
      'January food cost came in at 31%, slightly above 30% target. Labor cost at 28% is within range. Event revenue strong at $68K across 12 bookings. Waterfront location showing strongest growth trajectory.',
  },
  {
    title: 'Health Inspection Prep',
    type: 'one-time',
    time: daysFromNow(3),
    duration: 60,
    attendees: ['Aisha Williams', "James O'Brien", 'Sophie Laurent', 'Ryan Park'],
    workspace: 'Operations',
    aiSummary:
      'Annual health inspection scheduled for next week at Downtown and Waterfront. Aisha distributed checklist updates. James confirmed cold storage temps are logged daily. Sophie and Ryan to verify front-of-house compliance.',
  },
  {
    title: 'Catering Proposal Review',
    type: 'ad-hoc',
    time: hoursFromNow(24),
    duration: 45,
    attendees: ['Nina Petrov', 'Carlos Mendez', 'Maria Santos'],
    workspace: 'Events',
    aiSummary:
      'Reviewed three incoming catering RFPs. Nina presented cost breakdowns for each. Carlos recommended accepting the Techstars demo day and Portland Art Museum events. Maria to approve final pricing.',
  },
  {
    title: 'Location Manager Sync',
    type: 'recurring',
    time: hoursFromNow(-48),
    duration: 30,
    attendees: ['Sophie Laurent', 'Ryan Park', 'Aisha Williams'],
    workspace: 'Front-of-House',
    aiSummary:
      'Cross-location coordination meeting. Sophie shared Downtown reservation trends showing 15% increase. Ryan reported Waterfront patio repairs on schedule. Both flagged need for shared server pool during peak weekends.',
  },
  {
    title: 'Weekly Operations Standup',
    type: 'recurring',
    time: hoursFromNow(-1),
    duration: 30,
    attendees: ['Aisha Williams', 'Maria Santos', 'Sophie Laurent', 'Ryan Park', "James O'Brien"],
    workspace: 'Operations',
    aiSummary:
      'Quick status across all locations. No critical issues. Waterfront HVAC repair completed. Downtown POS system update scheduled for Tuesday. Catering van maintenance due next week.',
  },
  {
    title: 'All-Hands Meeting',
    type: 'recurring',
    time: daysFromNow(7),
    duration: 60,
    attendees: [
      'Maria Santos',
      "James O'Brien",
      'Sophie Laurent',
      'Carlos Mendez',
      'Aisha Williams',
      'Ryan Park',
      'Nina Petrov',
      'Ben Thompson',
    ],
    workspace: 'Management',
    aiSummary:
      'Monthly all-hands covering Q1 performance, spring menu launch, upcoming events calendar, and new employee onboarding. Maria to recognize top performers. James to preview spring tasting menu.',
  },
];

// ── Actions (23) ────────────────────────────────────────────

const actions = [
  // Inventory & Supply
  {
    title: 'Place weekly seafood order with Pacific Seafood',
    status: 'in_progress',
    assignee: "James O'Brien",
    workspace: 'Kitchen/Menu',
    priority: 'high',
  },
  {
    title: 'Audit dry goods inventory across all locations',
    status: 'overdue',
    assignee: 'Ben Thompson',
    workspace: 'Kitchen/Menu',
    priority: 'high',
  },
  {
    title: 'Negotiate new linen supplier contract',
    status: 'in_progress',
    assignee: 'Aisha Williams',
    workspace: 'Operations',
    priority: 'medium',
  },
  {
    title: 'Order replacement glassware for Waterfront',
    status: 'completed',
    assignee: 'Ryan Park',
    workspace: 'Front-of-House',
    priority: 'low',
  },
  // Menu Updates
  {
    title: 'Finalize spring menu draft',
    status: 'in_progress',
    assignee: "James O'Brien",
    workspace: 'Kitchen/Menu',
    priority: 'critical',
  },
  {
    title: 'Update allergen labels for new dishes',
    status: 'blocked',
    assignee: 'Ben Thompson',
    workspace: 'Kitchen/Menu',
    priority: 'high',
  },
  {
    title: 'Design new dessert menu cards',
    status: 'completed',
    assignee: 'Sophie Laurent',
    workspace: 'Front-of-House',
    priority: 'medium',
  },
  {
    title: 'Train staff on wine pairing updates',
    status: 'in_progress',
    assignee: 'Sophie Laurent',
    workspace: 'Front-of-House',
    priority: 'medium',
  },
  // Event Preparations
  {
    title: 'Confirm AV setup for corporate gala',
    status: 'in_progress',
    assignee: 'Carlos Mendez',
    workspace: 'Events',
    priority: 'high',
  },
  {
    title: 'Finalize catering menu for Techstars event',
    status: 'overdue',
    assignee: 'Nina Petrov',
    workspace: 'Events',
    priority: 'critical',
  },
  {
    title: 'Coordinate tent rental for outdoor reception',
    status: 'completed',
    assignee: 'Carlos Mendez',
    workspace: 'Events',
    priority: 'medium',
  },
  {
    title: 'Book florist for Art Museum gala',
    status: 'in_progress',
    assignee: 'Nina Petrov',
    workspace: 'Events',
    priority: 'medium',
  },
  {
    title: 'Send event deposit invoices',
    status: 'overdue',
    assignee: 'Carlos Mendez',
    workspace: 'Events',
    priority: 'high',
  },
  // Maintenance & Operations
  {
    title: 'Schedule HVAC maintenance for Downtown',
    status: 'completed',
    assignee: 'Aisha Williams',
    workspace: 'Operations',
    priority: 'medium',
  },
  {
    title: 'Repair patio furniture at Waterfront',
    status: 'completed',
    assignee: 'Ryan Park',
    workspace: 'Operations',
    priority: 'low',
  },
  {
    title: 'Update POS system software at all locations',
    status: 'blocked',
    assignee: 'Aisha Williams',
    workspace: 'Operations',
    priority: 'high',
  },
  {
    title: 'Complete fire safety inspection checklist',
    status: 'in_progress',
    assignee: 'Aisha Williams',
    workspace: 'Operations',
    priority: 'critical',
  },
  {
    title: 'Service catering delivery van',
    status: 'overdue',
    assignee: 'Nina Petrov',
    workspace: 'Operations',
    priority: 'medium',
  },
  // Staffing
  {
    title: 'Post job listing for line cook position',
    status: 'completed',
    assignee: 'Maria Santos',
    workspace: 'Management',
    priority: 'high',
  },
  {
    title: 'Schedule new server orientation at Downtown',
    status: 'completed',
    assignee: 'Sophie Laurent',
    workspace: 'Front-of-House',
    priority: 'medium',
  },
  {
    title: 'Review overtime hours for January',
    status: 'overdue',
    assignee: 'Aisha Williams',
    workspace: 'Operations',
    priority: 'high',
  },
  {
    title: 'Update employee handbook with new PTO policy',
    status: 'blocked',
    assignee: 'Maria Santos',
    workspace: 'Management',
    priority: 'medium',
  },
  {
    title: 'Coordinate cross-location server coverage for Valentine weekend',
    status: 'completed',
    assignee: 'Ryan Park',
    workspace: 'Front-of-House',
    priority: 'critical',
  },
];

// ── Decisions (8) ───────────────────────────────────────────

const decisions = [
  {
    title: 'Raise dinner entree prices by 8%',
    status: 'approved',
    rationale:
      'Food costs have increased 12% year-over-year. An 8% price increase keeps margins within target while remaining competitive with peer restaurants.',
    workspace: 'Kitchen/Menu',
  },
  {
    title: 'Switch to regional seafood supplier',
    status: 'approved',
    rationale:
      'Pacific Seafood offers fresher product with shorter supply chain. 5% volume discount offsets slightly higher per-unit cost. Supports local sourcing brand positioning.',
    workspace: 'Kitchen/Menu',
  },
  {
    title: 'Require 48-hour cancellation for events over 50 guests',
    status: 'approved',
    rationale:
      'Three large event cancellations in Q4 resulted in $15K food waste. 48-hour policy with 25% deposit retention protects against last-minute losses.',
    workspace: 'Events',
  },
  {
    title: 'Add second sous chef position at Downtown',
    status: 'pending',
    rationale:
      'Friday and Saturday dinner service consistently understaffed in kitchen. Adding a second sous chef reduces prep bottleneck and improves ticket times by an estimated 20%.',
    workspace: 'Kitchen/Menu',
  },
  {
    title: 'Implement shared server pool for peak weekends',
    status: 'approved',
    rationale:
      'Cross-location coverage reduces overtime costs by approximately $2,400/month while improving service quality during high-volume periods.',
    workspace: 'Front-of-House',
  },
  {
    title: 'Launch weekday lunch service at Waterfront',
    status: 'under_review',
    rationale:
      'Market analysis shows strong weekday foot traffic near Waterfront location. Projected revenue of $18K/month with minimal additional staffing using existing prep kitchen.',
    workspace: 'Management',
  },
  {
    title: 'Upgrade POS system to cloud-based platform',
    status: 'approved',
    rationale:
      'Current system lacks cross-location reporting. Cloud POS enables real-time inventory tracking, unified reporting, and mobile ordering integration. ROI projected within 8 months.',
    workspace: 'Operations',
  },
  {
    title: 'Expand catering menu with vegan and gluten-free options',
    status: 'approved',
    rationale:
      'Dietary restriction requests have increased 35% over past year. Expanded options open access to corporate clients with inclusive dining requirements.',
    workspace: 'Events',
  },
];

// ── Financials ──────────────────────────────────────────────

const financials = {
  monthlyRevenue: 285000,
  foodCost: 0.31,
  foodCostTarget: 0.3,
  laborCost: 0.28,
  eventBookings: 12,
  eventRevenue: 68000,
};

// ── AI Insights (10) ────────────────────────────────────────

const insights = [
  {
    id: 'ins-1',
    type: 'alert',
    title: 'Food cost trending above target',
    summary:
      'January food cost at 31% exceeds the 30% target. Seafood prices drove the variance. Locking in Q2 supplier pricing could save an estimated $3,200/month.',
    severity: 'medium',
    workspace: 'Kitchen/Menu',
    timestamp: hoursFromNow(-4),
  },
  {
    id: 'ins-2',
    type: 'scheduling',
    title: 'Weekend staffing gap at Downtown',
    summary:
      'Saturday dinner shifts are short by 2 servers on average. Cross-referencing with reservation data, coverage should increase to 8 FOH staff minimum for projected covers.',
    severity: 'high',
    workspace: 'Front-of-House',
    timestamp: hoursFromNow(-6),
  },
  {
    id: 'ins-3',
    type: 'opportunity',
    title: 'Event capacity underutilized on Sundays',
    summary:
      'Sunday event bookings are at 15% capacity across locations. Introducing a Sunday brunch event package could generate an estimated $8,500/month in additional revenue.',
    severity: 'low',
    workspace: 'Events',
    timestamp: hoursFromNow(-8),
  },
  {
    id: 'ins-4',
    type: 'pricing',
    title: 'Supplier pricing variance detected',
    summary:
      'Produce costs from Valley Farms are 12% higher than comparable suppliers for three key items. Switching romaine, tomatoes, and herbs could save $1,800/month.',
    severity: 'medium',
    workspace: 'Kitchen/Menu',
    timestamp: hoursFromNow(-12),
  },
  {
    id: 'ins-5',
    type: 'trend',
    title: 'Waterfront location growth accelerating',
    summary:
      'Waterfront revenue up 22% month-over-month, driven by weekend brunch and patio dining. Consider accelerating patio expansion timeline to capture spring/summer demand.',
    severity: 'low',
    workspace: 'Management',
    timestamp: hoursFromNow(-14),
  },
  {
    id: 'ins-6',
    type: 'alert',
    title: 'Overtime hours exceeding budget',
    summary:
      'January overtime across all locations was 340 hours, 18% above budget. Downtown kitchen accounts for 60% of overages. Scheduling optimization recommended.',
    severity: 'high',
    workspace: 'Operations',
    timestamp: hoursFromNow(-18),
  },
  {
    id: 'ins-7',
    type: 'opportunity',
    title: 'Catering repeat client rate at 72%',
    summary:
      'Strong repeat booking rate suggests high client satisfaction. A referral discount program could convert existing clients into lead generators for new corporate accounts.',
    severity: 'low',
    workspace: 'Events',
    timestamp: hoursFromNow(-22),
  },
  {
    id: 'ins-8',
    type: 'compliance',
    title: 'Health inspection due in 10 days',
    summary:
      'Annual health inspection for Downtown and Waterfront is scheduled. Last inspection flagged cold storage temperature logging gaps. Ensure daily logs are current for all walk-in units.',
    severity: 'high',
    workspace: 'Operations',
    timestamp: hoursFromNow(-24),
  },
  {
    id: 'ins-9',
    type: 'menu',
    title: 'Top-selling entree margin below average',
    summary:
      'The pan-seared salmon (top seller at 180 covers/week) has a 24% margin vs. 32% menu average. Portion adjustment or side substitution could improve margin by 5 points without impacting guest satisfaction.',
    severity: 'medium',
    workspace: 'Kitchen/Menu',
    timestamp: hoursFromNow(-28),
  },
  {
    id: 'ins-10',
    type: 'trend',
    title: 'Online reservation conversion improving',
    summary:
      'Website-to-reservation conversion rate improved from 8% to 14% after the new booking widget launch. Consider extending the widget to the catering inquiry page.',
    severity: 'low',
    workspace: 'Management',
    timestamp: hoursFromNow(-32),
  },
];

// ── Assemble Dataset ────────────────────────────────────────

const hospitalityData = {
  company,
  team,
  meetings,
  actions,
  decisions,
  financials,
  insights,
  locations,
};

export default hospitalityData;

// Register with industry loader
registerDataset('hospitality', hospitalityData);
