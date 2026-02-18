import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Onboarding Flow Tests
 *
 * Tests the 6-step onboarding wizard:
 *   Step 1: Company info (name, industry, size)
 *   Step 2: Department selection (toggle switches)
 *   Step 3: Tool discovery (dropdown selects)
 *   Step 4: OAuth connect (connect buttons per tool)
 *   Step 5: Scanning animation (progress + data counts)
 *   Step 6: Insight reveal (AI insights + dashboard + CTA)
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Load an onboarding step HTML file into document.body and execute inline scripts. */
function loadStep(stepNumber) {
  // Each step file is a standalone HTML page. We extract the <body> content
  // and inline <script> blocks to simulate the page in jsdom.
  const fs = require('fs');
  const path = require('path');
  const filePath = path.resolve(
    __dirname,
    '..',
    'onboarding',
    `step-${stepNumber}-${stepNames[stepNumber]}.html`
  );
  const html = fs.readFileSync(filePath, 'utf-8');

  // Extract body content (everything between <body...> and </body>)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) throw new Error(`Could not parse body from step-${stepNumber}`);

  let bodyContent = bodyMatch[1];

  // Remove the demo/init.js module script (not relevant to unit tests)
  bodyContent = bodyContent.replace(
    /<script\s+type="module"\s+src="[^"]*demo\/init\.js"[^>]*><\/script>/gi,
    ''
  );

  // Separate inline scripts from HTML content
  const scripts = [];
  const htmlWithoutScripts = bodyContent.replace(
    /<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi,
    (match) => {
      // Only keep inline scripts (not external src scripts)
      if (!match.includes(' src=')) {
        const scriptContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        scripts.push(scriptContent);
      }
      return '';
    }
  );

  document.body.innerHTML = htmlWithoutScripts;

  // Execute inline scripts in order
  scripts.forEach((scriptContent) => {
    const fn = new Function(scriptContent);
    fn();
  });
}

