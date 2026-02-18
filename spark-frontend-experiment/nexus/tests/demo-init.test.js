import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the imports before any imports
vi.mock('../demo/guided-mode.js', () => ({
  resumeIfNeeded: vi.fn(),
  initGuidedKeyboard: vi.fn()
}));

vi.mock('../demo/demo-bar.js', () => ({
  initDemoBar: vi.fn()
}));

describe('demo/init.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('exports initDemo function', async () => {
    const { initDemo } = await import('../demo/init.js');
    expect(typeof initDemo).toBe('function');
  });

  it('initDemo calls all 3 initialization functions', async () => {
    const { resumeIfNeeded, initGuidedKeyboard } = await import('../demo/guided-mode.js');
    const { initDemoBar } = await import('../demo/demo-bar.js');
    const { initDemo } = await import('../demo/init.js');

    initDemo();

    expect(initDemoBar).toHaveBeenCalled();
    expect(initGuidedKeyboard).toHaveBeenCalled();
    expect(resumeIfNeeded).toHaveBeenCalled();
  });

  it('initDemo can be called multiple times safely', async () => {
    const { initDemoBar } = await import('../demo/demo-bar.js');
    const { initDemo } = await import('../demo/init.js');

    initDemo();
    initDemo();

    expect(initDemoBar).toHaveBeenCalledTimes(2);
  });

  it('registers DOMContentLoaded listener', async () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    await import('../demo/init.js');

    const dcl = addSpy.mock.calls.find(c => c[0] === 'DOMContentLoaded');
    expect(dcl).toBeTruthy();

    addSpy.mockRestore();
  });
});
