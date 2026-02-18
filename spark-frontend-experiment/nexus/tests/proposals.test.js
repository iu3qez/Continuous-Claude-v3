import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Helper: reproduce the inline script functions from proposals.html
// These mirror the exact DOM-manipulation logic in the page's <script> block.
// ---------------------------------------------------------------------------

function approveProposal(btn) {
  const card = btn.closest('.proposal-card');
  card.style.opacity = '0.5';
  card.style.borderColor = '#059669';
  card.querySelectorAll('button').forEach((b) => (b.disabled = true));
  const indicator = document.createElement('div');
  indicator.className =
    'flex items-center gap-1 mt-2 px-2 py-1 rounded bg-[#059669]/10 border border-[#059669]/20';
  indicator.innerHTML =
    '<span class="font-mono text-[10px] text-[#059669]">Approved</span>';
  card.querySelector('.flex-1').appendChild(indicator);
}

function rejectProposal(btn) {
  const card = btn.closest('.proposal-card');
  card.style.opacity = '0.3';
  card.querySelectorAll('button').forEach((b) => (b.disabled = true));
}

function deferProposal(btn) {
  const card = btn.closest('.proposal-card');
  card.style.opacity = '0.6';
  card.querySelectorAll('button').forEach((b) => (b.disabled = true));
  const indicator = document.createElement('div');
  indicator.className =
    'flex items-center gap-1 mt-2 px-2 py-1 rounded bg-[#232326] border border-[#232326]';
  indicator.innerHTML =
    '<span class="font-mono text-[10px] text-[#8F8F94]">Deferred</span>';
  card.querySelector('.flex-1').appendChild(indicator);
}

