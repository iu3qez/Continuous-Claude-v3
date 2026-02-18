/**
 * Detail Drawer Component
 * A slide-in panel from the right side of the screen.
 */

// Track open state per drawer via a WeakSet
const openDrawers = new WeakSet();

// Track escape key listeners per drawer so we can clean up
const escapeHandlers = new WeakMap();

export function createDrawer({ title = '', width = 400 } = {}) {
  const drawer = document.createElement('div');
  drawer.className = 'detail-drawer';
  drawer.style.cssText = [
    'position:fixed',
    'top:0',
    'right:0',
    'bottom:0',
    `width:${width}px`,
    "background:var(--surface-elevated,#1C1C1F)",
    "border-left:1px solid var(--border,#232326)",
    'transform:translateX(100%)',
    'transition:transform 0.3s ease',
    'z-index:900',
    'display:flex',
    'flex-direction:column',
  ].join(';') + ';';

  // Header
  const header = document.createElement('div');
  header.className = 'drawer-header';
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border,#232326);';

  const titleEl = document.createElement('h2');
  titleEl.className = 'drawer-title';
  titleEl.textContent = title;
  titleEl.style.cssText = 'margin:0;font-size:18px;font-weight:600;';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'drawer-close';
  closeBtn.textContent = '\u00D7';
  closeBtn.style.cssText = 'background:none;border:none;font-size:24px;cursor:pointer;color:inherit;padding:0 4px;';
  closeBtn.addEventListener('click', () => {
    closeDrawer(drawer);
  });

  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  // Content area
  const content = document.createElement('div');
  content.className = 'drawer-content';
  content.style.cssText = 'flex:1;overflow-y:auto;padding:20px;';

  drawer.appendChild(header);
  drawer.appendChild(content);

  return drawer;
}

export function openDrawer(drawer) {
  drawer.style.transform = 'translateX(0)';
  openDrawers.add(drawer);

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'drawer-backdrop';
  backdrop.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);z-index:899;';
  backdrop.addEventListener('click', () => {
    closeDrawer(drawer);
  });
  document.body.appendChild(backdrop);

  // Escape key handler
  const onEscape = (e) => {
    if (e.key === 'Escape') {
      closeDrawer(drawer);
    }
  };
  escapeHandlers.set(drawer, onEscape);
  document.addEventListener('keydown', onEscape);
}

export function closeDrawer(drawer) {
  drawer.style.transform = 'translateX(100%)';
  openDrawers.delete(drawer);

  // Remove backdrop
  const backdrop = document.querySelector('.drawer-backdrop');
  if (backdrop) {
    backdrop.remove();
  }

  // Remove escape handler
  const onEscape = escapeHandlers.get(drawer);
  if (onEscape) {
    document.removeEventListener('keydown', onEscape);
    escapeHandlers.delete(drawer);
  }
}

export function setDrawerContent(drawer, content) {
  const contentEl = drawer.querySelector('.drawer-content');
  if (contentEl) {
    contentEl.innerHTML = content;
  }
}

export function setDrawerTitle(drawer, title) {
  const titleEl = drawer.querySelector('.drawer-title');
  if (titleEl) {
    titleEl.textContent = title;
  }
}

export function isDrawerOpen(drawer) {
  return openDrawers.has(drawer);
}
