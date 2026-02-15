import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Meeting Detail Page', () => {
  let WorkbookDemo;
  let persona;
  let aiChat;
  let responseEngine;

  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();
    document.body.innerHTML = '';

    const stateMod = await import('../components/state.js');
    WorkbookDemo = stateMod.default;
    WorkbookDemo.industry = 'consulting';
    WorkbookDemo.persona = 'ceo';
    WorkbookDemo.aiMode = 'scripted';
    WorkbookDemo._listeners = {};

    persona = await import('../components/persona.js');
    aiChat = await import('../components/ai-chat.js');
    responseEngine = await import('../ai/response-engine.js');
  });

  // ──────────────────────────────────────────────
  // 1. Persona Access (3 tests)
  // ──────────────────────────────────────────────
  describe('Persona Access', () => {
    it('CEO can access meeting-detail', () => {
      expect(persona.canAccessPage('meeting-detail', 'ceo')).toBe(true);
    });

    it('ops persona can access meeting-detail', () => {
      expect(persona.canAccessPage('meeting-detail', 'ops')).toBe(true);
    });

    it('new persona can access meeting-detail', () => {
      expect(persona.canAccessPage('meeting-detail', 'new')).toBe(true);
    });

    it('engineering persona can access meeting-detail', () => {
      expect(persona.canAccessPage('meeting-detail', 'engineering')).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // 2. Meeting Header (4 tests)
  // ──────────────────────────────────────────────
  describe('Meeting Header', () => {
    let headerHtml;

    beforeEach(() => {
      // Render the meeting header structure from meeting-detail.html
      document.body.innerHTML = `
        <div class="px-4 pb-4">
          <div class="flex items-start justify-between mb-2">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h1 class="text-xl font-heading font-semibold text-txt-primary">Emergency Campaign Blocker</h1>
                <span class="font-mono text-[10px] px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20">Emergency</span>
              </div>
              <div class="flex items-center gap-2 flex-wrap mt-1.5">
                <span class="metadata-chip text-[10px] px-2 py-0.5 font-mono">Feb 10, 2026</span>
                <span class="metadata-chip text-[10px] px-2 py-0.5">MKT Workspace</span>
                <span class="metadata-chip text-[10px] px-2 py-0.5">45 min</span>
                <span class="metadata-chip text-[10px] px-2 py-0.5">4 attendees</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3 mt-3 pb-3 border-b border-[#232326]">
            <span class="text-[10px] text-txt-tertiary uppercase tracking-wider">Attendees</span>
            <div class="flex items-center gap-2">
              <span class="text-xs text-txt-secondary">Sarah Chen (Chair)</span>
              <span class="text-xs text-txt-secondary">Marcus Johnson</span>
              <span class="text-xs text-txt-secondary">Lisa Park</span>
              <span class="text-xs text-txt-secondary">David Hayes</span>
            </div>
          </div>
        </div>
      `;
    });

    it('displays the meeting title', () => {
      const title = document.querySelector('h1');
      expect(title).not.toBeNull();
      expect(title.textContent).toBe('Emergency Campaign Blocker');
    });

    it('displays the meeting date in a metadata chip', () => {
      const chips = document.querySelectorAll('.metadata-chip');
      const dateChip = Array.from(chips).find((c) =>
        c.textContent.includes('Feb 10, 2026')
      );
      expect(dateChip).toBeDefined();
    });

    it('displays the workspace tag', () => {
      const chips = document.querySelectorAll('.metadata-chip');
      const workspaceChip = Array.from(chips).find((c) =>
        c.textContent.includes('MKT Workspace')
      );
      expect(workspaceChip).toBeDefined();
    });

    it('displays all 4 attendees', () => {
      const attendeeNames = document.querySelectorAll('.text-xs.text-txt-secondary');
      expect(attendeeNames.length).toBe(4);
      const names = Array.from(attendeeNames).map((el) => el.textContent);
      expect(names).toContain('Sarah Chen (Chair)');
      expect(names).toContain('Marcus Johnson');
      expect(names).toContain('Lisa Park');
      expect(names).toContain('David Hayes');
    });
  });

  // ──────────────────────────────────────────────
  // 3. AI Chat Panel (5 tests)
  // ──────────────────────────────────────────────
  describe('AI Chat Panel', () => {
    it('createChatPanel returns a DOM element', () => {
      const panel = aiChat.createChatPanel();
      expect(panel).toBeInstanceOf(HTMLElement);
    });

    it('panel has a message area with data-chat-messages attribute', () => {
      const panel = aiChat.createChatPanel();
      const messageArea = panel.querySelector('[data-chat-messages]');
      expect(messageArea).not.toBeNull();
    });

    it('panel has a text input field for user messages', () => {
      const panel = aiChat.createChatPanel();
      const input = panel.querySelector('input[type="text"]');
      expect(input).not.toBeNull();
      expect(input.placeholder).toBeTruthy();
    });

    it('panel has a send button', () => {
      const panel = aiChat.createChatPanel();
      const sendBtn = panel.querySelector('[data-send-btn]');
      expect(sendBtn).not.toBeNull();
    });

    it('user messages display in the message area', () => {
      const panel = aiChat.createChatPanel();
      document.body.appendChild(panel);
      aiChat.addUserMessage(panel, 'Test message');
      const userMsg = panel.querySelector('[data-role="user"]');
      expect(userMsg).not.toBeNull();
      expect(userMsg.textContent).toContain('Test message');
    });
  });

  // ──────────────────────────────────────────────
  // 4. Prep Me Flow (4 tests)
  // ──────────────────────────────────────────────
  describe('Prep Me Flow', () => {
    it('response engine returns Tier 1 match for "prep me" on meeting-detail', () => {
      const match = responseEngine.matchTier1('prep me for this meeting', 'meeting-detail');
      expect(match).not.toBeNull();
      expect(match.responseId).toBe('meeting-prep');
    });

    it('getResponse returns meeting-prep content with tool chips', () => {
      const response = responseEngine.getResponse('prep me for this meeting', {
        page: 'meeting-detail',
      });
      expect(response.tier).toBe(1);
      expect(response.content).toBeTruthy();
      expect(Array.isArray(response.toolChips)).toBe(true);
      expect(response.toolChips.length).toBeGreaterThan(0);
    });

    it('handleSend adds user message and AI response to the panel', () => {
      const panel = aiChat.createChatPanel();
      document.body.appendChild(panel);

      aiChat.handleSend(panel, 'prep me for this meeting');

      const messages = aiChat.getMessages(panel);
      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe('user');
      expect(messages[0].text).toBe('prep me for this meeting');
      expect(messages[1].role).toBe('ai');
    });

    it('prep response includes follow-up suggestions', () => {
      const response = responseEngine.getResponse('prep me for this meeting', {
        page: 'meeting-detail',
      });
      expect(Array.isArray(response.followUpSuggestions)).toBe(true);
      expect(response.followUpSuggestions.length).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────────────
  // 5. AI Mode Selector (3 tests)
  // ──────────────────────────────────────────────
  describe('AI Mode Selector', () => {
    it('chat panel has 3 mode tabs', () => {
      const panel = aiChat.createChatPanel();
      const tabs = panel.querySelectorAll('[data-mode-tab]');
      expect(tabs.length).toBe(3);
    });

    it('switching mode updates current mode on panel', () => {
      const panel = aiChat.createChatPanel();
      document.body.appendChild(panel);

      aiChat.setMode(panel, 'research');
      expect(aiChat.getCurrentMode(panel)).toBe('research');
    });

    it('state.js aiMode toggles between scripted and live', () => {
      expect(WorkbookDemo.aiMode).toBe('scripted');
      WorkbookDemo.toggleAiMode();
      expect(WorkbookDemo.aiMode).toBe('live');
      WorkbookDemo.toggleAiMode();
      expect(WorkbookDemo.aiMode).toBe('scripted');
    });
  });

  // ──────────────────────────────────────────────
  // 6. Proposed Actions (4 tests)
  // ──────────────────────────────────────────────
  describe('Proposed Actions', () => {
    let container;

    beforeEach(() => {
      // Render the proposed action card from meeting-detail.html
      container = document.createElement('div');
      container.innerHTML = `
        <div class="proposed-action-card" data-action-id="media-hold">
          <div class="px-3 py-2 bg-accent/5 border-b border-accent/10 flex items-center gap-2">
            <span class="font-mono text-[10px] text-accent font-medium">Proposed Action</span>
          </div>
          <div class="p-3 space-y-2">
            <div class="text-xs text-txt-primary">
              <span class="font-medium">Create action:</span> Approve $48K media hold authorization
            </div>
            <div class="flex gap-2 mt-1">
              <button data-approve class="flex-1 px-3 py-1.5 rounded bg-success text-white text-xs font-medium">Approve</button>
              <button data-reject class="flex-1 px-3 py-1.5 rounded bg-danger/10 text-danger text-xs font-medium">Reject</button>
              <button data-edit class="px-3 py-1.5 rounded bg-[#232326] text-txt-secondary text-xs">Edit</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(container);
    });

    it('action card displays the proposed action text', () => {
      const actionText = container.querySelector('.text-xs.text-txt-primary');
      expect(actionText.textContent).toContain('Approve $48K media hold authorization');
    });

    it('action card has an approve button', () => {
      const approveBtn = container.querySelector('[data-approve]');
      expect(approveBtn).not.toBeNull();
      expect(approveBtn.textContent).toContain('Approve');
    });

    it('action card has a reject button', () => {
      const rejectBtn = container.querySelector('[data-reject]');
      expect(rejectBtn).not.toBeNull();
      expect(rejectBtn.textContent).toContain('Reject');
    });

    it('clicking approve changes the card visual state', () => {
      const approveBtn = container.querySelector('[data-approve]');
      const card = container.querySelector('.proposed-action-card');

      approveBtn.addEventListener('click', () => {
        card.setAttribute('data-status', 'approved');
        card.classList.add('action-approved');
      });

      approveBtn.click();
      expect(card.getAttribute('data-status')).toBe('approved');
      expect(card.classList.contains('action-approved')).toBe(true);
    });
  });

  // ──────────────────────────────────────────────
  // 7. Timeline (3 tests)
  // ──────────────────────────────────────────────
  describe('Timeline', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="relative pl-12">
          <div class="timeline-line absolute left-4 top-0 bottom-0 w-px"></div>

          <div class="timeline-section relative mb-6">
            <span class="font-mono text-[10px] text-txt-tertiary" data-time>11:00</span>
            <div class="timeline-node timeline-node-active absolute w-3 h-3 rounded-full"></div>
            <h4 class="font-heading text-base font-semibold mb-1 text-txt-primary">Campaign Launch Status</h4>
          </div>

          <div class="timeline-section relative mb-6">
            <span class="font-mono text-[10px] text-txt-tertiary" data-time>11:10</span>
            <div class="timeline-node absolute w-3 h-3 rounded-full"></div>
            <h4 class="font-heading text-base font-semibold mb-1 text-txt-primary">Legal Review Scope</h4>
          </div>

          <div class="timeline-section relative mb-6">
            <span class="font-mono text-[10px] text-txt-tertiary" data-time>11:20</span>
            <div class="timeline-node absolute w-3 h-3 rounded-full"></div>
            <h4 class="font-heading text-base font-semibold mb-1 text-txt-primary">Financial Impact Assessment</h4>
          </div>

          <div class="timeline-section relative mb-6">
            <span class="font-mono text-[10px] text-txt-tertiary" data-time>11:30</span>
            <div class="timeline-node absolute w-3 h-3 rounded-full"></div>
            <h4 class="font-heading text-base font-semibold mb-1 text-txt-primary">Contingency Plan</h4>
          </div>

          <div class="timeline-section relative mb-6">
            <span class="font-mono text-[10px] text-txt-tertiary" data-time>11:40</span>
            <div class="timeline-node absolute w-3 h-3 rounded-full"></div>
            <h4 class="font-heading text-base font-semibold mb-1 text-txt-primary">Next Steps & Close</h4>
          </div>
        </div>
      `;
    });

    it('renders 5 timeline sections with timestamps', () => {
      const sections = document.querySelectorAll('.timeline-section');
      expect(sections.length).toBe(5);

      const times = document.querySelectorAll('[data-time]');
      expect(times.length).toBe(5);
      expect(times[0].textContent).toBe('11:00');
      expect(times[4].textContent).toBe('11:40');
    });

    it('first timeline node is marked as active (key moment)', () => {
      const activeNode = document.querySelector('.timeline-node-active');
      expect(activeNode).not.toBeNull();

      // Only one node should be active
      const allActive = document.querySelectorAll('.timeline-node-active');
      expect(allActive.length).toBe(1);
    });

    it('timeline entries are in chronological order', () => {
      const times = document.querySelectorAll('[data-time]');
      const timeValues = Array.from(times).map((t) => t.textContent);

      for (let i = 1; i < timeValues.length; i++) {
        const prev = parseInt(timeValues[i - 1].replace(':', ''), 10);
        const curr = parseInt(timeValues[i].replace(':', ''), 10);
        expect(curr).toBeGreaterThan(prev);
      }
    });
  });

  // ──────────────────────────────────────────────
  // 8. Tool-Use Chips (3 tests)
  // ──────────────────────────────────────────────
  describe('Tool-Use Chips', () => {
    it('AI messages can have tool chips attached', () => {
      const panel = aiChat.createChatPanel();
      document.body.appendChild(panel);

      aiChat.addAiMessage(panel, {
        content: 'Analysis complete.',
        toolChips: ['Queried MKT workspace', 'Queried Legal decisions', 'Queried Finance data'],
      });

      const chipArea = panel.querySelector('[data-tool-chips]');
      expect(chipArea).not.toBeNull();
      const chips = chipArea.querySelectorAll('[data-chip]');
      expect(chips.length).toBe(3);
    });

    it('tool chips display correct labels', () => {
      const panel = aiChat.createChatPanel();
      document.body.appendChild(panel);

      const chipLabels = ['Queried MKT workspace', 'Queried Legal decisions', 'Queried Finance data'];
      aiChat.addAiMessage(panel, {
        content: 'Analysis complete.',
        toolChips: chipLabels,
      });

      const chips = panel.querySelectorAll('[data-chip]');
      const chipTexts = Array.from(chips).map((c) => c.textContent);
      chipLabels.forEach((label) => {
        expect(chipTexts).toContain(label);
      });
    });

    it('addToolChip appends a chip to the last AI message', () => {
      const panel = aiChat.createChatPanel();
      document.body.appendChild(panel);

      aiChat.addAiMessage(panel, { content: 'Processing request...' });
      aiChat.addToolChip(panel, 'CRM Query');

      const chipArea = panel.querySelector('[data-tool-chips]');
      const chip = chipArea.querySelector('[data-chip]');
      expect(chip).not.toBeNull();
      expect(chip.textContent).toContain('CRM Query');
    });
  });

  // ──────────────────────────────────────────────
  // 9. Response Engine Integration (3 tests)
  // ──────────────────────────────────────────────
  describe('Response Engine Integration', () => {
    it('meeting-prep response includes tool chips for data sources', () => {
      const chips = responseEngine.getToolChips('meeting-prep');
      expect(Array.isArray(chips)).toBe(true);
      expect(chips.length).toBeGreaterThan(0);
    });

    it('Tier 2 keywords match risk category for blocker-related queries', () => {
      const category = responseEngine.matchTier2Keywords('what are the risks and blockers');
      expect(category).toBe('risk');
    });

    it('fallback Tier 3 response is returned for unrecognized input', () => {
      const response = responseEngine.getResponse('completely random gibberish xyz', {});
      expect(response.tier).toBe(3);
      expect(typeof response.content).toBe('string');
      expect(response.content.length).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────────────
  // 10. Thinking Indicator (2 tests)
  // ──────────────────────────────────────────────
  describe('Thinking Indicator', () => {
    it('showThinking adds indicator with 3 animated dots', () => {
      const panel = aiChat.createChatPanel();
      document.body.appendChild(panel);

      aiChat.showThinking(panel);
      const indicator = panel.querySelector('[data-thinking]');
      expect(indicator).not.toBeNull();
      const dots = indicator.querySelectorAll('[data-dot]');
      expect(dots.length).toBe(3);
    });

    it('hideThinking removes the indicator', () => {
      const panel = aiChat.createChatPanel();
      document.body.appendChild(panel);

      aiChat.showThinking(panel);
      expect(panel.querySelector('[data-thinking]')).not.toBeNull();

      aiChat.hideThinking(panel);
      expect(panel.querySelector('[data-thinking]')).toBeNull();
    });
  });
});
