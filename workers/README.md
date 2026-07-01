# Meta Conversions API Relay — Cloudflare Worker

A tiny, **free** serverless relay that receives privacy-safe conversion beacons
from the website and forwards them to Meta's **Conversions API (CAPI)**. Running
events server-side (in addition to the browser Pixel) recovers conversions lost
to ad-blockers, iOS tracking limits, and ITP — and Meta **deduplicates** the two
using a shared `event_id`.

```
Browser  ──fbq('track','Lead', {eventID})──►  Meta Pixel ─┐
   │                                                        ├─► deduped by event_id
   └──JSON beacon──► Cloudflare Worker ──Graph API──► Meta ─┘
```

No PII is sent from the browser. The Worker only adds the request IP +
User-Agent, and SHA-256-hashes any optional email/phone before forwarding.

---

## What you need first

From **Meta Events Manager** (https://business.facebook.com/events_manager):

1. **Pixel ID** — Events Manager → your Pixel → **Settings**. A ~15-digit number.
2. **CAPI access token** — Events Manager → your Pixel → **Settings** →
   **Conversions API** → **Generate access token**. Copy it (shown once).
3. *(optional)* **Test Event Code** — Events Manager → **Test Events** tab, for
   verifying the pipeline before going live.

---

## Deploy (one-time, ~5 minutes)

1. **Create a free Cloudflare account** at https://dash.cloudflare.com/sign-up
   (the Workers free tier — 100k requests/day — is far more than enough).

2. **Install Wrangler** (Cloudflare's CLI):

   ```bash
   npm install -g wrangler
   ```

3. **Log in** (opens a browser to authorize):

   ```bash
   wrangler login
   ```

4. **Set the secrets** (run from inside this `workers/` directory). You'll be
   prompted to paste each value — they are encrypted, never committed to git:

   ```bash
   cd workers
   wrangler secret put META_PIXEL_ID       # paste the Pixel ID
   wrangler secret put META_CAPI_TOKEN      # paste the CAPI access token
   wrangler secret put META_TEST_EVENT_CODE # optional — only for Test Events
   ```

5. **Deploy:**

   ```bash
   wrangler deploy
   ```

   Wrangler prints a URL like:

   ```
   https://virar-meta-capi.<your-subdomain>.workers.dev
   ```

6. **Copy that URL** into the site config — it becomes
   `CONFIG.integrations.meta.capiEndpoint` in `assets/js/config.js`:

   ```js
   meta: {
     pixelId: '<your Pixel ID>',
     capiEndpoint: 'https://virar-meta-capi.<your-subdomain>.workers.dev',
   },
   ```

That's it. The Pixel fires in the browser; the Worker mirrors each WhatsApp/call
conversion to Meta server-side, deduplicated by `event_id`.

---

## Verify it's working

- **Test Events:** with `META_TEST_EVENT_CODE` set, open Events Manager →
  **Test Events**, then click a WhatsApp/Call button on the site. You should see
  a `Lead` (or `Contact`) event arrive from both **Browser** and **Server**, and
  Meta should mark them as **deduplicated**.
- **Worker logs:** `wrangler tail` streams live request logs (status codes only —
  no PII is ever logged).

## Security notes

- CORS is locked to `https://virarprint.in` only; other origins are rejected.
- Secrets live in Cloudflare's encrypted store, not in this repo.
- The Worker always returns `200` to the browser, even on upstream errors, so a
  Meta outage can never break the site or block a WhatsApp click.
- Raw email/phone are never logged or stored — only SHA-256 hashes are forwarded.

## Updating later

Re-run `wrangler deploy` after editing `meta-capi.js`. To rotate a token, just
`wrangler secret put META_CAPI_TOKEN` again and redeploy.
