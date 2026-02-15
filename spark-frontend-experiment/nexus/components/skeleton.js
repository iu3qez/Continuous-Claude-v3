const SKELETON_TEMPLATES = {
  card: '<div class="skeleton skeleton-card"></div>',
  metric: '<div class="skeleton skeleton-metric"></div>',
  text: '<div class="skeleton skeleton-text"></div>',
  'table-row': '<div class="skeleton skeleton-table-row"></div>',
  timeline: '<div class="skeleton skeleton-timeline"></div>',
  title: '<div class="skeleton skeleton-title"></div>',
  avatar: '<div class="skeleton skeleton-avatar"></div>',
};

/**
 * Show skeleton loading placeholders in a container.
 * Hides original content and inserts skeleton elements.
 *
 * @param {HTMLElement} container - The DOM element to show skeletons in
 * @param {string} type - Skeleton type ('card', 'metric', 'text', 'table-row', 'timeline', 'title', 'avatar')
 * @param {object} options
 * @param {number} options.count - Number of skeleton items to show (default 3)
 * @param {number} options.autoHide - Auto-remove after N ms (0 = disabled)
 */
export function showSkeleton(container, type = 'card', { count = 3, autoHide = 0 } = {}) {
  const template = SKELETON_TEMPLATES[type];
  if (!template) {
    return;
  }

  // Hide original content
  const children = Array.from(container.children);
  children.forEach((child) => {
    child.style.display = 'none';
  });

  // Create skeleton wrapper
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-skeleton-wrapper', '');

  for (let i = 0; i < count; i++) {
    wrapper.insertAdjacentHTML('beforeend', template);
  }

  container.appendChild(wrapper);

  // Auto-hide after delay
  if (autoHide > 0) {
    setTimeout(() => {
      hideSkeleton(container);
    }, autoHide);
  }
}

/**
 * Remove skeleton loading placeholders and restore original content.
 *
 * @param {HTMLElement} container - The DOM element to clear skeletons from
 */
export function hideSkeleton(container) {
  // Remove skeleton wrapper
  const wrapper = container.querySelector('[data-skeleton-wrapper]');
  if (wrapper) {
    wrapper.remove();
  }

  // Restore original content visibility
  const children = Array.from(container.children);
  children.forEach((child) => {
    if (child.style.display === 'none') {
      child.style.display = '';
    }
  });
}