function setFilter(el) {
  const allChips = document.querySelectorAll('.filter-chip');
  allChips.forEach((chip) => {
    chip.classList.remove('filter-chip-active');
    chip.classList.add('text-[#8F8F94]');
    if (!chip.classList.contains('border-[#232326]')) {
      chip.classList.add('border-[#232326]');
    }
  });
  el.classList.add('filter-chip-active');
  el.classList.remove('text-[#8F8F94]');
  el.classList.remove('border-[#232326]');
  el.classList.add('border-transparent');

  const filterType = el.getAttribute('data-filter');
  const cards = document.querySelectorAll('.proposal-card');
  cards.forEach((card) => {
    if (filterType === 'all' || card.getAttribute('data-type') === filterType) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

function batchApprove() {
  document.querySelectorAll('.proposal-card').forEach((card) => {
    if (
      card.style.opacity !== '0.3' &&
      card.style.opacity !== '0.5' &&
      card.style.opacity !== '0.6'
    ) {
      const approveBtn = card.querySelector('.btn-approve');
      if (approveBtn && !approveBtn.disabled) {
        approveProposal(approveBtn);
      }
    }
  });
}

function batchDismiss() {
  document.querySelectorAll('.proposal-card').forEach((card) => {
    if (
      card.style.opacity !== '0.3' &&
      card.style.opacity !== '0.5' &&
      card.style.opacity !== '0.6'
    ) {
      const rejectBtn = card.querySelector('.btn-reject');
      if (rejectBtn && !rejectBtn.disabled) {
        rejectProposal(rejectBtn);
      }
    }
  });
}

// ---------------------------------------------------------------------------
// DOM factory: builds a proposal card matching the HTML structure in
// proposals.html. Each card has data-type, data-urgency, data-id attributes
// and three action buttons (approve, reject, defer).
// ---------------------------------------------------------------------------

function createProposalCard({ id, title, type, urgency }) {
  const card = document.createElement('div');
  card.className = 'proposal-card card p-4 cursor-pointer';
  card.setAttribute('data-type', type);
  card.setAttribute('data-urgency', urgency);
  card.setAttribute('data-id', id);

  card.innerHTML = `
    <div class="flex items-start gap-3">
      <div class="flex-shrink-0 mt-1">
        <div class="w-3 h-3 rounded-full agent-nova" title="Agent: Nova"></div>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <p class="text-base font-medium truncate">${title}</p>
        </div>
      </div>
      <div class="flex items-center gap-1 flex-shrink-0">
        <button class="btn-approve">Approve</button>
        <button class="btn-reject">Reject</button>
        <button class="btn-defer">Defer</button>
      </div>
    </div>
  `;
  return card;
}

function createFilterBar(types) {
  const bar = document.createElement('div');
  bar.className = 'filter-bar';

  types.forEach((type) => {
    const chip = document.createElement('button');
    chip.className = 'filter-chip font-mono text-[11px] px-3 py-1 rounded border border-[#232326] text-[#8F8F94]';
    chip.setAttribute('data-filter', type);
    chip.textContent = type === 'all' ? 'All' : type;
    bar.appendChild(chip);
  });

  return bar;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Proposals Page', () => {
  let persona;
  let WorkbookDemo;

  beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();

    const stateMod = await import('../components/state.js');
    WorkbookDemo = stateMod.default;
    WorkbookDemo.industry = 'consulting';
    WorkbookDemo.persona = 'ceo';
    WorkbookDemo._listeners = {};

    persona = await import('../components/persona.js');
  });

  // -------------------------------------------------------------------------
  // 1. Persona Access
  // -------------------------------------------------------------------------
  describe('Persona Access', () => {
    it('CEO can access proposals page', () => {
      expect(persona.canAccessPage('proposals', 'ceo')).toBe(true);
    });

    it('ops persona can access proposals page', () => {
      expect(persona.canAccessPage('proposals', 'ops')).toBe(true);
    });

    it('engineering persona can access proposals page', () => {
      expect(persona.canAccessPage('proposals', 'engineering')).toBe(true);
    });

    it('new persona CANNOT access proposals page', () => {
      expect(persona.canAccessPage('proposals', 'new')).toBe(false);
    });

    it('returns false for unknown persona', () => {
      expect(persona.canAccessPage('proposals', 'unknown-user')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Proposal Card DOM Structure
  // -------------------------------------------------------------------------
  describe('Proposal Card DOM', () => {
    it('card has correct data-type attribute', () => {
      const card = createProposalCard({
        id: 'p1',
        title: 'Test',
        type: 'follow-up',
        urgency: 'high',
      });
      expect(card.getAttribute('data-type')).toBe('follow-up');
    });

    it('card has correct data-urgency attribute', () => {
      const card = createProposalCard({
        id: 'p1',
        title: 'Test',
        type: 'action',
        urgency: 'medium',
      });
      expect(card.getAttribute('data-urgency')).toBe('medium');
    });

    it('card has correct data-id attribute', () => {
      const card = createProposalCard({
        id: 'p3',
        title: 'Test',
        type: 'risk',
        urgency: 'low',
      });
      expect(card.getAttribute('data-id')).toBe('p3');
    });

    it('card contains approve, reject, and defer buttons', () => {
      const card = createProposalCard({
        id: 'p1',
        title: 'Test',
        type: 'action',
        urgency: 'high',
      });
      expect(card.querySelector('.btn-approve')).not.toBeNull();
      expect(card.querySelector('.btn-reject')).not.toBeNull();
      expect(card.querySelector('.btn-defer')).not.toBeNull();
    });

    it('card contains a .flex-1 content area', () => {
      const card = createProposalCard({
        id: 'p1',
        title: 'Test',
        type: 'action',
        urgency: 'high',
      });
      expect(card.querySelector('.flex-1')).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Filter Chips
  // -------------------------------------------------------------------------
  describe('Filter Chips', () => {
    let container;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);

      const bar = createFilterBar(['all', 'action', 'follow-up', 'risk', 'opportunity']);
      container.appendChild(bar);

      const cards = [
        { id: 'p1', title: 'A', type: 'follow-up', urgency: 'high' },
        { id: 'p2', title: 'B', type: 'action', urgency: 'high' },
        { id: 'p3', title: 'C', type: 'opportunity', urgency: 'medium' },
        { id: 'p4', title: 'D', type: 'action', urgency: 'high' },
        { id: 'p5', title: 'E', type: 'risk', urgency: 'medium' },
      ];
      cards.forEach((c) => container.appendChild(createProposalCard(c)));
    });

    it('shows all cards when "all" filter is active', () => {
      const allChip = container.querySelector('[data-filter="all"]');
      setFilter(allChip);

      const visible = container.querySelectorAll('.proposal-card');
      const hiddenCount = Array.from(visible).filter(
        (c) => c.style.display === 'none'
      ).length;
      expect(hiddenCount).toBe(0);
    });

    it('shows only action cards when "action" filter is active', () => {
      const actionChip = container.querySelector('[data-filter="action"]');
      setFilter(actionChip);

      const cards = container.querySelectorAll('.proposal-card');
      cards.forEach((card) => {
        if (card.getAttribute('data-type') === 'action') {
          expect(card.style.display).not.toBe('none');
        } else {
          expect(card.style.display).toBe('none');
        }
      });
    });

    it('shows only risk cards when "risk" filter is active', () => {
      const riskChip = container.querySelector('[data-filter="risk"]');
      setFilter(riskChip);

      const visibleCards = Array.from(
        container.querySelectorAll('.proposal-card')
      ).filter((c) => c.style.display !== 'none');
      expect(visibleCards).toHaveLength(1);
      expect(visibleCards[0].getAttribute('data-type')).toBe('risk');
    });

    it('adds filter-chip-active class to selected chip', () => {
      const actionChip = container.querySelector('[data-filter="action"]');
      setFilter(actionChip);
      expect(actionChip.classList.contains('filter-chip-active')).toBe(true);
    });

    it('removes filter-chip-active from previously selected chip', () => {
      const actionChip = container.querySelector('[data-filter="action"]');
      const riskChip = container.querySelector('[data-filter="risk"]');
      setFilter(actionChip);
      setFilter(riskChip);
      expect(actionChip.classList.contains('filter-chip-active')).toBe(false);
      expect(riskChip.classList.contains('filter-chip-active')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Approve Flow
  // -------------------------------------------------------------------------
  describe('Approve Flow', () => {
    let card;
    let approveBtn;

    beforeEach(() => {
      card = createProposalCard({
        id: 'p1',
        title: 'Schedule follow-up',
        type: 'follow-up',
        urgency: 'high',
      });
      document.body.appendChild(card);
      approveBtn = card.querySelector('.btn-approve');
    });

    it('sets card opacity to 0.5', () => {
      approveProposal(approveBtn);
      expect(card.style.opacity).toBe('0.5');
    });

    it('sets card border color to success green (#059669)', () => {
      approveProposal(approveBtn);
      // jsdom normalizes hex to rgb format
      expect(card.style.borderColor).toBe('rgb(5, 150, 105)');
    });

    it('disables all buttons on the card', () => {
      approveProposal(approveBtn);
      const buttons = card.querySelectorAll('button');
      buttons.forEach((b) => {
        expect(b.disabled).toBe(true);
      });
    });

    it('appends an "Approved" indicator to the content area', () => {
      approveProposal(approveBtn);
      const indicator = card.querySelector('.flex-1 span');
      expect(indicator).not.toBeNull();
      expect(indicator.textContent).toBe('Approved');
    });
  });

  // -------------------------------------------------------------------------
  // 5. Reject Flow
  // -------------------------------------------------------------------------
  describe('Reject Flow', () => {
    let card;
    let rejectBtn;

    beforeEach(() => {
      card = createProposalCard({
        id: 'p2',
        title: 'Update timeline',
        type: 'action',
        urgency: 'high',
      });
      document.body.appendChild(card);
      rejectBtn = card.querySelector('.btn-reject');
    });

    it('sets card opacity to 0.3', () => {
      rejectProposal(rejectBtn);
      expect(card.style.opacity).toBe('0.3');
    });

    it('disables all buttons on the card', () => {
      rejectProposal(rejectBtn);
      card.querySelectorAll('button').forEach((b) => {
        expect(b.disabled).toBe(true);
      });
    });

    it('does NOT add any status indicator text', () => {
      rejectProposal(rejectBtn);
      const contentArea = card.querySelector('.flex-1');
      // Reject only changes opacity and disables buttons -- no indicator appended
      const indicators = contentArea.querySelectorAll('span');
      const statusTexts = Array.from(indicators).filter(
        (s) => s.textContent === 'Approved' || s.textContent === 'Deferred'
      );
      expect(statusTexts).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Defer Flow
  // -------------------------------------------------------------------------
  describe('Defer Flow', () => {
    let card;
    let deferBtn;

    beforeEach(() => {
      card = createProposalCard({
        id: 'p3',
        title: 'Review pricing',
        type: 'opportunity',
        urgency: 'medium',
      });
      document.body.appendChild(card);
      deferBtn = card.querySelector('.btn-defer');
    });

    it('sets card opacity to 0.6', () => {
      deferProposal(deferBtn);
      expect(card.style.opacity).toBe('0.6');
    });

    it('disables all buttons on the card', () => {
      deferProposal(deferBtn);
      card.querySelectorAll('button').forEach((b) => {
        expect(b.disabled).toBe(true);
      });
    });

    it('appends a "Deferred" indicator to the content area', () => {
      deferProposal(deferBtn);
      const indicators = card.querySelector('.flex-1').querySelectorAll('span');
      const deferredSpan = Array.from(indicators).find(
        (s) => s.textContent === 'Deferred'
      );
      expect(deferredSpan).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // 7. Batch Operations
  // -------------------------------------------------------------------------
  describe('Batch Operations', () => {
    let container;

    beforeEach(() => {
      container = document.createElement('div');
      document.body.appendChild(container);

      const cards = [
        { id: 'p1', title: 'A', type: 'follow-up', urgency: 'high' },
        { id: 'p2', title: 'B', type: 'action', urgency: 'high' },
        { id: 'p3', title: 'C', type: 'opportunity', urgency: 'medium' },
      ];
      cards.forEach((c) => container.appendChild(createProposalCard(c)));
    });

    it('batch approve sets all cards to opacity 0.5', () => {
      batchApprove();

      container.querySelectorAll('.proposal-card').forEach((card) => {
        expect(card.style.opacity).toBe('0.5');
      });
    });

    it('batch approve adds "Approved" indicator to every card', () => {
      batchApprove();

      container.querySelectorAll('.proposal-card').forEach((card) => {
        const spans = card.querySelectorAll('.flex-1 span');
        const approved = Array.from(spans).find(
          (s) => s.textContent === 'Approved'
        );
        expect(approved).toBeDefined();
      });
    });

    it('batch dismiss sets all cards to opacity 0.3', () => {
      batchDismiss();

      container.querySelectorAll('.proposal-card').forEach((card) => {
        expect(card.style.opacity).toBe('0.3');
      });
    });

    it('batch approve skips already-processed cards', () => {
      // Reject the first card manually
      const firstReject = container.querySelector(
        '.proposal-card .btn-reject'
      );
      rejectProposal(firstReject);

      // Now batch approve -- first card should stay at 0.3
      batchApprove();

      const cards = container.querySelectorAll('.proposal-card');
      expect(cards[0].style.opacity).toBe('0.3');
      expect(cards[1].style.opacity).toBe('0.5');
      expect(cards[2].style.opacity).toBe('0.5');
    });

    it('batch dismiss skips already-approved cards', () => {
      const firstApprove = container.querySelector(
        '.proposal-card .btn-approve'
      );
      approveProposal(firstApprove);

      batchDismiss();

      const cards = container.querySelectorAll('.proposal-card');
      // First card was approved (0.5) -- should remain untouched
      expect(cards[0].style.opacity).toBe('0.5');
      expect(cards[1].style.opacity).toBe('0.3');
      expect(cards[2].style.opacity).toBe('0.3');
    });
  });

  // -------------------------------------------------------------------------
  // 8. State Integration
  // -------------------------------------------------------------------------
  describe('State Integration', () => {
    it('switching persona to "new" makes proposals inaccessible', () => {
      WorkbookDemo.switchPersona('new');
      expect(WorkbookDemo.persona).toBe('new');
      expect(persona.canAccessPage('proposals', WorkbookDemo.persona)).toBe(
        false
      );
    });

    it('switching persona to "ops" keeps proposals accessible', () => {
      WorkbookDemo.switchPersona('ops');
      expect(WorkbookDemo.persona).toBe('ops');
      expect(persona.canAccessPage('proposals', WorkbookDemo.persona)).toBe(
        true
      );
    });

    it('persona change fires notification via WorkbookDemo', () => {
      const spy = vi.fn();
      WorkbookDemo.subscribe('personaChange', spy);
      WorkbookDemo.switchPersona('engineering');
      expect(spy).toHaveBeenCalledWith({ persona: 'engineering' });
    });
  });
});
