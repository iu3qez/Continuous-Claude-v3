/**
 * Showcase Responses - Tier 1 demo-quality AI responses for Workbook.
 *
 * Each response is a carefully crafted, multi-paragraph answer that
 * demonstrates the depth of Workbook's intelligence. Placeholders use
 * {{key}} syntax for industry-adaptive personalization.
 */

export const SHOWCASE_RESPONSES = {
  'meeting-prep': {
    id: 'meeting-prep',
    trigger: 'prep me',
    toolChips: [
      'Querying CRM',
      'Checking Calendar',
      'Scanning Email',
      'Cross-referencing Actions',
    ],
    content: `Here's your briefing for the {{meetingTitle}} meeting with {{company}}:

**Key Context:**
- Last meeting with {{attendee}} was 2 weeks ago; they raised concerns about timeline slippage on the {{project}} deliverable
- {{company}} renewed their contract 4 months ago at \${{dealValue}}/yr -- up 18% from prior term
- Their NPS score dropped from 72 to 61 last quarter; CS flagged churn risk

**Open Items ({{actionCount}}):**
1. Proposal revision due by Friday -- legal review pending
2. Technical integration spec needs sign-off from their engineering lead
3. Pricing tier discussion deferred from last call

**Sentiment & Signals:**
- Email frequency from {{attendee}} is down 40% vs. 90-day average
- They viewed the case study you sent but did not forward it internally
- Competitor {{competitor}} was mentioned in their last vendor review

**Recommended Talking Points:**
- Lead with the integration progress to rebuild momentum
- Address the NPS drop proactively -- shows you are paying attention
- Propose a joint success review for next month to lock in engagement`,
    followUpSuggestions: [
      'What happened in our last meeting?',
      'Show me their account history',
      'Draft follow-up actions',
    ],
  },

  'q2-status': {
    id: 'q2-status',
    trigger: 'status of q2',
    toolChips: [
      'Pulling Revenue Data',
      'Analyzing Pipeline',
      'Comparing Targets',
      'Generating Trends',
    ],
    content: `**{{company}} Q2 Performance Dashboard**

**Revenue:** \${{revenue}} of \${{target}} target ({{metric}}% attainment)
- Recurring revenue up 14% QoQ, transactional down 6%
- Top contributor: Enterprise segment at $1.2M (+22% vs. Q1)
- Underperforming: Mid-market at $480K (-11% vs. plan)

**Pipeline Health:**
- 47 active opportunities worth $2.8M weighted
- Win rate trending at 31% (down from 36% in Q1)
- Average sales cycle lengthened to 52 days from 44

**Key Risks:**
- Two enterprise deals worth $340K combined slipped from June into July
- {{department}} spending is 7% over budget due to unplanned contractor costs
- Hiring is 2 heads behind plan, impacting capacity

**Bright Spots:**
- Customer expansion revenue exceeded plan by 19%
- New logo acquisition is at 108% of target
- Product-led growth channel delivering 3x pipeline vs. last quarter

**Forecast:** If current trends hold, Q2 will close between 91-96% of target. Recovering the two slipped deals would push attainment above 100%.`,
    followUpSuggestions: [
      'Which deals slipped?',
      'Show department breakdown',
      'Compare to Q1',
    ],
  },

  blockers: {
    id: 'blockers',
    trigger: 'cross-department blockers',
    toolChips: [
      'Scanning Project Boards',
      'Checking Dependencies',
      'Mapping Ownership',
      'Calculating Impact',
    ],
    content: `**Cross-Department Blocker Report for {{company}}**

**Critical (3 blockers impacting revenue):**

1. **Engineering <> Design** -- Feature spec for {{project}} v2.1 is 9 days overdue
   - Owner: {{attendee}} (Design)
   - Impact: Delays sprint planning for 2 engineering squads (14 people idle)
   - Root cause: Design waiting on updated brand guidelines from Marketing
   - Resolution ETA: 3 business days if brand assets are delivered today

2. **Sales <> Finance** -- Updated pricing model not yet approved
   - Owner: VP Finance
   - Impact: \${{dealValue}} in pipeline cannot advance past proposal stage
   - Root cause: Margin analysis requires data from new cost allocation model
   - Resolution ETA: 5 business days

3. **Marketing <> Legal** -- Campaign launch blocked on compliance review
   - Owner: Legal counsel
   - Impact: Q2 lead gen target at risk; 2-week delay reduces leads by ~{{metric}}%
   - Root cause: New privacy regulation requires updated consent flows

**Warning (2 blockers, lower urgency):**
4. CS team waiting on product release notes for customer communications
5. HR onboarding delayed for 3 new hires pending background check vendor switch

**Trend:** Blocker count is up from 2 last month to 5 this month. Cross-functional handoffs are the common thread.`,
    followUpSuggestions: [
      'Escalate the top blocker',
      'Who owns each blocker?',
      'Timeline for resolution?',
    ],
  },

  'today-focus': {
    id: 'today-focus',
    trigger: 'focus on today',
    toolChips: [
      'Reading Calendar',
      'Prioritizing Tasks',
      'Checking Deadlines',
      'Scanning Notifications',
    ],
    content: `**Your Focus Plan for Today at {{company}}**

**High Priority (must complete):**
1. **Finalize Q2 board deck** -- Due at 5 PM; slides 8-12 need revenue commentary
   - The CFO flagged 3 data points that need updating from last night's close
   - Estimated effort: 45 minutes
2. **Pipeline review with {{attendee}}** -- 2:00 PM, 45 min
   - 6 deals to discuss; 2 need go/no-go decisions today
   - Prep note: {{attendee}} will ask about the {{project}} discount approval
3. **Sign off on offer letter** -- Engineering hire, senior level
   - Comp band approved; just needs your signature in DocuSign
   - Estimated effort: 5 minutes

**Medium Priority (complete if possible):**
4. Respond to {{competitor}} competitive intel from Sales (3 emails waiting)
5. Review the draft press release Marketing sent yesterday

**Low Priority (defer if needed):**
6. Update OKR tracker for your team
7. Clean up action items from Monday's all-hands

**Calendar Gaps:** You have 90 minutes free between 10:30 AM and noon -- best window for the board deck work. Your afternoon is back-to-back from 1 PM to 4 PM.

**Overdue Items:** 2 tasks from last week still open (both medium priority, both delegatable).`,
    followUpSuggestions: [
      'Reschedule something',
      'Delegate a task',
      'What is overdue?',
    ],
  },

  pipeline: {
    id: 'pipeline',
    trigger: 'analyze this pipeline',
    toolChips: [
      'Loading CRM Data',
      'Running Win/Loss Model',
      'Segmenting Deals',
      'Benchmarking Velocity',
    ],
    content: `**Pipeline Analysis for {{company}}**

**Overview:**
- 42 active opportunities | Total value: \${{dealValue}}M weighted
- Stage distribution: Discovery (12), Proposal (15), Negotiation (9), Closing (6)
- Win rate: 34% trailing 90-day (benchmark: 28% for {{industry}})

**Velocity Metrics:**
- Average deal cycle: 47 days (up from 39 last quarter)
- Time in proposal stage: 14 days avg (was 9 -- bottleneck detected)
- Conversion rate proposal-to-close: 41%

**Risk Deals (4):**
| Deal | Value | Days Stalled | Risk Signal |
|------|-------|-------------|-------------|
| {{company}}-Enterprise | $180K | 18 days | Champion went silent |
| Meridian Group | $95K | 12 days | Budget freeze reported |
| Apex Solutions | $72K | 21 days | Competitor POC underway |
| DataFlow Inc | $54K | 8 days | Decision maker changed |

**Top Deals by Expected Value:**
1. NovaTech Corp -- $220K (68% probability, closing this month)
2. {{company}}-Enterprise -- $180K (35% probability, at risk)
3. Summit Partners -- $145K (55% probability, on track)

**Recommendation:** Focus rep attention on the 9 deals in negotiation stage. A 5% improvement in proposal-to-close conversion adds ~\${{metric}}K to quarterly revenue.`,
    followUpSuggestions: [
      'Which deals are at risk?',
      'Top 5 by value',
      'Compare to last quarter',
    ],
  },

  'deal-stalled': {
    id: 'deal-stalled',
    trigger: 'why is this deal stalled',
    toolChips: [
      'Analyzing Deal History',
      'Checking Contact Activity',
      'Reviewing Competitors',
      'Scoring Engagement',
    ],
    content: `**Stalled Deal Analysis: {{company}} Enterprise Account**

**Current State:**
- Stage: Negotiation (day 23 of avg 14-day stage)
- Last activity: Email from {{attendee}} on Feb 3 (11 days ago)
- Deal value: \${{dealValue}}K | Expected close: was Feb 28, now at risk

**Engagement Timeline:**
- Jan 8: Discovery call -- strong interest, {{attendee}} identified as champion
- Jan 15: Demo delivered -- "best demo we have seen" per attendee feedback
- Jan 22: Proposal sent (\${{dealValue}}K, 2-year term)
- Jan 29: {{attendee}} requested minor pricing adjustment
- Feb 3: Your team sent revised proposal -- no response since

**What Changed:**
- {{attendee}}'s LinkedIn shows a title change (promoted to VP) on Feb 5
- {{competitor}} posted a case study with a company in the same {{industry}} vertical
- {{company}}'s quarterly earnings call mentioned "cost optimization initiatives"
- Email open rate: {{attendee}} opened your last 2 emails but did not reply

**Diagnosis:** Likely a combination of champion role change (new priorities) and budget scrutiny. The deal is not dead but needs re-engagement at a higher level.

**Recommended Actions:**
1. Congratulate {{attendee}} on the promotion -- rebuild rapport
2. Request an intro to their successor or a peer stakeholder
3. Reframe the proposal around cost savings to align with their earnings call messaging
4. Offer a 30-day pilot to reduce perceived risk and restart momentum`,
    followUpSuggestions: [
      'Draft a check-in email',
      'Find another contact',
      'Should we discount?',
    ],
  },

  'board-summary': {
    id: 'board-summary',
    trigger: 'summary for the board',
    toolChips: [
      'Compiling Financials',
      'Aggregating KPIs',
      'Formatting Deck Data',
      'Pulling Benchmarks',
    ],
    content: `**Board Summary: {{company}} -- {{quarter}} {{year}}**

**Financial Highlights:**
- Revenue: \${{revenue}}M (+12% YoY, +3% vs. plan)
- Gross margin: 71.4% (up from 68.9% prior year)
- Operating expenses: \${{metric}}M (4% under budget)
- Cash position: $8.2M with 14 months runway at current burn

**Growth Metrics:**
- ARR: \${{dealValue}}M (+26% YoY)
- Net revenue retention: 118%
- New logos: 34 (108% of target)
- Logo churn: 2.1% (improved from 3.4% prior year)

**Strategic Initiatives:**
| Initiative | Status | Notes |
|-----------|--------|-------|
| {{project}} Platform Launch | On Track | Beta with 12 customers, GA target: next quarter |
| International Expansion | On Track | UK entity established, first hire made |
| Enterprise Upmarket Move | Amber | Pipeline building slower than planned; revised strategy in flight |

**Headcount:**
- Current: 94 of 100 planned (6 open roles)
- Key hires: VP Engineering (filled), Sr. Data Scientist (in final round)
- Attrition: 8.2% annualized ({{industry}} benchmark: 12%)

**Board Attention Items:**
1. Enterprise pipeline velocity needs acceleration -- requesting additional SDR budget
2. Competitor {{competitor}} raised Series C; expect increased market pressure
3. Recommending investment in AI capabilities for product differentiation`,
    followUpSuggestions: [
      'Expand on the amber initiative',
      'Add competitive landscape',
      'Include hiring plan',
    ],
  },

  yesterday: {
    id: 'yesterday',
    trigger: 'yesterday meetings',
    toolChips: [
      'Parsing Calendar',
      'Extracting Notes',
      'Linking Action Items',
      'Analyzing Outcomes',
    ],
    content: `**Yesterday's Meeting Recap for {{company}}**

**4 meetings | 2h 45m total | 7 action items generated**

**1. Product Sync (9:30 AM, 30 min)**
- Attendees: {{attendee}}, Product Lead, 2 engineers
- Key discussion: {{project}} feature prioritization for next sprint
- Decision: Deferred the dashboard redesign to focus on API reliability
- Action: Engineering to share revised sprint plan by Thursday

**2. Sales Pipeline Review (11:00 AM, 45 min)**
- Attendees: Sales Lead, 3 AEs, RevOps
- Key discussion: Q2 pipeline coverage is at 2.8x (target: 3.0x)
- Flagged: 2 deals at risk of slipping (combined value \${{dealValue}}K)
- Action: AE to send re-engagement emails by EOD; RevOps to update forecast model

**3. 1:1 with CTO (2:00 PM, 30 min)**
- Key discussion: Technical debt allocation and hiring priorities
- Decision: Approved 20% time allocation for tech debt in Q3 sprints
- Action: CTO to draft tech debt backlog prioritization framework
- Note: CTO mentioned exploring partnership with {{competitor}} for data integration

**4. Client Call -- {{company}} Enterprise (3:30 PM, 60 min)**
- Attendees: Account team + client stakeholders
- Key discussion: Implementation timeline and success criteria
- Client sentiment: Positive but concerned about onboarding speed
- Action: CS to create accelerated onboarding plan; share within 48 hours
- Action: Schedule follow-up demo of advanced features for next Tuesday

**Unresolved from yesterday:** The pricing discussion from the Sales review still needs Finance input before the deals can advance.`,
    followUpSuggestions: [
      'Summarize the client call',
      'What action items came out?',
      'Any follow-ups needed?',
    ],
  },

  'dept-compare': {
    id: 'dept-compare',
    trigger: 'compare department',
    toolChips: [
      'Loading Department Data',
      'Normalizing Metrics',
      'Running Comparisons',
      'Building Rankings',
    ],
    content: `**Department Performance Comparison: {{company}} -- {{quarter}}**

| Metric | Engineering | Sales | Marketing | Operations | CS |
|--------|------------|-------|-----------|------------|-----|
| Target Attainment | 92% | 87% | 105% | 96% | 91% |
| Headcount vs Plan | 95% | 100% | 88% | 92% | 100% |
| Budget Utilization | 89% | 102% | 94% | 98% | 87% |
| Satisfaction Score | 4.2/5 | 3.8/5 | 4.1/5 | 4.0/5 | 4.3/5 |

**Top Performer: Marketing**
- Lead gen at 105% of target driven by the {{project}} campaign
- Cost per lead down 22% through improved channel mix
- Content engagement up 34% YoY

**Needs Attention: Sales**
- Quota attainment at 87% -- below the 90% threshold
- Root causes: longer deal cycles (+8 days avg) and 2 rep vacancies
- Ramp time for new hires is 4.5 months ({{industry}} avg: 3.8 months)
- Action plan: Sales enablement program launching next week

**Cross-Department Insights:**
- Engineering velocity correlates strongly with Product's spec delivery timing
- Marketing-to-Sales handoff conversion improved 15% after implementing lead scoring
- Operations SLA compliance of 96% is top quartile for {{industry}}
- CS satisfaction (4.3) is the highest across all departments

**Budget Alert:** Sales is 2% over budget due to event sponsorships. Marketing is 6% under budget with opportunity to reallocate to demand gen.

**Trend (6-month):** Overall company performance index improved from {{metric}} to 91.2, driven primarily by Engineering and Marketing improvements.`,
    followUpSuggestions: [
      'Why is Sales below target?',
      'Show trend over 6 months',
      'Who are top performers?',
    ],
  },

  'follow-up-email': {
    id: 'follow-up-email',
    trigger: 'draft a follow-up',
    toolChips: [
      'Reviewing Meeting Notes',
      'Extracting Action Items',
      'Drafting Email',
      'Checking Tone',
    ],
    content: `**Draft Follow-Up Email**

**To:** {{attendee}} <{{attendee}}@{{company}}.com>
**Subject:** Next steps from our conversation + {{project}} timeline

Hi {{attendee}},

Thank you for taking the time to meet yesterday. I wanted to recap the key points and next steps so we stay aligned.

**What we discussed:**
- The {{project}} implementation is on track for Phase 1 delivery by end of month
- Your team's feedback on the pilot has been incorporated into the updated spec
- Budget approval for Phase 2 is pending review from your finance team

**Action items:**
1. **Our team:** Share the revised technical architecture document by Friday
2. **Our team:** Schedule the advanced features demo for your engineering leads (proposing next Tuesday at 2 PM)
3. **Your team:** Confirm the Phase 2 budget allocation timeline
4. **Your team:** Provide access credentials for the staging environment

**Timeline check:**
- Phase 1 go-live: {{metric}} business days remaining
- Phase 2 proposal due: End of next week
- Quarterly business review: Scheduled for March 15

I have also attached the case study from a similar {{industry}} deployment we completed last quarter -- thought it might be useful context as you present to your leadership team.

Please let me know if I have missed anything or if any of the above needs adjusting. Looking forward to keeping the momentum going.

Best regards`,
    followUpSuggestions: [
      'Make it more formal',
      'Add the action items',
      'Send it now',
    ],
  },
};

/**
 * Retrieve a showcase response by its ID.
 * Returns the response object or null if not found.
 */
export function getShowcaseResponse(id) {
  const response = SHOWCASE_RESPONSES[id];
  return response || null;
}

/**
 * Adapt a showcase response by replacing {{placeholder}} tokens
 * with values from the provided context object.
 * Returns a new response object -- does not mutate the original.
 */
export function adaptShowcaseResponse(response, context) {
  let content = response.content;

  for (const [key, value] of Object.entries(context)) {
    const placeholder = `{{${key}}}`;
    content = content.split(placeholder).join(value);
  }

  return { ...response, content };
}

/**
 * Return an array of all showcase response IDs.
 */
export function getShowcaseIds() {
  return Object.keys(SHOWCASE_RESPONSES);
}
