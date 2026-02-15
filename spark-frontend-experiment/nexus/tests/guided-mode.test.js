import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  startArc, nextStep, prevStep, jumpToStep,
  exitGuided, isGuidedActive, getGuidedState,
  onGuidedModeChange, initGuidedKeyboard, resumeIfNeeded
} from '../demo/guided-mode.js';

describe('Guided Mode Controller', () => {
  beforeEach(() => {
    exitGuided();
    // Mock sessionStorage
    const store = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(key => store[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, val) => { store[key] = val; });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(key => { delete store[key]; });
  });

  describe('startArc', () => {
    it('starts a valid arc', () => {
      expect(startArc(1)).toBe(true);
      expect(isGuidedActive()).toBe(true);
    });

    it('rejects invalid arc ID', () => {
      expect(startArc(99)).toBe(false);
      expect(isGuidedActive()).toBe(false);
    });

    it('sets step index to 0', () => {
      startArc(2);
      const state = getGuidedState();
      expect(state.stepIndex).toBe(0);
    });

    it('provides arc metadata', () => {
      startArc(1);
      const state = getGuidedState();
      expect(state.arc.title).toBe('New Customer Journey');
      expect(state.totalSteps).toBe(9);
    });
  });

  describe('nextStep', () => {
    it('advances step index', () => {
      startArc(1);
      expect(nextStep()).toBe(true);
      expect(getGuidedState().stepIndex).toBe(1);
    });

    it('returns false at end of arc', () => {
      startArc(5); // 5 steps
      nextStep(); nextStep(); nextStep(); nextStep();
      expect(nextStep()).toBe(false);
      expect(getGuidedState().stepIndex).toBe(4);
    });

    it('returns false when no arc active', () => {
      expect(nextStep()).toBe(false);
    });
  });

  describe('prevStep', () => {
    it('goes back one step', () => {
      startArc(1);
      nextStep();
      nextStep();
      expect(prevStep()).toBe(true);
      expect(getGuidedState().stepIndex).toBe(1);
    });

    it('returns false at start of arc', () => {
      startArc(1);
      expect(prevStep()).toBe(false);
      expect(getGuidedState().stepIndex).toBe(0);
    });
  });

  describe('jumpToStep', () => {
    it('jumps to valid step', () => {
      startArc(1);
      expect(jumpToStep(5)).toBe(true);
      expect(getGuidedState().stepIndex).toBe(5);
    });

    it('rejects negative index', () => {
      startArc(1);
      expect(jumpToStep(-1)).toBe(false);
    });

    it('rejects index beyond arc length', () => {
      startArc(1);
      expect(jumpToStep(99)).toBe(false);
    });
  });

  describe('exitGuided', () => {
    it('deactivates guided mode', () => {
      startArc(1);
      exitGuided();
      expect(isGuidedActive()).toBe(false);
    });

    it('returns null state after exit', () => {
      startArc(1);
      exitGuided();
      expect(getGuidedState()).toBeNull();
    });
  });

  describe('onGuidedModeChange', () => {
    it('notifies on arc start', () => {
      const callback = vi.fn();
      onGuidedModeChange(callback);
      startArc(1);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        stepIndex: 0,
        totalSteps: 9
      }));
    });

    it('notifies on step change', () => {
      const callback = vi.fn();
      onGuidedModeChange(callback);
      startArc(1);
      nextStep();
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('unsubscribes correctly', () => {
      const callback = vi.fn();
      const unsub = onGuidedModeChange(callback);
      startArc(1);
      unsub();
      nextStep();
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('notifies on exit with null', () => {
      const callback = vi.fn();
      onGuidedModeChange(callback);
      startArc(1);
      exitGuided();
      expect(callback).toHaveBeenLastCalledWith(null);
    });
  });

  describe('keyboard shortcuts', () => {
    it('initializes without error', () => {
      expect(() => initGuidedKeyboard()).not.toThrow();
    });
  });
});
