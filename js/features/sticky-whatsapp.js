// js/features/sticky-whatsapp.js
// Self-contained Sticky WhatsApp Button feature module.
// Owns visibility toggling (hero-exit reveal), IntersectionObserver, rAF throttle,
// and WhatsApp URL construction.
// Dependencies: CONFIG (config.js), buildWhatsAppUrl, resolveBusinessWhatsAppNumber (helpers.js)

import { CONFIG } from '../config.js';
import { buildWhatsAppUrl, resolveBusinessWhatsAppNumber } from '../utils/helpers.js';

// ---------------------------------------------------------------------------
// initStickyWhatsApp — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initStickyWhatsApp = () => {
  const stickyButton = document.getElementById('stickyWhatsAppBtn');
  const heroSection =
    document.getElementById('home') || document.querySelector('.hero-section');

  if (!stickyButton || !heroSection) {
    return;
  }

  // Resolve phone number from the page's own WhatsApp links (same pattern as
  // main.js shared references), falling back to CONFIG.
  const whatsAppNumber = resolveBusinessWhatsAppNumber();
  const message =
    stickyButton.dataset.whatsappMessage || CONFIG.messages.stickyWhatsAppDefault;

  // Set the button's href once upfront.
  stickyButton.href = buildWhatsAppUrl(whatsAppNumber, message);

  const revealOffset = 80;
  let isVisible = false;
  let visibilityTicking = false;

  // Apply visibility state only when it actually changes — avoids needless DOM writes.
  const applyVisibility = (shouldShow) => {
    if (shouldShow === isVisible) {
      return;
    }

    isVisible = shouldShow;
    stickyButton.classList.toggle('is-visible', shouldShow);
    stickyButton.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
  };

  // Show the button once the hero section bottom has scrolled above the threshold.
  const updateVisibility = () => {
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    applyVisibility(heroBottom <= revealOffset);
  };

  // rAF-throttled wrapper to keep scroll handling smooth on low-end devices.
  const queueVisibilityUpdate = () => {
    if (visibilityTicking) {
      return;
    }

    visibilityTicking = true;
    window.requestAnimationFrame(() => {
      visibilityTicking = false;
      updateVisibility();
    });
  };

  // Run once immediately so the button starts in the correct state.
  updateVisibility();

  // IntersectionObserver triggers when the hero enters/leaves the viewport —
  // eliminates the need for continuous scroll polling.
  if ('IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(
      () => {
        queueVisibilityUpdate();
      },
      { threshold: [0, 0.2, 0.5, 1], rootMargin: '-60px 0px 0px 0px' }
    );
    heroObserver.observe(heroSection);
  }

  // Scroll + resize listeners as belt-and-suspenders for edge cases
  // (e.g. programmatic scroll, orientaion change, browser toolbar appear/disappear).
  window.addEventListener('scroll', queueVisibilityUpdate, { passive: true });
  window.addEventListener('resize', queueVisibilityUpdate);
};
