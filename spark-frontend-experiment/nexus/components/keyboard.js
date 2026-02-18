import WorkbookDemo from './state.js';

const NAV_PAGES = ['dashboard.html', 'meetings.html', 'actions.html', 'decisions.html'];
const SKIP_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

let _handler = null;

function handleKeydown(e) {
  if (SKIP_TAGS.has(e.target.tagName)) return;

  // --- Global shortcuts ---

  // Cmd+K / Ctrl+K: focus command bar
  if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    const input = document.getElementById('command-bar-input');
    if (input) input.focus();
    return;
  }

  // Cmd+1-4: navigate to page
  if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '4') {
    e.preventDefault();
    window.location.href = NAV_PAGES[Number(e.key) - 1];
    return;
  }

  // Ctrl+Shift+L: toggle live AI mode
  if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
    e.preventDefault();
    document.dispatchEvent(new CustomEvent('toggle-live-mode'));
    return;
  }

  // Ctrl+D: toggle demo control bar
  if (e.ctrlKey && e.key === 'd') {
    e.preventDefault();
    document.dispatchEvent(new CustomEvent('toggle-demo-bar'));
    return;
  }

  // --- Demo mode shortcuts (only when not free) ---
  if (WorkbookDemo.demoMode !== 'free') {
    switch (e.key) {
      case ' ':
      case 'ArrowRight':
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('demo-next'));
        return;
      case 'ArrowLeft':
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('demo-prev'));
        return;
      case 'Escape':
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('demo-exit'));
        return;
      case 'f':
      case 'F':
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen?.();
        }
        return;
      default:
        // Arc jump keys 1-5
        if (e.key >= '1' && e.key <= '5') {
          e.preventDefault();
          document.dispatchEvent(
            new CustomEvent('demo-jump-arc', { detail: { arc: Number(e.key) } })
          );
          return;
        }
    }
  }

  // Escape (global, only reached when demoMode is free)
  if (e.key === 'Escape') {
    document.dispatchEvent(new CustomEvent('dismiss-all'));
    return;
  }
}

export function initKeyboard() {
  destroyKeyboard();
  _handler = handleKeydown;
  document.addEventListener('keydown', _handler);
}

export function destroyKeyboard() {
  if (_handler) {
    document.removeEventListener('keydown', _handler);
    _handler = null;
  }
}
