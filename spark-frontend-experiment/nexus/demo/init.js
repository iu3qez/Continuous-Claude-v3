import { resumeIfNeeded, initGuidedKeyboard } from './guided-mode.js';
import { initDemoBar } from './demo-bar.js';

export function initDemo() {
  initDemoBar();
  initGuidedKeyboard();
  // Resume guided mode if we navigated here from another step
  resumeIfNeeded();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initDemo);
}
