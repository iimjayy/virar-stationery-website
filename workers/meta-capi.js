// workers/meta-capi.js
// Cloudflare Worker — server-side relay for the Meta Conversions API (CAPI).
// Receives a minimal, PII-free JSON beacon from the browser (meta-capi.js),
// enriches it with the request IP + User-Agent, optionally SHA-256-hashes any
// PII the caller chose to include, and forwards it to Meta's Graph API.
//
// Design goals:
//   - Lock CORS to the production origin only.
//   - Return 200 fast; swallow and log upstream errors so the client never
//     sees a failure (marketing telemetry must never break the site).
//   - Never log raw PII — only hashed values are ever sent onward.

const ALLOWED_ORIGIN = 'https://virarprint.in';
const GRAPH_API_VERSION = 'v19.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  'Vary': 'Origin'
};

// SHA-256 hex digest via Web Crypto. Meta requires PII (email/phone) to be
// lowercased + trimmed before hashing. Returns '' for empty input.
const sha256Hex = async (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';

  const data = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    // --- CORS preflight ---
    if (request.method === 'OPTIONS') {
      if (origin !== ALLOWED_ORIGIN) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // --- Method + origin guards ---
    if (request.method !== 'POST') {
      return jsonResponse(405, { error: 'method_not_allowed' });
    }
    if (origin !== ALLOWED_ORIGIN) {
      return jsonResponse(403, { error: 'forbidden_origin' });
    }

    // Parse the client beacon. A bad body still returns 200 so the browser
    // never blocks or retries — we just have nothing useful to forward.
    let beacon;
    try {
      beacon = await request.json();
    } catch (error) {
      return jsonResponse(200, { received: false });
    }

    try {
      const pixelId = env.META_PIXEL_ID;
      const accessToken = env.META_CAPI_TOKEN;

      // No credentials configured → acknowledge but do nothing.
      if (!pixelId || !accessToken) {
        return jsonResponse(200, { received: true, forwarded: false });
      }

      const clientIp = request.headers.get('CF-Connecting-IP') || '';
      const userAgent = request.headers.get('User-Agent') || '';

      const userData = {
        client_ip_address: clientIp,
        client_user_agent: userAgent
      };
      if (beacon.fbp) userData.fbp = beacon.fbp;
      if (beacon.fbc) userData.fbc = beacon.fbc;

      // Optional PII — hashed before it ever leaves the Worker. Raw values are
      // never logged or stored. Meta expects arrays of hashed values.
      if (beacon.em) userData.em = [await sha256Hex(beacon.em)];
      if (beacon.ph) userData.ph = [await sha256Hex(beacon.ph)];

      const eventTime = Number.isFinite(beacon.event_time)
        ? beacon.event_time
        : Math.floor(Date.now() / 1000);

      const payload = {
        data: [
          {
            event_name: beacon.event_name || 'Lead',
            event_id: beacon.event_id,
            event_time: eventTime,
            action_source: 'website',
            event_source_url: beacon.event_source_url || ALLOWED_ORIGIN,
            user_data: userData
          }
        ]
      };

      // Test events (Events Manager → Test Events) when the secret is present.
      if (env.META_TEST_EVENT_CODE) {
        payload.test_event_code = env.META_TEST_EVENT_CODE;
      }

      const graphUrl =
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${encodeURIComponent(pixelId)}/events` +
        `?access_token=${encodeURIComponent(accessToken)}`;

      const upstream = await fetch(graphUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!upstream.ok) {
        // Log status only — never echo the body (may contain diagnostic data).
        console.log(`CAPI upstream non-OK: ${upstream.status}`);
      }

      return jsonResponse(200, { received: true, forwarded: true });
    } catch (error) {
      // Swallow everything — the client must always get a clean 200.
      console.log('CAPI relay error:', error?.message || 'unknown');
      return jsonResponse(200, { received: true, forwarded: false });
    }
  }
};
