// js/main.js
// Application orchestrator — imports feature modules and coordinates initialisation.
// Retains the production-safe runAfterReady + safeRun architecture.
// Phase 1 extracted: smart-search, gallery-lightbox, quote-calculator

import { CONFIG } from './config.js';
import { detailedServices, pdfTemplates, pricingConfig, addonRates } from './data/business-data.js';
import { escapeHtml, normalizePhoneNumber, resolveBusinessWhatsAppNumber, resolveBusinessEmail } from './utils/helpers.js';
import { ensureEnquiryToast, showEnquiryToast } from './core/toast.js';

// --- Phase 1 feature modules ---
import { initSmartSearch } from './features/smart-search.js';
import { initGalleryLightbox } from './features/gallery-lightbox.js';
import { initQuoteCalculator } from './features/quote-calculator.js';

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
import { initChatWidget } from './features/chat-widget.js';

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
  const searchForms = document.querySelectorAll('.search-box');
  const businessWhatsAppNumber = resolveBusinessWhatsAppNumber();
  const businessEmail = resolveBusinessEmail();

  const isMobileDevice = /Android|iPhone|iPad|iPod|Windows Phone|webOS|Mobile/i.test(navigator.userAgent || '');

  const buildWhatsAppUrl = (phoneNumber, enquiryMessage) => {
    const safePhone = normalizePhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(enquiryMessage || '');

    if (isMobileDevice) {
      return `https://wa.me/${safePhone}?text=${encodedMessage}`;
    }

    return `https://api.whatsapp.com/send?phone=${safePhone}&text=${encodedMessage}`;
  };

  const buildMailtoUrl = (emailAddress, subject, body) => {
    const encodedSubject = encodeURIComponent(subject || '');
    const encodedBody = encodeURIComponent(body || '');
    return `mailto:${emailAddress}?subject=${encodedSubject}&body=${encodedBody}`;
  };

  const openEnquiryChannel = (whatsAppUrl, mailtoUrl) => {
    if (isMobileDevice) {
      const currentLocation = window.location.href;
      window.location.assign(whatsAppUrl);

      window.setTimeout(() => {
        if (window.location.href === currentLocation) {
          window.location.assign(mailtoUrl);
        }
      }, 1400);

      return true;
    }

    try {
      const popup = window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
      if (popup) {
        popup.opener = null;
        return true;
      }
    } catch {
      // Ignore and continue to fallback.
    }

    window.location.assign(mailtoUrl);
    return false;
  };

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
      const selectedService = String(contactForm.querySelector('#service')?.value ?? '').trim();
      const customerMessage = String(contactForm.querySelector('#message')?.value ?? '').trim();

      return [
        'New Website Enquiry',
        '',
        `Name: ${customerName}`,
        `Service Needed: ${selectedService}`,
        `Message: ${customerMessage}`
      ].join('\n');
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
  // SERVICE INTERACTIONS (Expandable cards + slider)
  // =========================================================================
  const setupServiceInteractions = () => {
    const servicesRow = document.querySelector('#services .service-grid') || document.querySelector('#services .row.g-4');
    if (!servicesRow) {
      return;
    }

    servicesRow.classList.add('service-grid');

    const cardColumns = Array.from(servicesRow.children).filter((column) => column.querySelector('.service-card'));
    const serviceCards = cardColumns
      .map((column) => column.querySelector('.service-card'))
      .filter(Boolean);

    if (!serviceCards.length) {
      return;
    }

    const phoneHref = CONFIG.business.phoneHref;
    const phoneLabel = CONFIG.business.phoneLabel;

    const buildWhatsAppLink = (serviceName) => {
      const message = `Hi, I want details for ${serviceName}.`;
      return `https://wa.me/${phoneHref}?text=${encodeURIComponent(message)}`;
    };

    const getBadgeVariantClass = (badgeValue) => {
      const normalizedValue = String(badgeValue ?? '').toLowerCase();

      if (normalizedValue.includes('popular') || normalizedValue.includes('chosen')) {
        return 'badge-popular';
      }

      if (normalizedValue.includes('student')) {
        return 'badge-student';
      }

      if (normalizedValue.includes('bulk') || normalizedValue.includes('discount')) {
        return 'badge-bulk';
      }

      if (normalizedValue.includes('fast')) {
        return 'badge-fast';
      }

      return 'badge-default';
    };

    const renderList = (items) => {
      if (!Array.isArray(items) || !items.length) {
        return '<li>Details available on request.</li>';
      }

      return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    };

    const fallbackBadges = ['Fast Service', 'Most Popular', 'Student Favorite', 'Bulk Discount Available'];

    const defaultDetails = (title, summary, iconClass) => {
      const hash = title.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
      return {
        title,
        explanation: summary || `Reliable ${title.toLowerCase()} support for students, offices, and everyday needs.`,
        commonUses: ['Student requirements', 'Office documentation', 'Local business support'],
        startingPrice: ['Call or WhatsApp for latest rates'],
        deliveryTime: ['Usually available on the same day'],
        addOns: ['Bulk quantity support', 'Counter guidance'],
        badge: fallbackBadges[hash % fallbackBadges.length],
        priceTag: 'Ask for price',
        iconClass
      };
    };

    const getServiceDetails = (card) => {
      const titleNode = card.querySelector('h3');
      const summaryNode = card.querySelector('p');
      const iconNode = card.querySelector('.card-icon i');

      if (!titleNode) {
        return null;
      }

      const title = titleNode.textContent.trim();
      const summary = summaryNode ? summaryNode.textContent.trim() : '';
      const iconClass = iconNode ? iconNode.className : 'fa-solid fa-file-lines';
      const customDetails = detailedServices[title];

      if (!customDetails) {
        return defaultDetails(title, summary, iconClass);
      }

      return {
        title,
        explanation: customDetails.explanation || summary,
        commonUses: customDetails.commonUses || [],
        startingPrice: customDetails.startingPrice || ['Call or WhatsApp for latest rates'],
        deliveryTime: customDetails.deliveryTime || ['Usually available on the same day'],
        addOns: customDetails.addOns || [],
        badge: customDetails.badge || 'Fast Service',
        priceTag: customDetails.priceTag || 'Ask for price',
        iconClass: customDetails.iconClass || iconClass
      };
    };

    const buildDetailPanelMarkup = (details) => {
      const whatsappHref = buildWhatsAppLink(details.title);
      const badgeVariantClass = getBadgeVariantClass(details.badge);
      return `
        <div class="service-row-detail-shell">
          <button type="button" class="service-row-close" aria-label="Close service details">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
          <div class="service-row-left">
            <div class="service-detail-icon-large">
              <i class="${escapeHtml(details.iconClass)}" aria-hidden="true"></i>
            </div>
            <div>
              <h3>${escapeHtml(details.title)}</h3>
              <p class="service-detail-summary">${escapeHtml(details.explanation)}</p>
              <div class="service-detail-badges">
                <span class="service-detail-badge tag ${badgeVariantClass}">${escapeHtml(details.badge)}</span>
                <span class="service-detail-badge price">${escapeHtml(details.priceTag)}</span>
              </div>
              <h4>Common Uses</h4>
              <ul class="service-detail-list">${renderList(details.commonUses)}</ul>
            </div>
          </div>
          <div class="service-row-right">
            <div class="service-detail-block">
              <h4>Starting Price</h4>
              <ul class="service-detail-list compact">${renderList(details.startingPrice)}</ul>
            </div>
            <div class="service-detail-block">
              <h4>Delivery Time</h4>
              <ul class="service-detail-list compact">${renderList(details.deliveryTime)}</ul>
            </div>
            <div class="service-detail-block">
              <h4>Add-on Services</h4>
              <ul class="service-detail-list compact">${renderList(details.addOns)}</ul>
            </div>
            <div class="service-row-cta">
              <a class="service-cta-btn" href="${whatsappHref}" target="_blank" rel="noopener">WhatsApp Inquiry</a>
              <a class="service-cta-btn is-outline" href="tel:${phoneHref}">Call Now</a>
              <a class="service-cta-btn is-light" href="#contact">Get Quote</a>
            </div>
            <p class="service-row-contact-note">Need quick help? Call ${escapeHtml(phoneLabel)}.</p>
          </div>
        </div>
      `;
    };

    const detailColumn = document.createElement('div');
    detailColumn.className = 'col-12 service-row-detail-col';
    detailColumn.innerHTML = '<div class="service-row-detail-panel" aria-hidden="true"></div>';
    const detailPanel = detailColumn.querySelector('.service-row-detail-panel');
    let activeCard = null;
    const sliderBreakpoint = window.matchMedia('(max-width: 1199.98px)');
    let sliderUi = null;
    let sliderDotsTrack = null;
    let sliderDotButtons = [];
    let sliderPrevButton = null;
    let sliderNextButton = null;
    let sliderFocusCard = null;
    let sliderPointerStartX = null;
    let sliderWasDragged = false;
    let sliderScrollTicking = false;

    const isSliderLayout = () => servicesRow.classList.contains('service-grid--slider');

    const getServiceColumns = () =>
      Array.from(servicesRow.children).filter((column) => column.classList.contains('service-grid-col') || column.querySelector('.service-card'));

    const getRowLastColumn = (cardColumn) => {
      const serviceColumns = getServiceColumns();
      const targetTop = cardColumn.offsetTop;
      const sameRowColumns = serviceColumns.filter((column) => Math.abs(column.offsetTop - targetTop) <= 6);
      return sameRowColumns[sameRowColumns.length - 1] || cardColumn;
    };

    const placeDetailPanelAfterRow = (card) => {
      if (isSliderLayout()) {
        detailColumn.classList.add('is-slider-detail');
        const insertionAnchor = sliderUi && sliderUi.parentElement ? sliderUi : servicesRow;
        insertionAnchor.insertAdjacentElement('afterend', detailColumn);
        return;
      }

      detailColumn.classList.remove('is-slider-detail');
      const cardColumn = card.closest('.service-grid-col') || card.closest('[class*="col-"]');
      if (!cardColumn) {
        return;
      }

      const rowLastColumn = getRowLastColumn(cardColumn);
      servicesRow.insertBefore(detailColumn, rowLastColumn.nextSibling);
    };

    const setCardState = (card, isActive) => {
      card.classList.toggle('is-active', isActive);

      const cardLink = card.querySelector('.card-link');
      const label = card.querySelector('.service-link-label');

      if (label) {
        label.textContent = isActive ? 'Hide Details' : 'View Details';
      }

      if (cardLink) {
        cardLink.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      }
    };

    const closePanel = () => {
      detailPanel.classList.remove('is-open');
      detailPanel.setAttribute('aria-hidden', 'true');

      if (activeCard) {
        setCardState(activeCard, false);
        activeCard = null;
      }

      window.setTimeout(() => {
        if (!detailPanel.classList.contains('is-open') && detailColumn.parentElement) {
          detailColumn.remove();
        }
      }, 380);
    };

    const openPanelForCard = (card) => {
      const details = getServiceDetails(card);
      if (!details) {
        return;
      }

      if (activeCard && activeCard !== card) {
        setCardState(activeCard, false);
      }

      activeCard = card;
      setCardState(card, true);

      if (isSliderLayout()) {
        setSliderFocusCard(card, { syncDetails: false });
      }

      detailPanel.innerHTML = buildDetailPanelMarkup(details);
      placeDetailPanelAfterRow(card);
      detailPanel.setAttribute('aria-hidden', 'false');

      window.requestAnimationFrame(() => {
        detailPanel.classList.add('is-open');
      });

      if (isSliderLayout()) {
        centerCardInSlider(card, 'smooth');
      }
    };

    const toggleCardDetails = (card) => {
      if (activeCard === card && detailPanel.classList.contains('is-open')) {
        closePanel();
        return;
      }

      openPanelForCard(card);
    };

    const updateSliderControlsState = () => {
      if (!sliderDotButtons.length) {
        return;
      }

      sliderDotButtons.forEach((dotButton, index) => {
        const isCurrent = serviceCards[index] === sliderFocusCard;
        dotButton.classList.toggle('is-active', isCurrent);
        dotButton.setAttribute('aria-current', isCurrent ? 'true' : 'false');
      });

      const currentIndex = Math.max(0, serviceCards.indexOf(sliderFocusCard));

      if (sliderPrevButton) {
        sliderPrevButton.disabled = currentIndex <= 0;
      }

      if (sliderNextButton) {
        sliderNextButton.disabled = currentIndex >= serviceCards.length - 1;
      }
    };

    const setSliderFocusCard = (card, options = {}) => {
      if (!card || !serviceCards.includes(card)) {
        return;
      }

      const shouldSyncDetails = options.syncDetails !== false;
      sliderFocusCard = card;

      cardColumns.forEach((column, index) => {
        column.classList.toggle('is-slider-focus', serviceCards[index] === card);
      });

      updateSliderControlsState();

      if (shouldSyncDetails && detailPanel.classList.contains('is-open') && activeCard && activeCard !== card) {
        openPanelForCard(card);
      }
    };

    const getNearestCardToCenter = () => {
      const sliderCenter = servicesRow.scrollLeft + (servicesRow.clientWidth / 2);
      let nearestCard = null;
      let shortestDistance = Number.POSITIVE_INFINITY;

      cardColumns.forEach((column, index) => {
        const card = serviceCards[index];
        if (!column || !card) {
          return;
        }

        const columnCenter = column.offsetLeft + (column.offsetWidth / 2);
        const distance = Math.abs(columnCenter - sliderCenter);

        if (distance < shortestDistance) {
          shortestDistance = distance;
          nearestCard = card;
        }
      });

      return nearestCard;
    };

    const centerCardInSlider = (card, behavior = 'smooth') => {
      const cardIndex = serviceCards.indexOf(card);
      const column = cardColumns[cardIndex];

      if (cardIndex === -1 || !column) {
        return;
      }

      const targetLeft = column.offsetLeft - ((servicesRow.clientWidth - column.offsetWidth) / 2);
      servicesRow.scrollTo({
        left: Math.max(0, targetLeft),
        behavior
      });
    };

    const shiftSliderFocus = (direction) => {
      const currentIndex = Math.max(0, serviceCards.indexOf(sliderFocusCard));
      const targetIndex = Math.min(serviceCards.length - 1, Math.max(0, currentIndex + direction));
      const targetCard = serviceCards[targetIndex];

      if (!targetCard) {
        return;
      }

      setSliderFocusCard(targetCard);
      centerCardInSlider(targetCard, 'smooth');
    };

    const buildSliderUi = () => {
      if (sliderUi) {
        return;
      }

      sliderUi = document.createElement('div');
      sliderUi.className = 'service-slider-ui';
      sliderUi.innerHTML = `
        <button type="button" class="service-slider-nav service-slider-prev" aria-label="Previous service">
          <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
        </button>
        <div class="service-slider-dots" aria-label="Service slider pagination"></div>
        <button type="button" class="service-slider-nav service-slider-next" aria-label="Next service">
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </button>
      `;

      sliderPrevButton = sliderUi.querySelector('.service-slider-prev');
      sliderNextButton = sliderUi.querySelector('.service-slider-next');
      sliderDotsTrack = sliderUi.querySelector('.service-slider-dots');

      sliderDotButtons = serviceCards.map((card, index) => {
        const dotButton = document.createElement('button');
        dotButton.type = 'button';
        dotButton.className = 'service-slider-dot';

        const title = card.querySelector('h3')?.textContent?.trim() || `Service ${index + 1}`;
        dotButton.setAttribute('aria-label', `Go to ${title}`);

        dotButton.addEventListener('click', () => {
          setSliderFocusCard(card);
          centerCardInSlider(card, 'smooth');
        });

        sliderDotsTrack.appendChild(dotButton);
        return dotButton;
      });

      sliderPrevButton?.addEventListener('click', () => {
        shiftSliderFocus(-1);
      });

      sliderNextButton?.addEventListener('click', () => {
        shiftSliderFocus(1);
      });

      servicesRow.insertAdjacentElement('afterend', sliderUi);
    };

    const applySliderMode = () => {
      const sliderEnabled = sliderBreakpoint.matches;
      servicesRow.classList.toggle('service-grid--slider', sliderEnabled);

      buildSliderUi();

      if (sliderUi) {
        sliderUi.classList.toggle('is-visible', sliderEnabled);
      }

      if (sliderEnabled) {
        const focusTarget = activeCard || sliderFocusCard || serviceCards[0];
        if (focusTarget) {
          setSliderFocusCard(focusTarget, { syncDetails: false });
          centerCardInSlider(focusTarget, 'auto');
        }
      } else {
        sliderFocusCard = null;
        cardColumns.forEach((column) => {
          column.classList.remove('is-slider-focus');
        });
        updateSliderControlsState();
      }

      if (activeCard && detailPanel.classList.contains('is-open')) {
        placeDetailPanelAfterRow(activeCard);
      }
    };

    detailColumn.addEventListener('click', (event) => {
      if (event.target.closest('.service-row-close')) {
        event.preventDefault();
        closePanel();
      }
    });

    serviceCards.forEach((card, index) => {
      const cardColumn = cardColumns[index];
      if (cardColumn) {
        cardColumn.classList.add('service-grid-col');
        cardColumn.style.transitionDelay = `${(index % 4) * 60}ms`;
      }

      card.classList.add('premium-service-card');
      card.setAttribute('tabindex', '0');

      const cardLink = card.querySelector('.card-link');
      if (cardLink) {
        cardLink.setAttribute('href', '#');
        cardLink.setAttribute('role', 'button');
        cardLink.setAttribute('aria-expanded', 'false');
        cardLink.innerHTML = `
          <span class="service-link-label">View Details</span>
          <span class="service-link-meta">
            <i class="fa-solid fa-arrow-right-long service-chevron" aria-hidden="true"></i>
          </span>
        `;
      }

      card.addEventListener('click', (event) => {
        if (event.target.closest('.card-link')) {
          event.preventDefault();
        }

        if (sliderWasDragged) {
          sliderWasDragged = false;
          return;
        }

        if (event.target.closest('a') && !event.target.closest('.card-link')) {
          return;
        }

        toggleCardDetails(card);
      });

      card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }

        event.preventDefault();
        toggleCardDetails(card);
      });
    });

    servicesRow.addEventListener(
      'scroll',
      () => {
        if (!isSliderLayout()) {
          return;
        }

        if (sliderScrollTicking) {
          return;
        }

        sliderScrollTicking = true;
        window.requestAnimationFrame(() => {
          sliderScrollTicking = false;
          const nearestCard = getNearestCardToCenter();
          if (nearestCard) {
            setSliderFocusCard(nearestCard);
          }
        });
      },
      { passive: true }
    );

    const resetSliderPointerTracking = () => {
      sliderPointerStartX = null;
      window.setTimeout(() => {
        sliderWasDragged = false;
      }, 0);
    };

    servicesRow.addEventListener('pointerdown', (event) => {
      if (!isSliderLayout()) {
        return;
      }

      sliderPointerStartX = event.clientX;
      sliderWasDragged = false;
    });

    servicesRow.addEventListener('pointermove', (event) => {
      if (!isSliderLayout() || sliderPointerStartX === null) {
        return;
      }

      if (Math.abs(event.clientX - sliderPointerStartX) > 10) {
        sliderWasDragged = true;
      }
    });

    servicesRow.addEventListener('pointerup', resetSliderPointerTracking);
    servicesRow.addEventListener('pointercancel', resetSliderPointerTracking);

    if (typeof sliderBreakpoint.addEventListener === 'function') {
      sliderBreakpoint.addEventListener('change', applySliderMode);
    } else if (typeof sliderBreakpoint.addListener === 'function') {
      sliderBreakpoint.addListener(applySliderMode);
    }

    applySliderMode();

    window.addEventListener('resize', () => {
      if (isSliderLayout()) {
        const focusTarget = activeCard || sliderFocusCard || serviceCards[0];
        if (focusTarget) {
          setSliderFocusCard(focusTarget, { syncDetails: false });
          centerCardInSlider(focusTarget, 'auto');
        }
      }

      if (!activeCard || !detailPanel.classList.contains('is-open')) {
        return;
      }

      placeDetailPanelAfterRow(activeCard);
    });
  };

  setupServiceInteractions();

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
  // TILT EFFECTS
  // =========================================================================
  // TILT EFFECTS — owned by main.js (low complexity, kept for now)

  // =========================================================================
  // HERO PARALLAX
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

    const updateParallax = () => {
      const heroBounds = heroSection.getBoundingClientRect();
      const viewportHeight = Math.max(window.innerHeight, 1);
      const heroCenterOffset = (heroBounds.top + (heroBounds.height / 2)) - (viewportHeight / 2);
      const normalizedOffset = Math.max(-1, Math.min(1, heroCenterOffset / viewportHeight));
      const yOffset = normalizedOffset * -10;
      heroImageTilt.style.setProperty('--hero-parallax-y', `${yOffset.toFixed(2)}px`);
    };

    updateParallax();
    window.addEventListener('scroll', updateParallax, { passive: true });
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
  const setupBulkEnquiryForm = () => {
    const bulkForm = document.getElementById('bulkEnquiryForm');
    if (!bulkForm) {
      return;
    }

    // businessWhatsAppNumber and businessEmail resolved once in shared references
    const bulkSubject = CONFIG.messages.bulkSubject;

    const submitButton = bulkForm.querySelector('.bulk-submit-btn');
    const statusLabel = bulkForm.querySelector('#bulkFormStatus');
    const uploadZone = bulkForm.querySelector('#bulkUpload');
    const fileInput = bulkForm.querySelector('#bulkFile');
    const filePreview = bulkForm.querySelector('#bulkFilePreview');
    const shareButton = bulkForm.querySelector('#bulkShareBtn');
    const browseButton = uploadZone?.querySelector('button');

    const requiredFields = [
      bulkForm.querySelector('#bulkName'),
      bulkForm.querySelector('#bulkBusiness'),
      bulkForm.querySelector('#bulkPhone'),
      bulkForm.querySelector('#bulkService'),
      bulkForm.querySelector('#bulkQuantity'),
      bulkForm.querySelector('#bulkDescription')
    ].filter(Boolean);

    let selectedFile = null;
    let previewUrl = null;

    const setStatus = (message, options = {}) => {
      if (!statusLabel) {
        return;
      }

      statusLabel.textContent = message;
      statusLabel.classList.toggle('is-error', options.isError === true);
    };

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
        submitButton.innerHTML = '<span class="btn-spinner" aria-hidden="true"></span><span>Sending...</span>';
      } else {
        submitButton.innerHTML = submitButton.dataset.originalHtml;
      }
    };

    const formatFileSize = (size) => {
      if (!size || Number.isNaN(size)) {
        return '';
      }

      if (size < 1024) {
        return `${size} B`;
      }

      if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
      }

      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    const renderFilePreview = () => {
      if (!filePreview) {
        return;
      }

      filePreview.innerHTML = '';

      if (!selectedFile) {
        return;
      }

      const isImage = selectedFile.type.startsWith('image/');
      const fileCard = document.createElement('div');
      fileCard.className = 'bulk-file-card';

      const thumb = document.createElement('div');
      thumb.className = 'bulk-file-thumb';

      if (isImage) {
        previewUrl = URL.createObjectURL(selectedFile);
        const img = document.createElement('img');
        img.src = previewUrl;
        img.alt = 'Uploaded preview';
        thumb.appendChild(img);
      } else {
        thumb.innerHTML = '<i class="fa-solid fa-file-lines" aria-hidden="true"></i>';
      }

      const info = document.createElement('div');
      info.className = 'bulk-file-info';
      info.innerHTML = `
        <h4>${selectedFile.name}</h4>
        <p>${formatFileSize(selectedFile.size)} file ready for review</p>
      `;

      fileCard.appendChild(thumb);
      fileCard.appendChild(info);
      filePreview.appendChild(fileCard);

      if (shareButton) {
        shareButton.disabled = false;
      }
    };

    const clearFilePreview = () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
      }

      selectedFile = null;

      if (fileInput) {
        fileInput.value = '';
      }

      if (filePreview) {
        filePreview.innerHTML = '';
      }

      if (shareButton) {
        shareButton.disabled = true;
      }
    };

    const validateFile = (file) => {
      if (!file) {
        return true;
      }

      const maxSize = CONFIG.upload.maxFileSizeBytes;

      if (file.size > maxSize) {
        setStatus('File too large. Please upload files under 10MB.', { isError: true });
        return false;
      }

      if (file.type && !CONFIG.upload.allowedTypes.includes(file.type)) {
        setStatus('Unsupported file type. Upload PDF, DOC, or JPG files.', { isError: true });
        return false;
      }

      return true;
    };

    const handleFileSelection = (file) => {
      clearFilePreview();

      if (!file) {
        return;
      }

      if (!validateFile(file)) {
        return;
      }

      selectedFile = file;
      renderFilePreview();
      setStatus('File attached. We will review it shortly.', { isError: false });
    };

    if (uploadZone && fileInput) {
      uploadZone.addEventListener('click', () => {
        fileInput.click();
      });

      if (browseButton) {
        browseButton.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          fileInput.click();
        });
      }

      fileInput.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        handleFileSelection(file);
      });

      uploadZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        uploadZone.classList.add('is-dragover');
      });

      uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('is-dragover');
      });

      uploadZone.addEventListener('drop', (event) => {
        event.preventDefault();
        uploadZone.classList.remove('is-dragover');

        const file = event.dataTransfer?.files?.[0];
        if (!file) {
          return;
        }

        if (fileInput && typeof DataTransfer !== 'undefined') {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
        }

        handleFileSelection(file);
      });
    }

    if (shareButton) {
      shareButton.addEventListener('click', async () => {
        if (!selectedFile) {
          setStatus('Please select a file to share first.', { isError: true });
          return;
        }

        const shareMessage = `Bulk enquiry file: ${selectedFile.name}`;

        if (navigator.share && navigator.canShare?.({ files: [selectedFile] })) {
          try {
            await navigator.share({
              files: [selectedFile],
              title: 'Virar Stationery Bulk Enquiry',
              text: shareMessage
            });
            setStatus('Share sheet opened. Please choose WhatsApp.', { isError: false });
            return;
          } catch {
            // Continue to WhatsApp fallback.
          }
        }

        const fallbackMessage = `${shareMessage}. Please confirm the best way to send this file.`;
        const whatsAppUrl = buildWhatsAppUrl(businessWhatsAppNumber, fallbackMessage);
        window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
        setStatus('WhatsApp opened. Attach the file manually if needed.', { isError: false });
      });
    }

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
        setStatus('Please complete all required fields.', { isError: true });
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

    const buildBulkMessage = () => {
      const name = String(bulkForm.querySelector('#bulkName')?.value ?? '').trim();
      const business = String(bulkForm.querySelector('#bulkBusiness')?.value ?? '').trim();
      const phone = String(bulkForm.querySelector('#bulkPhone')?.value ?? '').trim();
      const email = String(bulkForm.querySelector('#bulkEmail')?.value ?? '').trim();
      const service = String(bulkForm.querySelector('#bulkService')?.value ?? '').trim();
      const quantity = String(bulkForm.querySelector('#bulkQuantity')?.value ?? '').trim();
      const description = String(bulkForm.querySelector('#bulkDescription')?.value ?? '').trim();

      const fileLine = selectedFile
        ? `File: ${selectedFile.name} (${formatFileSize(selectedFile.size)}) - please confirm best way to share.`
        : 'File: Not attached';

      return [
        'Bulk / Business Enquiry',
        '',
        `Name: ${name}`,
        `Business: ${business}`,
        `Phone: ${phone}`,
        `Email: ${email || 'N/A'}`,
        `Service: ${service}`,
        `Quantity: ${quantity}`,
        `Notes: ${description}`,
        fileLine
      ].join('\n');
    };

    bulkForm.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!validateRequiredFields()) {
        return;
      }

      setSubmitLoading(true);
      setStatus('Opening WhatsApp for your business enquiry...', { isError: false });

      const enquiryMessage = buildBulkMessage();
      const whatsAppUrl = buildWhatsAppUrl(businessWhatsAppNumber, enquiryMessage);
      const mailtoUrl = buildMailtoUrl(businessEmail, bulkSubject, enquiryMessage);

      window.setTimeout(() => {
        const opened = openEnquiryChannel(whatsAppUrl, mailtoUrl);
        setSubmitLoading(false);

        if (opened) {
          bulkForm.reset();
          clearFilePreview();
          requiredFields.forEach((field) => {
            field.classList.remove('is-invalid');
            field.setAttribute('aria-invalid', 'false');
          });
          setStatus('WhatsApp opened. Please send your enquiry.', { isError: false });
          showEnquiryToast('WhatsApp opened for your bulk enquiry.', { duration: 2200 });
        } else {
          setStatus('WhatsApp unavailable. Opening email fallback...', { isError: true });
          showEnquiryToast('WhatsApp unavailable. Opening email fallback...', { isError: true, duration: 2800 });
        }
      }, 450);
    });
  };

  // =========================================================================
  // PDF DOWNLOADS
  // =========================================================================
  const setupPdfDownloads = () => {
    const downloadButtons = Array.from(document.querySelectorAll('.pdf-download-btn'));
    if (!downloadButtons.length) {
      return;
    }

    let jsPdfPromise = null;

    const loadJsPdf = () => {
      if (window.jspdf?.jsPDF) {
        return Promise.resolve(window.jspdf);
      }

      if (jsPdfPromise) {
        return jsPdfPromise;
      }

      jsPdfPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
        script.async = true;
        script.onload = () => resolve(window.jspdf);
        script.onerror = () => reject(new Error('jsPDF failed to load'));
        document.head.appendChild(script);
      });

      return jsPdfPromise;
    };

    const setButtonLoading = (button, isLoading) => {
      button.classList.toggle('is-loading', isLoading);
      button.disabled = isLoading;
    };

    const buildPdf = (template) => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const marginX = 48;
      let cursorY = 64;
      const maxWidth = 520;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(template.title, marginX, cursorY);

      cursorY += 24;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(template.subtitle, marginX, cursorY);

      if (Array.isArray(template.meta)) {
        cursorY += 18;
        doc.setFontSize(10);
        doc.setTextColor(90);
        template.meta.forEach((line) => {
          doc.text(line, marginX, cursorY);
          cursorY += 14;
        });
      }

      cursorY += 12;
      doc.setDrawColor(230);
      doc.line(marginX, cursorY, marginX + maxWidth, cursorY);
      cursorY += 18;

      doc.setTextColor(20);
      doc.setFontSize(11);

      if (Array.isArray(template.sections)) {
        template.sections.forEach((section) => {
          doc.setFont('helvetica', 'bold');
          doc.text(section.title, marginX, cursorY);
          cursorY += 16;

          doc.setFont('helvetica', 'normal');
          (section.items || []).forEach((item) => {
            const wrapped = doc.splitTextToSize(`- ${item}`, maxWidth);
            doc.text(wrapped, marginX, cursorY);
            cursorY += 14 * wrapped.length;
          });

          cursorY += 8;
        });
      } else {
        template.lines.forEach((line) => {
          doc.text(line, marginX, cursorY);
          cursorY += 18;
        });
      }

      if (Array.isArray(template.footerLines)) {
        cursorY += 6;
        doc.setTextColor(90);
        doc.setFontSize(9);
        template.footerLines.forEach((line) => {
          const wrapped = doc.splitTextToSize(line, maxWidth);
          doc.text(wrapped, marginX, cursorY);
          cursorY += 12 * wrapped.length;
        });
      }

      doc.save(template.filename);
    };

    downloadButtons.forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();

        const template = pdfTemplates[button.dataset.pdfType];
        if (!template) {
          return;
        }

        setButtonLoading(button, true);
        showEnquiryToast('Preparing your PDF download...', { duration: 1600 });

        try {
          await loadJsPdf();
          buildPdf(template);
          showEnquiryToast('Download started.', { duration: 1800 });
        } catch {
          showEnquiryToast('Unable to download now. Please try again.', { isError: true, duration: 2400 });
        } finally {
          window.setTimeout(() => {
            setButtonLoading(button, false);
          }, 300);
        }
      });
    });
  };

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
  const setupServiceAvailability = () => {
    const serviceCards = Array.from(document.querySelectorAll('.service-card'));
    if (!serviceCards.length) {
      return;
    }

    const statusMap = {
      available: { label: 'Available Now', className: 'is-available' },
      busy: { label: 'Busy - Slight Delay', className: 'is-busy' },
      limited: { label: 'High Demand', className: 'is-limited' }
    };

    const limitedServices = new Set([
      'Jumbo Xerox',
      'Smart Card',
      'Visiting Card',
      'Project Printing'
    ]);

    const busyServices = new Set([
      'Color Printing',
      'Xerox / Photocopy',
      'Spiral Binding'
    ]);

    const getTimeStatus = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const openMinutes = CONFIG.hours.openHour * 60;
      const closeMinutes = CONFIG.hours.closeHour * 60;

      if (minutes < openMinutes || minutes >= closeMinutes) {
        return 'limited';
      }

      if ((minutes >= 11 * 60 && minutes <= 14 * 60) || (minutes >= 18 * 60 && minutes <= 20 * 60)) {
        return 'busy';
      }

      return 'available';
    };

    const applyStatus = () => {
      const baseStatus = getTimeStatus();

      serviceCards.forEach((card) => {
        const title = card.querySelector('h3')?.textContent?.trim() || '';
        let resolvedStatus = card.dataset.availability || 'auto';

        if (resolvedStatus === 'auto') {
          if (limitedServices.has(title)) {
            resolvedStatus = 'limited';
          } else if (busyServices.has(title)) {
            resolvedStatus = 'busy';
          } else {
            resolvedStatus = baseStatus;
          }
        }

        const statusInfo = statusMap[resolvedStatus] || statusMap.available;

        let badge = card.querySelector('.service-status-badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'service-status-badge';
          badge.innerHTML = '<span class="service-status-dot" aria-hidden="true"></span><span class="service-status-text"></span>';
          card.insertAdjacentElement('afterbegin', badge);
        }

        badge.classList.remove('is-available', 'is-busy', 'is-limited');
        badge.classList.add(statusInfo.className);
        const textEl = badge.querySelector('.service-status-text');
        if (textEl) {
          textEl.textContent = statusInfo.label;
        }
      });
    };

    applyStatus();
    window.setInterval(applyStatus, 20 * 60 * 1000);
  };

  // =========================================================================
  // FEATURE INITIALISATION — wrapped in safeRun for production resilience
  // =========================================================================

  // --- Phase 3: reveal animations (scroll-reveal, header, hero-status, skeletons, typing) ---
  safeRun('reveal-animations', initRevealAnimations);

  // --- Phase 3: navigation (scrollspy, indicator, desktop + mobile menu) ---
  safeRun('navigation', initNavigation);

  // --- Phase 3: floating actions (back-to-top + desktop CTA rail) ---
  safeRun('floating-actions', initFloatingActions);

  // --- Remaining inline features ---
  safeRun('ripples', setupRippleEffects);
  safeRun('tilt-effects', setupTiltEffects);
  safeRun('hero-parallax', setupHeroParallax);

  // --- Phase 2 modules ---
  safeRun('counters', initCounters);
  safeRun('faq', initFAQ);
  safeRun('testimonial-slider', initTestimonialSlider);
  safeRun('address-copy', initAddressCopy);
  safeRun('sticky-whatsapp', initStickyWhatsApp);

  // --- Phase 1 modules ---
  safeRun('smart-search', initSmartSearch);
  safeRun('gallery-lightbox', initGalleryLightbox);
  safeRun('quote-calculator', initQuoteCalculator);

  // --- Phase 3: chat widget ---
  safeRun('chat-widget', initChatWidget);

  // --- Still-inline complex systems (not yet extracted) ---
  safeRun('bulk-enquiry', setupBulkEnquiryForm);
  safeRun('pdf-downloads', setupPdfDownloads);
  safeRun('service-availability', setupServiceAvailability);
});
