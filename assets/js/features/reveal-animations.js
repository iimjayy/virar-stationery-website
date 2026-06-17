// js/features/reveal-animations.js
// Self-contained Reveal Animations feature module.
// Owns: IntersectionObserver-based scroll-reveal for .reveal elements,
// rAF-throttled scroll-progress bar, header shadow/compact transitions,
// hero-open-status pill, image skeleton loaders, and hero typing line.
// All share a single DOMContentLoaded-safe initialization path.
// Dependencies: CONFIG (for business hours in hero-open-status)

import { CONFIG } from '../config.js';

// ---------------------------------------------------------------------------
// initRevealAnimations — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initRevealAnimations = () => {
  initScrollReveal();
  initScrollProgressBar();
  initHeaderScroll();
  initHeroOpenStatus();
  initImageSkeletons();
  initHeroTypingLine();
};

// ---------------------------------------------------------------------------
// initScrollReveal — fade-in .reveal elements as they enter the viewport
// Supports child stagger (.reveal-child) and per-element data-reveal-delay.
// ---------------------------------------------------------------------------
const initScrollReveal = () => {
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * revealWithChildren — marks the element visible and staggers any
   * direct `.reveal-child` children with a 100ms cascade.
   * If reduced motion is preferred every class is applied synchronously.
   */
  const revealWithChildren = (element) => {
    element.classList.add('is-visible');

    const children = element.querySelectorAll(':scope > .reveal-child');
    if (!children.length) {
      return;
    }

    if (prefersReducedMotion) {
      children.forEach((child) => child.classList.add('is-visible'));
      return;
    }

    children.forEach((child, index) => {
      window.setTimeout(() => {
        child.classList.add('is-visible');
      }, (index + 1) * 100);
    });
  };

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealObserver.unobserve(entry.target);

          const delayAttr = entry.target.dataset.revealDelay;
          const delay = prefersReducedMotion ? 0 : parseInt(delayAttr, 10) || 0;

          if (delay > 0) {
            window.setTimeout(() => revealWithChildren(entry.target), delay);
          } else {
            revealWithChildren(entry.target);
          }
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
};

// ---------------------------------------------------------------------------
// initScrollProgressBar — thin progress bar at top of page tracks scroll depth
// ---------------------------------------------------------------------------
const initScrollProgressBar = () => {
  const progressBar = document.getElementById('scrollProgress');
  if (!progressBar) {
    return;
  }

  const updateProgress = () => {
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress =
      documentHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / documentHeight)) : 0;
    progressBar.style.transform = `scaleX(${progress})`;
  };

  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
};

// ---------------------------------------------------------------------------
// initHeaderScroll — add is-scrolled / is-compact classes to site-header
// ---------------------------------------------------------------------------
const initHeaderScroll = () => {
  const header = document.querySelector('.site-header');
  if (!header) {
    return;
  }

  let headerScrollTicking = false;

  const updateHeaderShadow = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
    header.classList.toggle('is-compact', window.scrollY > 84);
  };

  updateHeaderShadow();

  window.addEventListener(
    'scroll',
    () => {
      if (headerScrollTicking) {
        return;
      }
      headerScrollTicking = true;
      window.requestAnimationFrame(() => {
        headerScrollTicking = false;
        updateHeaderShadow();
      });
    },
    { passive: true }
  );
};

// ---------------------------------------------------------------------------
// initHeroOpenStatus — live open/closed business-hours pill in the hero
// ---------------------------------------------------------------------------
const initHeroOpenStatus = () => {
  const statusPill = document.getElementById('heroOpenStatus');
  if (!statusPill) {
    return;
  }

  const statusText = statusPill.querySelector('.hero-open-text');
  if (!statusText) {
    return;
  }

  const { openHour, closeHour } = CONFIG.hours;

  const formatHour = (hour24) => {
    const suffix = hour24 >= 12 ? 'pm' : 'am';
    const normalized = ((hour24 + 11) % 12) + 1;
    return `${normalized}${suffix}`;
  };

  const updateOpenStatus = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isOpenNow = currentMinutes >= openHour * 60 && currentMinutes < closeHour * 60;

    statusPill.classList.remove('is-loading', 'is-open', 'is-closed');

    if (isOpenNow) {
      statusPill.classList.add('is-open');
      statusText.textContent = `Open Now · Closes at ${formatHour(closeHour)}`;
    } else {
      statusPill.classList.add('is-closed');
      const isAfterClosing = currentMinutes >= closeHour * 60;
      statusText.textContent = isAfterClosing
        ? `Closed Now · Opens tomorrow ${formatHour(openHour)}`
        : `Closed Now · Opens ${formatHour(openHour)}`;
    }

    statusPill.setAttribute('aria-label', statusText.textContent);
  };

  updateOpenStatus();

  // Sync to the next minute boundary, then poll every 60 seconds.
  const now = new Date();
  const delayToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

  window.setTimeout(() => {
    updateOpenStatus();
    window.setInterval(updateOpenStatus, 60_000);
  }, Math.max(400, delayToNextMinute));
};

// ---------------------------------------------------------------------------
// initImageSkeletons — skeleton loader for gallery/product/hero images
// ---------------------------------------------------------------------------
const initImageSkeletons = () => {
  const images = document.querySelectorAll(
    '.gallery-item img, .product-card img, .hero-image'
  );

  images.forEach((image) => {
    const wrapper = image.closest('.gallery-item, .product-card, .hero-image-card');
    if (!wrapper) {
      return;
    }

    wrapper.classList.add('image-skeleton');

    const markLoaded = () => {
      wrapper.classList.add('is-loaded');
    };

    if (image.complete && image.naturalWidth > 0) {
      markLoaded();
    } else {
      image.addEventListener('load', markLoaded, { once: true });
      image.addEventListener('error', markLoaded, { once: true });
    }
  });
};

// ---------------------------------------------------------------------------
// initHeroTypingLine — typewriter animation for the hero subtitle
// ---------------------------------------------------------------------------
const initHeroTypingLine = () => {
  const typingTarget = document.getElementById('heroTypingText');
  if (!typingTarget) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phrases = [
    'Fast prints. Reliable service.',
    'WhatsApp orders in minutes.',
    'Trusted by students and offices.'
  ];

  // Respect user's motion preference — show first phrase statically.
  if (prefersReducedMotion) {
    typingTarget.textContent = phrases[0];
    return;
  }

  let phraseIndex = 0;
  let characterIndex = 0;
  let isDeleting = false;

  const tick = () => {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      characterIndex = Math.max(0, characterIndex - 1);
    } else {
      characterIndex = Math.min(currentPhrase.length, characterIndex + 1);
    }

    typingTarget.textContent = currentPhrase.slice(0, characterIndex);

    let delay = isDeleting ? 34 : 58;

    if (!isDeleting && characterIndex === currentPhrase.length) {
      delay = 1450;
      isDeleting = true;
    } else if (isDeleting && characterIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 360;
    }

    window.setTimeout(tick, delay);
  };

  tick();
};
