// Page Transitions - Smooth crossfade between pages
(function() {
  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'page-transition-overlay';
  document.body.appendChild(overlay);

  // Intercept internal navigation links
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href');

    // Skip external links, anchors, javascript:, and special protocols
    if (!href || href.startsWith('#') || href.startsWith('javascript:') ||
        href.startsWith('http') || href.startsWith('mailto:') ||
        link.target === '_blank') return;

    // Skip if modifier keys held
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;

    e.preventDefault();

    // Fade out
    overlay.style.opacity = '1';

    // Navigate after fade completes
    setTimeout(() => {
      window.location.href = href;
    }, 150);
  });

  // On page load, ensure content fades in
  // The overlay starts visible briefly then fades out
  if (performance.navigation?.type === 1 || document.referrer.includes(window.location.hostname) || sessionStorage.getItem('nexus-navigating')) {
    overlay.style.opacity = '1';
    overlay.style.transition = 'none';
    requestAnimationFrame(() => {
      overlay.style.transition = 'opacity 150ms ease';
      requestAnimationFrame(() => {
        overlay.style.opacity = '0';
      });
    });
    sessionStorage.removeItem('nexus-navigating');
  }

  // Mark navigation in progress
  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('nexus-navigating', 'true');
  });
})();
