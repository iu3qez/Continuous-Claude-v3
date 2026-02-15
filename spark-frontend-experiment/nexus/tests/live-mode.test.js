import { describe, it, expect, beforeEach, vi } from 'vitest';
import WorkbookDemo from '../components/state.js';
import { isLiveMode, toggleLiveMode, sendLiveQuery, setLiveBadge } from '../ai/live-mode.js';

describe('Live Mode', () => {
  beforeEach(() => {
    WorkbookDemo.aiMode = 'scripted';
    vi.restoreAllMocks();
  });

  describe('isLiveMode', () => {
    it('returns false by default', () => {
      expect(isLiveMode()).toBe(false);
    });

    it('returns true when aiMode is live', () => {
      WorkbookDemo.aiMode = 'live';
      expect(isLiveMode()).toBe(true);
    });
  });

  describe('toggleLiveMode', () => {
    it('switches from scripted to live', () => {
      toggleLiveMode();
      expect(WorkbookDemo.aiMode).toBe('live');
    });

    it('switches from live back to scripted', () => {
      WorkbookDemo.aiMode = 'live';
      toggleLiveMode();
      expect(WorkbookDemo.aiMode).toBe('scripted');
    });
  });

  describe('sendLiveQuery', () => {
    it('returns response on success', async () => {
      const payload = { reply: 'hello from server' };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(payload),
      });

      const result = await sendLiveQuery('hi', { page: 'dashboard' });
      expect(result).toEqual(payload);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('returns null on fetch error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('network'));

      const result = await sendLiveQuery('hi', {});
      expect(result).toBeNull();
    });

    it('returns null on non-ok response', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

      const result = await sendLiveQuery('hi', {});
      expect(result).toBeNull();
    });

    it('returns null on timeout', async () => {
      // fetch that never resolves, so AbortController fires
      global.fetch = vi.fn().mockImplementation(
        () => new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException('aborted', 'AbortError')), 10);
        })
      );

      const result = await sendLiveQuery('hi', {});
      expect(result).toBeNull();
    });
  });

  describe('setLiveBadge', () => {
    it('renders LIVE badge when mode is live', () => {
      WorkbookDemo.aiMode = 'live';
      const container = document.createElement('div');
      setLiveBadge(container);
      const badge = container.querySelector('.live-badge');
      expect(badge).not.toBeNull();
      expect(badge.textContent).toBe('LIVE');
    });

    it('renders no badge when mode is scripted', () => {
      const container = document.createElement('div');
      setLiveBadge(container);
      const badge = container.querySelector('.live-badge');
      expect(badge).toBeNull();
    });
  });
});
