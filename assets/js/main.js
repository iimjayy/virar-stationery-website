// js/main.js
// Application orchestrator — imports feature modules and coordinates initialisation.
// Retains the production-safe runAfterReady + safeRun architecture.
// Phase 1 extracted: smart-search, gallery-lightbox, quote-calculator
// Phase 2 extracted: service-interactions

import { CONFIG } from './config.js';
import { escapeHtml, normalizePhoneNumber, resolveBusinessWhatsAppNumber, resolveBusinessEmail, buildWhatsAppUrl, buildMailtoUrl, openEnquiryChannel } from './utils/helpers.js';
import { ensureEnquiryToast, showEnquiryToast } from './core/toast.js';
import { captureLead } from './core/firebase.js';
import './core/prefetch.js';

// --- Phase 1 feature modules ---
import { initSmartSearch } from './features/smart-search.js';
import { initGalleryLightbox } from './features/gallery-lightbox.js';
import { initGalleryFilter } from './features/gallery-filter.js';

// --- Phase 2 feature modules ---
import { initFAQ } from './features/faq.js';
import { initCounters } from './features/counters.js';
import { initTestimonialSlider } from './features/testimonial-slider.js';
import { initAddressCopy } from './features/address-copy.js';
import { initStickyWhatsApp } from './features/sticky-whatsapp.js';

// --- Phase 3 feature modules ---
import { initNavigation } from './features/navigation.js';
import { initFloatingActions } from './features/floating-actions.js';
import { initRevealAnimations } from './features/reveal-animations.js';

// --- Phase 5 feature modules ---
import { initServiceAvailability } from './features/service-availability.js';
import { initAnalytics } from './features/analytics.js';
import { initGoogleAnalytics } from './features/google-analytics.js';
import { initLazyGoogleMap } from './features/lazy-google-map.js';
import { initReviewPrompt } from './features/review-prompt.js';

// --- Phase 2 extraction: service interactions ---
import { initServiceInteractions } from './features/service-interactions.js';

// --- Business Engine modules (June 2026) ---
import { initOrderStatus } from './features/order-status.js';
import { initThemeToggle } from './features/theme-toggle.js';
import { initSocialProof } from './features/social-proof.js';
// language-toggle.js (339KB) is lazy-loaded on user interaction below

// ---------------------------------------------------------------------------
// runAfterReady — retained exactly as the original for production safety
// ---------------------------------------------------------------------------
const runAfterReady = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
};

