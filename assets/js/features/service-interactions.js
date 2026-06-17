// js/features/service-interactions.js
// Self-contained Service Interactions feature module.
// Owns: dual-mode responsive interaction system (desktop expandable grid +
// mobile horizontal slider), detail panel, slider pagination, pointer
// tracking, and responsive mode switching.
// Dependencies: CONFIG (config.js), detailedServices (business-data.js),
//               escapeHtml + buildWhatsAppUrl (helpers.js)

import { CONFIG } from '../config.js';
import { detailedServices } from '../data/business-data.js';
import { escapeHtml, buildWhatsAppUrl } from '../utils/helpers.js';

// ---------------------------------------------------------------------------
// initServiceInteractions — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initServiceInteractions = () => {
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

  const buildServiceWhatsAppLink = (serviceName) => {
    const message = `Hi, I want details for ${serviceName}.`;
    return buildWhatsAppUrl(phoneHref, message);
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
    const whatsappHref = buildServiceWhatsAppLink(details.title);
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
  let resizeTicking = false;

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

  // rAF-throttled resize handler — prevents jank on rapid resize events.
  window.addEventListener('resize', () => {
    if (resizeTicking) {
      return;
    }

    resizeTicking = true;
    window.requestAnimationFrame(() => {
      resizeTicking = false;

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
  });
};
