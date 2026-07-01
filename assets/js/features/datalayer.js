// js/features/datalayer.js
// Advanced, privacy-safe GA4 *engagement* signals — the high-intent layer that
// analytics.js does not cover. Every signal is (a) sent via gtag AND (b) pushed
// as a structured object onto window.dataLayer so the site is GTM-ready if a
// container is added later.
//
// PRIVACY: never sends names, phone numbers, typed form text, or full URLs.
// Only buckets, booleans, enums and counts leave the browser.
//
// SAFETY: every listener is wrapped — a crash in this module must never affect
// the customer experience. Mirrors the lazy/fail-safe style of
// google-analytics.js and the safeGtag pattern of analytics.js.

// ---------------------------------------------------------------------------
// Core: safe gtag + dataLayer push
// ---------------------------------------------------------------------------
const ENGAGEMENT_TYPE = 'engagement_signal';

// Single source of truth: fires the GA4 event AND mirrors a clean object onto
// window.dataLayer (GTM-ready). Swallows any error so tracking can never break
// the page.
const pushEvent = (name, params = {}) => {
  try {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };

    const payload = { engagement_type: ENGAGEMENT_TYPE, ...params };

    // (a) GA4 via gtag
    window.gtag('event', name, payload);

    // (b) Structured push for a future GTM container
    window.dataLayer.push({ event: name, ...payload });
  } catch (_error) {
    // Analytics must never surface to the customer.
  }
};

// Defensive listener wrapper — keeps a thrown handler from bubbling out.
const safeHandler = (fn) => (...args) => {
  try {
    fn(...args);
  } catch (_error) {
    // Swallow — never let an analytics handler break the page.
  }
};

// rIC with a setTimeout fallback (matches google-analytics.js runWhenIdle).
const runWhenIdle = (callback) => {
  try {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback, { timeout: 2500 });
      return;
    }
  } catch (_error) {
    // fall through to timeout
  }
  window.setTimeout(callback, 1500);
};

const PASSIVE = { passive: true };

// ---------------------------------------------------------------------------
// Bucketing helpers (privacy: lengths/sizes/pages -> coarse enums)
// ---------------------------------------------------------------------------
const queryLengthBucket = (length) => {
  if (length <= 0) return 'empty';
  if (length <= 3) return '1_3';
  if (length <= 10) return '4_10';
  if (length <= 20) return '11_20';
  return '20_plus';
};

const pageBucket = (pages) => {
  if (!Number.isFinite(pages) || pages <= 0) return 'unknown';
  if (pages <= 5) return '1_5';
  if (pages <= 20) return '6_20';
  if (pages <= 50) return '21_50';
  return '50_plus';
};

const sizeBucket = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'unknown';
  const mb = bytes / (1024 * 1024);
  if (mb <= 1) return 'lte_1mb';
  if (mb <= 5) return '1_5mb';
  if (mb <= 10) return '5_10mb';
  return '10mb_plus';
};

// ---------------------------------------------------------------------------
// Lead score — accumulated from high-intent actions, persisted for the session.
// Pushes lead_score_update only as it crosses the 25 / 50 / 75 tiers.
// ---------------------------------------------------------------------------
const LEAD_SCORE_KEY = 'vs_lead_score';
const LEAD_TIER_KEY = 'vs_lead_tier';
const LEAD_TIERS = [25, 50, 75];

const readSession = (key, fallback) => {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw === null) return fallback;
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  } catch (_error) {
    return fallback;
  }
};

const writeSession = (key, value) => {
  try {
    window.sessionStorage.setItem(key, String(value));
  } catch (_error) {
    // sessionStorage may be unavailable (private mode) — degrade silently.
  }
};

const highestTierCrossed = (score) =>
  LEAD_TIERS.reduce((acc, tier) => (score >= tier ? tier : acc), 0);

// Adds points (capped 0–100) and emits lead_score_update on a new tier crossing.
const addLeadScore = safeHandler((points, reason) => {
  const previous = readSession(LEAD_SCORE_KEY, 0);
  const next = Math.max(0, Math.min(100, previous + points));
  if (next === previous) return;

  writeSession(LEAD_SCORE_KEY, next);

  const lastTier = readSession(LEAD_TIER_KEY, 0);
  const newTier = highestTierCrossed(next);
  if (newTier > lastTier) {
    writeSession(LEAD_TIER_KEY, newTier);
    pushEvent('lead_score_update', {
      lead_score: next,
      lead_tier: newTier,
      reason: reason || 'unknown'
    });
  }
});

