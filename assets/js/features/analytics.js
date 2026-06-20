// js/features/analytics.js
// Lightweight GA4-compatible click tracking for high-intent website actions.

export const trackEvent = (eventName, eventCategory, eventLabel) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      event_category: eventCategory,
      event_label: eventLabel
    });
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(['event', eventName, {
      event_category: eventCategory,
      event_label: eventLabel
    }]);
  }
};

const getLabel = (element, fallback) => {
  const ariaLabel = element.getAttribute('aria-label');
  const text = element.textContent?.replace(/\s+/g, ' ').trim();
  return ariaLabel || text || fallback;
};

const bindClickTracking = (selector, eventName, eventCategory, fallbackLabel) => {
  document.querySelectorAll(selector).forEach((element) => {
    element.addEventListener('click', () => {
      trackEvent(eventName, eventCategory, getLabel(element, fallbackLabel));
    });
  });
};

export const initAnalytics = () => {
  bindClickTracking(
    '.whatsapp-btn, #quoteWhatsAppBtn, a[href*="wa.me"], a[href*="api.whatsapp.com"]',
    'whatsapp_inquiry',
    'WhatsApp Inquiry',
    'WhatsApp Inquiry'
  );

  const quoteCalculator = document.getElementById('quoteCalculator');
  if (quoteCalculator) {
    quoteCalculator.addEventListener('input', () => {
      trackEvent('quote_calculated', 'Quote Calculated', 'Live Quote Updated');
    });

    quoteCalculator.addEventListener('change', () => {
      trackEvent('quote_calculated', 'Quote Calculated', 'Quote Option Changed');
    });
  }

  bindClickTracking(
    '.nav-link, [data-nav-target]',
    'navigation_click',
    'Navigation',
    'Navigation Click'
  );

  bindClickTracking(
    '.service-card, .price-card, [data-service-id]',
    'service_card_click',
    'Service Interest',
    'Service Card'
  );

  // --- NEW EXHAUSTIVE TRACKING ---

  // Track Gallery Image Views
  bindClickTracking(
    '.gallery-item, .gallery-link, [data-gallery]',
    'gallery_image_view',
    'Gallery Interaction',
    'Viewed Gallery Image'
  );

  // Track FAQ Reads
  bindClickTracking(
    '.accordion-button, .faq-question',
    'faq_interaction',
    'FAQ Read',
    'Opened FAQ'
  );

  // Track Language Changes
  bindClickTracking(
    '.language-btn, .lang-toggle, [data-lang]',
    'language_change',
    'Localization',
    'Changed Language'
  );

  // Track Address Copies (High Intent to Visit)
  bindClickTracking(
    '#copyAddressBtn, .copy-btn, .address-card',
    'address_copy',
    'Location Interest',
    'Copied Address'
  );

  // Track Footer Links (Legal, Maps, Contact)
  bindClickTracking(
    'footer a',
    'footer_link_click',
    'Footer Interaction',
    'Footer Link'
  );

  // Track Search Usage (Stationery & Main Site)
  const bindSearchTracking = (inputId, eventName) => {
    const input = document.getElementById(inputId);
    if (input) {
      let timeout = null;
      input.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (input.value.trim().length > 2) {
            trackEvent(eventName, 'Search', input.value.trim());
          }
        }, 1500); // Only track after they stop typing for 1.5s
      });
    }
  };

  bindSearchTracking('stationerySearchInput', 'stationery_search');
  
  const siteSearch = document.querySelector('#siteSearch input, .search-box input');
  if (siteSearch) {
    bindSearchTracking(siteSearch.id || 'mainSearch', 'site_search');
  }

  // Track PDF Upload Intent
  bindClickTracking(
    '#quotePdfDrop',
    'pdf_upload_intent',
    'Quote Calculated',
    'Clicked/Dropped PDF Zone'
  );
};
