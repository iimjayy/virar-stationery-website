// js/features/analytics.js
// Lightweight GA4-compatible click tracking for high-intent website actions.

export const trackEvent = (eventName, eventCategory, eventLabel) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    event_category: eventCategory,
    event_label: eventLabel
  });
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
};
