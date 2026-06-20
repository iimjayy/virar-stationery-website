// js/features/analytics.js
// Enterprise-Grade Global GA4 Click Tracking Engine

export const trackEvent = (eventName, eventCategory, eventLabel, extraParams = {}) => {
  const params = {
    event_category: eventCategory,
    event_label: eventLabel,
    ...extraParams
  };

  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  gtag('event', eventName, params);
};

const getElementContext = (el) => {
  const ariaLabel = el.getAttribute('aria-label');
  const title = el.getAttribute('title');
  const id = el.id;
  const href = el.getAttribute('href');
  let text = el.innerText || el.textContent || '';
  text = text.replace(/\s+/g, ' ').trim().substring(0, 50); // Truncate to 50 chars for clean reporting

  // SVG and Math elements have different className objects, handle gracefully
  const classes = typeof el.className === 'string' ? el.className : 'svg-or-complex-element';

  return {
    label: ariaLabel || title || text || id || href || 'Unknown Element',
    id: id || 'none',
    href: href || 'none',
    classes: classes || 'none',
    tag: el.tagName ? el.tagName.toLowerCase() : 'unknown'
  };
};

export const initAnalytics = () => {
  // 1. "God-Mode" Global Event Delegation for ALL Clicks
  // O(1) memory complexity, highly performant
  document.addEventListener('click', (e) => {
    // Traverse up to find the nearest interactive element
    const target = e.target.closest('a, button, input[type="submit"], input[type="button"], select, [role="button"], [data-action], .clickable, .nav-link, .gallery-item, .faq-question, .service-card, .price-card, [data-copy-address], #quotePdfDrop');
    
    if (target) {
      const context = getElementContext(target);
      
      // Determine a highly specific event name based on the element
      let eventName = 'ui_interaction';
      let category = 'User Interaction';

      if (context.tag === 'a') {
        eventName = 'link_click';
        category = 'Navigation';
      }
      if (context.tag === 'button') {
        eventName = 'button_click';
        category = 'Interaction';
      }
      if (context.href.includes('wa.me') || target.closest('.whatsapp-btn')) {
        eventName = 'whatsapp_click';
        category = 'High Intent Lead';
      }
      if (target.closest('footer')) {
        eventName = 'footer_click';
        category = 'Footer Interaction';
      }
      if (target.closest('header')) {
        eventName = 'header_click';
        category = 'Header Interaction';
      }
      if (target.closest('.gallery-item')) {
        eventName = 'gallery_image_view';
        category = 'Media View';
      }
      if (target.closest('.faq-question')) {
        eventName = 'faq_open';
        category = 'Information Seek';
      }
      if (target.closest('[data-copy-address]')) {
        eventName = 'address_copied';
        category = 'Location Interest';
      }
      if (target.closest('.lang-toggle-btn') || target.closest('#langToggle')) {
        eventName = 'language_changed';
        category = 'Localization';
      }

      // Send the highly specific event to Google Analytics
      trackEvent(eventName, category, context.label, {
        element_id: context.id,
        element_classes: context.classes,
        element_tag: context.tag,
        destination_url: context.href
      });
    }
  });

  // 2. Preserve specialized search tracking (Keyboard input is not a click)
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
        }, 1500);
      });
    }
  };

  bindSearchTracking('stationerySearchInput', 'stationery_search');
  
  const siteSearch = document.querySelector('#siteSearch input, .search-box input');
  if (siteSearch) {
    bindSearchTracking(siteSearch.id || 'mainSearch', 'site_search');
  }

  // 3. Preserve specialized Quote Calculator Logic (Change/Input events)
  const quoteCalculator = document.getElementById('quoteCalculator');
  if (quoteCalculator) {
    quoteCalculator.addEventListener('input', () => {
      trackEvent('quote_calculated', 'Quote Calculated', 'Live Quote Updated');
    });
    quoteCalculator.addEventListener('change', () => {
      trackEvent('quote_calculated', 'Quote Calculated', 'Quote Option Changed');
    });
  }
};
