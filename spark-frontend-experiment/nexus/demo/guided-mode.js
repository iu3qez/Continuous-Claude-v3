/**
 * Guided Mode Controller - Manages step-by-step demo walkthroughs.
 * Navigates between pages, shows narration, highlights elements.
 */

import { getArc, DEMO_ARCS } from './arcs.js';

let currentArc = null;
let currentStepIndex = 0;
let listeners = [];

/**
 * Subscribe to guided mode state changes.
 * @param {Function} callback - Called with { arc, step, stepIndex, totalSteps }
 * @returns {Function} Unsubscribe function
 */
export function onGuidedModeChange(callback) {
  listeners.push(callback);
  return () => { listeners = listeners.filter(l => l !== callback); };
}

function notify() {
  const state = getGuidedState();
  listeners.forEach(fn => fn(state));
}

/**
 * Get current guided mode state.
 * @returns {object|null} Current state or null if not in guided mode
 */
export function getGuidedState() {
  if (!currentArc) return null;
  return {
    arc: currentArc,
    step: currentArc.steps[currentStepIndex],
    stepIndex: currentStepIndex,
    totalSteps: currentArc.steps.length,
  };
}

/**
 * Start a guided demo arc.
 * @param {number} arcId - Arc ID (1-5)
 * @returns {boolean} True if arc started successfully
 */
export function startArc(arcId) {
  const arc = getArc(arcId);
  if (!arc) return false;
  currentArc = arc;
  currentStepIndex = 0;
  notify();
  executeStep();
  return true;
}

/**
 * Advance to the next step.
 * @returns {boolean} True if advanced, false if at end
 */
export function nextStep() {
  if (!currentArc) return false;
  if (currentStepIndex >= currentArc.steps.length - 1) return false;
  currentStepIndex++;
  notify();
  executeStep();
  return true;
}

/**
 * Go back to the previous step.
 * @returns {boolean} True if went back, false if at start
 */
export function prevStep() {
  if (!currentArc) return false;
  if (currentStepIndex <= 0) return false;
  currentStepIndex--;
  notify();
  executeStep();
  return true;
}

/**
 * Jump to a specific step.
 * @param {number} index - Step index (0-based)
 * @returns {boolean} True if jumped successfully
 */
export function jumpToStep(index) {
  if (!currentArc) return false;
  if (index < 0 || index >= currentArc.steps.length) return false;
  currentStepIndex = index;
  notify();
  executeStep();
  return true;
}

/**
 * Exit guided mode and return to free explore.
 */
export function exitGuided() {
  currentArc = null;
  currentStepIndex = 0;
  removeHighlight();
  notify();
}

/**
 * Check if guided mode is active.
 * @returns {boolean}
 */
export function isGuidedActive() {
  return currentArc !== null;
}

/**
 * Execute the current step - navigate, highlight, show narration.
 */
function executeStep() {
  if (!currentArc) return;
  const step = currentArc.steps[currentStepIndex];
  if (!step) return;

  // Navigate if on different page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const targetPage = step.page.split('#')[0];

  if (currentPage !== targetPage) {
    // Store state for after navigation
    sessionStorage.setItem('guided-arc', String(currentArc.id));
    sessionStorage.setItem('guided-step', String(currentStepIndex));
    window.location.href = step.page;
    return;
  }

  // Highlight element if selector provided
  if (step.highlight) {
    highlightElement(step.highlight);
  }
}

/**
 * Highlight an element with a pulsing border.
 * @param {string} selector - CSS selector
 */
function highlightElement(selector) {
  removeHighlight();
  const el = document.querySelector(selector);
  if (!el) return;
  el.setAttribute('data-guided-highlight', 'true');
  el.style.outline = '2px solid var(--accent)';
  el.style.outlineOffset = '4px';
  el.style.transition = 'outline 0.3s ease';
}

/**
 * Remove any active highlights.
 */
function removeHighlight() {
  const highlighted = document.querySelectorAll('[data-guided-highlight]');
  highlighted.forEach(el => {
    el.removeAttribute('data-guided-highlight');
    el.style.outline = '';
    el.style.outlineOffset = '';
  });
}

/**
 * Resume guided mode after page navigation.
 * Call this on page load.
 */
export function resumeIfNeeded() {
  const arcId = sessionStorage.getItem('guided-arc');
  const stepIndex = sessionStorage.getItem('guided-step');
  if (arcId && stepIndex !== null) {
    sessionStorage.removeItem('guided-arc');
    sessionStorage.removeItem('guided-step');
    const arc = getArc(parseInt(arcId));
    if (arc) {
      currentArc = arc;
      currentStepIndex = parseInt(stepIndex);
      notify();
      executeStep();
    }
  }
}

/**
 * Set up keyboard shortcuts for guided mode.
 * Space/Right = next, Left = prev, 1-5 = jump to arc, Esc = exit
 */
export function initGuidedKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Don't capture when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    if (!isGuidedActive()) {
      // Allow starting arcs with number keys even outside guided mode
      if (e.key >= '1' && e.key <= '5') {
        startArc(parseInt(e.key));
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case ' ':
      case 'ArrowRight':
        e.preventDefault();
        nextStep();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prevStep();
        break;
      case 'Escape':
        e.preventDefault();
        exitGuided();
        break;
      default:
        if (e.key >= '1' && e.key <= '5') {
          e.preventDefault();
          startArc(parseInt(e.key));
        }
    }
  });
}
