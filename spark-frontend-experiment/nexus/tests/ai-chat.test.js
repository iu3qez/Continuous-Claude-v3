import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createContainer, cleanup } from './setup.js';

describe('AI Chat Panel', () => {
  let mod;
  let container;

  beforeEach(async () => {
    vi.resetModules();
    mod = await import('../components/ai-chat.js');
    container = createContainer();
  });

  afterEach(() => {
    cleanup();
  });

  describe('createChatPanel', () => {
    it('returns a DOM element with input and message area', () => {
      const panel = mod.createChatPanel();
      expect(panel).toBeInstanceOf(HTMLElement);

      // Has a message area
      const messageArea = panel.querySelector('[data-chat-messages]');
      expect(messageArea).not.toBeNull();

      // Has an input field
      const input = panel.querySelector('input[type="text"]');
      expect(input).not.toBeNull();
    });

    it('input field has placeholder text', () => {
      const panel = mod.createChatPanel();
      const input = panel.querySelector('input[type="text"]');
      expect(input.placeholder).toBeTruthy();
    });

    it('has mode selector tabs', () => {
      const panel = mod.createChatPanel();
      const tabs = panel.querySelectorAll('[data-mode-tab]');
      expect(tabs.length).toBe(3);
    });

    it('has a send button', () => {
      const panel = mod.createChatPanel();
      const sendBtn = panel.querySelector('[data-send-btn]');
      expect(sendBtn).not.toBeNull();
    });
  });

  describe('addUserMessage', () => {
    it('adds a message with user styling', () => {
      const panel = mod.createChatPanel();
      container.appendChild(panel);

      mod.addUserMessage(panel, 'Hello');
      const messages = panel.querySelector('[data-chat-messages]');
      const userMsg = messages.querySelector('[data-role="user"]');
      expect(userMsg).not.toBeNull();
      expect(userMsg.textContent).toContain('Hello');
    });

    it('message rendering includes timestamp', () => {
      const panel = mod.createChatPanel();
      container.appendChild(panel);

      mod.addUserMessage(panel, 'Hello');
      const messages = panel.querySelector('[data-chat-messages]');
      const timestamp = messages.querySelector('[data-timestamp]');
      expect(timestamp).not.toBeNull();
      expect(timestamp.textContent).toBeTruthy();
    });
  });

  describe('addAiMessage', () => {
    it('adds a message with AI styling', () => {
      const panel = mod.createChatPanel();
      container.appendChild(panel);

      mod.addAiMessage(panel, { content: 'Hi' });
      const messages = panel.querySelector('[data-chat-messages]');
      const aiMsg = messages.querySelector('[data-role="ai"]');
      expect(aiMsg).not.toBeNull();
      expect(aiMsg.textContent).toContain('Hi');
    });

    it('AI messages have tool chip area', () => {
      const panel = mod.createChatPanel();
      container.appendChild(panel);

      mod.addAiMessage(panel, { content: 'Response', toolChips: ['CRM Query'] });
      const messages = panel.querySelector('[data-chat-messages]');
      const chipArea = messages.querySelector('[data-tool-chips]');
      expect(chipArea).not.toBeNull();
    });

    it('message rendering includes timestamp', () => {
      const panel = mod.createChatPanel();
      container.appendChild(panel);

      mod.addAiMessage(panel, { content: 'Hi there' });
      const messages = panel.querySelector('[data-chat-messages]');
      const timestamp = messages.querySelector('[data-timestamp]');
      expect(timestamp).not.toBeNull();
      expect(timestamp.textContent).toBeTruthy();
    });
  });

  describe('getMessages', () => {
    it('returns array of message objects', () => {
      const panel = mod.createChatPanel();
      container.appendChild(panel);

      mod.addUserMessage(panel, 'First');
      mod.addAiMessage(panel, { content: 'Second' });

      const messages = mod.getMessages(panel);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe('user');
      expect(messages[0].text).toBe('First');
      expect(messages[1].role).toBe('ai');
      expect(messages[1].text).toBe('Second');
    });
  });

  describe('clearMessages', () => {
    it('removes all messages', () => {
      const panel = mod.createChatPanel();
      container.appendChild(panel);

      mod.addUserMessage(panel, 'One');
      mod.addAiMessage(panel, { content: 'Two' });
      expect(mod.getMessages(panel).length).toBe(2);

      mod.clearMessages(panel);
      expect(mod.getMessages(panel).length).toBe(0);
    });
  });

  describe('setMode', () => {
    it('updates the mode indicator', () => {
      const panel = mod.createChatPanel();
      container.appendChild(panel);

      mod.setMode(panel, 'meeting-prep');
      const activeTab = panel.querySelector('[data-mode-tab].active');
      expect(activeTab).not.toBeNull();
      expect(activeTab.dataset.modeTab).toBe('meeting-prep');
    });
  });

  describe('getModes', () => {
    it('returns the three available modes', () => {
      const modes = mod.getModes();
      expect(modes).toEqual(['meeting-prep', 'action-tracker', 'research']);
    });
  });

  describe('getCurrentMode', () => {
    it('returns the active mode', () => {
      const panel = mod.createChatPanel();
      container.appendChild(panel);

      mod.setMode(panel, 'research');
      expect(mod.getCurrentMode(panel)).toBe('research');
    });

    it('defaults to meeting-prep', () => {
      const panel = mod.createChatPanel();
      container.appendChild(panel);

      expect(mod.getCurrentMode(panel)).toBe('meeting-prep');
    });
  });

  describe('showThinking', () => {
    it('adds thinking indicator with 3 dots', () => {
      const panel = mod.createChatPanel();
      container.appendChild(panel);

      mod.showThinking(panel);
      const indicator = panel.querySelector('[data-thinking]');
      expect(indicator).not.toBeNull();
      const dots = indicator.querySelectorAll('[data-dot]');
      expect(dots.length).toBe(3);
    });
  });

  describe('hideThinking', () => {
    it('removes thinking indicator', () => {
      const panel = mod.createChatPanel();
      container.appendChild(panel);

      mod.showThinking(panel);
      expect(panel.querySelector('[data-thinking]')).not.toBeNull();

      mod.hideThinking(panel);
      expect(panel.querySelector('[data-thinking]')).toBeNull();
    });
  });

  describe('addToolChip', () => {
    it('adds a tool-use chip to the last AI message', () => {
      const panel = mod.createChatPanel();
      container.appendChild(panel);

      mod.addAiMessage(panel, { content: 'Processing...' });
      mod.addToolChip(panel, 'Querying CRM');

      const chipArea = panel.querySelector('[data-tool-chips]');
      expect(chipArea).not.toBeNull();
      const chip = chipArea.querySelector('[data-chip]');
      expect(chip).not.toBeNull();
      expect(chip.textContent).toContain('Querying CRM');
    });
  });

  describe('showFollowUps', () => {
    it('renders follow-up suggestions as clickable buttons', () => {
      const panel = mod.createChatPanel();
      container.appendChild(panel);

      mod.showFollowUps(panel, ['Option A', 'Option B', 'Option C']);

      const followUps = panel.querySelectorAll('[data-follow-up]');
      expect(followUps.length).toBe(3);
      expect(followUps[0].tagName).toBe('BUTTON');
      expect(followUps[0].textContent).toContain('Option A');
      expect(followUps[1].textContent).toContain('Option B');
      expect(followUps[2].textContent).toContain('Option C');
    });
  });
});
