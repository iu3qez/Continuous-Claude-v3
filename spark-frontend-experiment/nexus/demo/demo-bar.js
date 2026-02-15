/**
 * Demo Control Bar - Fixed bottom bar for guided demo navigation.
 * Shows current scene, progress dots, narration text, and navigation controls.
 */

import { getGuidedState, nextStep, prevStep, exitGuided, startArc, onGuidedModeChange } from './guided-mode.js';
import { DEMO_ARCS } from './arcs.js';

let barElement = null;
let isVisible = true;

/**
 * Initialize the demo bar.
 * Creates the bar element and subscribes to guided mode changes.
 */
export function initDemoBar() {
  createBarElement();

  onGuidedModeChange((state) => {
    if (state) {
      showBar();
      updateBar(state);
    } else {
      hideBar();
    }
  });

  // Ctrl+D toggle
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      toggleVisibility();
    }
  });
}

function createBarElement() {
  barElement = document.createElement('div');
  barElement.id = 'demo-bar';
  barElement.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    height: 56px;
    background: rgba(22, 22, 24, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    display: none;
    align-items: center;
    gap: 16px;
    padding: 0 20px;
    z-index: 9999;
    min-width: 600px;
    max-width: 900px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  `;

  barElement.innerHTML = `
    <button id="demo-prev" style="background: none; border: none; color: var(--txt-tertiary); cursor: pointer; font-size: 16px; padding: 4px 8px;" title="Previous (Left Arrow)">&#9664;</button>

    <div id="demo-scene" style="color: var(--txt-secondary); font-size: 12px; font-weight: 600; white-space: nowrap; min-width: 120px; text-align: center;"></div>

    <div id="demo-dots" style="display: flex; gap: 4px; align-items: center;"></div>

    <div id="demo-step-num" style="color: var(--txt-tertiary); font-size: 11px; white-space: nowrap;"></div>

    <div style="width: 1px; height: 24px; background: var(--border);"></div>

    <div id="demo-narration" style="color: var(--txt-secondary); font-size: 13px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;"></div>

    <button id="demo-next" style="background: none; border: none; color: var(--accent); cursor: pointer; font-size: 16px; padding: 4px 8px;" title="Next (Right Arrow / Space)">&#9654;</button>

    <select id="demo-arc-select" style="background: var(--surface-dark); color: var(--txt-secondary); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 11px; padding: 2px 4px; cursor: pointer;">
      <option value="">Scene...</option>
    </select>

    <button id="demo-close" style="background: none; border: none; color: var(--txt-tertiary); cursor: pointer; font-size: 14px; padding: 4px;" title="Exit (Esc)">&#10005;</button>
  `;

  document.body.appendChild(barElement);

  // Populate arc selector
  const select = barElement.querySelector('#demo-arc-select');
  DEMO_ARCS.forEach(arc => {
    const opt = document.createElement('option');
    opt.value = arc.id;
    opt.textContent = arc.title;
    select.appendChild(opt);
  });

  // Event listeners
  barElement.querySelector('#demo-prev').addEventListener('click', () => prevStep());
  barElement.querySelector('#demo-next').addEventListener('click', () => nextStep());
  barElement.querySelector('#demo-close').addEventListener('click', () => exitGuided());
  select.addEventListener('change', (e) => {
    if (e.target.value) startArc(parseInt(e.target.value));
  });
}

function updateBar(state) {
  if (!barElement || !state) return;

  const { arc, step, stepIndex, totalSteps } = state;

  barElement.querySelector('#demo-scene').textContent = arc.title;
  barElement.querySelector('#demo-step-num').textContent = `${stepIndex + 1} / ${totalSteps}`;
  barElement.querySelector('#demo-narration').textContent = step.narration;
  barElement.querySelector('#demo-arc-select').value = arc.id;

  // Update dots
  const dotsContainer = barElement.querySelector('#demo-dots');
  dotsContainer.innerHTML = '';
  for (let i = 0; i < totalSteps; i++) {
    const dot = document.createElement('div');
    dot.style.cssText = `
      width: 6px; height: 6px; border-radius: 50%;
      background: ${i <= stepIndex ? 'var(--accent)' : 'var(--border)'};
      transition: background 0.2s;
    `;
    dotsContainer.appendChild(dot);
  }

  // Disable prev at start, highlight next at end
  barElement.querySelector('#demo-prev').style.opacity = stepIndex === 0 ? '0.3' : '1';
  barElement.querySelector('#demo-next').style.opacity = stepIndex === totalSteps - 1 ? '0.3' : '1';
}

function showBar() {
  if (barElement) barElement.style.display = 'flex';
  isVisible = true;
}

function hideBar() {
  if (barElement) barElement.style.display = 'none';
  isVisible = false;
}

/**
 * Toggle bar visibility.
 */
export function toggleVisibility() {
  if (isVisible) {
    hideBar();
    // Show mini dot
    showMiniDot();
  } else {
    showBar();
    hideMiniDot();
  }
}

let miniDot = null;

function showMiniDot() {
  if (!miniDot) {
    miniDot = document.createElement('div');
    miniDot.style.cssText = `
      position: fixed; bottom: 16px; right: 16px;
      width: 12px; height: 12px; border-radius: 50%;
      background: var(--accent); cursor: pointer; z-index: 9999;
      box-shadow: 0 0 8px rgba(79, 70, 229, 0.5);
    `;
    miniDot.addEventListener('click', () => toggleVisibility());
    document.body.appendChild(miniDot);
  }
  miniDot.style.display = 'block';
}

function hideMiniDot() {
  if (miniDot) miniDot.style.display = 'none';
}

/**
 * Check if the demo bar is visible.
 */
export function isDemoBarVisible() {
  return isVisible;
}
