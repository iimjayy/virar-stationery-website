bash
cat > /mnt/user-data/outputs/script.js << 'SCRIPT_EOF'
// =============================================================================
// Virar Stationery & Jumbo Xerox — Production Script
// =============================================================================
// Replace placeholder phone numbers, WhatsApp links, addresses, and images
// with real business details before deployment.
//
// Architecture: Single-file modular pattern.
//   1. AppConfig       — shared constants, single source of truth
//   2. Utils           — shared pure helpers (no DOM side effects)
//   3. Toast           — singleton notification layer
//   4. WhatsApp        — shared enquiry-channel helpers
//   5. Feature modules — each self-contained, initialised via safeRun()
//   6. Bootstrap       — ordered, safe initialisation entry point
// =============================================================================

'use strict';

// ---------------------------------------------------------------------------
// 1. EARLY BOOT GUARD
// ---------------------------------------------------------------------------
// Runs callback immediately if DOM is ready, otherwise waits for the event.

const runAfterReady = (callback) => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
};

runAfterReady(() => {

  // =========================================================================
  // 2. APP CONFIG — single source of truth for shared constants
  // =========================================================================

  const AppConfig = Object.freeze({
    business: {
      defaultWhatsAppNumber: '917021072757',
      defaultEmail: 'virarcopy123@gmail.com',
      enquirySubject: 'New Website Enquiry - Virar Stationery & Jumbo Xerox',
      bulkEnquirySubject: 'Bulk / Business Enquiry - Virar Stationery & Jumbo Xerox',
      phoneHref: '917021072757',
      phoneLabel: '+91 70210 72757',
      openHour: 8,
      closeHour: 21
    },
    scroll: {
      headerShadowThreshold: 12,
      headerCompactThreshold: 84,
      backToTopThreshold: 520,
      stickyWhatsAppRevealOffset: 80,
      desktopCtaRailRevealOffset: 110
    },
    timing: {
      enquiryToastDefault: 1900,
      whatsAppFallbackDelay: 1400,
      enquirySubmitDelay: 500,
      bulkSubmitDelay: 450
    }
  });

  // =========================================================================
  // 3. UTILS — pure helpers, no DOM side-effects
  // =========================================================================

  const Utils = Object.freeze({

    /** Strip all non-digit characters from a string. */
    normalizePhone(value) {
      return String(value ?? '').replace(/\D+/g, '');
    },

    /** HTML-escape a value for safe innerHTML insertion. */
    escapeHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    },

    /** Escape a string for use inside a RegExp. */
    escapeRegExp(value) {
      return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    /**
     * Format a 24h hour as "8am" / "9pm".
     * Pure, no DOM required.
     */
    formatHour(hour24) {
      const suffix = hour24 >= 12 ? 'pm' : 'am';
      const normalized = ((hour24 + 11) % 12) + 1;
      return `${normalized}${suffix}`;
    },

    /** Format bytes into a human-readable size string. */
    formatFileSize(size) {
      if (!size || Number.isNaN(size)) return '';
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    },

    /** Format a numeric value as a rupee currency string. */
    formatCurrency(value) {
      if (!Number.isFinite(value)) return 'Rs 0';
      const formatted = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
      return `Rs ${formatted}`;
    },

    /**
     * Check whether a form field has a valid, non-empty value.
     * Works for text inputs, selects, and number inputs.
     */
    fieldHasValue(field) {
      const raw = String(field.value ?? '');
      if (field.type === 'number') {
        const num = Number(raw);
        return Number.isFinite(num) && num > 0;
      }
      return field.tagName === 'SELECT' ? raw !== '' : raw.trim() !== '';
    },

    /** Detect likely mobile UA for WhatsApp deep-link routing. */
    isMobileDevice() {
      return /Android|iPhone|iPad|iPod|Windows Phone|webOS|Mobile/i.test(
        navigator.userAgent || ''
      );
    }

  });

  // =========================================================================
  // 4. TOAST — singleton notification layer
  // =========================================================================

  const Toast = (() => {
    let _el = null;
    let _timeoutId = null;

    const _getOrCreate = () => {
      if (_el) return _el;
      const existing = document.getElementById('enquiryToast');
      if (existing) { _el = existing; return _el; }
      _el = document.createElement('div');
      _el.id = 'enquiryToast';
      _el.className = 'enquiry-toast';
      _el.setAttribute('role', 'status');
      _el.setAttribute('aria-live', 'polite');
      _el.setAttribute('aria-atomic', 'true');
      document.body.appendChild(_el);
      return _el;
    };

    return {
      show(message, { isError = false, duration = AppConfig.timing.enquiryToastDefault } = {}) {
        const el = _getOrCreate();
        el.textContent = message;
        el.classList.toggle('is-error', isError);
        el.classList.add('is-visible');
        if (_timeoutId) window.clearTimeout(_timeoutId);
        _timeoutId = window.setTimeout(() => el.classList.remove('is-visible'), duration);
      }
    };
  })();

  // =========================================================================
  // 5. WHATSAPP HELPERS — shared enquiry-channel utilities
  // =========================================================================

  const WhatsApp = (() => {
    // Resolve the business WhatsApp number once from the DOM, fall back to config.
    const _resolveNumber = () => {
      const link = document.querySelector('a[href*="wa.me/"], a[href*="api.whatsapp.com/send"]');
      const href = link?.getAttribute('href') || '';
      const waMatch = href.match(/wa\.me\/(\d+)/i);
      if (waMatch?.[1]) return Utils.normalizePhone(waMatch[1]) || AppConfig.business.defaultWhatsAppNumber;
      try {
        const url = new URL(href, window.location.origin);
        const param = url.searchParams.get('phone');
        if (param) return Utils.normalizePhone(param) || AppConfig.business.defaultWhatsAppNumber;
      } catch { /* ignore */ }
      return AppConfig.business.defaultWhatsAppNumber;
    };

    const _resolveEmail = () => {
      const link = document.querySelector('a[href^="mailto:"]');
      const href = link?.getAttribute('href') || '';
      if (!href) return AppConfig.business.defaultEmail;
      return href.replace(/^mailto:/i, '').split('?')[0].trim() || AppConfig.business.defaultEmail;
    };

    // Resolved once on first use, then cached.
    let _number = null;
    let _email = null;

    const getNumber = () => { if (!_number) _number = _resolveNumber(); return _number; };
    const getEmail  = () => { if (!_email)  _email  = _resolveEmail();  return _email; };

    const buildUrl = (phone, message) => {
      const safe = Utils.normalizePhone(phone);
      const encoded = encodeURIComponent(message || '');
      return Utils.isMobileDevice()
        ? `https://wa.me/${safe}?text=${encoded}`
        : `https://api.whatsapp.com/send?phone=${safe}&text=${encoded}`;
    };

    const buildMailto = (email, subject, body) =>
      `mailto:${email}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;

    /**
     * Open the WhatsApp URL. On mobile, fall back to mailto after a short
     * delay if WhatsApp doesn't capture. Returns true if WhatsApp was opened.
     */
    const open = (whatsAppUrl, mailtoUrl) => {
      if (Utils.isMobileDevice()) {
        const currentLocation = window.location.href;
        window.location.assign(whatsAppUrl);
        window.setTimeout(() => {
          if (window.location.href === currentLocation) window.location.assign(mailtoUrl);
        }, AppConfig.timing.whatsAppFallbackDelay);
        return true;
      }
      try {
        const popup = window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
        if (popup) { popup.opener = null; return true; }
      } catch { /* ignore */ }
      window.location.assign(mailtoUrl);
      return false;
    };

    return { getNumber, getEmail, buildUrl, buildMailto, open };
  })();

  // =========================================================================
  // 6. INIT ERROR HANDLER
  // =========================================================================

  const InitGuard = (() => {
    let _reported = false;

    const report = (error) => {
      if (_reported) return;
      _reported = true;
      console.error('Interactive features failed to load:', error);
      Toast.show('Some interactive features failed. Refresh the page.', {
        isError: true,
        duration: 2800
      });
    };

    window.addEventListener('error', (event) => {
      if (event?.error) report(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      if (event?.reason) report(event.reason);
    });

    return { report };
  })();

  /**
   * Wraps a feature init function in a try-catch so one broken feature
   * never takes down the entire script.
   */
  const safeRun = (label, callback) => {
    try {
      callback();
    } catch (error) {
      InitGuard.report(error);
      console.error(`Init step failed: ${label}`, error);
    }
  };

  // =========================================================================
  // 7. SHARED FORM HELPERS
  // =========================================================================
  // Extracted once to avoid copy-paste between contactForm and bulkEnquiry.

  /**
   * Validate a list of required fields. Marks invalid ones, focuses the
   * first invalid field, shows a toast, and returns false if invalid.
   */
  const validateFields = (fields, { toastMessage = 'Please complete all required fields.' } = {}) => {
    let firstInvalid = null;

    fields.forEach((field) => {
      const valid = Utils.fieldHasValue(field);
      field.classList.toggle('is-invalid', !valid);
      field.setAttribute('aria-invalid', valid ? 'false' : 'true');
      if (!valid && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      Toast.show(toastMessage, { isError: true, duration: 2300 });
      return false;
    }
    return true;
  };

  /**
   * Attach input/change listeners that clear the invalid state as soon as
   * a field gets a valid value.
   */
  const attachFieldClearListeners = (fields) => {
    fields.forEach((field) => {
      const clearError = () => {
        if (Utils.fieldHasValue(field)) {
          field.classList.remove('is-invalid');
          field.setAttribute('aria-invalid', 'false');
        }
      };
      field.addEventListener('input', clearError);
      field.addEventListener('change', clearError);
    });
  };

  /**
   * Toggle the loading state of a submit button.
   * Preserves original HTML so it can be restored after submit.
   */
  const setButtonLoading = (button, isLoading, { loadingHtml = '<span class="btn-spinner" aria-hidden="true"></span><span>Opening WhatsApp...</span>' } = {}) => {
    if (!button) return;
    if (!button.dataset.originalHtml) button.dataset.originalHtml = button.innerHTML;
    button.disabled = isLoading;
    button.classList.toggle('is-loading', isLoading);
    button.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    button.innerHTML = isLoading ? loadingHtml : button.dataset.originalHtml;
  };

  // =========================================================================
  // 8. REVEAL ANIMATIONS & HEADER
  // =========================================================================
  // Kept at the top-level because they run unconditionally and are trivial.

  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealElements.forEach((el) => revealObserver.observe(el));

  const header = document.querySelector('.site-header');
  if (header) {
    const updateHeaderShadow = () => {
      header.classList.toggle('is-scrolled', window.scrollY > AppConfig.scroll.headerShadowThreshold);
      header.classList.toggle('is-compact', window.scrollY > AppConfig.scroll.headerCompactThreshold);
    };
    updateHeaderShadow();
    window.addEventListener('scroll', updateHeaderShadow, { passive: true });
  }

  // =========================================================================
  // 9. HERO OPEN STATUS
  // =========================================================================

  const setupHeroOpenStatus = () => {
    const statusPill = document.getElementById('heroOpenStatus');
    if (!statusPill) return;

    const statusText = statusPill.querySelector('.hero-open-text');
    if (!statusText) return;

    const { openHour, closeHour } = AppConfig.business;

    const updateOpenStatus = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const openMinutes  = openHour  * 60;
      const closeMinutes = closeHour * 60;
      const isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;

      statusPill.classList.remove('is-loading', 'is-open', 'is-closed');
      statusPill.classList.add(isOpen ? 'is-open' : 'is-closed');

      const label = isOpen
        ? `Open Now · Closes at ${Utils.formatHour(closeHour)}`
        : currentMinutes >= closeMinutes
          ? `Closed Now · Opens tomorrow ${Utils.formatHour(openHour)}`
          : `Closed Now · Opens ${Utils.formatHour(openHour)}`;

      statusText.textContent = label;
      statusPill.setAttribute('aria-label', label);
    };

    updateOpenStatus();

    // Align the minute-by-minute tick to the next real minute boundary.
    const now = new Date();
    const delayToNextMinute = ((60 - now.getSeconds()) * 1000) - now.getMilliseconds();
    window.setTimeout(() => {
      updateOpenStatus();
      window.setInterval(updateOpenStatus, 60_000);
    }, Math.max(400, delayToNextMinute));
  };

  setupHeroOpenStatus();

  // =========================================================================
  // 10. CONTACT FORM
  // =========================================================================

  const setupContactForm = () => {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    const submitButton   = contactForm.querySelector('button[type="submit"]');
    const requiredFields = [
      contactForm.querySelector('#name'),
      contactForm.querySelector('#service'),
      contactForm.querySelector('#message')
    ].filter(Boolean);

    const businessNumber = WhatsApp.getNumber();
    const businessEmail  = WhatsApp.getEmail();

    const buildMessage = () => {
      const name    = String(contactForm.querySelector('#name')?.value    ?? '').trim();
      const service = String(contactForm.querySelector('#service')?.value ?? '').trim();
      const message = String(contactForm.querySelector('#message')?.value ?? '').trim();
      return ['New Website Enquiry', '', `Name: ${name}`, `Service Needed: ${service}`, `Message: ${message}`].join('\n');
    };

    attachFieldClearListeners(requiredFields);

    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!validateFields(requiredFields)) return;

      setButtonLoading(submitButton, true);
      Toast.show('Opening WhatsApp...', { duration: 1800 });

      const msg        = buildMessage();
      const waUrl      = WhatsApp.buildUrl(businessNumber, msg);
      const mailtoUrl  = WhatsApp.buildMailto(businessEmail, AppConfig.business.enquirySubject, msg);

      window.setTimeout(() => {
        const opened = WhatsApp.open(waUrl, mailtoUrl);
        setButtonLoading(submitButton, false);

        if (opened) {
          contactForm.reset();
          requiredFields.forEach((f) => {
            f.classList.remove('is-invalid');
            f.setAttribute('aria-invalid', 'false');
          });
          Toast.show('WhatsApp opened. Please send your enquiry.', { duration: 2200 });
        } else {
          Toast.show('WhatsApp unavailable. Opening email fallback...', { isError: true, duration: 2800 });
        }
      }, AppConfig.timing.enquirySubmitDelay);
    });
  };

  setupContactForm();

  // =========================================================================
  // 11. SMART SEARCH
  // =========================================================================

  const setupSmartSearch = (form) => {
    if (!form) return;

    const input = form.querySelector('.search-input');
    if (!input) return;

    // --- DOM setup ---
    const dropdown = document.createElement('div');
    dropdown.className = 'smart-search-dropdown';
    dropdown.setAttribute('aria-hidden', 'true');
    dropdown.setAttribute('role', 'listbox');
    dropdown.innerHTML = '<div class="smart-search-scroll"></div>';
    form.appendChild(dropdown);

    const dropdownScroll = dropdown.querySelector('.smart-search-scroll');

    // --- Constants ---
    const MAX_VISIBLE      = 10;
    const MAX_RECENT       = 6;
    const STORAGE_KEY      = 'virarSmartSearchRecent';
    const CATEGORY_ORDER   = ['Services', 'Products', 'Popular Searches', 'Contact & Location', 'Customer Queries', 'Recent Searches'];

    // --- State (scoped to this search instance) ---
    let activeSuggestionIndex = -1;
    let visibleSuggestions    = [];
    let isShowingAllResults   = false;
    let previousQuery         = '';

    // --- Text helpers (scoped; no outer dependency) ---
    const normalizeText = (value) =>
      String(value ?? '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    const toLookupKey = (value) =>
      normalizeText(value)
        .replace(/\bcolour\b/g,   'color')
        .replace(/\bprinting\b/g, 'print')
        .replace(/\bprintout\b/g, 'print')
        .replace(/\s+/g, ' ')
        .trim();

    const highlightMatch = (text, query) => {
      const safe   = Utils.escapeHtml(text);
      const tokens = normalizeText(query)
        .split(' ')
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);
      if (!tokens.length) return safe;
      const pattern = tokens.map(Utils.escapeRegExp).join('|');
      if (!pattern) return safe;
      return safe.replace(new RegExp(`(${pattern})`, 'ig'), '<mark>$1</mark>');
    };

    const fuzzySeq = (source, query) => {
      if (!source || !query) return false;
      let qi = 0;
      for (const ch of source) {
        if (ch === query[qi]) { qi++; if (qi === query.length) return true; }
      }
      return false;
    };

    // --- Card maps — use data-service-id where available, fall back to h3 text ---
    const createCardMap = (cardSelector, headingSelector) => {
      const map = new Map();
      document.querySelectorAll(cardSelector).forEach((card) => {
        // Prefer the architecture-safe data attribute; fall back to heading text.
        const key = card.dataset.serviceId
          ? toLookupKey(card.dataset.serviceId)
          : (() => {
              const h = card.querySelector(headingSelector);
              return h ? toLookupKey(h.textContent) : null;
            })();
        if (key) map.set(key, card);
      });
      return map;
    };

    const serviceCardMap = createCardMap('#services .service-card',       'h3');
    const productCardMap = createCardMap('#stationery .product-card',     '.product-body h3');
    const priceCardMap   = createCardMap('#popular-prices .price-card',   'h3');

    // --- Search catalog ---
    const searchCatalog = {
      Services: [
        { label: 'Xerox',                  icon: 'fa-solid fa-copy',           keywords: ['photocopy', 'xerox service', 'copy center'],            target: { type: 'service', text: 'Xerox / Photocopy',       fallbackSelector: '#services' } },
        { label: 'Black & White Printing', icon: 'fa-solid fa-print',          keywords: ['bw print', 'printout', 'document print'],               target: { type: 'service', text: 'Black & White Printing',  fallbackSelector: '#services' } },
        { label: 'Colour Printing',        icon: 'fa-solid fa-palette',        keywords: ['color print', 'colour printout', 'brochure printing'],   target: { type: 'service', text: 'Color Printing',          fallbackSelector: '#services' } },
        { label: 'Lamination',             icon: 'fa-solid fa-layer-group',    keywords: ['document protection', 'laminate sheet'],                 target: { type: 'service', text: 'Lamination',              fallbackSelector: '#services' } },
        { label: 'Spiral Binding',         icon: 'fa-solid fa-clipboard-list', keywords: ['binding', 'project binding'],                           target: { type: 'service', text: 'Spiral Binding',          fallbackSelector: '#services' } },
        { label: 'Passport Photos',        icon: 'fa-solid fa-camera',         keywords: ['passport size photo', 'id photo'],                      target: { type: 'service', text: 'Passport Photos',         fallbackSelector: '#services' } },
        { label: 'Project Printing',       icon: 'fa-solid fa-folder-open',    keywords: ['college project', 'assignment print'],                  target: { type: 'service', text: 'Project Printing',        fallbackSelector: '#services' } },
        { label: 'ID Card Printing',       icon: 'fa-solid fa-id-card',        keywords: ['id card', 'smart card', 'card print'],                  target: { type: 'service', text: 'Smart Card',              fallbackSelector: '#services' } },
        { label: 'Smart Card Printing',    icon: 'fa-solid fa-address-card',   keywords: ['smart card', 'id card print'],                          target: { type: 'price',   text: 'Smart Card',              fallbackSelector: '#popular-prices' } },
        { label: 'Visiting Card Printing', icon: 'fa-solid fa-address-card',   keywords: ['business card', 'visiting card'],                       target: { type: 'service', text: 'Visiting Card',           fallbackSelector: '#services' } },
        { label: 'Rubber Stamp',           icon: 'fa-solid fa-stamp',          keywords: ['stamp making', 'office stamp'],                         target: { type: 'section', selector: '#contact' } },
        { label: 'Autocad Plotting',       icon: 'fa-solid fa-ruler-combined', keywords: ['plotting', 'engineering drawing', 'a0 print'],          target: { type: 'service', text: 'Jumbo Xerox',             fallbackSelector: '#services' } },
        { label: 'Jumbo Xerox',            icon: 'fa-solid fa-expand',         keywords: ['a3', 'a2', 'a1', 'a0 xerox'],                          target: { type: 'service', text: 'Jumbo Xerox',             fallbackSelector: '#services' } },
        { label: 'Digital Print',          icon: 'fa-solid fa-file-lines',     keywords: ['digital printing', 'high quality print'],               target: { type: 'service', text: 'Color Printing',          fallbackSelector: '#services' } },
        { label: 'Letterhead Printing',    icon: 'fa-solid fa-heading',        keywords: ['letterhead', 'business stationery print'],              target: { type: 'service', text: 'Letterhead Print',        fallbackSelector: '#services' } },
        { label: 'Aadhar Card Print',      icon: 'fa-solid fa-id-card',        keywords: ['aadhaar print', 'identity print', 'id proof print'],    target: { type: 'service', text: 'Black & White Printing',  fallbackSelector: '#services' } },
        { label: 'Resume Print',           icon: 'fa-solid fa-file-lines',     keywords: ['cv print', 'resume color print', 'job resume print'],   target: { type: 'service', text: 'Black & White Printing',  fallbackSelector: '#services' } }
      ],
      Products: [
        { label: 'Pens',         icon: 'fa-solid fa-pen',              keywords: ['ball pen', 'gel pen'],                              target: { type: 'product', text: 'Pens',             fallbackSelector: '#stationery' } },
        { label: 'Notebooks',    icon: 'fa-solid fa-book',             keywords: ['notebook', 'register'],                             target: { type: 'product', text: 'Notebooks',        fallbackSelector: '#stationery' } },
        { label: 'Files',        icon: 'fa-solid fa-folder',           keywords: ['document file', 'folder'],                          target: { type: 'product', text: 'Files',            fallbackSelector: '#stationery' } },
        { label: 'Charts',       icon: 'fa-solid fa-chart-column',     keywords: ['chart paper', 'presentation chart'],                target: { type: 'product', text: 'Charts',           fallbackSelector: '#stationery' } },
        { label: 'Sticky Notes', icon: 'fa-solid fa-note-sticky',      keywords: ['post it notes', 'memo notes'],                      target: { type: 'product', text: 'Sticky Notes',     fallbackSelector: '#stationery' } },
        { label: 'Project Paper',icon: 'fa-solid fa-file',             keywords: ['project materials', 'project sheets'],              target: { type: 'product', text: 'Project Materials', fallbackSelector: '#stationery' } },
        { label: 'A4 Sheets',    icon: 'fa-solid fa-file-lines',       keywords: ['a4 paper', 'print paper'],                          target: { type: 'product', text: 'Project Materials', fallbackSelector: '#stationery' } },
        { label: 'Markers',      icon: 'fa-solid fa-pen-clip',         keywords: ['marker pen', 'highlight marker'],                   target: { type: 'section', selector: '#stationery' } },
        { label: 'Folders',      icon: 'fa-solid fa-folder-open',      keywords: ['document folder', 'office folder'],                 target: { type: 'product', text: 'Files',            fallbackSelector: '#stationery' } },
        { label: 'Cartridges',   icon: 'fa-solid fa-print',            keywords: ['printer cartridge', 'toner'],                       target: { type: 'service', text: 'Cartridge Refelling', fallbackSelector: '#services' } },
        { label: 'Printer Ink',  icon: 'fa-solid fa-fill-drip',        keywords: ['ink refill', 'ink bottle'],                         target: { type: 'service', text: 'Cartridge Refelling', fallbackSelector: '#services' } },
        { label: 'Calculators',  icon: 'fa-solid fa-calculator',       keywords: ['scientific calculator', 'student calculator'],      target: { type: 'product', text: 'Calculators',      fallbackSelector: '#stationery' } },
        { label: 'Art Supplies', icon: 'fa-solid fa-paintbrush',       keywords: ['drawing supplies', 'art material'],                 target: { type: 'product', text: 'Art Supplies',     fallbackSelector: '#stationery' } },
        { label: 'Envelopes',    icon: 'fa-solid fa-envelope-open-text',keywords: ['covers', 'office envelope'],                       target: { type: 'section', selector: '#stationery' } }
      ],
      'Popular Searches': [
        { label: 'Xerox near me',               icon: 'fa-solid fa-magnifying-glass', keywords: ['nearby xerox', 'local xerox'],                  target: { type: 'service', text: 'Xerox / Photocopy',      fallbackSelector: '#services' } },
        { label: 'Printout near me',            icon: 'fa-solid fa-magnifying-glass', keywords: ['print near me', 'printing nearby'],             target: { type: 'service', text: 'Black & White Printing', fallbackSelector: '#services' } },
        { label: 'Colour print price',          icon: 'fa-solid fa-magnifying-glass', keywords: ['color print rate', 'colour printing cost'],     target: { type: 'price',   text: 'Colour Printout',        fallbackSelector: '#popular-prices' } },
        { label: 'Passport photo price',        icon: 'fa-solid fa-magnifying-glass', keywords: ['passport photo rate', 'photo print price'],     target: { type: 'price',   text: 'Passport Photos',        fallbackSelector: '#popular-prices' } },
        { label: 'Lamination near me',          icon: 'fa-solid fa-magnifying-glass', keywords: ['lamination service nearby'],                    target: { type: 'service', text: 'Lamination',             fallbackSelector: '#services' } },
        { label: 'Project printing',            icon: 'fa-solid fa-magnifying-glass', keywords: ['project print', 'assignment printing'],         target: { type: 'service', text: 'Project Printing',       fallbackSelector: '#services' } },
        { label: 'College project work',        icon: 'fa-solid fa-magnifying-glass', keywords: ['college print work', 'project binding'],        target: { type: 'service', text: 'Project Printing',       fallbackSelector: '#services' } },
        { label: 'Stationery shop in Virar',    icon: 'fa-solid fa-magnifying-glass', keywords: ['virar stationery', 'stationery near virar'],    target: { type: 'section', selector: '#stationery' } },
        { label: 'Xerox shop near Viva College',icon: 'fa-solid fa-magnifying-glass', keywords: ['viva college xerox', 'near viva college'],      target: { type: 'section', selector: '#contact' } },
        { label: 'Xerox Near Viva College',     icon: 'fa-solid fa-magnifying-glass', keywords: ['xerox near viva', 'viva college xerox shop'],   target: { type: 'section', selector: '#contact' } },
        { label: 'Jumbo Xerox',                 icon: 'fa-solid fa-magnifying-glass', keywords: ['a0 xerox', 'large xerox'],                      target: { type: 'service', text: 'Jumbo Xerox',            fallbackSelector: '#services' } },
        { label: 'Visiting card print',         icon: 'fa-solid fa-magnifying-glass', keywords: ['business card print'],                          target: { type: 'service', text: 'Visiting Card',          fallbackSelector: '#services' } },
        { label: 'Spiral binding price',        icon: 'fa-solid fa-magnifying-glass', keywords: ['binding rate'],                                 target: { type: 'price',   text: 'Spiral Binding',         fallbackSelector: '#popular-prices' } },
        { label: 'Smart card printing',         icon: 'fa-solid fa-magnifying-glass', keywords: ['smart card print'],                             target: { type: 'price',   text: 'Smart Card',             fallbackSelector: '#popular-prices' } },
        { label: 'Same day printing',           icon: 'fa-solid fa-magnifying-glass', keywords: ['urgent print', 'quick print service'],          target: { type: 'section', selector: '#services' } }
      ],
      'Contact & Location': [
        { label: 'Virar West',          icon: 'fa-solid fa-location-dot',     keywords: ['virar location', 'shop location'],                   target: { type: 'section', selector: '#contact' } },
        { label: 'Near Viva College',   icon: 'fa-solid fa-location-dot',     keywords: ['viva college', 'near old viva college'],             target: { type: 'section', selector: '#contact' } },
        { label: 'Shop timings',        icon: 'fa-solid fa-clock',            keywords: ['opening time', 'closing time', 'timings'],           target: { type: 'section', selector: '#contact' } },
        { label: 'WhatsApp inquiry',    icon: 'fa-brands fa-whatsapp',        keywords: ['send file on whatsapp', 'whatsapp print'],           target: { type: 'url', href: 'https://wa.me/917021072757', newTab: true } },
        { label: 'Call now',            icon: 'fa-solid fa-phone',            keywords: ['phone number', 'contact call'],                      target: { type: 'url', href: 'tel:+917021072757' } },
        { label: 'Directions',          icon: 'fa-solid fa-map-location-dot', keywords: ['google maps', 'navigate to shop'],                   target: { type: 'url', href: 'https://www.google.com/maps?q=Shop%20No.%2011%2C%20Takshashila%20Apartment%2C%20opp%20mahavir%20hospital%2C%20Near%20Old%20Viva%20College%2C%20ram%20mandir%20rd%2C%20Virar%20West%2C%20Mumbai%20-%20401303', newTab: true } },
        { label: 'Shop address',        icon: 'fa-solid fa-store',            keywords: ['address', 'location details'],                       target: { type: 'section', selector: '#contact' } },
        { label: 'Open now',            icon: 'fa-solid fa-clock',            keywords: ['is shop open', 'current timings'],                   target: { type: 'section', selector: '#contact' } }
      ],
      'Customer Queries': [
        { label: 'Xerox price',                  icon: 'fa-solid fa-circle-question', keywords: ['xerox rate', 'photocopy price'],                  target: { type: 'price', text: 'Xerox / Photocopy',  fallbackSelector: '#popular-prices' } },
        { label: 'Printout price',               icon: 'fa-solid fa-circle-question', keywords: ['print rate', 'document print price'],              target: { type: 'price', text: 'Colour Printout',    fallbackSelector: '#popular-prices' } },
        { label: 'Colour print price',           icon: 'fa-solid fa-circle-question', keywords: ['color print cost'],                                target: { type: 'price', text: 'Colour Printout',    fallbackSelector: '#popular-prices' } },
        { label: 'Lamination cost',              icon: 'fa-solid fa-circle-question', keywords: ['lamination price'],                                target: { type: 'price', text: 'Lamination',          fallbackSelector: '#popular-prices' } },
        { label: 'Binding cost',                 icon: 'fa-solid fa-circle-question', keywords: ['spiral binding price'],                            target: { type: 'price', text: 'Spiral Binding',      fallbackSelector: '#popular-prices' } },
        { label: 'Passport photo timing',        icon: 'fa-solid fa-circle-question', keywords: ['passport photo time'],                             target: { type: 'service', text: 'Passport Photos',  fallbackSelector: '#services' } },
        { label: 'How long does printing take',  icon: 'fa-solid fa-circle-question', keywords: ['printing time', 'delivery time'],                  target: { type: 'service', text: 'Project Printing', fallbackSelector: '#services' } },
        { label: 'Bulk printing discount',       icon: 'fa-solid fa-circle-question', keywords: ['bulk order discount', 'printing bulk rate'],       target: { type: 'section', selector: '#contact' } },
        { label: 'Same-day delivery',            icon: 'fa-solid fa-circle-question', keywords: ['same day print', 'urgent service'],                target: { type: 'section', selector: '#services' } },
        { label: 'WhatsApp document printing',   icon: 'fa-brands fa-whatsapp',       keywords: ['send files on whatsapp', 'document print whatsapp'],target: { type: 'url', href: 'https://wa.me/917021072757', newTab: true } }
      ]
    };

    // --- Flatten catalog once into a scored list ---
    const flatCatalog = Object.entries(searchCatalog).flatMap(([category, entries]) =>
      entries.map((entry, index) => {
        const terms = [entry.label, ...(entry.keywords || [])];
        return {
          id: `${toLookupKey(category)}-${index}`,
          category,
          label: entry.label,
          icon: entry.icon || 'fa-solid fa-magnifying-glass',
          target: entry.target,
          terms,
          normalizedTerms: terms.map(toLookupKey).filter(Boolean)
        };
      })
    );

    const catalogByLabel = new Map(flatCatalog.map((e) => [toLookupKey(e.label), e]));

    // --- Recent searches (localStorage, isolated key) ---
    const readRecent = () => {
      try {
        const data = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(data) ? data.filter((i) => typeof i === 'string' && i.trim()) : [];
      } catch { return []; }
    };

    const saveRecent = (list) => {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
    };

    const addRecent = (term) => {
      const t = term.trim();
      if (t.length < 2) return;
      const deduped = readRecent().filter((e) => toLookupKey(e) !== toLookupKey(t));
      saveRecent([t, ...deduped].slice(0, MAX_RECENT));
    };

    const createRecentEntry = (query) => ({
      id: `recent-${toLookupKey(query)}`,
      category: 'Recent Searches',
      label: query,
      icon: 'fa-solid fa-clock-rotate-left',
      target: { type: 'query', query },
      terms: [query],
      normalizedTerms: [toLookupKey(query)]
    });

    const getRecentEntries = () =>
      readRecent().slice(0, MAX_RECENT).map((t) => catalogByLabel.get(toLookupKey(t)) || createRecentEntry(t));

    // --- Trending (static list resolved against catalog) ---
    const trendingLabels = [
      'Xerox near me', 'Printout near me', 'Colour print price',
      'Passport photo price', 'Lamination near me', 'Project printing',
      'Stationery shop in Virar', 'Same day printing'
    ];
    const trendingEntries = trendingLabels
      .map((l) => catalogByLabel.get(toLookupKey(l)) || createRecentEntry(l))
      .slice(0, MAX_VISIBLE);

    // --- Scoring ---
    const getCategoryRank = (cat) => {
      const rank = CATEGORY_ORDER.indexOf(cat);
      return rank === -1 ? CATEGORY_ORDER.length + 1 : rank;
    };

    const scoreEntry = (entry, query) => {
      const qKey     = toLookupKey(query);
      if (!qKey) return 0;
      const qCompact = qKey.replace(/\s+/g, '');
      const qTokens  = qKey.split(' ').filter(Boolean);
      let best = 0;

      entry.normalizedTerms.forEach((term, ti) => {
        if (!term) return;
        const tc = term.replace(/\s+/g, '');
        let s = 0;
        if (term === qKey)          s += 200;
        if (term.startsWith(qKey))  s += 140;
        if (term.includes(qKey))    s += 110;
        if (fuzzySeq(tc, qCompact)) s += 65;

        qTokens.forEach((tok) => {
          if (tok.length < 2) { if (term.startsWith(tok)) s += 14; return; }
          if (term.startsWith(tok)) s += 22;
          else if (term.includes(tok)) s += 12;
        });

        if (ti > 0) s -= 6;
        best = Math.max(best, s);
      });

      if (!best) return 0;
      return best + Math.max(0, 8 - getCategoryRank(entry.category));
    };

    const getRanked = (query, includeAll = false) => {
      const scored = flatCatalog
        .map((e) => ({ entry: e, score: scoreEntry(e, query) }))
        .filter((i) => i.score >= 38)
        .sort((a, b) => b.score !== a.score
          ? b.score - a.score
          : getCategoryRank(a.entry.category) - getCategoryRank(b.entry.category))
        .map((i) => i.entry);
      return includeAll ? scored : scored.slice(0, MAX_VISIBLE);
    };

    const groupSuggestions = (entries) => {
      const grouped = new Map();
      entries.forEach((e) => {
        if (!grouped.has(e.category)) grouped.set(e.category, []);
        grouped.get(e.category).push(e);
      });
      return CATEGORY_ORDER
        .map((cat) => ({ category: cat, entries: grouped.get(cat) || [] }))
        .filter((g) => g.entries.length);
    };

    // --- Scroll-to helper (no state dependency) ---
    const scrollToElement = (el, block = 'center') => {
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block });
      el.classList.add('search-target-pulse');
      window.setTimeout(() => el.classList.remove('search-target-pulse'), 1200);
    };

    const resolveTargetElement = (target) => {
      if (!target?.type) return null;
      const key = toLookupKey(target.text || '');
      if (!key) return null;
      if (target.type === 'service') return serviceCardMap.get(key) || null;
      if (target.type === 'product') return productCardMap.get(key) || null;
      if (target.type === 'price')   return priceCardMap.get(key)   || null;
      return null;
    };

    // --- Dropdown state ---
    const openDropdown = () => {
      dropdown.classList.add('is-open');
      dropdown.setAttribute('aria-hidden', 'false');
      form.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
    };

    const closeDropdown = () => {
      dropdown.classList.remove('is-open');
      dropdown.setAttribute('aria-hidden', 'true');
      form.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
      activeSuggestionIndex = -1;
    };

    // --- HTML builders ---
    const buildSuggestionButton = (entry, index, query) => `
      <button type="button" class="smart-suggestion-item" data-index="${index}" role="option" aria-selected="false">
        <span class="smart-item-icon"><i class="${Utils.escapeHtml(entry.icon)}" aria-hidden="true"></i></span>
        <span class="smart-item-text">${highlightMatch(entry.label, query)}</span>
        <span class="smart-suggestion-pill">${Utils.escapeHtml(entry.category)}</span>
        <span class="smart-item-arrow"><i class="fa-solid fa-angle-right" aria-hidden="true"></i></span>
      </button>
    `;

    const updateActiveSuggestion = () => {
      dropdownScroll.querySelectorAll('.smart-suggestion-item').forEach((btn, i) => {
        const active = i === activeSuggestionIndex;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
        if (active) btn.scrollIntoView({ block: 'nearest' });
      });
    };

    const renderNoResults = (query) => {
      const alts = [
        catalogByLabel.get(toLookupKey('Xerox near me')),
        catalogByLabel.get(toLookupKey('Colour print price')),
        catalogByLabel.get(toLookupKey('Passport photo price')),
        catalogByLabel.get(toLookupKey('Stationery shop in Virar')),
        catalogByLabel.get(toLookupKey('WhatsApp inquiry'))
      ].filter(Boolean);

      visibleSuggestions    = alts;
      activeSuggestionIndex = alts.length ? 0 : -1;

      dropdownScroll.innerHTML = `
        <div class="smart-search-empty">
          <h4>No results found for "${Utils.escapeHtml(query)}"</h4>
          <p>Try shorter keywords like xerox, lamination, stationery, or timings.</p>
        </div>
        <div class="smart-search-group">
          <div class="smart-search-category">Helpful Alternatives</div>
          ${alts.map((e, i) => buildSuggestionButton(e, i, '')).join('')}
        </div>
      `;
      openDropdown();
      updateActiveSuggestion();
    };

    const renderSuggestionList = (query) => {
      const q = query.trim();

      if (!q) {
        const recentEntries = getRecentEntries();
        const groups = [];
        if (recentEntries.length) groups.push({ category: 'Recent Searches', entries: recentEntries });
        groups.push({ category: 'Popular Searches', entries: trendingEntries });

        let idx = 0;
        dropdownScroll.innerHTML = groups.map((g) => `
          <div class="smart-search-group">
            <div class="smart-search-category">${Utils.escapeHtml(g.category)}</div>
            ${g.entries.map((e) => buildSuggestionButton(e, idx++, '')).join('')}
          </div>
        `).join('');

        visibleSuggestions    = groups.flatMap((g) => g.entries);
        activeSuggestionIndex = visibleSuggestions.length ? 0 : -1;
        openDropdown();
        updateActiveSuggestion();
        return;
      }

      const all = getRanked(q, true);
      if (!all.length) { renderNoResults(q); return; }

      const displayed = isShowingAllResults ? all : all.slice(0, MAX_VISIBLE);
      visibleSuggestions    = displayed;
      activeSuggestionIndex = displayed.length ? 0 : -1;

      const grouped = groupSuggestions(displayed);
      let idx = 0;
      const groupsHtml = grouped.map((g) => `
        <div class="smart-search-group">
          <div class="smart-search-category">${Utils.escapeHtml(g.category)}</div>
          ${g.entries.map((e) => buildSuggestionButton(e, idx++, q)).join('')}
        </div>
      `).join('');

      const seeAll = (!isShowingAllResults && all.length > displayed.length)
        ? '<button type="button" class="smart-see-all-btn" data-search-action="see-all">See all results</button>'
        : '';

      dropdownScroll.innerHTML = groupsHtml + seeAll;
      openDropdown();
      updateActiveSuggestion();
    };

    // --- Target navigation ---
    const openTarget = (target) => {
      if (!target) return;

      if (target.type === 'query') {
        const tq = target.query || input.value.trim();
        const top = getRanked(tq, true)[0];
        if (top) executeSuggestion(top, { recentTerm: tq });
        else renderNoResults(tq);
        return;
      }

      if (target.type === 'url') {
        const href = target.href || '#contact';
        if (href.startsWith('#')) { const s = document.querySelector(href); if (s) scrollToElement(s, 'start'); return; }
        if (href.startsWith('tel:') || href.startsWith('mailto:')) { window.location.href = href; return; }
        if (target.newTab) window.open(href, '_blank', 'noopener,noreferrer');
        else window.location.href = href;
        return;
      }

      if (target.type === 'section') {
        const s = document.querySelector(target.selector || '#services');
        if (s) scrollToElement(s, 'start');
        return;
      }

      const el = resolveTargetElement(target);
      if (el) {
        scrollToElement(el, 'center');
        if (target.type === 'service') window.setTimeout(() => el.click(), 260);
        return;
      }

      if (target.fallbackSelector) {
        const fb = document.querySelector(target.fallbackSelector);
        if (fb) scrollToElement(fb, 'start');
      }
    };

    const executeSuggestion = (entry, options = {}) => {
      if (!entry) return;
      addRecent(options.recentTerm || entry.label);
      input.value = entry.label;
      closeDropdown();
      openTarget(entry.target);
    };

    const triggerFirstMatch = () => {
      const q = input.value.trim();
      if (!q) { renderSuggestionList(''); return; }
      const top = getRanked(q, true)[0];
      if (top) executeSuggestion(top, { recentTerm: q });
      else renderNoResults(q);
    };

    const moveActive = (dir) => {
      if (!visibleSuggestions.length) return;
      activeSuggestionIndex = activeSuggestionIndex < 0
        ? 0
        : (activeSuggestionIndex + dir + visibleSuggestions.length) % visibleSuggestions.length;
      updateActiveSuggestion();
    };

    // --- Events ---
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-expanded', 'false');
    form.classList.add('smart-search-ready');

    input.addEventListener('input', () => {
      isShowingAllResults = false;
      if (previousQuery !== input.value.trim()) activeSuggestionIndex = -1;
      previousQuery = input.value.trim();
      renderSuggestionList(input.value);
      input.setAttribute('aria-expanded', 'true');
    });

    input.addEventListener('focus', () => {
      isShowingAllResults = false;
      renderSuggestionList(input.value);
      input.setAttribute('aria-expanded', 'true');
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!dropdown.classList.contains('is-open')) renderSuggestionList(input.value);
        moveActive(1);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (!dropdown.classList.contains('is-open')) renderSuggestionList(input.value);
        moveActive(-1);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (visibleSuggestions.length && activeSuggestionIndex >= 0) {
          executeSuggestion(visibleSuggestions[activeSuggestionIndex], {
            recentTerm: input.value.trim() || visibleSuggestions[activeSuggestionIndex].label
          });
        } else {
          triggerFirstMatch();
        }
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDropdown();
        input.blur();
      }
    });

    form.addEventListener('submit', (event) => { event.preventDefault(); triggerFirstMatch(); });

    // Prevent blur-on-click from closing dropdown before click registers.
    dropdown.addEventListener('mousedown', (event) => {
      if (event.target.closest('.smart-suggestion-item, .smart-see-all-btn')) event.preventDefault();
    });

    // Single delegated click handler for the dropdown.
    dropdown.addEventListener('click', (event) => {
      const seeAll = event.target.closest('[data-search-action="see-all"]');
      if (seeAll) { isShowingAllResults = true; renderSuggestionList(input.value); return; }

      const btn = event.target.closest('.smart-suggestion-item');
      if (!btn) return;
      const idx = Number(btn.dataset.index);
      if (Number.isNaN(idx) || !visibleSuggestions[idx]) return;
      executeSuggestion(visibleSuggestions[idx], {
        recentTerm: input.value.trim() || visibleSuggestions[idx].label
      });
    });

    document.addEventListener('pointerdown', (event) => {
      if (!form.contains(event.target)) { closeDropdown(); input.setAttribute('aria-expanded', 'false'); }
    });

    form.addEventListener('focusout', () => {
      window.setTimeout(() => {
        if (!form.contains(document.activeElement)) { closeDropdown(); input.setAttribute('aria-expanded', 'false'); }
      }, 0);
    });
  };

  // Attach search to every .search-box on the page.
  document.querySelectorAll('.search-box').forEach(setupSmartSearch);

  // =========================================================================
  // 12. SERVICE INTERACTIONS (card panel + mobile slider)
  // =========================================================================

  const setupServiceInteractions = () => {
    const servicesRow = document.querySelector('#services .service-grid')
                     || document.querySelector('#services .row.g-4');
    if (!servicesRow) return;

    servicesRow.classList.add('service-grid');

    const cardColumns = Array.from(servicesRow.children).filter((col) => col.querySelector('.service-card'));
    const serviceCards = cardColumns.map((col) => col.querySelector('.service-card')).filter(Boolean);
    if (!serviceCards.length) return;

    const { phoneHref, phoneLabel } = AppConfig.business;

    // --- Helpers ---
    const buildWaLink = (serviceName) =>
      `https://wa.me/${phoneHref}?text=${encodeURIComponent(`Hi, I want details for ${serviceName}.`)}`;

    const getBadgeVariantClass = (badge) => {
      const v = String(badge ?? '').toLowerCase();
      if (v.includes('popular') || v.includes('chosen')) return 'badge-popular';
      if (v.includes('student'))                          return 'badge-student';
      if (v.includes('bulk') || v.includes('discount'))  return 'badge-bulk';
      if (v.includes('fast'))                             return 'badge-fast';
      return 'badge-default';
    };

    const renderList = (items) => {
      if (!Array.isArray(items) || !items.length) return '<li>Details available on request.</li>';
      return items.map((i) => `<li>${Utils.escapeHtml(i)}</li>`).join('');
    };

    // --- Service detail data ---
    const detailedServices = {
      'Black & White Printing': {
        explanation: 'Crisp monochrome prints for forms, notes, assignments, and office files.',
        commonUses: ['Assignments and exam notes', 'Office forms and records', 'Bulk handouts'],
        startingPrice: ['₹3 per side'],
        deliveryTime: ['2 to 5 minutes for regular work'],
        addOns: ['Stapling', 'Spiral binding', 'Lamination'],
        badge: 'Fast Service', priceTag: 'Starting from ₹3'
      },
      'Color Printing': {
        explanation: 'Vibrant color printing with accurate tones for presentations and project sheets.',
        commonUses: ['Project covers and charts', 'Flyers and notices', 'Brochures and invitations'],
        startingPrice: ['A4 Colour Print: ₹10 per side'],
        deliveryTime: ['5 to 10 minutes'],
        addOns: ['Glossy paper', 'Premium matte paper', 'Lamination'],
        badge: 'Most Popular', priceTag: 'Starting from ₹10'
      },
      'Xerox / Photocopy': {
        explanation: 'Fast photocopy service for everyday document duplication and bulk jobs.',
        commonUses: ['Government forms', 'Legal documents', 'Student notes and records'],
        startingPrice: ['Single copy: ₹1.5 per side', 'Bulk copies: Discount available'],
        deliveryTime: ['Instant for small sets', '15 to 30 min for bulk'],
        addOns: ['Sorting', 'Stapling', 'File set arrangement'],
        badge: 'Most Popular', priceTag: 'Starting from ₹1.5'
      },
      Lamination: {
        explanation: 'Neat edge-sealed lamination that protects documents from wear and moisture.',
        commonUses: ['Certificates', 'ID cards', 'Office notices and menus'],
        startingPrice: ['Small lamination: ₹10 onwards', 'A4 lamination: ₹20 onwards'],
        deliveryTime: ['About 5 minutes per sheet'],
        addOns: ['Glossy finish', 'Matte finish', 'Corner trim'],
        badge: 'Fast Service', priceTag: 'Starting from ₹10'
      },
      'Spiral Binding': {
        explanation: 'Professional spiral binding for reports, projects, and presentation copies.',
        commonUses: ['Project files', 'Office reports', 'Training booklets'],
        startingPrice: ['Small file: ₹30 onwards', 'Thick file: ₹50 onwards'],
        deliveryTime: ['10 to 20 minutes'],
        addOns: ['Transparent covers', 'Cardboard back sheet', 'Name label'],
        badge: 'Student Favorite', priceTag: 'Starting from ₹30'
      },
      'Passport Photos': {
        explanation: 'Quick passport photo prints with clean framing for official and personal use.',
        commonUses: ['Passport and visa forms', 'Admissions and job forms', 'Government IDs'],
        startingPrice: ['20 passport-size photos: ₹30 onwards'],
        deliveryTime: ['10 to 15 minutes'],
        addOns: ['Soft copy sharing', 'Basic face adjustment', 'Extra print sets'],
        badge: 'Fast Service', priceTag: 'Starting from ₹30'
      },
      'Project Printing': {
        explanation: 'Complete project printing support with neat finishing for school and college work.',
        commonUses: ['Seminar reports', 'Assignment submissions', 'Practical files'],
        startingPrice: ['Typical projects start from ₹50 onwards', 'Final pricing depends on pages, color printing, and binding'],
        deliveryTime: ['Same day delivery for regular quantity'],
        addOns: ['Spiral bind', 'Color cover pages', 'Lamination'],
        badge: 'Student Favorite', priceTag: 'Starting from ₹50'
      },
      'Stationery Products': {
        explanation: 'Everyday stationery stock for students, offices, and routine shop needs.',
        commonUses: ['Notebooks and pens', 'Files and folders', 'Craft and chart materials'],
        startingPrice: ['Pens from ₹10', 'Notebooks from ₹30', 'Files from ₹20', 'Calculators from ₹150', 'Cartridges from ₹250', 'Smart Card from ₹80'],
        deliveryTime: ['Instant in-store pickup'],
        addOns: ['Combo packs', 'Bulk school sets', 'Institution pricing'],
        badge: 'Bulk Discount Available', priceTag: 'Starting from ₹10'
      },
      'Blackbook Printing': {
        explanation: 'Durable blackbook print with consistent quality for project submissions.',
        commonUses: ['Engineering records', 'College submissions', 'Archival copies'],
        startingPrice: ['Quote based on size and quantity'],
        deliveryTime: ['Same day for standard jobs'],
        addOns: ['Spiral binding', 'Cover lamination', 'Additional copies'],
        badge: 'Student Favorite', priceTag: 'Custom quote'
      },
      'Letterhead Print': {
        explanation: 'Branded letterhead printing for businesses and professional communication.',
        commonUses: ['Company letters', 'Invoices and proposals', 'Office documentation'],
        startingPrice: ['Starts from ₹2 per sheet in bulk'],
        deliveryTime: ['1 to 2 days depending on quantity'],
        addOns: ['Logo alignment support', 'Paper upgrades', 'Bulk packing'],
        badge: 'Bulk Discount Available', priceTag: 'Bulk pricing'
      },
      'Visiting Card': {
        explanation: 'Clean and professional visiting card prints with premium finish options.',
        commonUses: ['Business networking', 'Shop and service branding', 'Personal profile cards'],
        startingPrice: ['Starts from ₹150 per 100 cards'],
        deliveryTime: ['Same day or next day'],
        addOns: ['Matte/gloss finish', 'Rounded corners', 'Lamination'],
        badge: 'Most Popular', priceTag: 'From ₹150'
      },
      'Billbook Print': {
        explanation: 'Custom billbook and invoice booklet printing for daily business operations.',
        commonUses: ['Retail billing', 'Service invoicing', 'Manual receipts'],
        startingPrice: ['Pricing depends on pages, copies, and size'],
        deliveryTime: ['1 to 2 days'],
        addOns: ['Numbering', 'Duplicate/triplicate sets', 'Custom branding'],
        badge: 'Bulk Discount Available', priceTag: 'Custom quote'
      },
      'Smart Card': {
        explanation: 'Smart card printing for ID cards, membership cards, office cards and custom cards.',
        commonUses: ['ID cards', 'Membership cards', 'Access cards'],
        startingPrice: ['Starting from ₹80'],
        deliveryTime: ['Same day for small batches'],
        addOns: ['Lanyard slot', 'Barcode printing', 'Name personalization'],
        badge: 'Fast Service', priceTag: 'Starting from ₹80'
      },
      'Jumbo Xerox': {
        explanation: 'Large-format xerox and copy services for plans, drawings, and posters.',
        commonUses: ['Architecture plans', 'Engineering drawings', 'Large charts and posters'],
        startingPrice: ['A3/A2/A1/A0 rates available on request'],
        deliveryTime: ['10 to 30 minutes based on size'],
        addOns: ['Roll to sheet trim', 'Set sorting', 'Tube packing'],
        badge: 'Fast Service', priceTag: 'All sizes available'
      },
      'Cartridge Refelling': {
        explanation: 'Reliable ink and toner refilling to keep your printer running affordably.',
        commonUses: ['Home printer refill', 'Office laser printer maintenance', 'Emergency refill support'],
        startingPrice: ['Pricing based on cartridge model'],
        deliveryTime: ['Usually 20 to 40 minutes'],
        addOns: ['Basic nozzle cleaning', 'Print quality check', 'Cartridge handling tips'],
        badge: 'Fast Service', priceTag: 'Model-based price'
      },
      'All Size Scanning': {
        explanation: 'Document scanning in multiple sizes for digital record-keeping and online submissions.',
        commonUses: ['PDF archive', 'Online application uploads', 'Email and WhatsApp sharing'],
        startingPrice: ['Scanning starts from ₹20 per page'],
        deliveryTime: ['2 to 10 minutes'],
        addOns: ['PDF merge', 'Image enhancement', 'Cloud/email send'],
        badge: 'Fast Service', priceTag: 'Starts at ₹20'
      },
      'Computer Accessories': {
        explanation: 'Essential accessories for day-to-day computer and printer usage.',
        commonUses: ['USB cables and adapters', 'Keyboard/mouse needs', 'Printer consumables'],
        startingPrice: ['Multiple budget and premium options available'],
        deliveryTime: ['Instant pickup for in-stock products'],
        addOns: ['Bulk office supply support', 'Product guidance', 'Quick replacement options'],
        badge: 'Bulk Discount Available', priceTag: 'Value pricing'
      }
    };

    const FALLBACK_BADGES = ['Fast Service', 'Most Popular', 'Student Favorite', 'Bulk Discount Available'];

    const getServiceDetails = (card) => {
      // Prefer data-service-id for lookup; fall back to h3 textContent.
      const titleNode   = card.querySelector('h3');
      const summaryNode = card.querySelector('p');
      const iconNode    = card.querySelector('.card-icon i');
      if (!titleNode) return null;

      const title    = card.dataset.serviceId || titleNode.textContent.trim();
      const summary  = summaryNode ? summaryNode.textContent.trim() : '';
      const iconClass = iconNode ? iconNode.className : 'fa-solid fa-file-lines';
      const custom   = detailedServices[title];

      if (!custom) {
        const hash = title.split('').reduce((t, c) => t + c.charCodeAt(0), 0);
        return {
          title, explanation: summary || `Reliable ${title.toLowerCase()} support for students, offices, and everyday needs.`,
          commonUses: ['Student requirements', 'Office documentation', 'Local business support'],
          startingPrice: ['Call or WhatsApp for latest rates'],
          deliveryTime: ['Usually available on the same day'],
          addOns: ['Bulk quantity support', 'Counter guidance'],
          badge: FALLBACK_BADGES[hash % FALLBACK_BADGES.length],
          priceTag: 'Ask for price', iconClass
        };
      }

      return {
        title,
        explanation:   custom.explanation  || summary,
        commonUses:    custom.commonUses    || [],
        startingPrice: custom.startingPrice || ['Call or WhatsApp for latest rates'],
        deliveryTime:  custom.deliveryTime  || ['Usually available on the same day'],
        addOns:        custom.addOns        || [],
        badge:         custom.badge         || 'Fast Service',
        priceTag:      custom.priceTag      || 'Ask for price',
        iconClass:     custom.iconClass     || iconClass
      };
    };

    const buildDetailPanelMarkup = (details) => `
      <div class="service-row-detail-shell">
        <button type="button" class="service-row-close" aria-label="Close service details">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
        <div class="service-row-left">
          <div class="service-detail-icon-large">
            <i class="${Utils.escapeHtml(details.iconClass)}" aria-hidden="true"></i>
          </div>
          <div>
            <h3>${Utils.escapeHtml(details.title)}</h3>
            <p class="service-detail-summary">${Utils.escapeHtml(details.explanation)}</p>
            <div class="service-detail-badges">
              <span class="service-detail-badge tag ${getBadgeVariantClass(details.badge)}">${Utils.escapeHtml(details.badge)}</span>
              <span class="service-detail-badge price">${Utils.escapeHtml(details.priceTag)}</span>
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
            <a class="service-cta-btn" href="${buildWaLink(details.title)}" target="_blank" rel="noopener">WhatsApp Inquiry</a>
            <a class="service-cta-btn is-outline" href="tel:${phoneHref}">Call Now</a>
            <a class="service-cta-btn is-light" href="#contact">Get Quote</a>
          </div>
          <p class="service-row-contact-note">Need quick help? Call ${Utils.escapeHtml(phoneLabel)}.</p>
        </div>
      </div>
    `;

    // --- Panel state ---
    const detailColumn = document.createElement('div');
    detailColumn.className = 'col-12 service-row-detail-col';
    detailColumn.innerHTML = '<div class="service-row-detail-panel" aria-hidden="true"></div>';
    const detailPanel = detailColumn.querySelector('.service-row-detail-panel');

    let activeCard   = null;
    let sliderUi     = null;
    let sliderDotsTrack  = null;
    let sliderDotButtons = [];
    let sliderPrevButton = null;
    let sliderNextButton = null;
    let sliderFocusCard  = null;
    let sliderPointerStartX  = null;
    let sliderWasDragged     = false;
    let sliderScrollTicking  = false;

    const sliderBreakpoint = window.matchMedia('(max-width: 1199.98px)');

    const isSliderLayout = () => servicesRow.classList.contains('service-grid--slider');

    const getServiceColumns = () =>
      Array.from(servicesRow.children).filter(
        (col) => col.classList.contains('service-grid-col') || col.querySelector('.service-card')
      );

    const getRowLastColumn = (cardColumn) => {
      const cols      = getServiceColumns();
      const targetTop = cardColumn.offsetTop;
      const sameRow   = cols.filter((col) => Math.abs(col.offsetTop - targetTop) <= 6);
      return sameRow[sameRow.length - 1] || cardColumn;
    };

    const placeDetailPanelAfterRow = (card) => {
      if (isSliderLayout()) {
        detailColumn.classList.add('is-slider-detail');
        const anchor = sliderUi?.parentElement ? sliderUi : servicesRow;
        anchor.insertAdjacentElement('afterend', detailColumn);
        return;
      }
      detailColumn.classList.remove('is-slider-detail');
      const cardCol = card.closest('.service-grid-col') || card.closest('[class*="col-"]');
      if (!cardCol) return;
      servicesRow.insertBefore(detailColumn, getRowLastColumn(cardCol).nextSibling);
    };

    const setCardState = (card, isActive) => {
      card.classList.toggle('is-active', isActive);
      const lbl = card.querySelector('.service-link-label');
      if (lbl) lbl.textContent = isActive ? 'Hide Details' : 'View Details';
      const link = card.querySelector('.card-link');
      if (link) link.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    };

    const closePanel = () => {
      detailPanel.classList.remove('is-open');
      detailPanel.setAttribute('aria-hidden', 'true');
      if (activeCard) { setCardState(activeCard, false); activeCard = null; }
      window.setTimeout(() => {
        if (!detailPanel.classList.contains('is-open') && detailColumn.parentElement) {
          detailColumn.remove();
        }
      }, 380);
    };

    const openPanelForCard = (card) => {
      const details = getServiceDetails(card);
      if (!details) return;
      if (activeCard && activeCard !== card) setCardState(activeCard, false);
      activeCard = card;
      setCardState(card, true);
      if (isSliderLayout()) setSliderFocusCard(card, { syncDetails: false });
      detailPanel.innerHTML = buildDetailPanelMarkup(details);
      placeDetailPanelAfterRow(card);
      detailPanel.setAttribute('aria-hidden', 'false');
      window.requestAnimationFrame(() => detailPanel.classList.add('is-open'));
      if (isSliderLayout()) centerCardInSlider(card, 'smooth');
    };

    const toggleCardDetails = (card) => {
      if (activeCard === card && detailPanel.classList.contains('is-open')) { closePanel(); return; }
      openPanelForCard(card);
    };

    // --- Slider controls ---
    const updateSliderControlsState = () => {
      if (!sliderDotButtons.length) return;
      sliderDotButtons.forEach((btn, i) => {
        const cur = serviceCards[i] === sliderFocusCard;
        btn.classList.toggle('is-active', cur);
        btn.setAttribute('aria-current', cur ? 'true' : 'false');
      });
      const idx = Math.max(0, serviceCards.indexOf(sliderFocusCard));
      if (sliderPrevButton) sliderPrevButton.disabled = idx <= 0;
      if (sliderNextButton) sliderNextButton.disabled = idx >= serviceCards.length - 1;
    };

    const setSliderFocusCard = (card, options = {}) => {
      if (!card || !serviceCards.includes(card)) return;
      sliderFocusCard = card;
      cardColumns.forEach((col, i) => col.classList.toggle('is-slider-focus', serviceCards[i] === card));
      updateSliderControlsState();
      const shouldSync = options.syncDetails !== false;
      if (shouldSync && detailPanel.classList.contains('is-open') && activeCard && activeCard !== card) {
        openPanelForCard(card);
      }
    };

    const getNearestCardToCenter = () => {
      const center = servicesRow.scrollLeft + (servicesRow.clientWidth / 2);
      let nearest = null;
      let minDist = Infinity;
      cardColumns.forEach((col, i) => {
        const card = serviceCards[i];
        if (!col || !card) return;
        const dist = Math.abs((col.offsetLeft + col.offsetWidth / 2) - center);
        if (dist < minDist) { minDist = dist; nearest = card; }
      });
      return nearest;
    };

    const centerCardInSlider = (card, behavior = 'smooth') => {
      const idx = serviceCards.indexOf(card);
      const col = cardColumns[idx];
      if (idx === -1 || !col) return;
      const left = col.offsetLeft - ((servicesRow.clientWidth - col.offsetWidth) / 2);
      servicesRow.scrollTo({ left: Math.max(0, left), behavior });
    };

    const shiftSliderFocus = (dir) => {
      const cur = Math.max(0, serviceCards.indexOf(sliderFocusCard));
      const target = serviceCards[Math.min(serviceCards.length - 1, Math.max(0, cur + dir))];
      if (!target) return;
      setSliderFocusCard(target);
      centerCardInSlider(target, 'smooth');
    };

    const buildSliderUi = () => {
      if (sliderUi) return;
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
      sliderDotsTrack  = sliderUi.querySelector('.service-slider-dots');

      sliderDotButtons = serviceCards.map((card, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'service-slider-dot';
        btn.setAttribute('aria-label', `Go to ${card.querySelector('h3')?.textContent?.trim() || `Service ${i + 1}`}`);
        btn.addEventListener('click', () => { setSliderFocusCard(card); centerCardInSlider(card, 'smooth'); });
        sliderDotsTrack.appendChild(btn);
        return btn;
      });

      sliderPrevButton?.addEventListener('click', () => shiftSliderFocus(-1));
      sliderNextButton?.addEventListener('click', () => shiftSliderFocus(1));
      servicesRow.insertAdjacentElement('afterend', sliderUi);
    };

    const applySliderMode = () => {
      const enabled = sliderBreakpoint.matches;
      servicesRow.classList.toggle('service-grid--slider', enabled);
      buildSliderUi();
      if (sliderUi) sliderUi.classList.toggle('is-visible', enabled);

      if (enabled) {
        const focus = activeCard || sliderFocusCard || serviceCards[0];
        if (focus) { setSliderFocusCard(focus, { syncDetails: false }); centerCardInSlider(focus, 'auto'); }
      } else {
        sliderFocusCard = null;
        cardColumns.forEach((col) => col.classList.remove('is-slider-focus'));
        updateSliderControlsState();
      }

      if (activeCard && detailPanel.classList.contains('is-open')) placeDetailPanelAfterRow(activeCard);
    };

    // --- Card event wiring ---
    serviceCards.forEach((card, i) => {
      const col = cardColumns[i];
      if (col) {
        col.classList.add('service-grid-col');
        col.style.transitionDelay = `${(i % 4) * 60}ms`;
      }

      card.classList.add('premium-service-card');
      card.setAttribute('tabindex', '0');

      const link = card.querySelector('.card-link');
      if (link) {
        link.setAttribute('href', '#');
        link.setAttribute('role', 'button');
        link.setAttribute('aria-expanded', 'false');
        link.innerHTML = `
          <span class="service-link-label">View Details</span>
          <span class="service-link-meta">
            <i class="fa-solid fa-arrow-right-long service-chevron" aria-hidden="true"></i>
          </span>
        `;
      }

      card.addEventListener('click', (event) => {
        if (event.target.closest('.card-link')) event.preventDefault();
        if (sliderWasDragged) { sliderWasDragged = false; return; }
        if (event.target.closest('a') && !event.target.closest('.card-link')) return;
        toggleCardDetails(card);
      });

      card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        toggleCardDetails(card);
      });
    });

    // Close-panel delegated click.
    detailColumn.addEventListener('click', (event) => {
      if (event.target.closest('.service-row-close')) { event.preventDefault(); closePanel(); }
    });

    // Scroll tracking (rAF-gated).
    servicesRow.addEventListener('scroll', () => {
      if (!isSliderLayout() || sliderScrollTicking) return;
      sliderScrollTicking = true;
      window.requestAnimationFrame(() => {
        sliderScrollTicking = false;
        const nearest = getNearestCardToCenter();
        if (nearest) setSliderFocusCard(nearest);
      });
    }, { passive: true });

    // Drag detection.
    const resetPointerTracking = () => {
      sliderPointerStartX = null;
      window.setTimeout(() => { sliderWasDragged = false; }, 0);
    };

    servicesRow.addEventListener('pointerdown', (event) => {
      if (!isSliderLayout()) return;
      sliderPointerStartX = event.clientX;
      sliderWasDragged = false;
    });

    servicesRow.addEventListener('pointermove', (event) => {
      if (!isSliderLayout() || sliderPointerStartX === null) return;
      if (Math.abs(event.clientX - sliderPointerStartX) > 10) sliderWasDragged = true;
    });

    servicesRow.addEventListener('pointerup',     resetPointerTracking);
    servicesRow.addEventListener('pointercancel', resetPointerTracking);

    // Resize: re-centre active card.
    window.addEventListener('resize', () => {
      if (isSliderLayout()) {
        const focus = activeCard || sliderFocusCard || serviceCards[0];
        if (focus) { setSliderFocusCard(focus, { syncDetails: false }); centerCardInSlider(focus, 'auto'); }
      }
      if (!activeCard || !detailPanel.classList.contains('is-open')) return;
      placeDetailPanelAfterRow(activeCard);
    });

    // MediaQuery change (compatible with both addListener and addEventListener).
    if (typeof sliderBreakpoint.addEventListener === 'function') {
      sliderBreakpoint.addEventListener('change', applySliderMode);
    } else if (typeof sliderBreakpoint.addListener === 'function') {
      sliderBreakpoint.addListener(applySliderMode);
    }

    applySliderMode();
  };

  setupServiceInteractions();

  // =========================================================================
  // 13. FEATURE MODULES — each wrapped by safeRun at the bottom
  // =========================================================================

  const setupScrollProgressIndicator = () => {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0})`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  };

  const setupHeroTypingLine = () => {
    const target = document.getElementById('heroTypingText');
    if (!target) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      target.textContent = 'Fast prints. Reliable service.';
      return;
    }
    const phrases = ['Fast prints. Reliable service.', 'WhatsApp orders in minutes.', 'Trusted by students and offices.'];
    let phraseIdx = 0;
    let charIdx   = 0;
    let deleting  = false;

    const tick = () => {
      const phrase = phrases[phraseIdx];
      charIdx = deleting ? Math.max(0, charIdx - 1) : Math.min(phrase.length, charIdx + 1);
      target.textContent = phrase.slice(0, charIdx);
      let delay = deleting ? 34 : 58;
      if (!deleting && charIdx === phrase.length) { delay = 1450; deleting = true; }
      else if (deleting && charIdx === 0) { deleting = false; phraseIdx = (phraseIdx + 1) % phrases.length; delay = 360; }
      window.setTimeout(tick, delay);
    };
    tick();
  };

  const setupCounterAnimations = () => {
    const counters = Array.from(document.querySelectorAll('.counter-value[data-counter-target]'));
    if (!counters.length) return;

    const animate = (el) => {
      if (el.dataset.counterAnimated === 'true') return;
      el.dataset.counterAnimated = 'true';

      const target    = Number(el.dataset.counterTarget || 0);
      const suffix    = el.dataset.counterSuffix || '';
      const duration  = 1500;
      const startTime = performance.now();
      const ease      = (v) => 1 - ((1 - v) ** 3);
      const fmt       = (v) => target >= 1000
        ? Math.round(v).toLocaleString('en-IN')
        : String(Math.round(v));

      const step = (now) => {
        const t = Math.min(1, (now - startTime) / duration);
        el.textContent = `${fmt(target * ease(t))}${suffix}`;
        if (t < 1) window.requestAnimationFrame(step);
        else el.textContent = `${fmt(target)}${suffix}`;
      };
      window.requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        (entries) => entries.forEach((e) => { if (e.isIntersecting) { animate(e.target); obs.unobserve(e.target); } }),
        { threshold: 0.35, rootMargin: '0px 0px -8% 0px' }
      );
      counters.forEach((c) => obs.observe(c));
    } else {
      counters.forEach(animate);
    }
  };

  const setupFaqAccordion = () => {
    const items = Array.from(document.querySelectorAll('.faq-item'));
    if (!items.length) return;

    const setItemState = (item, open) => {
      const q = item.querySelector('.faq-question');
      const a = item.querySelector('.faq-answer');
      if (!q || !a) return;
      item.classList.toggle('is-open', open);
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
      a.style.maxHeight = open ? `${a.scrollHeight}px` : '0px';
    };

    items.forEach((item) => {
      const q = item.querySelector('.faq-question');
      if (!q) return;
      setItemState(item, false);
      q.addEventListener('click', () => {
        const willOpen = !item.classList.contains('is-open');
        items.forEach((i) => setItemState(i, i === item ? willOpen : false));
      });
    });

    window.addEventListener('resize', () => {
      items.forEach((item) => {
        if (!item.classList.contains('is-open')) return;
        const a = item.querySelector('.faq-answer');
        if (a) a.style.maxHeight = `${a.scrollHeight}px`;
      });
    });
  };

  const setupRippleEffects = () => {
    const targets = document.querySelectorAll(
      '.cta-btn, .service-cta-btn, .map-directions-btn, .action-btn, .mobile-bottom-bar a, ' +
      '.testimonial-nav-btn, .faq-question, .quick-convert-actions a, .pdf-download-btn, ' +
      '.bulk-submit-btn, .chat-fab, .chat-quick-btn, .quote-cta-btn'
    );

    targets.forEach((el) => {
      el.classList.add('ripple-surface');
      el.addEventListener('pointerdown', (event) => {
        const bounds = el.getBoundingClientRect();
        const dot = document.createElement('span');
        dot.className = 'ripple-dot';
        dot.style.left = `${event.clientX - bounds.left}px`;
        dot.style.top  = `${event.clientY - bounds.top}px`;
        el.appendChild(dot);
        dot.addEventListener('animationend', () => dot.remove());
      });
    });
  };

  const setupImageLoadingSkeletons = () => {
    document.querySelectorAll('.gallery-item img, .product-card img, .hero-image').forEach((img) => {
      const wrapper = img.closest('.gallery-item, .product-card, .hero-image-card');
      if (!wrapper) return;
      wrapper.classList.add('image-skeleton');
      const done = () => wrapper.classList.add('is-loaded');
      if (img.complete && img.naturalWidth > 0) done();
      else {
        img.addEventListener('load',  done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
  };

  const setupTestimonialSlider = () => {
    const track       = document.getElementById('testimonialsTrack');
    const prevBtn     = document.getElementById('testimonialsPrevBtn');
    const nextBtn     = document.getElementById('testimonialsNextBtn');
    const dotsCont    = document.getElementById('testimonialsDots');
    if (!track || !prevBtn || !nextBtn || !dotsCont) return;

    const slides         = Array.from(track.querySelectorAll('.testimonial-slide'));
    if (!slides.length) return;

    const mobileBreak    = window.matchMedia('(max-width: 991px)');
    let activeIndex      = 0;
    let scrollTicking    = false;

    dotsCont.innerHTML = '';
    const dots = slides.map((_, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'testimonial-slider-dot';
      btn.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      btn.addEventListener('click', () => centerSlide(i, 'smooth'));
      dotsCont.appendChild(btn);
      return btn;
    });

    const setActive = (i) => {
      activeIndex = Math.max(0, Math.min(slides.length - 1, i));
      dots.forEach((d, di) => d.classList.toggle('is-active', di === activeIndex));
      prevBtn.disabled = activeIndex === 0;
      nextBtn.disabled = activeIndex === slides.length - 1;
    };

    const nearestIdx = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs((s.offsetLeft + s.offsetWidth / 2) - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    };

    const centerSlide = (i, behavior = 'smooth') => {
      const s = slides[i];
      if (!s) return;
      track.scrollTo({ left: Math.max(0, s.offsetLeft - (track.clientWidth - s.offsetWidth) / 2), behavior });
      setActive(i);
    };

    track.addEventListener('scroll', () => {
      if (!mobileBreak.matches || scrollTicking) return;
      scrollTicking = true;
      window.requestAnimationFrame(() => { scrollTicking = false; setActive(nearestIdx()); });
    }, { passive: true });

    prevBtn.addEventListener('click', () => centerSlide(activeIndex - 1));
    nextBtn.addEventListener('click', () => centerSlide(activeIndex + 1));

    const sync = () => {
      if (!mobileBreak.matches) { setActive(0); return; }
      window.requestAnimationFrame(() => setActive(nearestIdx()));
    };

    if (typeof mobileBreak.addEventListener === 'function') mobileBreak.addEventListener('change', sync);
    else if (typeof mobileBreak.addListener === 'function') mobileBreak.addListener(sync);
    sync();
  };

  const setupTiltEffects = () => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    document.querySelectorAll('.tilt-target').forEach((el) => {
      const reset = () => {
        el.style.setProperty('--tilt-rotate-x', '0deg');
        el.style.setProperty('--tilt-rotate-y', '0deg');
      };
      el.addEventListener('pointermove', (event) => {
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height) return;
        const rx = (event.clientX - b.left) / b.width;
        const ry = (event.clientY - b.top)  / b.height;
        el.style.setProperty('--tilt-rotate-x', `${((0.5 - ry) * 7).toFixed(2)}deg`);
        el.style.setProperty('--tilt-rotate-y', `${((rx - 0.5) * 8).toFixed(2)}deg`);
      });
      el.addEventListener('pointerleave',  reset);
      el.addEventListener('pointercancel', reset);
      el.addEventListener('blur',          reset);
    });
  };

  const setupHeroParallax = () => {
    const hero      = document.querySelector('.hero-section');
    const tilt      = document.querySelector('.hero-image-tilt');
    if (!hero || !tilt) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      tilt.style.setProperty('--hero-parallax-y', '0px');
      return;
    }
    const update = () => {
      const b  = hero.getBoundingClientRect();
      const vh = Math.max(window.innerHeight, 1);
      const offset = Math.max(-1, Math.min(1, ((b.top + b.height / 2) - vh / 2) / vh));
      tilt.style.setProperty('--hero-parallax-y', `${(offset * -10).toFixed(2)}px`);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  };

  const setupNavigationExperience = () => {
    const navLinks = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
    if (!navLinks.length) return;

    const navList = document.querySelector('.nav-strip .navbar-nav');
    const sectionLinkMap = new Map();
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href?.startsWith('#') && !sectionLinkMap.has(href)) sectionLinkMap.set(href, link);
    });

    let activeLink = navLinks.find((l) => l.classList.contains('active')) || navLinks[0];
    let indicator  = null;

    const positionIndicator = () => {
      if (!navList || !indicator || !activeLink) return;
      if (window.matchMedia('(max-width: 991px)').matches) { indicator.style.opacity = '0'; return; }
      const w    = Math.min(58, Math.max(24, activeLink.offsetWidth - 28));
      const left = activeLink.offsetLeft + (activeLink.offsetWidth - w) / 2;
      indicator.style.width     = `${w}px`;
      indicator.style.transform = `translateX(${left}px)`;
      indicator.style.opacity   = '1';
    };

    const setActiveLink = (link) => {
      if (!link) return;
      activeLink = link;
      navLinks.forEach((l) => l.classList.toggle('active', l === link));
      window.requestAnimationFrame(positionIndicator);
    };

    if (navList) {
      navList.classList.add('has-active-indicator');
      indicator = navList.querySelector('.nav-active-indicator');
      if (!indicator) {
        indicator = document.createElement('span');
        indicator.className = 'nav-active-indicator';
        navList.appendChild(indicator);
      }
      window.requestAnimationFrame(positionIndicator);
      window.addEventListener('resize', positionIndicator);
    }

    const sections = Array.from(sectionLinkMap.keys())
      .map((href) => document.querySelector(href))
      .filter(Boolean);

    if (sections.length) {
      const obs = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (!visible?.target?.id) return;
          const link = sectionLinkMap.get(`#${visible.target.id}`);
          if (link) setActiveLink(link);
        },
        { rootMargin: '-38% 0px -52% 0px', threshold: [0.15, 0.35, 0.6] }
      );
      sections.forEach((s) => obs.observe(s));
    }

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        setActiveLink(link);
        const collapse = document.querySelector('.navbar-collapse.show');
        if (collapse && window.bootstrap) {
          bootstrap.Collapse.getOrCreateInstance(collapse).hide();
        }
      });
    });
  };

  const setupMobileNavigationExperience = () => {
    const menuBtn  = document.querySelector('.mobile-menu-btn');
    const collapse = document.getElementById('mainNavbar');
    if (!menuBtn || !collapse || !window.bootstrap) return;

    const desktopBreak = window.matchMedia('(min-width: 992px)');
    const instance     = bootstrap.Collapse.getOrCreateInstance(collapse, { toggle: false });

    const syncState = () => {
      const open = collapse.classList.contains('show');
      menuBtn.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('mobile-nav-open', open && !desktopBreak.matches);
    };

    collapse.addEventListener('show.bs.collapse',   () => { menuBtn.classList.add('is-open'); if (!desktopBreak.matches) document.body.classList.add('mobile-nav-open'); menuBtn.setAttribute('aria-expanded', 'true'); });
    collapse.addEventListener('hide.bs.collapse',   () => { menuBtn.classList.remove('is-open'); document.body.classList.remove('mobile-nav-open'); menuBtn.setAttribute('aria-expanded', 'false'); });
    collapse.addEventListener('shown.bs.collapse',  syncState);
    collapse.addEventListener('hidden.bs.collapse', syncState);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && collapse.classList.contains('show')) instance.hide();
    });

    document.addEventListener('click', (event) => {
      if (desktopBreak.matches || !collapse.classList.contains('show')) return;
      if (collapse.contains(event.target) || menuBtn.contains(event.target)) return;
      instance.hide();
    });

    const handleBreakpoint = () => {
      if (desktopBreak.matches) {
        document.body.classList.remove('mobile-nav-open');
        menuBtn.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      } else {
        syncState();
      }
    };

    if (typeof desktopBreak.addEventListener === 'function') desktopBreak.addEventListener('change', handleBreakpoint);
    else if (typeof desktopBreak.addListener === 'function') desktopBreak.addListener(handleBreakpoint);

    syncState();
  };

  const setupDesktopCtaRailVisibility = () => {
    const rail = document.querySelector('.desktop-cta-rail');
    const hero = document.getElementById('home') || document.querySelector('.hero-section');
    if (!rail || !hero) return;

    const desktopBreak   = window.matchMedia('(min-width: 992px)');
    const OFFSET         = AppConfig.scroll.desktopCtaRailRevealOffset;
    let railVisible      = false;
    let ticking          = false;

    const apply = (show) => {
      rail.setAttribute('aria-hidden', show ? 'false' : 'true');
      if (show === railVisible) return;
      railVisible = show;
      rail.classList.toggle('is-visible', show);
    };

    const sync = () => {
      apply(desktopBreak.matches && hero.getBoundingClientRect().bottom <= OFFSET);
    };

    const queue = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => { ticking = false; sync(); });
    };

    sync();

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(() => queue(), {
        threshold: [0, 0.12, 0.25, 0.5, 0.75, 1],
        rootMargin: '-88px 0px 0px 0px'
      });
      obs.observe(hero);
    }

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);

    if (typeof desktopBreak.addEventListener === 'function') desktopBreak.addEventListener('change', queue);
    else if (typeof desktopBreak.addListener === 'function') desktopBreak.addListener(queue);
  };

  const setupBackToTop = () => {
    const btn = document.getElementById('backToTopBtn');
    if (!btn) return;
    const THRESHOLD = AppConfig.scroll.backToTopThreshold;
    const update = () => {
      const visible = window.scrollY > THRESHOLD;
      btn.classList.toggle('is-visible', visible);
      btn.setAttribute('aria-hidden', visible ? 'false' : 'true');
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  const setupGalleryLightbox = () => {
    const lightbox = document.getElementById('galleryLightbox');
    const images   = Array.from(document.querySelectorAll('#gallery .gallery-item img'));
    if (!lightbox || !images.length) return;

    const imgEl    = lightbox.querySelector('.gallery-lightbox-image');
    const caption  = lightbox.querySelector('.gallery-lightbox-caption');
    const closeBtn = lightbox.querySelector('.gallery-lightbox-close');
    const prevBtn  = lightbox.querySelector('.gallery-lightbox-nav.is-prev');
    const nextBtn  = lightbox.querySelector('.gallery-lightbox-nav.is-next');
    if (!imgEl || !caption || !closeBtn || !prevBtn || !nextBtn) return;

    let activeIdx     = 0;
    let triggerEl     = null;

    const sync = () => {
      const img = images[activeIdx];
      if (!img) return;
      imgEl.src       = img.currentSrc || img.src;
      imgEl.alt       = img.alt || `Gallery image ${activeIdx + 1}`;
      caption.textContent = img.alt || `Gallery image ${activeIdx + 1} of ${images.length}`;
    };

    const open = (i) => {
      activeIdx  = (i + images.length) % images.length;
      triggerEl  = images[activeIdx];
      sync();
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
      window.setTimeout(() => closeBtn.focus(), 0);
    };

    const close = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
      if (triggerEl) triggerEl.focus();
    };

    const prev = () => { activeIdx = (activeIdx - 1 + images.length) % images.length; sync(); };
    const next = () => { activeIdx = (activeIdx + 1) % images.length;                 sync(); };

    images.forEach((img, i) => {
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', `Open image preview: ${img.alt || `Gallery image ${i + 1}`}`);
      img.addEventListener('click', () => open(i));
      img.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
    });

    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', prev);
    nextBtn.addEventListener('click', next);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape')     { e.preventDefault(); close(); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    });
  };

  const setupAddressCopy = () => {
    const target = document.querySelector('[data-copy-address]');
    if (!target) return;

    const raw  = target.dataset.copyText || target.textContent || '';
    const text = raw.replace(/\s+/g, ' ').trim();

    const fallbackCopy = (value) => {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:absolute;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { /* ignore */ }
      document.body.removeChild(ta);
      return ok;
    };

    const runAnimation = () => {
      target.classList.add('is-copied');
      window.setTimeout(() => target.classList.remove('is-copied'), 700);
    };

    const handleCopy = async () => {
      if (!text) { Toast.show('Address unavailable. Please copy manually.', { isError: true, duration: 2400 }); return; }
      let copied = false;
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(text); copied = true; } catch { copied = false; }
      }
      if (!copied) copied = fallbackCopy(text);
      runAnimation();
      Toast.show(copied ? 'Address copied' : 'Unable to copy. Please copy manually.', {
        isError: !copied,
        duration: copied ? 1800 : 2400
      });
    };

    target.addEventListener('click', (e) => { e.preventDefault(); handleCopy(); });
  };

  const setupStickyWhatsAppButton = () => {
    const btn  = document.getElementById('stickyWhatsAppBtn');
    const hero = document.getElementById('home') || document.querySelector('.hero-section');
    if (!btn || !hero) return;

    const number  = WhatsApp.getNumber();
    const message = btn.dataset.whatsappMessage || 'Hi! I want to place a print order.';

    btn.href = WhatsApp.buildUrl(number, message);

    const OFFSET     = AppConfig.scroll.stickyWhatsAppRevealOffset;
    let isVisible    = false;
    let ticking      = false;

    const apply = (show) => {
      if (show === isVisible) return;
      isVisible = show;
      btn.classList.toggle('is-visible', show);
      btn.setAttribute('aria-hidden', show ? 'false' : 'true');
    };

    const check = () => apply(hero.getBoundingClientRect().bottom <= OFFSET);
    const queue = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => { ticking = false; check(); });
    };

    check();

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(() => queue(), {
        threshold: [0, 0.2, 0.5, 1],
        rootMargin: '-60px 0px 0px 0px'
      });
      obs.observe(hero);
    }

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
  };

  const setupBulkEnquiryForm = () => {
    const bulkForm = document.getElementById('bulkEnquiryForm');
    if (!bulkForm) return;

    const number      = WhatsApp.getNumber();
    const email       = WhatsApp.getEmail();
    const submitBtn   = bulkForm.querySelector('.bulk-submit-btn');
    const statusLabel = bulkForm.querySelector('#bulkFormStatus');
    const uploadZone  = bulkForm.querySelector('#bulkUpload');
    const fileInput   = bulkForm.querySelector('#bulkFile');
    const filePreview = bulkForm.querySelector('#bulkFilePreview');
    const shareBtn    = bulkForm.querySelector('#bulkShareBtn');
    const browseBtn   = uploadZone?.querySelector('button');

    const requiredFields = [
      bulkForm.querySelector('#bulkName'),
      bulkForm.querySelector('#bulkBusiness'),
      bulkForm.querySelector('#bulkPhone'),
      bulkForm.querySelector('#bulkService'),
      bulkForm.querySelector('#bulkQuantity'),
      bulkForm.querySelector('#bulkDescription')
    ].filter(Boolean);

    let selectedFile = null;
    let previewUrl   = null;

    const setStatus = (msg, { isError = false } = {}) => {
      if (!statusLabel) return;
      statusLabel.textContent = msg;
      statusLabel.classList.toggle('is-error', isError);
    };

    const renderFilePreview = () => {
      if (!filePreview) return;
      filePreview.innerHTML = '';
      if (!selectedFile) return;

      const isImage = selectedFile.type.startsWith('image/');
      const card    = document.createElement('div');
      card.className = 'bulk-file-card';

      const thumb = document.createElement('div');
      thumb.className = 'bulk-file-thumb';
      if (isImage) {
        previewUrl = URL.createObjectURL(selectedFile);
        const img = document.createElement('img');
        img.src = previewUrl; img.alt = 'Uploaded preview';
        thumb.appendChild(img);
      } else {
        thumb.innerHTML = '<i class="fa-solid fa-file-lines" aria-hidden="true"></i>';
      }

      const info = document.createElement('div');
      info.className = 'bulk-file-info';
      info.innerHTML = `<h4>${selectedFile.name}</h4><p>${Utils.formatFileSize(selectedFile.size)} file ready for review</p>`;

      card.appendChild(thumb);
      card.appendChild(info);
      filePreview.appendChild(card);
      if (shareBtn) shareBtn.disabled = false;
    };

    const clearFile = () => {
      if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
      selectedFile = null;
      if (fileInput) fileInput.value = '';
      if (filePreview) filePreview.innerHTML = '';
      if (shareBtn) shareBtn.disabled = true;
    };

    const validateFile = (file) => {
      if (!file) return true;
      const ALLOWED = ['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/png'];
      if (file.size > 10 * 1024 * 1024) { setStatus('File too large. Please upload files under 10MB.', { isError: true }); return false; }
      if (file.type && !ALLOWED.includes(file.type)) { setStatus('Unsupported file type. Upload PDF, DOC, or JPG files.', { isError: true }); return false; }
      return true;
    };

    const handleFile = (file) => {
      clearFile();
      if (!file || !validateFile(file)) return;
      selectedFile = file;
      renderFilePreview();
      setStatus('File attached. We will review it shortly.');
    };

    if (uploadZone && fileInput) {
      uploadZone.addEventListener('click', () => fileInput.click());
      browseBtn?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fileInput.click(); });
      fileInput.addEventListener('change', (e) => handleFile(e.target.files?.[0]));

      uploadZone.addEventListener('dragover',  (e) => { e.preventDefault(); uploadZone.classList.add('is-dragover'); });
      uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('is-dragover'));
      uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('is-dragover');
        const file = e.dataTransfer?.files?.[0];
        if (!file) return;
        if (fileInput && typeof DataTransfer !== 'undefined') {
          const dt = new DataTransfer(); dt.items.add(file); fileInput.files = dt.files;
        }
        handleFile(file);
      });
    }

    shareBtn?.addEventListener('click', async () => {
      if (!selectedFile) { setStatus('Please select a file to share first.', { isError: true }); return; }
      const msg = `Bulk enquiry file: ${selectedFile.name}`;
      if (navigator.share && navigator.canShare?.({ files: [selectedFile] })) {
        try {
          await navigator.share({ files: [selectedFile], title: 'Virar Stationery Bulk Enquiry', text: msg });
          setStatus('Share sheet opened. Please choose WhatsApp.');
          return;
        } catch { /* fall through */ }
      }
      window.open(WhatsApp.buildUrl(number, `${msg}. Please confirm the best way to send this file.`), '_blank', 'noopener,noreferrer');
      setStatus('WhatsApp opened. Attach the file manually if needed.');
    });

    const buildBulkMessage = () => {
      const name  = String(bulkForm.querySelector('#bulkName')?.value        ?? '').trim();
      const biz   = String(bulkForm.querySelector('#bulkBusiness')?.value    ?? '').trim();
      const phone = String(bulkForm.querySelector('#bulkPhone')?.value       ?? '').trim();
      const em    = String(bulkForm.querySelector('#bulkEmail')?.value       ?? '').trim();
      const svc   = String(bulkForm.querySelector('#bulkService')?.value     ?? '').trim();
      const qty   = String(bulkForm.querySelector('#bulkQuantity')?.value    ?? '').trim();
      const desc  = String(bulkForm.querySelector('#bulkDescription')?.value ?? '').trim();
      const fileLn = selectedFile
        ? `File: ${selectedFile.name} (${Utils.formatFileSize(selectedFile.size)}) - please confirm best way to share.`
        : 'File: Not attached';
      return ['Bulk / Business Enquiry', '', `Name: ${name}`, `Business: ${biz}`, `Phone: ${phone}`,
        `Email: ${em || 'N/A'}`, `Service: ${svc}`, `Quantity: ${qty}`, `Notes: ${desc}`, fileLn].join('\n');
    };

    attachFieldClearListeners(requiredFields);

    bulkForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!validateFields(requiredFields)) return;

      setButtonLoading(submitBtn, true, { loadingHtml: '<span class="btn-spinner" aria-hidden="true"></span><span>Sending...</span>' });
      setStatus('Opening WhatsApp for your business enquiry...');

      const msg      = buildBulkMessage();
      const waUrl    = WhatsApp.buildUrl(number, msg);
      const mailto   = WhatsApp.buildMailto(email, AppConfig.business.bulkEnquirySubject, msg);

      window.setTimeout(() => {
        const opened = WhatsApp.open(waUrl, mailto);
        setButtonLoading(submitBtn, false, { loadingHtml: '<span class="btn-spinner" aria-hidden="true"></span><span>Sending...</span>' });
        if (opened) {
          bulkForm.reset();
          clearFile();
          requiredFields.forEach((f) => { f.classList.remove('is-invalid'); f.setAttribute('aria-invalid', 'false'); });
          setStatus('WhatsApp opened. Please send your enquiry.');
          Toast.show('WhatsApp opened for your bulk enquiry.', { duration: 2200 });
        } else {
          setStatus('WhatsApp unavailable. Opening email fallback...', { isError: true });
          Toast.show('WhatsApp unavailable. Opening email fallback...', { isError: true, duration: 2800 });
        }
      }, AppConfig.timing.bulkSubmitDelay);
    });
  };

  const setupPdfDownloads = () => {
    const buttons = Array.from(document.querySelectorAll('.pdf-download-btn'));
    if (!buttons.length) return;

    const templates = {
      'price-list': {
        filename: 'virar-price-list.pdf',
        title:    'Virar Stationery & Jumbo Xerox',
        subtitle: 'Price List (Indicative)',
        meta: ['Updated: April 2026', 'Location: Near Old Viva College, Virar West', 'WhatsApp: +91 70210 72757'],
        sections: [
          { title: 'Printing & Xerox', items: ['Xerox / Photocopy (A4): Rs 1.5 per side', 'Black & White Print (A4): Rs 3 per side', 'Color Print (A4): Rs 10 per side', 'Color Print (A3): Rs 20 per side'] },
          { title: 'Finishing & Binding', items: ['Lamination (A4): Rs 10 per sheet', 'Lamination (A3): Rs 20 per sheet', 'Spiral Binding: Rs 30 per set', 'Project Binding (bulk): Price on request'] },
          { title: 'Photo & Cards', items: ['Passport Photos: Rs 30 per set', 'Smart Card: Rs 80 per card', 'Visiting Card (100 pcs): From Rs 150'] },
          { title: 'Large Format', items: ['Jumbo Xerox (A2/A1/A0): Price on request', 'Plotting and drawings: Price on request'] }
        ],
        footerLines: ['Bulk orders and student discounts available on selected services.', 'Final pricing depends on paper type, file quality, and finishing options.']
      },
      'service-guide': {
        filename: 'virar-service-guide.pdf',
        title:    'Virar Stationery & Jumbo Xerox',
        subtitle: 'Service Guide',
        meta: ['Updated: April 2026', 'WhatsApp: +91 70210 72757', 'Open: 8:00 AM - 9:00 PM (7 days)'],
        sections: [
          { title: 'Core Services', items: ['Black & White Printing (A4/A3)', 'Color Printing (A4/A3)', 'Xerox / Photocopy (bulk available)', 'Lamination and document protection'] },
          { title: 'Project & Office Work', items: ['Spiral Binding and project files', 'Letterhead, visiting cards, and billbooks', 'Smart cards and ID cards', 'Large format printing (A2/A1/A0)'] },
          { title: 'How to Order on WhatsApp', items: ['Send your file and quantity', 'Mention paper size and color preference', 'Share any deadline or pickup time', 'We confirm price and readiness time'] }
        ],
        footerLines: ['Bulk orders and student discounts available on selected services.', 'Final pricing depends on paper type, quantity, and finishing options.']
      }
    };

    // jsPDF is loaded on-demand and reused.
    let jsPdfPromise = null;
    const loadJsPdf = () => {
      if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf);
      if (jsPdfPromise) return jsPdfPromise;
      jsPdfPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
        s.async = true;
        s.onload  = () => resolve(window.jspdf);
        s.onerror = () => reject(new Error('jsPDF failed to load'));
        document.head.appendChild(s);
      });
      return jsPdfPromise;
    };

    const buildPdf = (tmpl) => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const mx = 48;
      let y = 64;
      const maxW = 520;

      doc.setFont('helvetica', 'bold');   doc.setFontSize(18);
      doc.text(tmpl.title, mx, y);        y += 24;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(12);
      doc.text(tmpl.subtitle, mx, y);

      if (Array.isArray(tmpl.meta)) {
        y += 18; doc.setFontSize(10); doc.setTextColor(90);
        tmpl.meta.forEach((l) => { doc.text(l, mx, y); y += 14; });
      }

      y += 12; doc.setDrawColor(230); doc.line(mx, y, mx + maxW, y); y += 18;
      doc.setTextColor(20); doc.setFontSize(11);

      if (Array.isArray(tmpl.sections)) {
        tmpl.sections.forEach((sec) => {
          doc.setFont('helvetica', 'bold');   doc.text(sec.title, mx, y); y += 16;
          doc.setFont('helvetica', 'normal');
          (sec.items || []).forEach((item) => {
            const wrapped = doc.splitTextToSize(`- ${item}`, maxW);
            doc.text(wrapped, mx, y); y += 14 * wrapped.length;
          });
          y += 8;
        });
      } else if (Array.isArray(tmpl.lines)) {
        tmpl.lines.forEach((l) => { doc.text(l, mx, y); y += 18; });
      }

      if (Array.isArray(tmpl.footerLines)) {
        y += 6; doc.setTextColor(90); doc.setFontSize(9);
        tmpl.footerLines.forEach((l) => {
          const wrapped = doc.splitTextToSize(l, maxW);
          doc.text(wrapped, mx, y); y += 12 * wrapped.length;
        });
      }

      doc.save(tmpl.filename);
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', async (event) => {
        event.preventDefault();
        const tmpl = templates[btn.dataset.pdfType];
        if (!tmpl) return;

        btn.classList.add('is-loading'); btn.disabled = true;
        Toast.show('Preparing your PDF download...', { duration: 1600 });

        try {
          await loadJsPdf();
          buildPdf(tmpl);
          Toast.show('Download started.', { duration: 1800 });
        } catch {
          Toast.show('Unable to download now. Please try again.', { isError: true, duration: 2400 });
        } finally {
          window.setTimeout(() => { btn.classList.remove('is-loading'); btn.disabled = false; }, 300);
        }
      });
    });
  };

  const setupChatWidget = () => {
    const widget    = document.getElementById('chatWidget');
    const fab       = document.getElementById('chatFab');
    const panel     = document.getElementById('chatPanel');
    const closeBtn  = document.getElementById('chatClose');
    const messages  = document.getElementById('chatMessages');
    if (!widget || !fab || !panel || !closeBtn || !messages) return;

    const quickBtns  = Array.from(panel.querySelectorAll('[data-quick-reply]'));
    const waLink      = panel.querySelector('[data-chat-whatsapp]');
    const number      = WhatsApp.getNumber();
    const DEFAULT_MSG = 'Hi! I need help with printing.';

    const syncWaLink = (msg) => {
      if (waLink) waLink.href = WhatsApp.buildUrl(number, msg || DEFAULT_MSG);
    };

    const toggle = (open) => {
      widget.classList.toggle('is-open', open);
      panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { syncWaLink(DEFAULT_MSG); window.setTimeout(() => panel.focus(), 0); }
    };

    const append = (text, type = 'user') => {
      const msg = document.createElement('div');
      msg.className = `chat-message is-${type}`;
      const p = document.createElement('p');
      p.textContent = text;
      msg.appendChild(p);
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    };

    const quickReplies = {
      'Send files': 'Great! Please send your files on WhatsApp so we can confirm details quickly.',
      'Check price': 'Share quantity, size, and color preferences for a fast price estimate.',
      Location: 'We are near Old Viva College, Virar West. Tap WhatsApp for directions.'
    };

    fab.addEventListener('click', () => toggle(!widget.classList.contains('is-open')));
    closeBtn.addEventListener('click', () => toggle(false));

    quickBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const reply    = btn.dataset.quickReply || '';
        append(reply, 'user');
        const response = quickReplies[reply] || 'We are here to help. Share your request on WhatsApp.';
        window.setTimeout(() => append(response, 'agent'), 260);
        syncWaLink(`Chat request: ${reply}. Please assist.`);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && widget.classList.contains('is-open')) toggle(false);
    });
  };

  const setupQuoteCalculator = () => {
    const form = document.getElementById('quoteCalculator');
    if (!form) return;

    const serviceSelect   = form.querySelector('#quoteService');
    const sizeSelect      = form.querySelector('#quoteSize');
    const colorSelect     = form.querySelector('#quoteColor');
    const qtyInput        = form.querySelector('#quoteQty');
    const laminationAddon = form.querySelector('#quoteAddonLamination');
    const bindingAddon    = form.querySelector('#quoteAddonBinding');
    const unitCostEl      = document.getElementById('quoteUnitCost');
    const totalCostEl     = document.getElementById('quoteTotalCost');
    const summaryLine     = document.getElementById('quoteSummaryLine');
    const waBtn           = document.getElementById('quoteWhatsAppBtn');

    if (!serviceSelect || !sizeSelect || !colorSelect || !qtyInput ||
        !unitCostEl || !totalCostEl || !summaryLine || !waBtn) return;

    const PRICING = {
      'bw-print':    { label: 'Black & White Printing', sizes: ['A4','A3'],        colors: ['bw'],         rates: { A4:{bw:3},   A3:{bw:6}                       }, unit: 'page',  addons: ['lamination','binding'] },
      'color-print': { label: 'Color Printing',          sizes: ['A4','A3'],        colors: ['color'],      rates: { A4:{color:10},A3:{color:20}                  }, unit: 'page',  addons: ['lamination','binding'] },
      'xerox':       { label: 'Xerox / Photocopy',       sizes: ['A4','A3'],        colors: ['bw','color'], rates: { A4:{bw:1.5,color:9},A3:{bw:3,color:18}      }, unit: 'page',  addons: ['binding'] },
      'lamination':  { label: 'Lamination',              sizes: ['A4','A3','A2'],   colors: ['bw'],         rates: { A4:{bw:10}, A3:{bw:20}, A2:{bw:35}          }, unit: 'sheet', addons: [] },
      'binding':     { label: 'Spiral Binding',          sizes: ['Standard'],       colors: ['bw'],         rates: { Standard:{bw:30}                            }, unit: 'set',   addons: [] },
      'passport':    { label: 'Passport Photos',         sizes: ['Standard'],       colors: ['color'],      rates: { Standard:{color:30}                         }, unit: 'set',   addons: [] },
      'smart-card':  { label: 'Smart Card',              sizes: ['Standard'],       colors: ['color'],      rates: { Standard:{color:80}                         }, unit: 'card',  addons: [] },
      'jumbo-xerox': { label: 'Jumbo Xerox',             sizes: ['A2','A1','A0'],   colors: ['bw'],         rates: { A2:{bw:30}, A1:{bw:55}, A0:{bw:80}         }, unit: 'sheet', addons: [] }
    };

    const ADDON_RATES = {
      lamination: { A4: 10, A3: 20, A2: 35, A1: 55, A0: 80 },
      binding: 30
    };

    const syncOptions = (svc) => {
      const sizes  = svc.sizes  || [];
      const colors = svc.colors || [];

      Array.from(sizeSelect.options).forEach((opt) => {
        const ok = sizes.includes(opt.value) || (opt.value === 'A4' && !sizes.length);
        opt.disabled = !ok; opt.hidden = !ok;
      });
      if (!sizes.includes(sizeSelect.value)) sizeSelect.value = sizes[0] || 'A4';

      Array.from(colorSelect.options).forEach((opt) => {
        const ok = colors.includes(opt.value);
        opt.disabled = !ok; opt.hidden = !ok;
      });
      if (!colors.includes(colorSelect.value)) colorSelect.value = colors[0] || 'bw';

      sizeSelect.disabled  = sizes.length  <= 1;
      colorSelect.disabled = colors.length <= 1;

      const allowLam = svc.addons.includes('lamination');
      const allowBnd = svc.addons.includes('binding');

      laminationAddon.disabled = !allowLam; if (!allowLam) laminationAddon.checked = false;
      bindingAddon.disabled    = !allowBnd; if (!allowBnd) bindingAddon.checked    = false;
    };

    const calculate = () => {
      const svc = PRICING[serviceSelect.value];
      if (!svc) {
        unitCostEl.textContent  = 'Rs 0';
        totalCostEl.textContent = 'Rs 0';
        summaryLine.textContent = 'Select a service to calculate pricing.';
        waBtn.href = WhatsApp.buildUrl(WhatsApp.getNumber(), 'Hi! I need a print quote.');
        return;
      }

      syncOptions(svc);

      const size  = sizeSelect.value;
      const color = colorSelect.value;
      const qty   = Math.max(1, Number(qtyInput.value || 1));
      if (qtyInput.value !== String(qty)) qtyInput.value = qty;

      const baseRate     = svc.rates?.[size]?.[color] ?? svc.rates?.[size]?.bw ?? 0;
      const laminRate    = laminationAddon.checked ? (ADDON_RATES.lamination[size] || ADDON_RATES.lamination.A4) : 0;
      const bindRate     = bindingAddon.checked ? ADDON_RATES.binding : 0;
      const perUnit      = baseRate + laminRate + bindRate;
      const total        = perUnit * qty;

      unitCostEl.textContent  = Utils.formatCurrency(perUnit);
      totalCostEl.textContent = Utils.formatCurrency(total);
      summaryLine.textContent = `${svc.label} | ${size} | ${color === 'bw' ? 'B&W' : 'Color'} | Qty ${qty}`;

      const msg = [
        'Instant Quote Request',
        `Service: ${svc.label}`,
        `Size: ${size}`,
        `Type: ${color === 'bw' ? 'Black & White' : 'Color'}`,
        `Quantity: ${qty}`,
        laminationAddon.checked ? 'Add-on: Lamination'     : null,
        bindingAddon.checked    ? 'Add-on: Spiral Binding' : null,
        `Estimated Total: ${Utils.formatCurrency(total)}`
      ].filter(Boolean).join('\n');

      waBtn.href = WhatsApp.buildUrl(WhatsApp.getNumber(), msg);
    };

    serviceSelect.addEventListener('change', calculate);
    sizeSelect.addEventListener('change', calculate);
    colorSelect.addEventListener('change', calculate);
    qtyInput.addEventListener('input', calculate);
    laminationAddon.addEventListener('change', calculate);
    bindingAddon.addEventListener('change', calculate);

    calculate();
  };

  const setupServiceAvailability = () => {
    const cards = Array.from(document.querySelectorAll('.service-card'));
    if (!cards.length) return;

    const STATUS_MAP = {
      available: { label: 'Available Now',      className: 'is-available' },
      busy:      { label: 'Busy - Slight Delay', className: 'is-busy' },
      limited:   { label: 'High Demand',         className: 'is-limited' }
    };

    // Services identified by data-service-id attribute (preferred) or h3 text (fallback).
    const LIMITED_IDS  = new Set(['jumbo-xerox', 'smart-card', 'visiting-card', 'project-printing']);
    const BUSY_IDS     = new Set(['color-printing', 'xerox', 'spiral-binding']);
    const LIMITED_TEXT = new Set(['Jumbo Xerox', 'Smart Card', 'Visiting Card', 'Project Printing']);
    const BUSY_TEXT    = new Set(['Color Printing', 'Xerox / Photocopy', 'Spiral Binding']);

    const getTimeStatus = () => {
      const m = new Date().getHours() * 60 + new Date().getMinutes();
      if (m < 8 * 60 || m >= 21 * 60) return 'limited';
      if ((m >= 11 * 60 && m <= 14 * 60) || (m >= 18 * 60 && m <= 20 * 60)) return 'busy';
      return 'available';
    };

    const applyStatus = () => {
      const base = getTimeStatus();
      cards.forEach((card) => {
        const id    = card.dataset.serviceId || '';
        const title = card.querySelector('h3')?.textContent?.trim() || '';
        let resolved = card.dataset.availability || 'auto';

        if (resolved === 'auto') {
          if (LIMITED_IDS.has(id) || LIMITED_TEXT.has(title)) resolved = 'limited';
          else if (BUSY_IDS.has(id) || BUSY_TEXT.has(title))  resolved = 'busy';
          else resolved = base;
        }

        const info = STATUS_MAP[resolved] || STATUS_MAP.available;
        let badge  = card.querySelector('.service-status-badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'service-status-badge';
          badge.innerHTML = '<span class="service-status-dot" aria-hidden="true"></span><span class="service-status-text"></span>';
          card.insertAdjacentElement('afterbegin', badge);
        }

        badge.classList.remove('is-available', 'is-busy', 'is-limited');
        badge.classList.add(info.className);
        const textEl = badge.querySelector('.service-status-text');
        if (textEl) textEl.textContent = info.label;
      });
    };

    applyStatus();
    window.setInterval(applyStatus, 20 * 60 * 1000);
  };

  // =========================================================================
  // 14. BOOTSTRAP — ordered, safe feature initialisation
  // =========================================================================
  // Each feature is isolated inside safeRun() so a single broken feature
  // never brings down the rest of the page.

  safeRun('scroll-progress',     setupScrollProgressIndicator);
  safeRun('hero-typing',         setupHeroTypingLine);
  safeRun('image-skeletons',     setupImageLoadingSkeletons);
  safeRun('counters',            setupCounterAnimations);
  safeRun('faq',                 setupFaqAccordion);
  safeRun('ripples',             setupRippleEffects);
  safeRun('testimonial-slider',  setupTestimonialSlider);
  safeRun('tilt-effects',        setupTiltEffects);
  safeRun('hero-parallax',       setupHeroParallax);
  safeRun('navigation',          setupNavigationExperience);
  safeRun('mobile-navigation',   setupMobileNavigationExperience);
  safeRun('desktop-cta-rail',    setupDesktopCtaRailVisibility);
  safeRun('back-to-top',         setupBackToTop);
  safeRun('gallery-lightbox',    setupGalleryLightbox);
  safeRun('address-copy',        setupAddressCopy);
  safeRun('sticky-whatsapp',     setupStickyWhatsAppButton);
  safeRun('bulk-enquiry',        setupBulkEnquiryForm);
  safeRun('pdf-downloads',       setupPdfDownloads);
  safeRun('chat-widget',         setupChatWidget);
  safeRun('quote-calculator',    setupQuoteCalculator);
  safeRun('service-availability',setupServiceAvailability);
