// js/features/meta-capi.js
// Lazy Meta Pixel loader + client half of a Conversions API (CAPI) relay.
// Mirrors google-analytics.js (idle inject, placeholder bail) and reuses the
// delegated document-click detection from analytics.js. Privacy-first: no PII
// is read or sent from the browser — only Meta's own _fbp/_fbc cookies.

import { CONFIG } from '../config.js';

const PLACEHOLDER_PIXEL_ID = 'META_PIXEL_ID';

const runWhenIdle = (callback) => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, { timeout: 2500 });
    return;
  }

  window.setTimeout(callback, 1800);
};

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

// Crypto-strong id with a graceful fallback for older browsers. The SAME id is
// sent to both the Pixel (browser) and the CAPI relay (server) so Meta can
// DEDUPLICATE the two events into one conversion.
const generateEventId = () => {
  try {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
  } catch (error) {
    // Fall through to the manual generator below.
  }
  return `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

// Read a first-party cookie by name (used for Meta's _fbp / _fbc).
const readCookie = (name) => {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : '';
  } catch (error) {
    return '';
  }
};

// POST a minimal, PII-free beacon to the Cloudflare Worker (server-side CAPI).
// sendBeacon is preferred (survives navigation); fetch+keepalive is the fallback.
const sendCapiBeacon = (payload) => {
  try {
    const endpoint = CONFIG.integrations?.meta?.capiEndpoint;
    if (!endpoint || endpoint === '' || endpoint === 'META_CAPI_ENDPOINT') {
      return;
    }

    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
      return;
    }

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      mode: 'cors'
    }).catch(() => {
      // CAPI is best-effort; never surface failures to the customer.
    });
  } catch (error) {
    // Marketing telemetry must never block navigation.
  }
};

// Fire a deduplicated conversion: Pixel event (browser) + CAPI beacon (server),
// both stamped with the same event_id.
const trackConversion = (eventName) => {
  try {
    const eventId = generateEventId();
    const eventTime = Math.floor(Date.now() / 1000);
    // Page path only — no query string (keeps URLs PII-free and consistent
    // between the browser and server events for matching).
    const eventSourceUrl = window.location.origin + window.location.pathname;

    if (typeof window.fbq === 'function') {
      window.fbq('track', eventName, {}, { eventID: eventId });
    }

    sendCapiBeacon({
      event_name: eventName,
      event_id: eventId,
      event_time: eventTime,
      event_source_url: eventSourceUrl,
      fbp: readCookie('_fbp'),
      fbc: readCookie('_fbc')
    });
  } catch (error) {
    // Swallow — a tracking error must never affect the WhatsApp/call flow.
  }
};

export const initMetaPixel = () => {
  const pixelId = CONFIG.integrations?.meta?.pixelId;
  if (!pixelId || pixelId === PLACEHOLDER_PIXEL_ID) {
    return;
  }

  // Standard Meta Pixel queue shim — calls are buffered until fbevents loads.
  if (!window.fbq) {
    const fbq = function fbq(){
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = window._fbq || fbq;
  }

  runWhenIdle(() => {
    loadScript('https://connect.facebook.net/en_US/fbevents.js')
      .then(() => {
        window.fbq('init', pixelId);
        window.fbq('track', 'PageView');
      })
      .catch(() => {
        // Pixel must never affect the customer experience.
      });
  });

  // Delegated click listener — same detection approach as analytics.js.
  // A WhatsApp or tel click is the core conversion → fire Lead.
  document.addEventListener('click', (event) => {
    try {
      const target = event.target.closest('a, button, [role="button"], [data-chat-whatsapp]');
      if (!target) return;

      const href = target.getAttribute('href') || '';

      if (href.includes('wa.me') || href.includes('api.whatsapp.com') || target.closest('[data-chat-whatsapp]')) {
        trackConversion('Lead');
        return;
      }

      if (href.startsWith('tel:')) {
        trackConversion('Contact');
      }
    } catch (error) {
      // Never block navigation.
    }
  });
};