runAfterReady(() => {
  // --- Toast bootstrap (must run before any feature that calls showEnquiryToast) ---
  ensureEnquiryToast();

  // Reveal animations, header scroll, hero open-status, image skeletons and
  // hero typing line are all owned by js/features/reveal-animations.js
  // and initialised via safeRun below.

  // --- Shared references (resolved once, used by all features) ---
  // Header scroll classes now owned by js/features/reveal-animations.js

  // Hero open-status is owned by js/features/reveal-animations.js

  // --- Shared references (resolved once, used by all features) ---
  const contactForm = document.getElementById('contactForm');
  const businessWhatsAppNumber = resolveBusinessWhatsAppNumber();
  const businessEmail = resolveBusinessEmail();

  // buildWhatsAppUrl, buildMailtoUrl, openEnquiryChannel imported from helpers.js

  // --- Diagnostics & safeRun ---
  const initDiagnostics = { hasError: false };

  const reportInitError = (error) => {
    if (initDiagnostics.hasError) {
      return;
    }

    initDiagnostics.hasError = true;
    console.error('Interactive features failed to load:', error);
    showEnquiryToast('Some interactive features failed. Refresh the page.', {
      isError: true,
      duration: 2800
    });
  };

  const safeRun = (label, callback) => {
    try {
      callback();
    } catch (error) {
      reportInitError(error);
      console.error(`Init step failed: ${label}`, error);
    }
  };

  window.addEventListener('error', (event) => {
    if (event?.error) {
      reportInitError(event.error);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (event?.reason) {
      reportInitError(event.reason);
    }
  });

  // =========================================================================
  // CONTACT FORM
  // =========================================================================
  if (contactForm) {
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const requiredFields = [
      contactForm.querySelector('#name'),
      contactForm.querySelector('#service'),
      contactForm.querySelector('#message')
    ].filter(Boolean);

    const enquirySubject = CONFIG.messages.enquirySubject;

    const setSubmitLoading = (isLoading) => {
      if (!submitButton) {
        return;
      }

      if (!submitButton.dataset.originalHtml) {
        submitButton.dataset.originalHtml = submitButton.innerHTML;
      }

      submitButton.disabled = isLoading;
      submitButton.classList.toggle('is-loading', isLoading);
      submitButton.setAttribute('aria-busy', isLoading ? 'true' : 'false');

      if (isLoading) {
        submitButton.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span><span>Opening WhatsApp...</span>';
      } else {
        submitButton.innerHTML = submitButton.dataset.originalHtml;
      }
    };

    const validateRequiredFields = () => {
      let firstInvalidField = null;

      requiredFields.forEach((field) => {
        const rawValue = String(field.value ?? '');
        let hasValue = field.tagName === 'SELECT' ? rawValue !== '' : rawValue.trim() !== '';

        if (field.type === 'number') {
          const numericValue = Number(rawValue);
          hasValue = Number.isFinite(numericValue) && numericValue > 0;
        }

        field.classList.toggle('is-invalid', !hasValue);
        field.setAttribute('aria-invalid', hasValue ? 'false' : 'true');

        if (!hasValue && !firstInvalidField) {
          firstInvalidField = field;
        }
      });

      if (firstInvalidField) {
        firstInvalidField.focus();
        showEnquiryToast('Please complete all required fields.', { isError: true, duration: 2300 });
        return false;
      }

      return true;
    };

    requiredFields.forEach((field) => {
      const clearErrorState = () => {
        const rawValue = String(field.value ?? '');
        let hasValue = field.tagName === 'SELECT' ? rawValue !== '' : rawValue.trim() !== '';

        if (field.type === 'number') {
          const numericValue = Number(rawValue);
          hasValue = Number.isFinite(numericValue) && numericValue > 0;
        }

        if (hasValue) {
          field.classList.remove('is-invalid');
          field.setAttribute('aria-invalid', 'false');
        }
      };

      field.addEventListener('input', clearErrorState);
      field.addEventListener('change', clearErrorState);
    });

    const buildEnquiryMessage = () => {
      const customerName = String(contactForm.querySelector('#name')?.value ?? '').trim();
      const customerPhone = String(contactForm.querySelector('#phone')?.value ?? '').trim();
      const selectedService = String(contactForm.querySelector('#service')?.value ?? '').trim();
      const customerMessage = String(contactForm.querySelector('#message')?.value ?? '').trim();

      const lines = [
        'New Website Enquiry',
        '',
        `Name: ${customerName}`
      ];
      if (customerPhone) {
        lines.push(`Phone: ${customerPhone}`);
      }
      lines.push(`Service Needed: ${selectedService}`);
      lines.push(`Message: ${customerMessage}`);
      return lines.join('\n');
    };


    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!validateRequiredFields()) {
        return;
      }

      setSubmitLoading(true);
      showEnquiryToast('Opening WhatsApp...', { duration: 1800 });

      const enquiryMessage = buildEnquiryMessage();
      const whatsAppUrl = buildWhatsAppUrl(businessWhatsAppNumber, enquiryMessage);
      const mailtoUrl = buildMailtoUrl(businessEmail, enquirySubject, enquiryMessage);

      // Persist the lead to Firestore (best-effort, non-blocking — WhatsApp
      // remains the primary channel and always opens regardless of this).
      captureLead('contact', {
        name: String(contactForm.querySelector('#name')?.value ?? '').trim(),
        phone: String(contactForm.querySelector('#phone')?.value ?? '').trim(),
        service: String(contactForm.querySelector('#service')?.value ?? '').trim(),
        message: String(contactForm.querySelector('#message')?.value ?? '').trim(),
      });

      window.setTimeout(() => {
        const openedWhatsApp = openEnquiryChannel(whatsAppUrl, mailtoUrl);

        setSubmitLoading(false);

        if (openedWhatsApp) {
          contactForm.reset();
          requiredFields.forEach((field) => {
            field.classList.remove('is-invalid');
            field.setAttribute('aria-invalid', 'false');
          });
          showEnquiryToast('WhatsApp opened. Please send your enquiry.', { duration: 2200 });
        } else {
          showEnquiryToast('WhatsApp unavailable. Opening email fallback...', { isError: true, duration: 2800 });
        }
      }, 500);
    });
  }

  // =========================================================================
  // SERVICE INTERACTIONS — extracted to js/features/service-interactions.js
  // =========================================================================

  // =========================================================================
  // SCROLL PROGRESS INDICATOR
  // =========================================================================
  // SCROLL PROGRESS INDICATOR — extracted to js/features/reveal-animations.js

  // =========================================================================
  // HERO TYPING LINE
  // =========================================================================
  // HERO TYPING LINE — extracted to js/features/reveal-animations.js

  // =========================================================================
  // COUNTER ANIMATIONS
  // =========================================================================
  // COUNTER ANIMATIONS — extracted to js/features/counters.js

  // =========================================================================
  // RIPPLE EFFECTS
  // =========================================================================
  const setupRippleEffects = () => {
    const rippleTargets = document.querySelectorAll(
      '.cta-btn, .service-cta-btn, .map-directions-btn, .action-btn, .mobile-bottom-bar a, .testimonial-nav-btn, .faq-question, .quick-convert-actions a, .pdf-download-btn, .bulk-submit-btn, .chat-fab, .chat-quick-btn, .quote-cta-btn'
    );

    rippleTargets.forEach((target) => {
      target.classList.add('ripple-surface');

      target.addEventListener('pointerdown', (event) => {
        const targetBounds = target.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple-dot';
        ripple.style.left = `${event.clientX - targetBounds.left}px`;
        ripple.style.top = `${event.clientY - targetBounds.top}px`;

        target.appendChild(ripple);

        ripple.addEventListener('animationend', () => {
          ripple.remove();
        });
      });
    });
  };

  // =========================================================================
  // IMAGE LOADING SKELETONS
  // =========================================================================
  // IMAGE LOADING SKELETONS — extracted to js/features/reveal-animations.js

  // =========================================================================
  // TESTIMONIAL SLIDER
  // =========================================================================
  // TESTIMONIAL SLIDER — extracted to js/features/testimonial-slider.js

  // =========================================================================
  // FAQ ACCORDION
  // =========================================================================
  // FAQ ACCORDION — extracted to js/features/faq.js

  // =========================================================================
  // TILT EFFECTS — restored (was accidentally lost during Phase 1 extraction)
  // =========================================================================
  const setupTiltEffects = () => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const tiltTargets = document.querySelectorAll('.tilt-target');
    tiltTargets.forEach((target) => {
      const resetTilt = () => {
        target.style.setProperty('--tilt-rotate-x', '0deg');
        target.style.setProperty('--tilt-rotate-y', '0deg');
      };

      target.addEventListener('pointermove', (event) => {
        const bounds = target.getBoundingClientRect();
        if (!bounds.width || !bounds.height) {
          return;
        }

        const relativeX = (event.clientX - bounds.left) / bounds.width;
        const relativeY = (event.clientY - bounds.top) / bounds.height;

        const rotateY = (relativeX - 0.5) * 8;
        const rotateX = (0.5 - relativeY) * 7;

        target.style.setProperty('--tilt-rotate-x', `${rotateX.toFixed(2)}deg`);
        target.style.setProperty('--tilt-rotate-y', `${rotateY.toFixed(2)}deg`);
      });

      target.addEventListener('pointerleave', resetTilt);
      target.addEventListener('pointercancel', resetTilt);
      target.addEventListener('blur', resetTilt);
    });
  };

  // =========================================================================
  // HERO PARALLAX — rAF-throttled scroll for mobile performance
  // =========================================================================
  const setupHeroParallax = () => {
    const heroSection = document.querySelector('.hero-section');
    const heroImageTilt = document.querySelector('.hero-image-tilt');
    if (!heroSection || !heroImageTilt) {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      heroImageTilt.style.setProperty('--hero-parallax-y', '0px');
      return;
    }

    let parallaxTicking = false;

    const updateParallax = () => {
      const heroBounds = heroSection.getBoundingClientRect();
      const viewportHeight = Math.max(window.innerHeight, 1);
      const heroCenterOffset = (heroBounds.top + (heroBounds.height / 2)) - (viewportHeight / 2);
      const normalizedOffset = Math.max(-1, Math.min(1, heroCenterOffset / viewportHeight));
      const yOffset = normalizedOffset * -10;
      heroImageTilt.style.setProperty('--hero-parallax-y', `${yOffset.toFixed(2)}px`);
    };

    const queueParallaxUpdate = () => {
      if (parallaxTicking) {
        return;
      }

      parallaxTicking = true;
      window.requestAnimationFrame(() => {
        parallaxTicking = false;
        updateParallax();
      });
    };

    updateParallax();
    window.addEventListener('scroll', queueParallaxUpdate, { passive: true });
    window.addEventListener('resize', updateParallax);
  };

  // =========================================================================
  // NAVIGATION EXPERIENCE
  // =========================================================================
  // NAVIGATION EXPERIENCE — extracted to js/features/navigation.js

  // =========================================================================
  // MOBILE NAVIGATION
  // =========================================================================
  // MOBILE NAVIGATION — extracted to js/features/navigation.js

  // =========================================================================
  // DESKTOP CTA RAIL VISIBILITY
  // =========================================================================
  // DESKTOP CTA RAIL — extracted to js/features/floating-actions.js

  // =========================================================================
  // BACK TO TOP
  // =========================================================================
  // BACK TO TOP — extracted to js/features/floating-actions.js

  // =========================================================================
  // GALLERY LIGHTBOX — extracted to js/features/gallery-lightbox.js
  // =========================================================================
  // initGalleryLightbox() is called via safeRun below.
  // =========================================================================
  // ADDRESS COPY
  // =========================================================================
  // ADDRESS COPY — extracted to js/features/address-copy.js

  // =========================================================================
  // STICKY WHATSAPP BUTTON
  // =========================================================================
  // STICKY WHATSAPP — extracted to js/features/sticky-whatsapp.js

  // =========================================================================
  // BULK ENQUIRY FORM
  // =========================================================================
  // BULK ENQUIRY FORM — extracted to js/features/bulk-enquiry.js

  // =========================================================================
  // PDF DOWNLOADS
  // =========================================================================
  // PDF DOWNLOADS — extracted to js/features/pdf-downloads.js

  // =========================================================================
  // CHAT WIDGET
  // =========================================================================
  // CHAT WIDGET — extracted to js/features/chat-widget.js

  // =========================================================================
  // QUOTE CALCULATOR — extracted to js/features/quote-calculator.js
  // =========================================================================
  // initQuoteCalculator() is called via safeRun below.
  // =========================================================================
  // SERVICE AVAILABILITY BADGES
  // =========================================================================
  // SERVICE AVAILABILITY — extracted to js/features/service-availability.js

  // =========================================================================
  // FEATURE INITIALISATION — wrapped in safeRun for production resilience
  // =========================================================================

  // Phase 3: reveal system (scroll-reveal, header, hero open-status, skeletons, typing)
  safeRun('reveal-animations', initRevealAnimations);

  // Phase 3: navigation (scrollspy, active indicator, desktop + mobile menu)
  safeRun('navigation', initNavigation);

  // Phase 3: floating actions (back-to-top + desktop CTA rail)
  safeRun('floating-actions', initFloatingActions);

  // Remaining inline micro-features (deferred; low complexity)
  safeRun('ripples', setupRippleEffects);
  safeRun('tilt-effects', setupTiltEffects);
  safeRun('hero-parallax', setupHeroParallax);

  // Phase 2 modules
  safeRun('counters', initCounters);
  safeRun('faq', initFAQ);
  safeRun('testimonial-slider', initTestimonialSlider);
  safeRun('address-copy', initAddressCopy);
  safeRun('sticky-whatsapp', initStickyWhatsApp);

  // Phase 1 modules
  safeRun('smart-search', initSmartSearch);
  safeRun('gallery-lightbox', initGalleryLightbox);
  safeRun('gallery-filter', initGalleryFilter);

  // Phase 3 + 5 interaction systems — lazy-load heavy modules
  safeRun('chat-widget', () => {
    import('./features/chat-widget.js').then(m => m.initChatWidget()).catch(e => console.error('chat-widget lazy load failed:', e));
  });
  safeRun('bulk-enquiry', () => {
    import('./features/bulk-enquiry.js').then(m => m.initBulkEnquiry()).catch(e => console.error('bulk-enquiry lazy load failed:', e));
  });
  safeRun('pdf-downloads', () => {
    import('./features/pdf-downloads.js').then(m => m.initPdfDownloads()).catch(e => console.error('pdf-downloads lazy load failed:', e));
  });
  safeRun('service-availability', initServiceAvailability);
  safeRun('google-analytics', initGoogleAnalytics);
  safeRun('analytics', initAnalytics);
  safeRun('lazy-google-map', initLazyGoogleMap);
  safeRun('review-prompt', initReviewPrompt);

  // Phase 2 extraction: service interactions (detail panels + mobile slider)
  safeRun('service-interactions', initServiceInteractions);

  // Business Engine modules (June 2026)
  safeRun('order-status', initOrderStatus);
  safeRun('theme-toggle', initThemeToggle);
  safeRun('social-proof', initSocialProof);

  // Language toggle (339KB) — lazy-loaded on first user interaction
  safeRun('language-toggle', () => {
    import('./features/language-toggle.js').then(m => m.initLanguageToggle()).catch(e => console.error('language-toggle lazy load failed:', e));
  });

  // Quote calculator — lazy-loaded (below the fold)
  safeRun('quote-calculator', () => {
    import('./features/quote-calculator.js').then(m => m.initQuoteCalculator()).catch(e => console.error('quote-calculator lazy load failed:', e));
  });
});
