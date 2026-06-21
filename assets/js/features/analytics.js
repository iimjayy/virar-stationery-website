// js/features/analytics.js
// Privacy-safe GA4 event tracking. No names, typed form text, phone numbers,
// or full destination URLs are sent as event parameters.

const safeGtag = (eventName, params = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
  window.gtag('event', eventName, params);
};

export const trackEvent = (eventName, params = {}) => {
  safeGtag(eventName, {
    engagement_type: 'website_interaction',
    ...params
  });
};

const findSection = (element) => {
  const section = element.closest('[data-section], section[id], header, footer, .quick-convert-bar, .mobile-bottom-bar, .floating-actions');
  if (!section) return 'unknown';
  return section.dataset.section || section.id || section.tagName.toLowerCase();
};

const classifyWhatsAppSource = (element) => {
  if (element.closest('#quoteCalculator, .quote-summary-card')) return 'quote_calculator';
  if (element.closest('#bulkEnquiryForm, .bulk-enquiry-section')) return 'bulk_enquiry';
  if (element.closest('.sticky-whatsapp-btn')) return 'sticky_floating_button';
  if (element.closest('.desktop-cta-rail')) return 'desktop_cta_rail';
  if (element.closest('.mobile-bottom-bar')) return 'mobile_bottom_bar';
  if (element.closest('.chat-panel')) return 'chat_widget';
  if (element.closest('.sp-hero, .sp-header')) return 'service_page';
  if (element.closest('#home')) return 'hero';
  return findSection(element);
};

const serviceNameFor = (element) => {
  const serviceCard = element.closest('[data-service-id]');
  if (serviceCard?.dataset.serviceId) return serviceCard.dataset.serviceId;
  const serviceSelect = document.getElementById('quoteService');
  return serviceSelect?.value || 'unknown';
};

export const initAnalytics = () => {
  document.addEventListener('click', (event) => {
    const target = event.target.closest('a, button, [role="button"], .gallery-item, [data-pdf-type], #quoteWhatsAppBtn');
    if (!target) return;

    const href = target.getAttribute('href') || '';

    if (href.includes('wa.me') || href.includes('api.whatsapp.com') || target.closest('[data-chat-whatsapp]')) {
      trackEvent('whatsapp_click', {
        source_section: classifyWhatsAppSource(target),
        service_name: serviceNameFor(target)
      });
      return;
    }

    if (href.startsWith('tel:')) {
      trackEvent('call_click', {
        source_section: findSection(target)
      });
      return;
    }

    if (href.includes('google.com/maps') || target.closest('.map-directions-btn')) {
      trackEvent('directions_click', {
        source_section: findSection(target)
      });
      return;
    }

    if (target.closest('.gallery-item')) {
      const galleryItem = target.closest('.gallery-item');
      trackEvent('gallery_image_open', {
        image_index: galleryItem?.dataset.galleryIndex || 'unknown'
      });
      return;
    }

    const pdfButton = target.closest('[data-pdf-type]');
    if (pdfButton) {
      trackEvent('pdf_download', {
        document_type: pdfButton.dataset.pdfType || 'unknown'
      });
    }
  });

  const quoteWhatsAppBtn = document.getElementById('quoteWhatsAppBtn');
  if (quoteWhatsAppBtn) {
    quoteWhatsAppBtn.addEventListener('click', () => {
      const service = document.getElementById('quoteService')?.value || 'unknown';
      const quantity = Number(document.getElementById('quoteQty')?.value || 0);
      trackEvent('quote_completed', {
        service_name: service,
        quantity_bucket: quantity >= 500 ? '500_plus' : quantity >= 100 ? '100_499' : quantity >= 25 ? '25_99' : '1_24'
      });
    });
  }
};
