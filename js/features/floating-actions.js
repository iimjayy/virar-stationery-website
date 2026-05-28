// js/features/floating-actions.js
// Self-contained Floating Actions feature module.
// Consolidates: back-to-top button + desktop CTA rail visibility.
// Both share the same scroll/resize listeners — merged into one module
// to eliminate duplicate passive scroll handlers.
// Dependencies: none (pure DOM + Web APIs)

// ---------------------------------------------------------------------------
// initFloatingActions — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initFloatingActions = () => {
  initBackToTop();
  initDesktopCtaRail();
};

// ---------------------------------------------------------------------------
// initBackToTop — back-to-top button visibility + click handler
// ---------------------------------------------------------------------------
const initBackToTop = () => {
  const backToTopButton = document.getElementById('backToTopBtn');
  if (!backToTopButton) {
    return;
  }

  const updateBackToTopVisibility = () => {
    const isVisible = window.scrollY > 520;
    backToTopButton.classList.toggle('is-visible', isVisible);
    backToTopButton.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
  };

  updateBackToTopVisibility();
  window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });

  backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
};

// ---------------------------------------------------------------------------
// initDesktopCtaRail — sticky desktop call-to-action rail that reveals
// after the hero section scrolls out of view.
// ---------------------------------------------------------------------------
const initDesktopCtaRail = () => {
  const desktopCtaRail = document.querySelector('.desktop-cta-rail');
  const heroSection =
    document.getElementById('home') || document.querySelector('.hero-section');

  if (!desktopCtaRail || !heroSection) {
    return;
  }

  const desktopBreakpoint = window.matchMedia('(min-width: 992px)');
  const revealOffsetPx = 110;
  let railVisible = false;
  let visibilityTicking = false;

  // Apply visibility — guard prevents spurious DOM writes when state unchanged.
  const applyRailVisibility = (shouldShowRail) => {
    desktopCtaRail.setAttribute('aria-hidden', shouldShowRail ? 'false' : 'true');

    if (shouldShowRail === railVisible) {
      return;
    }

    railVisible = shouldShowRail;
    desktopCtaRail.classList.toggle('is-visible', shouldShowRail);
  };

  const syncRailVisibility = () => {
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    const shouldShowRail = desktopBreakpoint.matches && heroBottom <= revealOffsetPx;
    applyRailVisibility(shouldShowRail);
  };

  // rAF-throttled queue — avoids layout thrash during fast scroll.
  const queueVisibilitySync = () => {
    if (visibilityTicking) {
      return;
    }

    visibilityTicking = true;
    window.requestAnimationFrame(() => {
      visibilityTicking = false;
      syncRailVisibility();
    });
  };

  syncRailVisibility();

  // IntersectionObserver as primary trigger — eliminates unnecessary scroll polling.
  if ('IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(
      () => {
        queueVisibilitySync();
      },
      {
        threshold: [0, 0.12, 0.25, 0.5, 0.75, 1],
        rootMargin: '-88px 0px 0px 0px'
      }
    );

    heroObserver.observe(heroSection);
  }

  window.addEventListener('scroll', queueVisibilitySync, { passive: true });
  window.addEventListener('resize', queueVisibilitySync);

  if (typeof desktopBreakpoint.addEventListener === 'function') {
    desktopBreakpoint.addEventListener('change', queueVisibilitySync);
  } else if (typeof desktopBreakpoint.addListener === 'function') {
    desktopBreakpoint.addListener(queueVisibilitySync);
  }
};
