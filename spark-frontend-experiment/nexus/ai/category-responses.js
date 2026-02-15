/**
 * Tier 2 Category Responses
 *
 * Rich, data-dense response templates for each of the 20 keyword categories.
 * Each response demonstrates cross-system intelligence with tables, structured
 * blocks, and {{placeholder}} tokens for dynamic adaptation.
 */

export const CATEGORY_RESPONSES = {
  finance: {
    category: 'finance',
    content: `**Financial Overview for {{company}}**

Here is what I found across your financial data:

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Revenue | {{revenue}} | {{target}} | {{status}} |
| Operating Costs | {{opCosts}} | {{opTarget}} | {{opStatus}} |
| Gross Margin | {{margin}} | {{marginTarget}} | {{marginStatus}} |

**Key Observations:**
1. Revenue is tracking {{revTrend}} compared to last quarter
2. Operational spending is {{spendDelta}} relative to budget
3. Cash runway remains healthy at {{runway}} months

**Recommended Actions:**
- Review the top 3 cost centers contributing to variance
- Align Q3 projections with updated pipeline data
- Schedule a finance review with department leads`,
    toolChips: ['Querying QuickBooks', 'Analyzing Pipeline', 'Pulling P&L Data'],
    followUpSuggestions: [
      'Break down by department',
      'Show me the trend over 6 months',
      'Compare to last quarter',
    ],
  },

  timeline: {
    category: 'timeline',
    content: `**Timeline & Milestone Tracker for {{company}}**

Here are the upcoming deadlines and milestones across your active projects:

| Milestone | Due Date | Owner | Status |
|-----------|----------|-------|--------|
| {{milestone1}} | {{due1}} | {{owner1}} | {{status1}} |
| {{milestone2}} | {{due2}} | {{owner2}} | {{status2}} |
| {{milestone3}} | {{due3}} | {{owner3}} | {{status3}} |

**Critical Path Items:**
- {{criticalCount}} items are on the critical path this sprint
- Nearest deadline is {{nearestDue}} requiring immediate attention
- {{overdueCount}} items are currently overdue

**Schedule Risk Assessment:**
- Dependencies between Engineering and Design may cause a 1-week slip
- Client deliverable dates are fixed and cannot shift`,
    toolChips: ['Checking Project Timelines', 'Scanning Calendar', 'Loading Gantt View'],
    followUpSuggestions: [
      'What is overdue right now?',
      'Push back a deadline',
      'Show the full project calendar',
    ],
  },

  risk: {
    category: 'risk',
    content: `**Risk & Issue Register for {{company}}**

I have identified {{riskCount}} active risks and {{issueCount}} open issues across the organization:

| Risk | Severity | Likelihood | Owner | Mitigation |
|------|----------|------------|-------|------------|
| {{risk1}} | High | {{like1}} | {{riskOwner1}} | {{mit1}} |
| {{risk2}} | Medium | {{like2}} | {{riskOwner2}} | {{mit2}} |
| {{risk3}} | Low | {{like3}} | {{riskOwner3}} | {{mit3}} |

**Highest Priority:**
- {{topRisk}} requires executive attention this week
- Unmitigated exposure estimated at {{exposure}}
- {{escalatedCount}} items have been escalated in the last 7 days

**Trend:** Risk volume is {{riskTrend}} compared to last month`,
    toolChips: ['Scanning Issue Tracker', 'Loading Risk Matrix', 'Checking Escalations'],
    followUpSuggestions: [
      'Show the full risk matrix',
      'Escalate the top risk',
      'Who owns mitigation for each?',
    ],
  },

  team: {
    category: 'team',
    content: `**Team Allocation & Capacity for {{company}}**

Current team status across departments:

| Team Member | Department | Current Load | Availability |
|-------------|------------|-------------|--------------|
| {{member1}} | {{dept1}} | {{load1}} | {{avail1}} |
| {{member2}} | {{dept2}} | {{load2}} | {{avail2}} |
| {{member3}} | {{dept3}} | {{load3}} | {{avail3}} |

**Capacity Summary:**
- {{availCount}} team members have bandwidth for new assignments
- {{overloadCount}} people are currently over-allocated (>100% utilization)
- Average team utilization sits at {{avgUtil}}

**Recommendations:**
- Redistribute tasks from over-allocated members to available ones
- Consider cross-training for single points of failure
- Review contractor needs for the upcoming sprint`,
    toolChips: ['Loading HR Dashboard', 'Checking Assignments', 'Scanning Workload Data'],
    followUpSuggestions: [
      'Who is available this week?',
      'Show workload balance chart',
      'Reassign tasks from overloaded members',
    ],
  },

  performance: {
    category: 'performance',
    content: `**Performance Dashboard for {{company}}**

Key performance indicators across the organization:

| KPI | Current | Target | Variance | Trend |
|-----|---------|--------|----------|-------|
| {{kpi1}} | {{val1}} | {{tgt1}} | {{var1}} | {{trend1}} |
| {{kpi2}} | {{val2}} | {{tgt2}} | {{var2}} | {{trend2}} |
| {{kpi3}} | {{val3}} | {{tgt3}} | {{var3}} | {{trend3}} |

**Performance Highlights:**
- {{onTrackCount}} of {{totalKpi}} KPIs are on or above target
- {{offTrackCount}} metrics need attention before end of quarter
- Top performer this period: {{topPerformer}} at {{topScore}}

**Areas of Concern:**
- {{concern1}} is trending below threshold for {{concernDuration}}
- Corrective actions are recommended within the next {{actionWindow}}`,
    toolChips: ['Loading KPI Dashboard', 'Querying Metrics DB', 'Pulling Benchmark Data'],
    followUpSuggestions: [
      'Show the full KPI dashboard',
      'Which metrics are off track?',
      'Compare performance to industry benchmark',
    ],
  },

  client: {
    category: 'client',
    content: `**Client & Account Overview for {{company}}**

Active client portfolio summary:

| Account | Value | Health | Last Contact | Next Action |
|---------|-------|--------|-------------|-------------|
| {{client1}} | {{value1}} | {{health1}} | {{contact1}} | {{action1}} |
| {{client2}} | {{value2}} | {{health2}} | {{contact2}} | {{action2}} |
| {{client3}} | {{value3}} | {{health3}} | {{contact3}} | {{action3}} |

**Portfolio Health:**
- {{activeAccounts}} active accounts with {{totalPipeline}} in pipeline
- {{atRiskCount}} accounts flagged as at-risk (no contact in 30+ days)
- Win rate this quarter: {{winRate}} ({{winTrend}} vs last quarter)

**Immediate Attention Required:**
- {{urgentClient}} has an open escalation pending resolution
- Contract renewal for {{renewalClient}} due in {{renewalDays}} days`,
    toolChips: ['Querying CRM', 'Loading Account Health', 'Scanning Deal Pipeline'],
    followUpSuggestions: [
      'Show top 5 accounts by value',
      'Which clients are at risk?',
      'Recent deal activity summary',
    ],
  },

  meeting: {
    category: 'meeting',
    content: `**Meeting Intelligence for {{company}}**

Here is a compiled view of your meeting context:

| Meeting | Date | Attendees | Status | Action Items |
|---------|------|-----------|--------|-------------|
| {{meeting1}} | {{date1}} | {{attendees1}} | {{meetStatus1}} | {{items1}} |
| {{meeting2}} | {{date2}} | {{attendees2}} | {{meetStatus2}} | {{items2}} |
| {{meeting3}} | {{date3}} | {{attendees3}} | {{meetStatus3}} | {{items3}} |

**Meeting Analytics:**
- {{totalMeetings}} meetings this week consuming {{totalHours}} hours
- {{actionItemCount}} open action items from recent meetings
- {{overdueActions}} action items are past their due date

**Preparation Notes:**
- Key topics requiring discussion: {{keyTopics}}
- Unresolved items from previous sessions: {{unresolvedCount}}
- Suggested agenda items based on recent activity: {{suggestedTopics}}`,
    toolChips: ['Scanning Calendar', 'Loading Meeting Notes', 'Pulling Action Items'],
    followUpSuggestions: [
      'Create an agenda for the next meeting',
      'Review notes from the last session',
      'List all open action items',
    ],
  },

  action: {
    category: 'action',
    content: `**Action Item Tracker for {{company}}**

Current action items requiring attention, sorted by priority:

| Task | Priority | Owner | Due Date | Status |
|------|----------|-------|----------|--------|
| {{task1}} | Critical | {{taskOwner1}} | {{taskDue1}} | {{taskStatus1}} |
| {{task2}} | High | {{taskOwner2}} | {{taskDue2}} | {{taskStatus2}} |
| {{task3}} | Medium | {{taskOwner3}} | {{taskDue3}} | {{taskStatus3}} |

**Summary:**
- {{totalTasks}} total active tasks across all projects
- {{overdueTasks}} items are overdue and need immediate attention
- {{completedThisWeek}} tasks completed this week ({{completionRate}} completion rate)

**Bottlenecks Detected:**
- {{bottleneckOwner}} has {{bottleneckCount}} blocked tasks
- Cross-team dependency on {{depTeam}} is holding up {{depCount}} items
- Recommended: escalate {{escalateTask}} before end of day`,
    toolChips: ['Loading Task Board', 'Checking Dependencies', 'Scanning Blocked Items'],
    followUpSuggestions: [
      'Show all overdue items',
      'Assign a task to someone',
      'Mark selected items complete',
    ],
  },

  decision: {
    category: 'decision',
    content: `**Decision Log for {{company}}**

Pending decisions requiring input or approval:

| Decision | Options | Stakeholders | Deadline | Impact |
|----------|---------|-------------|----------|--------|
| {{decision1}} | {{options1}} | {{stake1}} | {{decDue1}} | {{impact1}} |
| {{decision2}} | {{options2}} | {{stake2}} | {{decDue2}} | {{impact2}} |
| {{decision3}} | {{options3}} | {{stake3}} | {{decDue3}} | {{impact3}} |

**Decision Analysis:**
- {{pendingDecisions}} decisions are pending across the organization
- {{blockedByDecision}} work items are blocked waiting on approvals
- Average decision cycle time: {{avgDecisionTime}} days

**Recommendations:**
- {{urgentDecision}} should be resolved this week to unblock engineering
- Consider async approval for low-impact items to reduce meeting load
- {{decisionOwner}} has the most pending approvals ({{approvalCount}})`,
    toolChips: ['Loading Decision Log', 'Checking Approval Queue', 'Scanning Blocked Work'],
    followUpSuggestions: [
      'Show pros and cons for each option',
      'What do stakeholders recommend?',
      'Set a deadline for the top decision',
    ],
  },

  strategy: {
    category: 'strategy',
    content: `**Strategic Overview for {{company}}**

Current strategic initiatives and alignment status:

| Initiative | Lead | Progress | Budget | Health |
|-----------|------|----------|--------|--------|
| {{init1}} | {{initLead1}} | {{prog1}} | {{budget1}} | {{initHealth1}} |
| {{init2}} | {{initLead2}} | {{prog2}} | {{budget2}} | {{initHealth2}} |
| {{init3}} | {{initLead3}} | {{prog3}} | {{budget3}} | {{initHealth3}} |

**Strategic Health Summary:**
- {{onTrackInit}} of {{totalInit}} initiatives are on track
- Total strategic investment this quarter: {{stratBudget}}
- {{amberInit}} initiatives flagged amber for timeline or resource concerns

**Vision Alignment:**
- Company OKRs are {{okrAlignment}} aligned with current execution
- Recommended pivot: consider reallocating resources from {{lowInit}} to {{highInit}}
- Board review scheduled for {{boardDate}} -- deck preparation needed`,
    toolChips: ['Loading Strategy Dashboard', 'Pulling OKR Data', 'Checking Initiative Health'],
    followUpSuggestions: [
      'Show the full strategic roadmap',
      'Which initiatives are highest priority?',
      'Review resource allocation across initiatives',
    ],
  },

  comparison: {
    category: 'comparison',
    content: `**Comparison Analysis for {{company}}**

Side-by-side comparison of the requested items:

| Dimension | Option A | Option B | Delta | Winner |
|-----------|----------|----------|-------|--------|
| {{dim1}} | {{optA1}} | {{optB1}} | {{delta1}} | {{winner1}} |
| {{dim2}} | {{optA2}} | {{optB2}} | {{delta2}} | {{winner2}} |
| {{dim3}} | {{optA3}} | {{optB3}} | {{delta3}} | {{winner3}} |

**Key Differences:**
- The most significant variance is in {{topDiffDim}} ({{topDiffPct}} difference)
- {{optAName}} excels in {{optAStrength}} while {{optBName}} leads in {{optBStrength}}
- Cost difference is {{costDelta}} over the evaluation period

**Recommendation:**
- Based on weighted scoring, {{recommendedOpt}} is the stronger choice
- Consider {{tradeoff}} as a trade-off factor before finalizing
- Historical data shows {{historicalNote}} for similar decisions at {{company}}`,
    toolChips: ['Building Comparison Matrix', 'Calculating Deltas', 'Loading Historical Data'],
    followUpSuggestions: [
      'Show the comparison side by side',
      'What changed since last quarter?',
      'Recommend the best option overall',
    ],
  },

  trend: {
    category: 'trend',
    content: `**Trend Analysis for {{company}}**

Notable patterns detected over the selected time period:

| Metric | 3 Months Ago | Last Month | Current | Direction |
|--------|-------------|------------|---------|-----------|
| {{trendMetric1}} | {{t3m1}} | {{t1m1}} | {{tCur1}} | {{dir1}} |
| {{trendMetric2}} | {{t3m2}} | {{t1m2}} | {{tCur2}} | {{dir2}} |
| {{trendMetric3}} | {{t3m3}} | {{t1m3}} | {{tCur3}} | {{dir3}} |

**Growth Areas:**
- {{growthArea1}} has increased {{growthPct1}} over the period
- {{growthArea2}} shows consistent upward momentum

**Declining Metrics:**
- {{declineArea}} has dropped {{declinePct}} and requires investigation
- Root cause analysis suggests {{declineCause}}

**Seasonal Patterns:**
- Historical data indicates {{seasonalNote}} for this time of year at {{company}}
- Adjusting for seasonality, underlying performance is {{adjustedTrend}}`,
    toolChips: ['Analyzing Trends', 'Building Time Series', 'Checking Seasonal Patterns'],
    followUpSuggestions: [
      'Show the trend as a chart',
      'Extend the time range to 12 months',
      'What caused the biggest change?',
    ],
  },

  forecast: {
    category: 'forecast',
    content: `**Forecast & Projections for {{company}}**

Projections based on current trajectory and historical data:

| Metric | Current | End of Quarter | Year-End | Confidence |
|--------|---------|---------------|----------|------------|
| {{fcMetric1}} | {{fcCur1}} | {{fcEoq1}} | {{fcEoy1}} | {{fcConf1}} |
| {{fcMetric2}} | {{fcCur2}} | {{fcEoq2}} | {{fcEoy2}} | {{fcConf2}} |
| {{fcMetric3}} | {{fcCur3}} | {{fcEoq3}} | {{fcEoy3}} | {{fcConf3}} |

**Scenario Planning:**
- **Best case:** {{bestCase}} (probability: {{bestProb}})
- **Base case:** {{baseCase}} (probability: {{baseProb}})
- **Worst case:** {{worstCase}} (probability: {{worstProb}})

**Key Assumptions:**
- Pipeline conversion rate holds at {{convRate}}
- No major market disruptions in the forecast period
- Hiring plan delivers {{hireCount}} new hires by {{hireDate}} for {{company}}`,
    toolChips: ['Running Forecast Model', 'Loading Historical Baselines', 'Calculating Scenarios'],
    followUpSuggestions: [
      'Show the best case scenario in detail',
      'What does the worst case look like?',
      'Adjust the assumptions and re-forecast',
    ],
  },

  summary: {
    category: 'summary',
    content: `**Executive Summary for {{company}}**

Compiled from the latest data and activity across all departments:

| Department | Status | Key Metric | Trend |
|-----------|--------|-----------|-------|
| {{sumDept1}} | {{sumStatus1}} | {{sumMetric1}} | {{sumTrend1}} |
| {{sumDept2}} | {{sumStatus2}} | {{sumMetric2}} | {{sumTrend2}} |
| {{sumDept3}} | {{sumStatus3}} | {{sumMetric3}} | {{sumTrend3}} |

**Highlights:**
- Overall organization health: {{orgHealth}} ({{healthTrend}} vs last period)
- {{highlightCount}} notable achievements this period
- {{attentionCount}} items requiring executive attention

**Top-Level Numbers:**
- Revenue: {{summaryRevenue}} | Headcount: {{summaryHC}} | NPS: {{summaryNPS}}
- Active projects: {{activeProjects}} | On track: {{onTrackProjects}}

**Next Steps:**
- Review flagged items in the attention queue for {{company}}
- Prepare board update with latest financial projections`,
    toolChips: ['Compiling Cross-System Data', 'Loading Department Dashboards', 'Generating Summary'],
    followUpSuggestions: [
      'Expand on a specific department',
      'Export this summary as PDF',
      'Share with the leadership team',
    ],
  },

  search: {
    category: 'search',
    content: `**Search Results for {{company}}**

Here are the most relevant items matching your query across all connected systems:

| Source | Item | Relevance | Last Updated |
|--------|------|-----------|-------------|
| {{source1}} | {{item1}} | {{rel1}} | {{updated1}} |
| {{source2}} | {{item2}} | {{rel2}} | {{updated2}} |
| {{source3}} | {{item3}} | {{rel3}} | {{updated3}} |

**Search Coverage:**
- Searched across {{sourceCount}} connected data sources
- {{resultCount}} total results found, showing top {{shownCount}}
- Results include documents, messages, tasks, and meeting notes

**Related Searches:**
- Other users at {{company}} also searched for: {{relatedQueries}}
- You may also want to check: {{suggestedQueries}}`,
    toolChips: ['Searching Connected Systems', 'Indexing Documents', 'Ranking Results'],
    followUpSuggestions: [
      'Narrow the search with filters',
      'Sort results by date',
      'Show all results from a specific source',
    ],
  },

  create: {
    category: 'create',
    content: `**Content Draft for {{company}}**

I have created a draft based on available context, recent activity, and templates:

**Draft Preview:**
> {{draftPreview}}

**Sources Used:**
- Meeting notes from {{meetingSource}} ({{meetingDate}})
- Action items from {{actionSource}}
- Templates: {{templateName}}

**Draft Details:**
- Word count: {{wordCount}} | Tone: {{tone}} | Format: {{format}}
- Recipients: {{recipients}}
- Attachments suggested: {{attachments}}

**Review Checklist:**
- [ ] Verify key data points are accurate for {{company}}
- [ ] Confirm recipient list is complete
- [ ] Review tone and adjust if needed`,
    toolChips: ['Generating Draft', 'Loading Templates', 'Pulling Context Data'],
    followUpSuggestions: [
      'Edit the draft before sending',
      'Use a different template',
      'Preview the final version',
    ],
  },

  update: {
    category: 'update',
    content: `**Update Summary for {{company}}**

Here are the recent changes and their impact:

| Field | Previous | Updated | Changed By | When |
|-------|----------|---------|-----------|------|
| {{field1}} | {{prev1}} | {{new1}} | {{changer1}} | {{when1}} |
| {{field2}} | {{prev2}} | {{new2}} | {{changer2}} | {{when2}} |
| {{field3}} | {{prev3}} | {{new3}} | {{changer3}} | {{when3}} |

**Change Impact Assessment:**
- {{impactCount}} downstream items affected by these changes
- {{notifyCount}} stakeholders should be notified
- No breaking changes detected in current workflows

**Audit Trail:**
- Total changes this week: {{weeklyChanges}}
- Most active editor: {{topEditor}} with {{editCount}} modifications
- All changes are tracked and reversible for {{company}}`,
    toolChips: ['Tracking Changes', 'Checking Impact', 'Loading Audit Log'],
    followUpSuggestions: [
      'Apply the proposed changes',
      'Review the full change history',
      'Notify affected stakeholders',
    ],
  },

  report: {
    category: 'report',
    content: `**Report for {{company}}**

Generated with the latest data across all connected sources:

| Section | Key Finding | Data Source | Confidence |
|---------|-------------|-----------|------------|
| {{section1}} | {{finding1}} | {{dataSource1}} | {{conf1}} |
| {{section2}} | {{finding2}} | {{dataSource2}} | {{conf2}} |
| {{section3}} | {{finding3}} | {{dataSource3}} | {{conf3}} |

**Executive Insights:**
- {{insightCount}} actionable insights identified in this report
- Data freshness: {{dataAge}} (last sync: {{lastSync}})
- Report covers {{reportPeriod}} for {{company}}

**Visualizations Available:**
- Revenue trend chart | Pipeline funnel | Team utilization heatmap
- Department comparison bar chart | Risk severity distribution

**Distribution:**
- Suggested recipients: {{reportRecipients}}
- Scheduled reports: {{scheduleStatus}}`,
    toolChips: ['Generating Report', 'Pulling Data Sources', 'Building Visualizations'],
    followUpSuggestions: [
      'Show the visualizations',
      'Export the full report as PDF',
      'Schedule this report to run weekly',
    ],
  },

  notify: {
    category: 'notify',
    content: `**Notification Center for {{company}}**

Prepared notification with the following details:

| Recipient | Channel | Priority | Status |
|-----------|---------|----------|--------|
| {{recipient1}} | {{channel1}} | {{priority1}} | {{notifyStatus1}} |
| {{recipient2}} | {{channel2}} | {{priority2}} | {{notifyStatus2}} |
| {{recipient3}} | {{channel3}} | {{priority3}} | {{notifyStatus3}} |

**Message Preview:**
> {{messagePreview}}

**Notification Settings:**
- Delivery channels available: Email, Slack, Teams, In-app
- Total recipients: {{recipientCount}}
- Estimated delivery: immediate for high priority, batched for standard

**Recent Notification History:**
- {{recentNotifyCount}} notifications sent this week from {{company}}
- Open rate: {{openRate}} | Response rate: {{responseRate}}
- Most effective channel: {{bestChannel}}`,
    toolChips: ['Preparing Notification', 'Loading Recipient List', 'Checking Delivery Channels'],
    followUpSuggestions: [
      'Send the notification now',
      'Edit the message content',
      'Add more recipients to the list',
    ],
  },

  help: {
    category: 'help',
    content: `**Help & Guidance for {{company}}**

Here is an explanation of the topic you asked about:

**What You Need to Know:**
- This feature connects to your integrated data sources to provide real-time answers
- You can ask about finances, timelines, team status, risks, and more
- All responses are generated from live data across your connected systems

**Common Commands:**
| Command | What It Does | Example |
|---------|-------------|---------|
| "prep me for..." | Prepares meeting context | "Prep me for the board meeting" |
| "status of..." | Shows progress updates | "Status of Q2 results" |
| "compare..." | Side-by-side analysis | "Compare Engineering vs Sales" |

**Tips for Better Results:**
- Be specific: "Show Q2 revenue by department" works better than "show revenue"
- Use follow-up chips to drill deeper into any response
- Ask about cross-system connections unique to {{company}}

**Need More Help?**
- Type "help" anytime to see this guide
- Use the command bar for quick navigation`,
    toolChips: ['Loading Help Index', 'Checking Feature Guides', 'Scanning FAQ'],
    followUpSuggestions: [
      'Show me some examples',
      'Go deeper on a specific topic',
      'What related features are available?',
    ],
  },
};

/**
 * Get the response template for a given category ID.
 * Returns the response object or null if not found.
 */
export function getCategoryResponse(categoryId) {
  if (!categoryId || typeof categoryId !== 'string') {
    return null;
  }
  const response = CATEGORY_RESPONSES[categoryId];
  return response || null;
}

/**
 * Get an array of all category IDs.
 * Returns a new array each time.
 */
export function getCategoryIds() {
  return [...Object.keys(CATEGORY_RESPONSES)];
}
