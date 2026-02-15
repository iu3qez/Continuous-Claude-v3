import { registerDataset } from '../components/industry.js';

// ── ByteForge Labs - B2B SaaS Startup ─────────────────────

const techData = {
  company: {
    name: 'ByteForge Labs',
    size: 32,
    industry: 'tech',
    founded: '2023',
    description: 'B2B SaaS platform for developer workflow automation',
  },

  // ── Team (8) ──────────────────────────────────────────────

  team: [
    { name: 'Alex Rivera', role: 'CEO/Founder', department: 'Executive', avatarColor: 'purple' },
    { name: 'Jordan Kim', role: 'CTO', department: 'Engineering', avatarColor: 'indigo' },
    { name: 'Sam Patel', role: 'VP Product', department: 'Product', avatarColor: 'green' },
    { name: 'Maya Chen', role: 'Head of Sales', department: 'Sales', avatarColor: 'blue' },
    { name: 'Chris Taylor', role: 'Marketing Director', department: 'Marketing', avatarColor: 'amber' },
    { name: 'Dev Nguyen', role: 'Lead Engineer', department: 'Engineering', avatarColor: 'teal' },
    { name: 'Rachel Stone', role: 'Sales Rep', department: 'Sales', avatarColor: 'sky' },
    { name: 'Kai Yamamoto', role: 'Designer', department: 'Product', avatarColor: 'pink' },
  ],

  // ── Meetings (10) ────────────────────────────────────────

  meetings: [
    {
      title: 'Sprint Planning',
      type: 'recurring',
      time: '2026-02-16T10:00:00Z',
      attendees: ['Jordan Kim', 'Dev Nguyen', 'Sam Patel', 'Kai Yamamoto'],
      workspace: 'Engineering',
    },
    {
      title: 'Product Demo',
      type: 'scheduled',
      time: '2026-02-17T14:00:00Z',
      attendees: ['Sam Patel', 'Alex Rivera', 'Maya Chen', 'Kai Yamamoto'],
      workspace: 'Product',
    },
    {
      title: 'Sales Pipeline Review',
      type: 'recurring',
      time: '2026-02-14T11:00:00Z',
      attendees: ['Maya Chen', 'Rachel Stone', 'Alex Rivera'],
      workspace: 'Sales',
    },
    {
      title: 'Investor Update Prep',
      type: 'scheduled',
      time: '2026-02-18T09:00:00Z',
      attendees: ['Alex Rivera', 'Jordan Kim', 'Maya Chen'],
      workspace: 'Executive',
    },
    {
      title: 'Marketing Review',
      type: 'recurring',
      time: '2026-02-14T15:00:00Z',
      attendees: ['Chris Taylor', 'Sam Patel', 'Alex Rivera'],
      workspace: 'Marketing',
    },
    {
      title: '1:1 Alex / Jordan',
      type: 'recurring',
      time: '2026-02-14T09:00:00Z',
      attendees: ['Alex Rivera', 'Jordan Kim'],
      workspace: 'Executive',
    },
    {
      title: 'Engineering Standup',
      type: 'daily',
      time: '2026-02-14T09:30:00Z',
      attendees: ['Jordan Kim', 'Dev Nguyen', 'Kai Yamamoto'],
      workspace: 'Engineering',
    },
    {
      title: 'Design Review',
      type: 'recurring',
      time: '2026-02-15T13:00:00Z',
      attendees: ['Kai Yamamoto', 'Sam Patel', 'Dev Nguyen'],
      workspace: 'Product',
    },
    {
      title: 'All-Hands',
      type: 'monthly',
      time: '2026-02-20T16:00:00Z',
      attendees: ['Alex Rivera', 'Jordan Kim', 'Sam Patel', 'Maya Chen', 'Chris Taylor', 'Dev Nguyen', 'Rachel Stone', 'Kai Yamamoto'],
      workspace: 'Executive',
    },
    {
      title: 'Customer Success Call - Acme Corp',
      type: 'scheduled',
      time: '2026-02-14T16:30:00Z',
      attendees: ['Maya Chen', 'Rachel Stone', 'Dev Nguyen'],
      workspace: 'Sales',
    },
  ],

  // ── Actions (23) ─────────────────────────────────────────

  actions: [
    { title: 'Fix authentication token refresh bug', status: 'in_progress', assignee: 'Dev Nguyen', workspace: 'Engineering', priority: 'critical' },
    { title: 'Resolve API rate limiting edge case', status: 'in_progress', assignee: 'Jordan Kim', workspace: 'Engineering', priority: 'high' },
    { title: 'Update user onboarding flow', status: 'completed', assignee: 'Kai Yamamoto', workspace: 'Product', priority: 'high' },
    { title: 'Deploy v2.3 hotfix to staging', status: 'completed', assignee: 'Dev Nguyen', workspace: 'Engineering', priority: 'critical' },
    { title: 'Follow up with Globex on enterprise deal', status: 'overdue', assignee: 'Maya Chen', workspace: 'Sales', priority: 'high' },
    { title: 'Send proposal to Initech', status: 'in_progress', assignee: 'Rachel Stone', workspace: 'Sales', priority: 'medium' },
    { title: 'Close Acme Corp renewal', status: 'in_progress', assignee: 'Maya Chen', workspace: 'Sales', priority: 'high' },
    { title: 'Publish Q1 product roadmap blog post', status: 'overdue', assignee: 'Chris Taylor', workspace: 'Marketing', priority: 'medium' },
    { title: 'Launch LinkedIn ad campaign', status: 'in_progress', assignee: 'Chris Taylor', workspace: 'Marketing', priority: 'medium' },
    { title: 'Finalize Series A pitch deck', status: 'blocked', assignee: 'Alex Rivera', workspace: 'Executive', priority: 'critical' },
    { title: 'Implement webhook retry logic', status: 'in_progress', assignee: 'Dev Nguyen', workspace: 'Engineering', priority: 'high' },
    { title: 'Add SSO support for enterprise tier', status: 'blocked', assignee: 'Jordan Kim', workspace: 'Engineering', priority: 'high' },
    { title: 'Design new dashboard analytics widgets', status: 'in_progress', assignee: 'Kai Yamamoto', workspace: 'Product', priority: 'medium' },
    { title: 'Write integration tests for billing module', status: 'completed', assignee: 'Dev Nguyen', workspace: 'Engineering', priority: 'medium' },
    { title: 'Negotiate AWS reserved instances', status: 'in_progress', assignee: 'Jordan Kim', workspace: 'Engineering', priority: 'low' },
    { title: 'Update competitor analysis doc', status: 'completed', assignee: 'Chris Taylor', workspace: 'Marketing', priority: 'low' },
    { title: 'Schedule demo with Umbrella Corp', status: 'completed', assignee: 'Rachel Stone', workspace: 'Sales', priority: 'medium' },
    { title: 'Review and merge PR #247 - search feature', status: 'in_progress', assignee: 'Jordan Kim', workspace: 'Engineering', priority: 'high' },
    { title: 'Create customer case study - Acme Corp', status: 'overdue', assignee: 'Chris Taylor', workspace: 'Marketing', priority: 'medium' },
    { title: 'Fix mobile responsive layout issues', status: 'in_progress', assignee: 'Kai Yamamoto', workspace: 'Product', priority: 'medium' },
    { title: 'Prepare board meeting materials', status: 'blocked', assignee: 'Alex Rivera', workspace: 'Executive', priority: 'high' },
    { title: 'Set up monitoring alerts for API latency', status: 'completed', assignee: 'Dev Nguyen', workspace: 'Engineering', priority: 'high' },
    { title: 'Draft partnership proposal for TechCon', status: 'in_progress', assignee: 'Chris Taylor', workspace: 'Marketing', priority: 'low' },
  ],

  // ── Decisions (8) ────────────────────────────────────────

  decisions: [
    {
      title: 'Increase Pro tier pricing from $49 to $59/mo',
      status: 'approved',
      rationale: 'Market analysis shows room for 20% increase without churn impact; aligns with added SSO and analytics features',
      workspace: 'Executive',
    },
    {
      title: 'Prioritize enterprise SSO over mobile app',
      status: 'approved',
      rationale: 'Three pipeline deals worth $180K require SSO; mobile can wait until Q3',
      workspace: 'Product',
    },
    {
      title: 'Hire two senior engineers in Q2',
      status: 'pending',
      rationale: 'Current velocity cannot sustain roadmap; need backend and infra specialists',
      workspace: 'Engineering',
    },
    {
      title: 'Pursue Series A at $8M target',
      status: 'in_progress',
      rationale: 'Runway is 14 months; fundraising now gives leverage before metrics plateau',
      workspace: 'Executive',
    },
    {
      title: 'Migrate from Heroku to AWS ECS',
      status: 'approved',
      rationale: 'Cost reduction of 40% and better scaling for enterprise workloads',
      workspace: 'Engineering',
    },
    {
      title: 'Adopt weekly sprint cadence over bi-weekly',
      status: 'approved',
      rationale: 'Faster iteration on customer feedback; engineering team prefers shorter cycles',
      workspace: 'Engineering',
    },
    {
      title: 'Launch partner referral program',
      status: 'pending',
      rationale: 'CAC is $320; referral programs in similar SaaS cut it by 35-50%',
      workspace: 'Marketing',
    },
    {
      title: 'Sunset legacy API v1 by end of Q2',
      status: 'in_progress',
      rationale: 'Maintaining two API versions doubles support burden; 92% of traffic is on v2',
      workspace: 'Engineering',
    },
  ],

  // ── Financials ───────────────────────────────────────────

  financials: {
    mrr: 42000,
    pipeline: 180000,
    deals: 12,
    burnRate: 95000,
    runway: 14,
    arr: 504000,
  },

  // ── AI Insights (10) ─────────────────────────────────────

  insights: [
    {
      type: 'velocity',
      title: 'Sprint velocity trending up',
      description: 'Engineering velocity increased 18% over last 3 sprints. Webhook and billing work shipping ahead of estimates.',
      severity: 'positive',
      workspace: 'Engineering',
    },
    {
      type: 'pipeline',
      title: 'Pipeline staleness alert',
      description: 'Globex deal has been in negotiation for 45 days with no activity. Risk of going cold.',
      severity: 'warning',
      workspace: 'Sales',
    },
    {
      type: 'marketing',
      title: 'LinkedIn campaign ROI strong',
      description: 'Cost per lead from LinkedIn ads is $28, 40% below target. Consider increasing budget.',
      severity: 'positive',
      workspace: 'Marketing',
    },
    {
      type: 'financial',
      title: 'Burn rate exceeding plan',
      description: 'Monthly burn is $95K vs $85K budget. AWS costs and contractor spend are primary drivers.',
      severity: 'warning',
      workspace: 'Executive',
    },
    {
      type: 'churn',
      title: 'Low churn risk this quarter',
      description: 'Net revenue retention is 112%. Only 2 accounts flagged for potential downgrade.',
      severity: 'positive',
      workspace: 'Sales',
    },
    {
      type: 'product',
      title: 'Feature adoption gap',
      description: 'Only 23% of Pro users have activated the new analytics dashboard. Consider guided onboarding.',
      severity: 'warning',
      workspace: 'Product',
    },
    {
      type: 'engineering',
      title: 'Tech debt accumulating in auth module',
      description: 'Auth module has 14 open issues and 3 critical bugs. Dedicated sprint recommended.',
      severity: 'critical',
      workspace: 'Engineering',
    },
    {
      type: 'hiring',
      title: 'Engineering hiring pipeline healthy',
      description: '12 candidates in pipeline for 2 senior roles. 4 at final interview stage.',
      severity: 'positive',
      workspace: 'Engineering',
    },
    {
      type: 'customer',
      title: 'NPS score improvement',
      description: 'NPS increased from 42 to 51 after v2.2 release. Support ticket volume down 15%.',
      severity: 'positive',
      workspace: 'Product',
    },
    {
      type: 'competitive',
      title: 'Competitor launched similar feature',
      description: 'DevFlow released workflow templates last week. Accelerate our template marketplace launch.',
      severity: 'warning',
      workspace: 'Product',
    },
  ],

  // ── Proposals (7) ────────────────────────────────────────

  proposals: [
    { title: 'Acme Corp Enterprise License', value: 48000, status: 'sent', assignee: 'Maya Chen' },
    { title: 'Globex Annual Contract', value: 36000, status: 'draft', assignee: 'Maya Chen' },
    { title: 'Initech Team Plan', value: 12000, status: 'sent', assignee: 'Rachel Stone' },
    { title: 'Umbrella Corp Pilot', value: 8000, status: 'accepted', assignee: 'Rachel Stone' },
    { title: 'Stark Industries POC', value: 24000, status: 'draft', assignee: 'Maya Chen' },
    { title: 'Wayne Enterprises Integration', value: 60000, status: 'sent', assignee: 'Maya Chen' },
    { title: 'Oscorp Developer Tools Bundle', value: 18000, status: 'negotiation', assignee: 'Rachel Stone' },
  ],

  // ── Calendar Events ──────────────────────────────────────

  calendar: [
    { title: 'Series A Pitch - Sequoia', date: '2026-02-25', type: 'external' },
    { title: 'TechCon 2026 Booth', date: '2026-03-10', type: 'conference' },
    { title: 'Q1 Board Meeting', date: '2026-03-28', type: 'internal' },
    { title: 'Product Hunt Launch', date: '2026-03-15', type: 'marketing' },
    { title: 'AWS Migration Cutover', date: '2026-04-01', type: 'engineering' },
  ],
};

registerDataset('tech', techData);

export default techData;
