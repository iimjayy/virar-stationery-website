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

  // --- Scroll-reveal observer ---
  const revealElements = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((element) => observer.observe(element));

  // --- Header shadow on scroll (rAF-throttled) ---
  const header = document.querySelector('.site-header');
  let headerScrollTicking = false;
  const updateHeaderShadow = () => {
    if (window.scrollY > 12) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }

    if (window.scrollY > 84) {
      header.classList.add('is-compact');
    } else {
      header.classList.remove('is-compact');
    }
  };

  updateHeaderShadow();
  window.addEventListener('scroll', () => {
    if (headerScrollTicking) { return; }
    headerScrollTicking = true;
    window.requestAnimationFrame(() => {
      headerScrollTicking = false;
      updateHeaderShadow();
    });
  }, { passive: true });

  // --- Hero open-status pill ---
  const setupHeroOpenStatus = () => {
    const statusPill = document.getElementById('heroOpenStatus');
    if (!statusPill) {
      return;
    }

    const statusText = statusPill.querySelector('.hero-open-text');
    if (!statusText) {
      return;
    }

    const openHour = CONFIG.hours.openHour;
    const closeHour = CONFIG.hours.closeHour;

    const formatHour = (hour24) => {
      const suffix = hour24 >= 12 ? 'pm' : 'am';
      const normalizedHour = ((hour24 + 11) % 12) + 1;
      return `${normalizedHour}${suffix}`;
    };

    const updateOpenStatus = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const openMinutes = openHour * 60;
      const closeMinutes = closeHour * 60;
      const isOpenNow = currentMinutes >= openMinutes && currentMinutes < closeMinutes;

      statusPill.classList.remove('is-loading', 'is-open', 'is-closed');

      if (isOpenNow) {
        statusPill.classList.add('is-open');
        statusText.textContent = `Open Now · Closes at ${formatHour(closeHour)}`;
      } else {
        statusPill.classList.add('is-closed');
        const isAfterClosing = currentMinutes >= closeMinutes;
        statusText.textContent = isAfterClosing
          ? `Closed Now · Opens tomorrow ${formatHour(openHour)}`
          : `Closed Now · Opens ${formatHour(openHour)}`;
      }

      statusPill.setAttribute('aria-label', statusText.textContent);
    };

    updateOpenStatus();

    const now = new Date();
    const delayToNextMinute = ((60 - now.getSeconds()) * 1000) - now.getMilliseconds();

    window.setTimeout(() => {
      updateOpenStatus();
      window.setInterval(updateOpenStatus, 60000);
    }, Math.max(400, delayToNextMinute));
  };

  setupHeroOpenStatus();

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
  const setupScrollProgressIndicator = () => {
    const progressBar = document.getElementById('scrollProgress');
    if (!progressBar) {
      return;
    }

    const updateProgress = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = documentHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / documentHeight)) : 0;
      progressBar.style.transform = `scaleX(${progress})`;
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
  };

  // =========================================================================
  // HERO TYPING LINE
  // =========================================================================
  const setupHeroTypingLine = () => {
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

  // =========================================================================
  // COUNTER ANIMATIONS
  // =========================================================================
  const setupCounterAnimations = () => {
    const counters = Array.from(document.querySelectorAll('.counter-value[data-counter-target]'));
    if (!counters.length) {
      return;
    }

    const animateCounter = (counterElement) => {
      if (counterElement.dataset.counterAnimated === 'true') {
        return;
      }

      counterElement.dataset.counterAnimated = 'true';

      const targetValue = Number(counterElement.dataset.counterTarget || 0);
      const suffix = counterElement.dataset.counterSuffix || '';
      const duration = 1500;
      const startTime = performance.now();

      const easeOutCubic = (value) => 1 - ((1 - value) ** 3);
      const formatter = (value) => {
        if (targetValue >= 1000) {
          return Math.round(value).toLocaleString('en-IN');
        }
        return String(Math.round(value));
      };

      const step = (now) => {
        const elapsed = Math.min(1, (now - startTime) / duration);
        const eased = easeOutCubic(elapsed);
        const currentValue = targetValue * eased;

        counterElement.textContent = `${formatter(currentValue)}${suffix}`;

        if (elapsed < 1) {
          window.requestAnimationFrame(step);
        } else {
          counterElement.textContent = `${formatter(targetValue)}${suffix}`;
        }
      };

      window.requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          });
        },
        {
          threshold: 0.35,
          rootMargin: '0px 0px -8% 0px'
        }
      );

      counters.forEach((counter) => counterObserver.observe(counter));
      return;
    }

    counters.forEach(animateCounter);
  };

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
  const setupImageLoadingSkeletons = () => {
    const images = document.querySelectorAll('.gallery-item img, .product-card img, .hero-image');

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

  // =========================================================================
  // TESTIMONIAL SLIDER
  // =========================================================================
  const setupTestimonialSlider = () => {
    const track = document.getElementById('testimonialsTrack');
    const previousButton = document.getElementById('testimonialsPrevBtn');
    const nextButton = document.getElementById('testimonialsNextBtn');
    const dotsContainer = document.getElementById('testimonialsDots');

    if (!track || !previousButton || !nextButton || !dotsContainer) {
      return;
    }

    const slides = Array.from(track.querySelectorAll('.testimonial-slide'));
    if (!slides.length) {
      return;
    }

    const mobileBreakpoint = window.matchMedia('(max-width: 991px)');
    let activeIndex = 0;
    let scrollTicking = false;

    dotsContainer.innerHTML = '';
    const dotButtons = slides.map((_, index) => {
      const dotButton = document.createElement('button');
      dotButton.type = 'button';
      dotButton.className = 'testimonial-slider-dot';
      dotButton.setAttribute('aria-label', `Go to testimonial ${index + 1}`);

      dotButton.addEventListener('click', () => {
        centerSlide(index, 'smooth');
      });

      dotsContainer.appendChild(dotButton);
      return dotButton;
    });

    const setActiveIndex = (index) => {
      activeIndex = Math.max(0, Math.min(slides.length - 1, index));

      dotButtons.forEach((dotButton, dotIndex) => {
        dotButton.classList.toggle('is-active', dotIndex === activeIndex);
      });

      previousButton.disabled = activeIndex === 0;
      nextButton.disabled = activeIndex === slides.length - 1;
    };

    const getNearestSlideIndex = () => {
      const viewportCenter = track.scrollLeft + (track.clientWidth / 2);

      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      slides.forEach((slide, index) => {
        const slideCenter = slide.offsetLeft + (slide.offsetWidth / 2);
        const distance = Math.abs(slideCenter - viewportCenter);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      return nearestIndex;
    };

    const centerSlide = (index, behavior = 'smooth') => {
      const slide = slides[index];
      if (!slide) {
        return;
      }

      const targetLeft = slide.offsetLeft - ((track.clientWidth - slide.offsetWidth) / 2);
      track.scrollTo({ left: Math.max(0, targetLeft), behavior });
      setActiveIndex(index);
    };

    track.addEventListener(
      'scroll',
      () => {
        if (!mobileBreakpoint.matches || scrollTicking) {
          return;
        }

        scrollTicking = true;
        window.requestAnimationFrame(() => {
          scrollTicking = false;
          setActiveIndex(getNearestSlideIndex());
        });
      },
      { passive: true }
    );

    previousButton.addEventListener('click', () => {
      centerSlide(activeIndex - 1, 'smooth');
    });

    nextButton.addEventListener('click', () => {
      centerSlide(activeIndex + 1, 'smooth');
    });

    const syncSliderState = () => {
      if (!mobileBreakpoint.matches) {
        setActiveIndex(0);
        return;
      }

      window.requestAnimationFrame(() => {
        setActiveIndex(getNearestSlideIndex());
      });
    };

    if (typeof mobileBreakpoint.addEventListener === 'function') {
      mobileBreakpoint.addEventListener('change', syncSliderState);
    } else if (typeof mobileBreakpoint.addListener === 'function') {
      mobileBreakpoint.addListener(syncSliderState);
    }

    syncSliderState();
  };

  // =========================================================================
  // FAQ ACCORDION
  // =========================================================================
  const setupFaqAccordion = () => {
    const faqItems = Array.from(document.querySelectorAll('.faq-item'));
    if (!faqItems.length) {
      return;
    }

    const setItemState = (item, isOpen) => {
      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');

      if (!question || !answer) {
        return;
      }

      item.classList.toggle('is-open', isOpen);
      question.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      answer.style.maxHeight = isOpen ? `${answer.scrollHeight}px` : '0px';
    };

    faqItems.forEach((item) => {
      const question = item.querySelector('.faq-question');
      if (!question) {
        return;
      }

      setItemState(item, false);

      question.addEventListener('click', () => {
        const shouldOpen = !item.classList.contains('is-open');

        faqItems.forEach((faqItem) => {
          setItemState(faqItem, faqItem === item ? shouldOpen : false);
        });
      });
    });

    window.addEventListener('resize', () => {
      faqItems.forEach((item) => {
        if (!item.classList.contains('is-open')) {
          return;
        }

        const answer = item.querySelector('.faq-answer');
        if (answer) {
          answer.style.maxHeight = `${answer.scrollHeight}px`;
        }
      });
    });
  };

  // =========================================================================
  // TILT EFFECTS
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
  const setupNavigationExperience = () => {
    const navLinks = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
    if (!navLinks.length) {
      return;
    }

    const navList = document.querySelector('.nav-strip .navbar-nav');
    const sectionToPrimaryLink = new Map();
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#') && !sectionToPrimaryLink.has(href)) {
        sectionToPrimaryLink.set(href, link);
      }
    });

    let activeLink = navLinks.find((link) => link.classList.contains('active')) || navLinks[0];
    let activeIndicator = null;

    const positionIndicator = () => {
      if (!navList || !activeIndicator || !activeLink) {
        return;
      }

      if (window.matchMedia('(max-width: 991px)').matches) {
        activeIndicator.style.opacity = '0';
        return;
      }

      const indicatorWidth = Math.min(58, Math.max(24, activeLink.offsetWidth - 28));
      const indicatorLeft = activeLink.offsetLeft + ((activeLink.offsetWidth - indicatorWidth) / 2);

      activeIndicator.style.width = `${indicatorWidth}px`;
      activeIndicator.style.transform = `translateX(${indicatorLeft}px)`;
      activeIndicator.style.opacity = '1';
    };

    const setActiveLink = (link) => {
      if (!link) {
        return;
      }

      activeLink = link;
      navLinks.forEach((item) => {
        item.classList.toggle('active', item === link);
      });

      window.requestAnimationFrame(positionIndicator);
    };

    if (navList) {
      navList.classList.add('has-active-indicator');
      activeIndicator = navList.querySelector('.nav-active-indicator');

      if (!activeIndicator) {
        activeIndicator = document.createElement('span');
        activeIndicator.className = 'nav-active-indicator';
        navList.appendChild(activeIndicator);
      }

      window.requestAnimationFrame(positionIndicator);
      window.addEventListener('resize', positionIndicator);
    }

    const observedSections = Array.from(sectionToPrimaryLink.keys())
      .map((href) => document.querySelector(href))
      .filter(Boolean);

    if (observedSections.length) {
      const sectionObserver = new IntersectionObserver(
        (entries) => {
          const visibleEntry = entries
            .filter((entry) => entry.isIntersecting)
            .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

          if (!visibleEntry?.target?.id) {
            return;
          }

          const matchingLink = sectionToPrimaryLink.get(`#${visibleEntry.target.id}`);
          if (matchingLink) {
            setActiveLink(matchingLink);
          }
        },
        {
          rootMargin: '-38% 0px -52% 0px',
          threshold: [0.15, 0.35, 0.6]
        }
      );

      observedSections.forEach((section) => sectionObserver.observe(section));
    }

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        setActiveLink(link);

        const navbarCollapse = document.querySelector('.navbar-collapse.show');
        if (navbarCollapse && window.bootstrap) {
          const collapseInstance = bootstrap.Collapse.getOrCreateInstance(navbarCollapse);
          collapseInstance.hide();
        }
      });
    });
  };

  // =========================================================================
  // MOBILE NAVIGATION
  // =========================================================================
  const setupMobileNavigationExperience = () => {
    const menuButton = document.querySelector('.mobile-menu-btn');
    const navbarCollapse = document.getElementById('mainNavbar');

    if (!menuButton || !navbarCollapse || !window.bootstrap) {
      return;
    }

    const desktopBreakpoint = window.matchMedia('(min-width: 992px)');
    const collapseInstance = bootstrap.Collapse.getOrCreateInstance(navbarCollapse, { toggle: false });

    const syncMenuState = () => {
      const isOpen = navbarCollapse.classList.contains('show');
      menuButton.classList.toggle('is-open', isOpen);
      menuButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.classList.toggle('mobile-nav-open', isOpen && !desktopBreakpoint.matches);
    };

    navbarCollapse.addEventListener('show.bs.collapse', () => {
      menuButton.classList.add('is-open');
      if (!desktopBreakpoint.matches) {
        document.body.classList.add('mobile-nav-open');
      }
      menuButton.setAttribute('aria-expanded', 'true');
    });

    navbarCollapse.addEventListener('hide.bs.collapse', () => {
      menuButton.classList.remove('is-open');
      document.body.classList.remove('mobile-nav-open');
      menuButton.setAttribute('aria-expanded', 'false');
    });

    navbarCollapse.addEventListener('shown.bs.collapse', syncMenuState);
    navbarCollapse.addEventListener('hidden.bs.collapse', syncMenuState);

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !navbarCollapse.classList.contains('show')) {
        return;
      }

      collapseInstance.hide();
    });

    document.addEventListener('click', (event) => {
      if (desktopBreakpoint.matches || !navbarCollapse.classList.contains('show')) {
        return;
      }

      const target = event.target;
      if (navbarCollapse.contains(target) || menuButton.contains(target)) {
        return;
      }

      collapseInstance.hide();
    });

    const handleBreakpointChange = () => {
      if (desktopBreakpoint.matches) {
        document.body.classList.remove('mobile-nav-open');
        menuButton.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
      } else {
        syncMenuState();
      }
    };

    if (typeof desktopBreakpoint.addEventListener === 'function') {
      desktopBreakpoint.addEventListener('change', handleBreakpointChange);
    } else if (typeof desktopBreakpoint.addListener === 'function') {
      desktopBreakpoint.addListener(handleBreakpointChange);
    }

    syncMenuState();
  };

  // =========================================================================
  // DESKTOP CTA RAIL VISIBILITY
  // =========================================================================
  const setupDesktopCtaRailVisibility = () => {
    const desktopCtaRail = document.querySelector('.desktop-cta-rail');
    const heroSection = document.getElementById('home') || document.querySelector('.hero-section');

    if (!desktopCtaRail || !heroSection) {
      return;
    }

    const desktopBreakpoint = window.matchMedia('(min-width: 992px)');

    const revealOffsetPx = 110;
    let railVisible = false;
    let visibilityTicking = false;

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

    const handleBreakpointChange = () => {
      queueVisibilitySync();
    };

    if (typeof desktopBreakpoint.addEventListener === 'function') {
      desktopBreakpoint.addEventListener('change', handleBreakpointChange);
    } else if (typeof desktopBreakpoint.addListener === 'function') {
      desktopBreakpoint.addListener(handleBreakpointChange);
    }
  };

  // =========================================================================
  // BACK TO TOP
  // =========================================================================
  const setupBackToTop = () => {
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

  // =========================================================================
  // GALLERY LIGHTBOX — extracted to js/features/gallery-lightbox.js
  // =========================================================================
  // initGalleryLightbox() is called via safeRun below.
  // =========================================================================
  // ADDRESS COPY
  // =========================================================================
  const setupAddressCopy = () => {
    const copyTarget = document.querySelector('[data-copy-address]');
    if (!copyTarget) {
      return;
    }

    const rawText = copyTarget.dataset.copyText || copyTarget.textContent || '';
    const copyText = rawText.replace(/\s+/g, ' ').trim();

    const fallbackCopy = (value) => {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();

      let copied = false;
      try {
        copied = document.execCommand('copy');
      } catch {
        copied = false;
      }

      document.body.removeChild(textarea);
      return copied;
    };

    const runCopyAnimation = () => {
      copyTarget.classList.add('is-copied');
      window.setTimeout(() => {
        copyTarget.classList.remove('is-copied');
      }, 700);
    };

    const handleCopy = async () => {
      if (!copyText) {
        showEnquiryToast('Address unavailable. Please copy manually.', { isError: true, duration: 2400 });
        return;
      }

      let copied = false;

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(copyText);
          copied = true;
        } catch {
          copied = false;
        }
      }

      if (!copied) {
        copied = fallbackCopy(copyText);
      }

      runCopyAnimation();
      showEnquiryToast(copied ? 'Address copied' : 'Unable to copy. Please copy manually.', {
        isError: !copied,
        duration: copied ? 1800 : 2400
      });
    };

    copyTarget.addEventListener('click', (event) => {
      event.preventDefault();
      handleCopy();
    });
  };

  // =========================================================================
  // STICKY WHATSAPP BUTTON
  // =========================================================================
  const setupStickyWhatsAppButton = () => {
    const stickyButton = document.getElementById('stickyWhatsAppBtn');
    const heroSection = document.getElementById('home') || document.querySelector('.hero-section');

    if (!stickyButton || !heroSection) {
      return;
    }

    // businessWhatsAppNumber resolved once in shared references
    const message = stickyButton.dataset.whatsappMessage || CONFIG.messages.stickyWhatsAppDefault;

    const updateLink = () => {
      stickyButton.href = buildWhatsAppUrl(businessWhatsAppNumber, message);
    };

    updateLink();

    const revealOffset = 80;
    let isVisible = false;
    let visibilityTicking = false;

    const applyVisibility = (shouldShow) => {
      if (shouldShow === isVisible) {
        return;
      }

      isVisible = shouldShow;
      stickyButton.classList.toggle('is-visible', shouldShow);
      stickyButton.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    };

    const updateVisibility = () => {
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      applyVisibility(heroBottom <= revealOffset);
    };

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

    updateVisibility();

    if ('IntersectionObserver' in window) {
      const heroObserver = new IntersectionObserver(
        () => {
          queueVisibilityUpdate();
        },
        { threshold: [0, 0.2, 0.5, 1], rootMargin: '-60px 0px 0px 0px' }
      );
      heroObserver.observe(heroSection);
    }

    window.addEventListener('scroll', queueVisibilityUpdate, { passive: true });
    window.addEventListener('resize', queueVisibilityUpdate);
  };

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
  const setupChatWidget = () => {
    const chatWidget = document.getElementById('chatWidget');
    const chatFab = document.getElementById('chatFab');
    const chatPanel = document.getElementById('chatPanel');
    const chatClose = document.getElementById('chatClose');
    const chatMessages = document.getElementById('chatMessages');
    const quickButtons = Array.from(chatPanel?.querySelectorAll('[data-quick-reply]') || []);
    const whatsappLink = chatPanel?.querySelector('[data-chat-whatsapp]');

    if (!chatWidget || !chatFab || !chatPanel || !chatClose || !chatMessages) {
      return;
    }

    // businessWhatsAppNumber resolved once in shared references
    const defaultMessage = CONFIG.messages.chatDefault;

    const syncWhatsAppLink = (message) => {
      if (!whatsappLink) {
        return;
      }

      whatsappLink.href = buildWhatsAppUrl(businessWhatsAppNumber, message || defaultMessage);
    };

    const toggleChat = (shouldOpen) => {
      chatWidget.classList.toggle('is-open', shouldOpen);
      chatPanel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
      chatFab.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');

      if (shouldOpen) {
        syncWhatsAppLink(defaultMessage);
        window.setTimeout(() => {
          chatPanel.focus();
        }, 0);
      }
    };

    const appendMessage = (text, type = 'user') => {
      const message = document.createElement('div');
      message.className = `chat-message is-${type}`;
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      message.appendChild(paragraph);
      chatMessages.appendChild(message);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const quickReplies = {
      'Send files': 'Great! Please send your files on WhatsApp so we can confirm details quickly.',
      'Check price': 'Share quantity, size, and color preferences for a fast price estimate.',
      Location: 'We are near Old Viva College, Virar West. Tap WhatsApp for directions.'
    };

    chatFab.addEventListener('click', () => {
      toggleChat(!chatWidget.classList.contains('is-open'));
    });

    chatClose.addEventListener('click', () => {
      toggleChat(false);
    });

    quickButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const reply = button.dataset.quickReply || '';
        appendMessage(reply, 'user');

        const response = quickReplies[reply] || 'We are here to help. Share your request on WhatsApp.';
        window.setTimeout(() => {
          appendMessage(response, 'agent');
        }, 260);

        syncWhatsAppLink(`Chat request: ${reply}. Please assist.`);
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && chatWidget.classList.contains('is-open')) {
        toggleChat(false);
      }
    });
  };

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
  safeRun('scroll-progress', setupScrollProgressIndicator);
  safeRun('hero-typing', setupHeroTypingLine);
  safeRun('image-skeletons', setupImageLoadingSkeletons);
  safeRun('counters', setupCounterAnimations);
  safeRun('faq', setupFaqAccordion);
  safeRun('ripples', setupRippleEffects);
  safeRun('testimonial-slider', setupTestimonialSlider);
  safeRun('tilt-effects', setupTiltEffects);
  safeRun('hero-parallax', setupHeroParallax);
  safeRun('navigation', setupNavigationExperience);
  safeRun('mobile-navigation', setupMobileNavigationExperience);
  safeRun('desktop-cta-rail', setupDesktopCtaRailVisibility);
  safeRun('back-to-top', setupBackToTop);
  safeRun('smart-search', initSmartSearch);
  safeRun('gallery-lightbox', initGalleryLightbox);
  safeRun('address-copy', setupAddressCopy);
  safeRun('sticky-whatsapp', setupStickyWhatsAppButton);
  safeRun('bulk-enquiry', setupBulkEnquiryForm);
  safeRun('pdf-downloads', setupPdfDownloads);
  safeRun('chat-widget', setupChatWidget);
  safeRun('quote-calculator', initQuoteCalculator);
  safeRun('service-availability', setupServiceAvailability);
});