const stepNames = {
  1: 'company',
  2: 'departments',
  3: 'tools',
  4: 'connect',
  5: 'scanning',
  6: 'insight',
};

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('Onboarding Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    document.body.innerHTML = '';
    // Use fake timers globally so inline scripts from loadStep()
    // never schedule real timers that leak after test cleanup.
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Clear all pending fake timers, then restore real timers.
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  // =========================================================================
  // 1. Progress Indicator
  // =========================================================================
  describe('Progress Indicator', () => {
    it('step 1 renders 6 progress dots', () => {
      loadStep(1);
      const dots = document.querySelectorAll('.progress-dot');
      expect(dots.length).toBe(6);
    });

    it('step 1 has exactly 1 active dot (the first)', () => {
      loadStep(1);
      const activeDots = document.querySelectorAll('.progress-dot.active');
      expect(activeDots.length).toBe(1);
    });

    it('step 2 has 2 active dots', () => {
      loadStep(2);
      const activeDots = document.querySelectorAll('.progress-dot.active');
      expect(activeDots.length).toBe(2);
    });

    it('step 1 shows "Step 1 of 6" label', () => {
      loadStep(1);
      const label = document.querySelector('.progress-label');
      expect(label).not.toBeNull();
      expect(label.textContent).toContain('1 of 6');
    });

    it('step 3 has 3 active dots', () => {
      loadStep(3);
      // Step 3 uses .dot.active instead of .progress-dot.active
      const activeDots = document.querySelectorAll('.dot.active');
      expect(activeDots.length).toBe(3);
    });
  });

  // =========================================================================
  // 2. Step 1 - Company Form
  // =========================================================================
  describe('Step 1 - Company Form', () => {
    beforeEach(() => {
      loadStep(1);
    });

    it('renders company name text input', () => {
      const input = document.getElementById('company-name');
      expect(input).not.toBeNull();
      expect(input.type).toBe('text');
    });

    it('renders industry select dropdown with options', () => {
      const select = document.getElementById('industry');
      expect(select).not.toBeNull();
      expect(select.tagName).toBe('SELECT');
      const options = select.querySelectorAll('option');
      // placeholder + 6 industry options
      expect(options.length).toBeGreaterThanOrEqual(6);
    });

    it('renders company size radio buttons', () => {
      const radios = document.querySelectorAll('input[name="company-size"]');
      expect(radios.length).toBe(4);
    });

    it('renders a Next button', () => {
      const btn = document.getElementById('next-button');
      expect(btn).not.toBeNull();
      expect(btn.textContent.toLowerCase()).toContain('next');
    });

    it('alerts when Next is clicked with empty fields', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const btn = document.getElementById('next-button');
      btn.click();
      expect(alertSpy).toHaveBeenCalledWith(
        'Please complete all fields before continuing.'
      );
      alertSpy.mockRestore();
    });

    it('stores company data in sessionStorage when form is valid', () => {
      // Fill all fields
      document.getElementById('company-name').value = 'Acme Corp';
      document.getElementById('industry').value = 'technology-saas';
      document.querySelector('input[name="company-size"][value="11-50"]').checked = true;

      // Mock navigation
      const originalHref = window.location.href;
      const btn = document.getElementById('next-button');
      btn.click();

      expect(sessionStorage.getItem('onboarding-company-name')).toBe('Acme Corp');
      expect(sessionStorage.getItem('onboarding-industry')).toBe('technology-saas');
      expect(sessionStorage.getItem('onboarding-company-size')).toBe('11-50');
    });
  });

  // =========================================================================
  // 3. Step 2 - Departments
  // =========================================================================
  describe('Step 2 - Departments', () => {
    beforeEach(() => {
      loadStep(2);
    });

    it('renders 6 department cards', () => {
      const cards = document.querySelectorAll('.department-card');
      expect(cards.length).toBe(6);
    });

    it('each card has a toggle switch checkbox', () => {
      const toggles = document.querySelectorAll('.toggle-switch input[type="checkbox"]');
      expect(toggles.length).toBe(6);
    });

    it('4 departments are pre-checked (operations, engineering, sales, marketing)', () => {
      const checked = document.querySelectorAll('.toggle-switch input:checked');
      expect(checked.length).toBe(4);

      const checkedDepts = Array.from(checked).map((el) => el.dataset.dept);
      expect(checkedDepts).toContain('operations');
      expect(checkedDepts).toContain('engineering');
      expect(checkedDepts).toContain('sales');
      expect(checkedDepts).toContain('marketing');
    });

    it('unchecking a toggle removes active class from card', () => {
      const opsToggle = document.querySelector('input[data-dept="operations"]');
      const opsCard = document.querySelector('[data-department="operations"]');
      expect(opsCard.classList.contains('active')).toBe(true);

      opsToggle.checked = false;
      opsToggle.dispatchEvent(new Event('change'));

      expect(opsCard.classList.contains('active')).toBe(false);
    });

    it('checking a toggle adds active class to card', () => {
      const financeToggle = document.querySelector('input[data-dept="finance"]');
      const financeCard = document.querySelector('[data-department="finance"]');
      expect(financeCard.classList.contains('active')).toBe(false);

      financeToggle.checked = true;
      financeToggle.dispatchEvent(new Event('change'));

      expect(financeCard.classList.contains('active')).toBe(true);
    });
  });

  // =========================================================================
  // 4. Step 3 - Tool Discovery
  // =========================================================================
  describe('Step 3 - Tool Discovery', () => {
    beforeEach(() => {
      loadStep(3);
    });

    it('renders 6 tool category selects', () => {
      const selects = document.querySelectorAll('.tool-select');
      expect(selects.length).toBe(6);
    });

    it('CRM select defaults to salesforce', () => {
      const crm = document.getElementById('crm');
      expect(crm.value).toBe('salesforce');
    });

    it('communication select defaults to slack', () => {
      const comm = document.getElementById('communication');
      expect(comm.value).toBe('slack');
    });

    it('project select defaults to jira', () => {
      const proj = document.getElementById('project');
      expect(proj.value).toBe('jira');
    });

    it('each select has a "None" option', () => {
      const selects = document.querySelectorAll('.tool-select');
      selects.forEach((select) => {
        const noneOption = select.querySelector('option[value="none"]');
        expect(noneOption).not.toBeNull();
      });
    });
  });

  // =========================================================================
  // 5. Step 4 - OAuth Connect
  // =========================================================================
  describe('Step 4 - OAuth Connect', () => {
    beforeEach(() => {
      loadStep(4);
    });

    it('renders 6 tool cards', () => {
      const cards = document.querySelectorAll('.tool-card');
      expect(cards.length).toBe(6);
    });

    it('each tool card has a connect button', () => {
      const connectBtns = document.querySelectorAll('.connect-btn');
      expect(connectBtns.length).toBe(6);
    });

    it('all tools start as "Not Connected"', () => {
      const statuses = document.querySelectorAll('.status-indicator span');
      statuses.forEach((span) => {
        expect(span.textContent.trim()).toBe('Not Connected');
      });
    });

    it('next button starts disabled', () => {
      const nextBtn = document.getElementById('nextBtn');
      expect(nextBtn.disabled).toBe(true);
    });

    it('has a "Skip all - use sample data" button', () => {
      const skipBtn = document.getElementById('skipAllBtn');
      expect(skipBtn).not.toBeNull();
      expect(skipBtn.textContent).toContain('Skip all');
    });

    it('clicking skip-all enables the next button', () => {
      const skipBtn = document.getElementById('skipAllBtn');
      const nextBtn = document.getElementById('nextBtn');

      skipBtn.click();

      expect(nextBtn.disabled).toBe(false);
    });
  });

  // =========================================================================
  // 6. Step 4 - OAuth Connect (async flow)
  // =========================================================================
  describe('Step 4 - OAuth Connect Async Flow', () => {
    beforeEach(() => {
      loadStep(4);
    });

    it('clicking connect shows "Connecting..." text', () => {
      const connectBtn = document.querySelector('.tool-card[data-tool="salesforce"] .connect-btn');
      connectBtn.click();

      expect(connectBtn.textContent).toBe('Connecting...');
      expect(connectBtn.disabled).toBe(true);
    });

    it('status shows "Authorizing..." while connecting', () => {
      const card = document.querySelector('.tool-card[data-tool="salesforce"]');
      card.querySelector('.connect-btn').click();

      const status = card.querySelector('.status-indicator span');
      expect(status.textContent).toBe('Authorizing...');
    });

    it('after 2500ms, tool shows "Connected" state', async () => {
      const card = document.querySelector('.tool-card[data-tool="salesforce"]');
      card.querySelector('.connect-btn').click();

      await vi.advanceTimersByTimeAsync(2500);

      const connectBtn = card.querySelector('.connect-btn');
      expect(connectBtn.textContent).toBe('Connected');
    });

    it('after connecting a tool, next button becomes enabled', async () => {
      const card = document.querySelector('.tool-card[data-tool="slack"]');
      card.querySelector('.connect-btn').click();

      await vi.advanceTimersByTimeAsync(2500);

      const nextBtn = document.getElementById('nextBtn');
      expect(nextBtn.disabled).toBe(false);
    });

    it('AI narration updates with tool-specific message after connect', async () => {
      const card = document.querySelector('.tool-card[data-tool="salesforce"]');
      card.querySelector('.connect-btn').click();

      await vi.advanceTimersByTimeAsync(2500);

      const narration = document.getElementById('aiNarration');
      expect(narration.textContent).toContain('Salesforce connected');
    });

    it('connecting multiple tools increments the connected count', async () => {
      // Connect salesforce
      document.querySelector('.tool-card[data-tool="salesforce"] .connect-btn').click();
      await vi.advanceTimersByTimeAsync(2500);

      // Connect slack
      document.querySelector('.tool-card[data-tool="slack"] .connect-btn').click();
      await vi.advanceTimersByTimeAsync(2500);

      // Both should show Connected
      const salesforceBtn = document.querySelector('.tool-card[data-tool="salesforce"] .connect-btn');
      const slackBtn = document.querySelector('.tool-card[data-tool="slack"] .connect-btn');
      expect(salesforceBtn.textContent).toBe('Connected');
      expect(slackBtn.textContent).toBe('Connected');
    });
  });

  // =========================================================================
  // 7. Step 5 - Scanning Animation
  // =========================================================================
  describe('Step 5 - Scanning Animation', () => {
    beforeEach(() => {
      loadStep(5);
    });

    it('renders scan header element', () => {
      const header = document.getElementById('scan-header');
      expect(header).not.toBeNull();
      expect(header.textContent).toContain('Scanning connected tools');
    });

    it('renders 6 data discovery items (contacts, deals, tasks, events, emails, documents)', () => {
      const items = ['contacts', 'deals', 'tasks', 'events', 'emails', 'documents'];
      items.forEach((id) => {
        const el = document.getElementById(id);
        expect(el).not.toBeNull();
      });
    });

    it('renders a progress bar with 0% initially', () => {
      const progressPercent = document.getElementById('progress-percent');
      expect(progressPercent).not.toBeNull();
      expect(progressPercent.textContent).toBe('0%');
    });

    it('renders workspace cards for 5 departments', () => {
      const workspaces = [
        'workspace-operations',
        'workspace-engineering',
        'workspace-sales',
        'workspace-marketing',
        'workspace-finance',
      ];
      workspaces.forEach((id) => {
        expect(document.getElementById(id)).not.toBeNull();
      });
    });

    it('progress bar advances over time', async () => {
      // Advance past some progress updates
      await vi.advanceTimersByTimeAsync(4000);

      const progressPercent = document.getElementById('progress-percent');
      const pctValue = parseInt(progressPercent.textContent, 10);
      expect(pctValue).toBeGreaterThan(0);
      expect(pctValue).toBeLessThanOrEqual(100);
    });
  });

  // =========================================================================
  // 8. Step 6 - Insight Reveal
  // =========================================================================
  describe('Step 6 - Insight Reveal', () => {
    beforeEach(() => {
      loadStep(6);
    });

    it('renders AI header with "Workbook AI" label', () => {
      const header = document.getElementById('ai-header');
      expect(header).not.toBeNull();
      expect(header.textContent).toContain('Workbook AI');
    });

    it('renders 3 insight cards', () => {
      const insights = [
        document.getElementById('insight-1'),
        document.getElementById('insight-2'),
        document.getElementById('insight-3'),
      ];
      insights.forEach((el) => {
        expect(el).not.toBeNull();
      });
    });

    it('insight 1 is labeled "Operational"', () => {
      const badge = document.querySelector('#insight-1 .text-amber-400');
      expect(badge).not.toBeNull();
      expect(badge.textContent).toContain('Operational');
    });

    it('insight 2 is labeled "Financial Risk"', () => {
      const badge = document.querySelector('#insight-2 .text-red-400');
      expect(badge).not.toBeNull();
      expect(badge.textContent).toContain('Financial Risk');
    });

    it('renders the "Your workspace is ready" CTA', () => {
      const cta = document.getElementById('ready-cta');
      expect(cta).not.toBeNull();
      expect(cta.textContent).toContain('Your workspace is ready');
    });
  });

  // =========================================================================
  // 9. Step 6 - Dashboard Assembly
  // =========================================================================
  describe('Step 6 - Dashboard Assembly', () => {
    beforeEach(() => {
      loadStep(6);
    });

    it('renders dashboard shell', () => {
      const shell = document.getElementById('dash-shell');
      expect(shell).not.toBeNull();
    });

    it('renders dashboard sidebar with nav items', () => {
      const sidebar = document.getElementById('dash-sidebar');
      expect(sidebar).not.toBeNull();

      const navItems = ['nav-1', 'nav-2', 'nav-3', 'nav-4', 'nav-5'];
      navItems.forEach((id) => {
        expect(document.getElementById(id)).not.toBeNull();
      });
    });

    it('renders 3 metric cards (Actions, Meetings, Decisions)', () => {
      const metricsContainer = document.getElementById('dash-metrics');
      expect(metricsContainer).not.toBeNull();
      const metricNumbers = metricsContainer.querySelectorAll('.metric-number');
      expect(metricNumbers.length).toBe(3);
    });

    it('renders AI briefing section', () => {
      const briefing = document.getElementById('dash-briefing');
      expect(briefing).not.toBeNull();
    });

    it('renders follow-up input field', () => {
      const followUp = document.getElementById('follow-up');
      expect(followUp).not.toBeNull();
      const input = followUp.querySelector('input[type="text"]');
      expect(input).not.toBeNull();
      expect(input.placeholder).toContain('Ask me anything');
    });
  });

  // =========================================================================
  // 10. Navigation
  // =========================================================================
  describe('Navigation', () => {
    it('step 1 has a Next button', () => {
      loadStep(1);
      const btn = document.getElementById('next-button');
      expect(btn).not.toBeNull();
    });

    it('step 2 has Back and Next links', () => {
      loadStep(2);
      const backLink = document.querySelector('.btn-back');
      expect(backLink).not.toBeNull();
      expect(backLink.getAttribute('href')).toContain('step-1');

      const nextLink = document.getElementById('nextBtn');
      expect(nextLink).not.toBeNull();
      expect(nextLink.getAttribute('href')).toContain('step-3');
    });

    it('step 3 has Back and Next links', () => {
      loadStep(3);
      const backLink = document.querySelector('.btn-back');
      expect(backLink).not.toBeNull();
      expect(backLink.getAttribute('href')).toContain('step-2');

      const nextLink = document.querySelector('.btn-next');
      expect(nextLink).not.toBeNull();
      expect(nextLink.getAttribute('href')).toContain('step-4');
    });

    it('step 4 has Back link to step 3', () => {
      loadStep(4);
      const backLink = document.querySelector('a[href*="step-3"]');
      expect(backLink).not.toBeNull();
    });

    it('step 5 has a Skip link to step 6', () => {
      loadStep(5);
      const skipLink = document.querySelector('a[href*="step-6"]');
      expect(skipLink).not.toBeNull();
    });
  });

  // =========================================================================
  // 11. Data Persistence
  // =========================================================================
  describe('Data Persistence', () => {
    it('step 2 stores selected departments in localStorage', () => {
      loadStep(2);
      // Initial state: 4 departments are checked and updateAINarration runs on init
      const stored = localStorage.getItem('nexus_departments');
      expect(stored).not.toBeNull();

      const depts = JSON.parse(stored);
      expect(depts).toContain('operations');
      expect(depts).toContain('engineering');
    });

    it('step 3 saves tool selections to localStorage on next click', () => {
      loadStep(3);
      const nextBtn = document.querySelector('.btn-next');

      // Trigger the click handler (it saves to localStorage)
      nextBtn.click();

      const saved = localStorage.getItem('nexus-tools');
      expect(saved).not.toBeNull();

      const tools = JSON.parse(saved);
      expect(tools.crm).toBe('salesforce');
      expect(tools.communication).toBe('slack');
    });

    it('step 3 restores saved tool selections from localStorage', () => {
      // Pre-set localStorage before loading the step
      localStorage.setItem(
        'nexus-tools',
        JSON.stringify({
          crm: 'hubspot',
          communication: 'teams',
          documents: 'notion',
          project: 'linear',
          accounting: 'xero',
          calendar: 'outlook',
        })
      );

      loadStep(3);

      // The load event handler restores values -- simulate it
      window.dispatchEvent(new Event('load'));

      expect(document.getElementById('crm').value).toBe('hubspot');
      expect(document.getElementById('communication').value).toBe('teams');
      expect(document.getElementById('documents').value).toBe('notion');
    });
  });

  // =========================================================================
  // 12. AI Narration
  // =========================================================================
  describe('AI Narration', () => {
    it('step 1 shows welcome AI text', () => {
      loadStep(1);
      const aiText = document.getElementById('ai-text');
      expect(aiText).not.toBeNull();
      expect(aiText.textContent).toContain('Welcome');
    });

    it('step 1 AI text updates when industry is selected', () => {
      loadStep(1);

      const select = document.getElementById('industry');
      select.value = 'technology-saas';
      select.dispatchEvent(new Event('change'));

      // The typeText function uses setInterval at 30ms per character
      // Advance enough for some text to appear
      vi.advanceTimersByTime(3000);

      const aiText = document.getElementById('ai-text');
      // The text should now contain tech-related narration
      expect(aiText.textContent).toContain('tech');
    });

    it('step 2 AI narration updates when departments are toggled off', () => {
      loadStep(2);
      const narration = document.getElementById('aiNarration');

      // Uncheck all departments
      document.querySelectorAll('.toggle-switch input').forEach((toggle) => {
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change'));
      });

      expect(narration.textContent).toContain("haven't selected any departments");
    });

    it('step 4 initial AI narration mentions encryption and security', () => {
      loadStep(4);
      const narration = document.getElementById('aiNarration');
      expect(narration.textContent).toContain('encrypted');
    });
  });

  // =========================================================================
  // 13. Step 2 - Department Validation
  // =========================================================================
  describe('Step 2 - Department Validation', () => {
    beforeEach(() => {
      loadStep(2);
    });

    it('next button is visually disabled when no departments selected', () => {
      // Uncheck all
      document.querySelectorAll('.toggle-switch input').forEach((toggle) => {
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change'));
      });

      const nextBtn = document.getElementById('nextBtn');
      expect(nextBtn.style.opacity).toBe('0.5');
      expect(nextBtn.style.pointerEvents).toBe('none');
    });

    it('next button is enabled when at least one department selected', () => {
      // Start with all unchecked
      document.querySelectorAll('.toggle-switch input').forEach((toggle) => {
        toggle.checked = false;
        toggle.dispatchEvent(new Event('change'));
      });

      // Check one back
      const opsToggle = document.querySelector('input[data-dept="operations"]');
      opsToggle.checked = true;
      opsToggle.dispatchEvent(new Event('change'));

      const nextBtn = document.getElementById('nextBtn');
      expect(nextBtn.style.opacity).toBe('1');
      expect(nextBtn.style.pointerEvents).toBe('auto');
    });

    it('has an "Add Custom Department" button', () => {
      const addBtn = document.querySelector('.btn-add-custom');
      expect(addBtn).not.toBeNull();
      expect(addBtn.textContent).toContain('Add Custom Department');
    });
  });

  // =========================================================================
  // 14. Step 6 - Insight Details
  // =========================================================================
  describe('Step 6 - Insight Details', () => {
    beforeEach(() => {
      loadStep(6);
    });

    it('insight 3 is labeled "Strategic Opportunity"', () => {
      const badge = document.querySelector('#insight-3 .text-indigo-400');
      expect(badge).not.toBeNull();
      expect(badge.textContent).toContain('Strategic Opportunity');
    });

    it('insight cards have "View" action links', () => {
      const links = document.querySelectorAll('.insight-card a');
      expect(links.length).toBeGreaterThanOrEqual(3);
      const linkTexts = Array.from(links).map((l) => l.textContent);
      expect(linkTexts.some((t) => t.includes('View'))).toBe(true);
    });

    it('CTA links to dashboard.html', () => {
      const ctaLink = document.querySelector('#ready-cta a');
      expect(ctaLink).not.toBeNull();
      expect(ctaLink.getAttribute('href')).toContain('dashboard.html');
    });

    it('dashboard greeting says "Good morning, Jay"', () => {
      const greeting = document.getElementById('dash-greeting');
      expect(greeting).not.toBeNull();
      expect(greeting.textContent).toContain('Good morning, Jay');
    });

    it('dashboard shows meetings section with 3 meetings', () => {
      const meetings = document.getElementById('dash-meetings');
      expect(meetings).not.toBeNull();
      // 3 meeting cards (bg-[#1C1C1F] rounded p-2 blocks)
      const meetingItems = meetings.querySelectorAll('.rounded.p-2');
      expect(meetingItems.length).toBe(3);
    });
  });
});