// ---------------------------------------------------------------------------
// Engaged session — 30s active OR 2+ meaningful interactions (whichever first).
// ---------------------------------------------------------------------------
const createEngagementTracker = () => {
  let interactionCount = 0;
  let fired = false;
  let timerId = null;

  const fire = safeHandler((trigger) => {
    if (fired) return;
    fired = true;
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
    pushEvent('engaged_session', { trigger });
  });

  // 30s of presence (only counted while the tab is visible).
  const startTimer = () => {
    if (fired || timerId !== null) return;
    if (document.visibilityState === 'hidden') return;
    timerId = window.setTimeout(() => fire('time_30s'), 30000);
  };

  const noteInteraction = () => {
    if (fired) return;
    interactionCount += 1;
    if (interactionCount >= 2) fire('interactions_2');
  };

  document.addEventListener('visibilitychange', safeHandler(() => {
    if (document.visibilityState === 'visible') {
      startTimer();
    } else if (timerId !== null) {
      // Pause the timer while the tab is backgrounded so we count active time.
      window.clearTimeout(timerId);
      timerId = null;
    }
  }));

  startTimer();
  return { noteInteraction };
};

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export const initDataLayer = () => {
  const engagement = createEngagementTracker();
  const noteInteraction = safeHandler(() => engagement.noteInteraction());

  // -------------------------------------------------------------------------
  // scroll_depth — fire once each at 25 / 50 / 75 / 90 % of page scroll.
  // -------------------------------------------------------------------------
  const setupScrollDepth = () => {
    const thresholds = [25, 50, 75, 90];
    const reached = new Set();
    let ticking = false;

    const evaluate = () => {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;

      const percent = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      thresholds.forEach((threshold) => {
        if (percent >= threshold && !reached.has(threshold)) {
          reached.add(threshold);
          pushEvent('scroll_depth', { percent: threshold });
        }
      });

      if (reached.size === thresholds.length) {
        window.removeEventListener('scroll', onScroll, PASSIVE);
      }
    };

    const onScroll = safeHandler(() => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(evaluate);
    });

    window.addEventListener('scroll', onScroll, PASSIVE);
  };

  // -------------------------------------------------------------------------
  // view_section — IntersectionObserver on [data-section]; once per section.
  // -------------------------------------------------------------------------
  const setupSectionViews = () => {
    const sections = document.querySelectorAll('[data-section]');
    if (!sections.length || !('IntersectionObserver' in window)) return;

    let remaining = sections.length;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const target = entry.target;
        const sectionId = target.dataset.section || target.id || 'unknown';
        pushEvent('view_section', { section_id: sectionId });
        observer.unobserve(target);
        remaining -= 1;
        if (remaining <= 0) observer.disconnect();
      });
    }, { threshold: 0.4 });

    sections.forEach((section) => observer.observe(section));
  };

  // -------------------------------------------------------------------------
  // select_service — click within [data-service-id].
  // -------------------------------------------------------------------------
  const setupServiceSelect = () => {
    document.addEventListener('click', safeHandler((event) => {
      const card = event.target.closest('[data-service-id]');
      if (!card) return;
      const serviceId = card.dataset.serviceId || 'unknown';
      pushEvent('select_service', { service_id: serviceId });
      addLeadScore(10, 'select_service');
      noteInteraction();
    }));
  };

  // -------------------------------------------------------------------------
  // site_search — debounced. Sends has_query + a length bucket, never the text.
  // -------------------------------------------------------------------------
  const setupSiteSearch = () => {
    const input = document.querySelector(
      '[data-stationery-search-input], #stationery-search input[type="search"]'
    );
    if (!input) return;

    let debounceId = null;
    let lastBucket = null;

    const onInput = safeHandler(() => {
      if (debounceId !== null) window.clearTimeout(debounceId);
      debounceId = window.setTimeout(() => {
        const length = String(input.value || '').trim().length;
        const bucket = queryLengthBucket(length);
        // De-dupe consecutive identical buckets to avoid keystroke spam.
        if (bucket === lastBucket) return;
        lastBucket = bucket;
        pushEvent('site_search', {
          has_query: length > 0,
          query_length: bucket
        });
        if (length > 0) noteInteraction();
      }, 600);
    });

    input.addEventListener('input', onInput);
  };

  // -------------------------------------------------------------------------
  // begin_quote — first interaction with #quoteCalculator (once).
  // -------------------------------------------------------------------------
  const setupBeginQuote = () => {
    const form = document.getElementById('quoteCalculator');
    if (!form) return;

    let started = false;
    const trigger = safeHandler(() => {
      if (started) return;
      started = true;
      pushEvent('begin_quote', {});
      addLeadScore(20, 'begin_quote');
      noteInteraction();
      form.removeEventListener('focusin', trigger);
      form.removeEventListener('change', trigger);
      form.removeEventListener('pointerdown', trigger, PASSIVE);
    });

    form.addEventListener('focusin', trigger);
    form.addEventListener('change', trigger);
    form.addEventListener('pointerdown', trigger, PASSIVE);
  };

  // -------------------------------------------------------------------------
  // attach_pdf — PDF dropped or selected in #quotePdfDrop.
  // Sends page_bucket (best-effort, 'unknown' until known) + size_bucket.
  // -------------------------------------------------------------------------
  const setupAttachPdf = () => {
    const dropzone = document.getElementById('quotePdfDrop');
    if (!dropzone) return;

    const emit = (file) => {
      const bytes = file && Number.isFinite(file.size) ? file.size : 0;
      // Page count isn't known at the DOM layer here; the quote calculator
      // resolves it asynchronously. Report 'unknown' and let size carry intent.
      pushEvent('attach_pdf', {
        page_bucket: pageBucket(NaN),
        size_bucket: sizeBucket(bytes)
      });
      addLeadScore(20, 'attach_pdf');
      noteInteraction();
    };

    // Native drop onto the zone.
    dropzone.addEventListener('drop', safeHandler((event) => {
      const file = event.dataTransfer?.files?.[0];
      emit(file || null);
    }));

    // File picker — listen at the dropzone subtree for any file input change.
    dropzone.addEventListener('change', safeHandler((event) => {
      const target = event.target;
      if (target && target.type === 'file' && target.files?.length) {
        emit(target.files[0]);
      }
    }));

    // The browse affordance can spawn a sibling/detached input; catch those too.
    document.addEventListener('change', safeHandler((event) => {
      const target = event.target;
      if (!target || target.type !== 'file' || !target.files?.length) return;
      const acceptsPdf = (target.accept || '').includes('pdf');
      const insideQuote = target.closest('#quoteCalculator, #quotePdfDrop');
      if (acceptsPdf && (insideQuote || target.dataset.quotePdf !== undefined)) {
        emit(target.files[0]);
      }
    }), PASSIVE);
  };

  // -------------------------------------------------------------------------
  // form_start (first focus) + form_submit on #bulkEnquiryForm.
  // -------------------------------------------------------------------------
  const setupBulkForm = () => {
    const form = document.getElementById('bulkEnquiryForm');
    if (!form) return;

    let started = false;
    const onFocus = safeHandler(() => {
      if (started) return;
      started = true;
      pushEvent('form_start', { form_id: 'bulk_enquiry' });
      addLeadScore(10, 'form_start');
      noteInteraction();
      form.removeEventListener('focusin', onFocus);
    });
    form.addEventListener('focusin', onFocus);

    form.addEventListener('submit', safeHandler(() => {
      pushEvent('form_submit', { form_id: 'bulk_enquiry' });
      addLeadScore(15, 'form_submit');
      noteInteraction();
    }));
  };

  // -------------------------------------------------------------------------
  // chat_open — when the chat panel opens. The widget toggles `is-open` on
  // #chatWidget and flips aria-hidden on the .chat-panel; observe both.
  // -------------------------------------------------------------------------
  const setupChatOpen = () => {
    const widget = document.querySelector('.chat-widget, #chatWidget');
    const panel = document.querySelector('.chat-panel, #chatPanel');
    if (!widget && !panel) return;
    if (!('MutationObserver' in window)) return;

    let isOpen = false;

    const computeOpen = () => {
      const openByClass = widget ? widget.classList.contains('is-open') : false;
      const openByAria = panel ? panel.getAttribute('aria-hidden') === 'false' : false;
      return openByClass || openByAria;
    };

    const observer = new MutationObserver(safeHandler(() => {
      const nowOpen = computeOpen();
      if (nowOpen && !isOpen) {
        pushEvent('chat_open', {});
        addLeadScore(5, 'chat_open');
        noteInteraction();
      }
      isOpen = nowOpen;
    }));

    if (widget) {
      observer.observe(widget, { attributes: true, attributeFilter: ['class'] });
    }
    if (panel) {
      observer.observe(panel, { attributes: true, attributeFilter: ['aria-hidden'] });
    }
  };

  // -------------------------------------------------------------------------
  // Cross-feed: high-intent clicks that analytics.js already fires (whatsapp /
  // call) also feed the lead score. We READ analytics' dataLayer pushes rather
  // than re-firing the events, so there is zero duplication.
  // -------------------------------------------------------------------------
  const setupIntentLeadFeed = () => {
    document.addEventListener('click', safeHandler((event) => {
      const target = event.target.closest('a, button, [role="button"]');
      if (!target) return;
      const href = target.getAttribute('href') || '';

      if (href.includes('wa.me') || href.includes('api.whatsapp.com') ||
          target.closest('[data-chat-whatsapp]')) {
        addLeadScore(25, 'whatsapp_intent');
        noteInteraction();
        return;
      }
      if (href.startsWith('tel:')) {
        addLeadScore(25, 'call_intent');
        noteInteraction();
      }
    }), PASSIVE);
  };

  // -------------------------------------------------------------------------
  // Wire everything up once the browser is idle. Each step is independently
  // guarded so one failure cannot stop the others.
  // -------------------------------------------------------------------------
  runWhenIdle(() => {
    [
      setupScrollDepth,
      setupSectionViews,
      setupServiceSelect,
      setupSiteSearch,
      setupBeginQuote,
      setupAttachPdf,
      setupBulkForm,
      setupChatOpen,
      setupIntentLeadFeed
    ].forEach((setup) => safeHandler(setup)());
  });
};
