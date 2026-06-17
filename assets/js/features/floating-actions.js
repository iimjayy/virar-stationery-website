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
// initBackToTop — back-to-top button visibility + scroll progress ring
// ---------------------------------------------------------------------------
const initBackToTop = () => {
  const backToTopButton = document.getElementById('backToTopBtn');
  if (!backToTopButton) {
    return;
  }

  // --- Scroll progress ring ---------------------------------------------------
  const progressCircle = backToTopButton.querySelector('.progress-ring-circle');
  // Full circumference = 2 * π * r  (r = 19 → ≈ 119.38)
  const circumference = progressCircle
    ? parseFloat(progressCircle.getAttribute('stroke-dasharray')) || 119.38
    : 0;

  const updateProgressRing = () => {
    if (!progressCircle) {
      return;
    }
    const docHeight = document.documentElement.scrollHeight;
    const viewHeight = window.innerHeight;
    const maxScroll = docHeight - viewHeight;
    const progress = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;
    const offset = circumference * (1 - progress);
    progressCircle.style.strokeDashoffset = offset;
  };

  // --- Smooth entrance / exit -------------------------------------------------
  let isCurrentlyVisible = false;
  let leaveTimer = null;

  const showButton = () => {
    if (isCurrentlyVisible) {
      return;
    }
    isCurrentlyVisible = true;

    // Cancel any pending leave animation
    if (leaveTimer !== null) {
      clearTimeout(leaveTimer);
      leaveTimer = null;
    }

    backToTopButton.classList.remove('is-leaving');
    backToTopButton.classList.add('is-entering');
    backToTopButton.setAttribute('aria-hidden', 'false');

    // Next frame: swap entering → visible so CSS transition kicks in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        backToTopButton.classList.remove('is-entering');
        backToTopButton.classList.add('is-visible');
      });
    });
  };

  const hideButton = () => {
    if (!isCurrentlyVisible) {
      return;
    }
    isCurrentlyVisible = false;

    backToTopButton.classList.add('is-leaving');
    backToTopButton.setAttribute('aria-hidden', 'true');

    leaveTimer = setTimeout(() => {
      backToTopButton.classList.remove('is-visible', 'is-entering', 'is-leaving');
      leaveTimer = null;
    }, 300);
  };

  // --- rAF-throttled scroll handler -------------------------------------------
  let backToTopTicking = false;

  const onScroll = () => {
    if (backToTopTicking) {
      return;
    }
    backToTopTicking = true;

    requestAnimationFrame(() => {
      backToTopTicking = false;

      const shouldShow = window.scrollY > 520;
      if (shouldShow) {
        showButton();
      } else {
        hideButton();
      }

      updateProgressRing();
    });
  };

  // Initial state
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

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
