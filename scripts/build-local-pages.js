#!/usr/bin/env node
'use strict';
/**
 * build-local-pages.js — Local SEO landing-page generator.
 *
 * Generates a CURATED, hand-picked set of high-quality locality × service
 * landing pages into areas/. We deliberately DO NOT generate every possible
 * permutation — Google penalises thin doorway pages. Each combination below
 * was chosen because it reflects a real, sensible local search intent
 * (e.g. "xerox near Viva College", "thesis printing in Nala Sopara").
 *
 * Every generated page is genuinely differentiated:
 *   - unique <title>, meta description, canonical and OG tags
 *   - JSON-LD: BreadcrumbList + Service (provider=LocalBusiness, areaServed,
 *     offers with price) + a localized FAQPage with locality-specific Q&As
 *   - real body content: locality intro, "how to reach us", a price table,
 *     why-choose bullets, the locality FAQ, and a prominent WhatsApp CTA
 *   - strong internal linking back to home, the matching root service page,
 *     and 2–3 sibling area pages
 *   - the same CSS shell + footer-partial marker as services/*.html
 *
 * Run:   node scripts/build-local-pages.js
 *
 * Pure CommonJS, no dependencies — matches the repo's no-bundler convention.
 */

const fs = require('fs');
const path = require('path');
const { LOCALITIES, SERVICES } = require('./data/local-seo');

const ROOT = path.resolve(__dirname, '..');
const AREAS_DIR = path.join(ROOT, 'areas');
const SITE = 'https://virarprint.in';
const WA_NUMBER = '917021072757';
const CSS_VER = '20260630-dark1'; // keep in sync with services/*.html
const TODAY = '2026-06-30';

// ---------------------------------------------------------------------------
// CURATED combinations. Each entry pairs a locality slug with a service slug.
// Slugs are looked up against local-seo.js; an unknown slug aborts the build.
// The page filename follows the SEO-friendly pattern declared in `file`.
// ---------------------------------------------------------------------------
const COMBINATIONS = [
  { service: 'xerox',           locality: 'viva-college',  file: 'xerox-near-viva-college.html' },
  { service: 'thesis-printing', locality: 'nala-sopara',   file: 'thesis-printing-in-nala-sopara.html' },
  { service: 'color-printing',  locality: 'virar-west',    file: 'color-printing-virar-west.html' },
  { service: 'bw-printing',     locality: 'virar-east',    file: 'bw-printing-virar-east.html' },
  { service: 'thesis-printing', locality: 'viva-college',  file: 'thesis-printing-near-viva-college.html' },
  { service: 'xerox',           locality: 'virar-station', file: 'xerox-near-virar-station.html' },
  { service: 'spiral-binding',  locality: 'nala-sopara',   file: 'spiral-binding-in-nala-sopara.html' },
  { service: 'lamination',      locality: 'bolinj',        file: 'lamination-in-bolinj.html' },
  { service: 'passport-photos', locality: 'virar-west',    file: 'passport-photos-virar-west.html' },
  { service: 'color-printing',  locality: 'global-city',   file: 'color-printing-in-global-city.html' },
  { service: 'xerox',           locality: 'chandansar',    file: 'xerox-in-chandansar.html' }
];

// --- small helpers ---------------------------------------------------------

// Escape text for safe placement inside HTML element/attribute content.
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Escape a string for embedding inside a JSON-LD string value.
function jsonStr(s) {
  return JSON.stringify(String(s));
}

// Build a wa.me deep link with a pre-filled, URL-encoded order message.
function waLink(locality, service) {
  const msg =
    `🖨️ New Order — virarprint.in\n` +
    `Service: ${service.name}\n` +
    `Area: ${locality.name}\n\n` +
    `📎 Please attach your file below.`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

// Find sibling area pages (other combinations) for internal linking.
function siblingsFor(current, lookup) {
  return COMBINATIONS
    .filter(c => c.file !== current.file)
    .slice(0, 12)
    // Prefer siblings that share the locality OR the service for relevance.
    .sort((a, b) => {
      const score = c =>
        (c.locality === current.locality ? 2 : 0) +
        (c.service === current.service ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, 3)
    .map(c => ({
      file: c.file,
      label: `${lookup.svc[c.service].name} · ${lookup.loc[c.locality].name}`
    }));
}

// --- per-service price table -----------------------------------------------
// A small, service-appropriate rate card (official rates) rendered as cards.
function priceCards(serviceSlug) {
  const cards = {
    'xerox': [
      ['fa-regular fa-copy', '₹1.5', 'per page', 'A4 B&amp;W'],
      ['fa-solid fa-palette', '₹9', 'per page', 'A4 Colour'],
      ['fa-regular fa-file-lines', '₹3', 'per page', 'A3 B&amp;W'],
      ['fa-solid fa-layer-group', 'Bulk', '100+ pages', 'Special Rate']
    ],
    'color-printing': [
      ['fa-solid fa-palette', '₹10', 'per page', 'A4 Colour'],
      ['fa-solid fa-swatchbook', '₹18', 'per page', 'A3 Colour'],
      ['fa-solid fa-image', '₹10', 'per page', 'Photo / Poster'],
      ['fa-regular fa-file', '₹3', 'per page', 'B&amp;W Option']
    ],
    'bw-printing': [
      ['fa-regular fa-file', '₹3', 'per page', 'A4 B&amp;W'],
      ['fa-regular fa-file-lines', '₹3', 'per page', 'Single Side'],
      ['fa-solid fa-layer-group', 'Bulk', '100+ pages', 'Special Rate'],
      ['fa-solid fa-palette', '₹10', 'per page', 'Colour Option']
    ],
    'thesis-printing': [
      ['fa-regular fa-file', '₹3', 'per page', 'B&amp;W Print'],
      ['fa-solid fa-palette', '₹10', 'per page', 'Colour Print'],
      ['fa-solid fa-book', '₹30', 'per set', 'Spiral Binding'],
      ['fa-solid fa-book-bookmark', 'Custom', 'on request', 'Hardbound']
    ],
    'spiral-binding': [
      ['fa-solid fa-book', '₹30', 'per set', 'Spiral Binding'],
      ['fa-regular fa-file', '₹3', 'per page', 'B&amp;W Print'],
      ['fa-solid fa-palette', '₹10', 'per page', 'Colour Print'],
      ['fa-solid fa-book-bookmark', 'Custom', 'on request', 'Hardbound']
    ],
    'lamination': [
      ['fa-solid fa-id-card', '₹10', 'per sheet', 'A4 Lamination'],
      ['fa-regular fa-credit-card', '₹20', 'per card', 'A3 Lamination'],
      ['fa-solid fa-certificate', '₹10', 'per sheet', 'Certificates'],
      ['fa-solid fa-images', '₹10', 'per sheet', 'Photos / ID']
    ],
    'passport-photos': [
      ['fa-solid fa-camera-retro', '₹30', 'per set', 'Passport Set'],
      ['fa-solid fa-id-badge', '₹30', 'per set', 'ID / Visa Photo'],
      ['fa-solid fa-bolt', 'Fast', 'in minutes', 'Instant Print'],
      ['fa-solid fa-check', 'White', 'background', 'Spec-correct']
    ]
  };
  const list = cards[serviceSlug] || cards['xerox'];
  return list
    .map((c, i) => {
      const highlight = i === 1 || i === 2 ? ' sp-pricing-highlight' : '';
      return `        <div class="col-6 col-md-3">
          <div class="sp-pricing-card${highlight}">
            <div class="sp-pricing-icon"><i class="${c[0]}"></i></div>
            <div class="price-tag">${c[1]}</div>
            <div class="price-unit">${c[2]}</div>
            <div class="price-label fw-600">${c[3]}</div>
          </div>
        </div>`;
    })
    .join('\n');
}

// --- why-choose bullets ----------------------------------------------------
function whyBullets(locality, service) {
  return [
    `${esc(service.priceLabel)} — clear, honest rates with no hidden charges`,
    `${esc(locality.distance)}`,
    `Order on WhatsApp from ${esc(locality.name)} and just walk in to collect`,
    `Same-day turnaround on most jobs, open 8 AM – 9 PM every day`,
    `Service in English, Hindi, Marathi &amp; Gujarati · Cash, UPI, Google Pay &amp; PhonePe accepted`
  ]
    .map(b => `          <li class="mb-2"><i class="fa-solid fa-check sp-check"></i>${b}</li>`)
    .join('\n');
}

// --- FAQ (3 Q&As): one service-framed + the two locality-specific FAQs ------
function faqEntries(locality, service) {
  const lead = {
    q: `Do you offer ${service.name.toLowerCase()} for ${locality.name}?`,
    a:
      `Yes — ${service.name} is one of our most-requested services for ` +
      `${locality.name} customers. ${service.value}`
  };
  return [lead, locality.faqs[0], locality.faqs[1]];
}

function faqJsonLd(faqs) {
  const entities = faqs
    .map(
      f =>
        `        {"@type": "Question", "name": ${jsonStr(f.q)}, "acceptedAnswer": {"@type": "Answer", "text": ${jsonStr(f.a)}}}`
    )
    .join(',\n');
  return entities;
}

function faqHtml(faqs) {
  return faqs
    .map(
      f => `          <div class="sp-faq-item">
            <h5>${esc(f.q)}</h5>
            <p>${esc(f.a)}</p>
          </div>`
    )
    .join('\n');
}

// --- the page template -----------------------------------------------------
function renderPage(combo, lookup) {
  const service = lookup.svc[combo.service];
  const locality = lookup.loc[combo.locality];
  const url = `${SITE}/areas/${combo.file}`;
  const wa = waLink(locality, service);
  const faqs = faqEntries(locality, service);
  const siblings = siblingsFor(combo, lookup);

  // Concise, length-targeted meta strings.
  const title = `${service.name} in ${locality.name} | Virar Stationery`;
  const ogTitle = `${service.name} in ${locality.name} — Virar Stationery & Jumbo Xerox`;
  const desc =
    `${service.name} for ${locality.name}, Virar. ${service.priceLabel}. ` +
    `WhatsApp your file, walk in to collect. Near Old Viva College. Open 8AM–9PM.`;

  const siblingLinks = siblings
    .map(
      s =>
        `            <li class="mb-2"><i class="fa-solid fa-location-arrow sp-check"></i> <a href="./${s.file}">${esc(s.label)}</a></li>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="view-transition" content="same-origin">
  <script>(function(){var u=navigator.userAgent||"";var ios=/iP(hone|ad|od)/.test(u)||(/Macintosh/.test(u)&&"ontouchend" in document);var de=document.documentElement;if(ios){de.classList.add("is-ios");}else if(/Android/.test(u)){de.classList.add("is-android");}})();</script>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="canonical" href="${url}" />
  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(ogTitle)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:site_name" content="Virar Stationery &amp; Jumbo Xerox" />
  <!-- JSON-LD -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "name": ${jsonStr(`${service.name} in ${locality.name}`)},
        "serviceType": ${jsonStr(service.name)},
        "provider": {
          "@type": "LocalBusiness",
          "name": "Virar Stationery & Jumbo Xerox",
          "telephone": "+917021072757",
          "url": "https://virarprint.in",
          "email": "virarcopy123@gmail.com",
          "image": "https://virarprint.in/assets/images/brand/logo.png",
          "openingHours": "Mo-Su 08:00-21:00",
          "priceRange": "₹",
          "geo": {"@type": "GeoCoordinates", "latitude": 19.4558, "longitude": 72.8113},
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Shop No. 11, Takshashila Apartment, Near Old Viva College, Ram Mandir Rd",
            "addressLocality": "Virar West",
            "addressRegion": "Maharashtra",
            "postalCode": "401303",
            "addressCountry": "IN"
          }
        },
        "areaServed": {"@type": "Place", "name": ${jsonStr(`${locality.name}, Virar`)}},
        "offers": {
          "@type": "Offer",
          "name": ${jsonStr(service.offerName)},
          "price": ${jsonStr(service.offerPrice)},
          "priceCurrency": "INR",
          "availability": "https://schema.org/InStock"
        },
        "url": "${url}"
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://virarprint.in"},
          {"@type": "ListItem", "position": 2, "name": "Service Areas", "item": "https://virarprint.in/#services"},
          {"@type": "ListItem", "position": 3, "name": ${jsonStr(`${service.name} in ${locality.name}`)}, "item": "${url}"}
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
${faqJsonLd(faqs)}
        ]
      }
    ]
  }
  </script>
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap" rel="stylesheet">
  <!-- Bootstrap 5.3.3 -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous" />
  <!-- Font Awesome 6.5.2 -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <!-- Site Stylesheet -->
  <link rel="stylesheet" href="../assets/css/main.bundled.css?v=${CSS_VER}" />
  <link rel="stylesheet" href="../assets/css/pages/service-pages.css" />
</head>
<body>
  <!-- Header -->

  <!-- Shop Info Bar -->
  <div class="shop-info-bar" aria-label="Shop contact information">
    <div class="container-fluid px-3 px-xl-4 d-flex justify-content-between align-items-center">
      <div class="info-items-left d-none d-sm-flex">
        <span class="info-item"><i class="fa-solid fa-location-dot"></i> ${esc(locality.name)}, Virar</span>
        <span class="info-item"><i class="fa-solid fa-clock"></i> Open: 8:00 AM - 9:00 PM</span>
      </div>
      <div class="info-items-right text-center text-sm-end">
        <a href="tel:+919702073424" class="info-phone-link"><i class="fa-solid fa-phone"></i> +91 97020 73424</a>
      </div>
    </div>
  </div>

  <header class="sp-header">
    <div class="container d-flex align-items-center justify-content-between">
      <a href="/" class="sp-header-back">← Virar Stationery &amp; Jumbo Xerox</a>
      <a href="${wa}" target="_blank" rel="noopener" class="sp-header-wa"><i class="fa-brands fa-whatsapp"></i> WhatsApp Us</a>
    </div>
  </header>

  <!-- Hero -->
  <section class="sp-hero">
    <div class="container">
      <div class="row align-items-center">
        <div class="col-lg-7">
          <span class="sp-badge"><i class="${service.icon} me-1"></i> ${esc(service.name)} · ${esc(locality.name)}</span>
          <h1>${esc(service.name)} in<br><span class="sp-hero-accent">${esc(locality.name)}, Virar</span></h1>
          <p class="lead my-4">Looking for ${esc(service.name.toLowerCase())} near ${esc(locality.landmark)}? ${esc(service.value)}</p>
          <div class="d-flex flex-wrap gap-3">
            <a href="${wa}" target="_blank" rel="noopener" class="sp-btn-wa"><i class="fa-brands fa-whatsapp me-2"></i>WhatsApp Your Order</a>
            <a href="tel:+919702073424" class="sp-btn-call"><i class="fa-solid fa-phone me-2"></i>Call Now</a>
          </div>
        </div>
        <div class="col-lg-5 d-none d-lg-flex justify-content-end">
          <div class="sp-features">
            <div class="sp-features-icon"><i class="${service.icon}"></i></div>
            <ul class="sp-features-list">
              <li class="mb-2"><i class="fa-solid fa-check sp-check"></i>${esc(service.priceLabel)}</li>
              <li class="mb-2"><i class="fa-solid fa-check sp-check"></i>Serving ${esc(locality.name)} &amp; nearby</li>
              <li class="mb-2"><i class="fa-solid fa-check sp-check"></i>Order on WhatsApp, walk in to collect</li>
              <li class="mb-2"><i class="fa-solid fa-check sp-check"></i>Same-day on most jobs</li>
              <li><i class="fa-solid fa-check sp-check"></i>Open 8 AM – 9 PM daily</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Locality intro + how to reach us -->
  <section class="sp-steps">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-9">
          <p class="sp-section-label text-center">Serving ${esc(locality.name)}</p>
          <h2 class="sp-section-title text-center mb-4">${esc(service.name)} for ${esc(locality.name)} Residents</h2>
          <p class="text-muted">Virar Stationery &amp; Jumbo Xerox is the go-to print and stationery shop for ${esc(locality.name)}. Whether it is a single page or a bulk order, you get ${esc(service.priceLabel.toLowerCase())} with fast, friendly service close to ${esc(locality.landmark)}. ${esc(locality.distance)}</p>
          <div class="sp-faq-item">
            <h5><i class="fa-solid fa-route me-2"></i>How to reach us from ${esc(locality.landmark)}</h5>
            <p>${esc(locality.reach)}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Pricing -->
  <section class="sp-pricing">
    <div class="container">
      <div class="text-center mb-5">
        <p class="sp-section-label">Transparent Rates</p>
        <h2 class="sp-section-title">${esc(service.name)} Price List</h2>
        <p class="text-muted">Official rates for ${esc(locality.name)} customers — no hidden fees.</p>
      </div>
      <div class="row g-4 justify-content-center">
${priceCards(combo.service)}
      </div>
    </div>
  </section>

  <!-- Why choose us -->
  <section class="sp-steps">
    <div class="container">
      <div class="text-center mb-5">
        <p class="sp-section-label">Why ${esc(locality.name)} Chooses Us</p>
        <h2 class="sp-section-title">Local, Fast &amp; Affordable</h2>
      </div>
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <ul class="sp-features-list">
${whyBullets(locality, service)}
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="sp-faq">
    <div class="container">
      <div class="text-center mb-5">
        <p class="sp-section-label">Got Questions?</p>
        <h2 class="sp-section-title">${esc(locality.name)} FAQs</h2>
      </div>
      <div class="row justify-content-center">
        <div class="col-lg-8">
${faqHtml(faqs)}
        </div>
      </div>
    </div>
  </section>

  <!-- How to Order -->
  <section class="sp-how-to-order">
    <div class="container text-center">
      <div class="sp-hto-icon"><i class="fa-brands fa-whatsapp"></i></div>
      <h2 class="sp-hto-title">Order from ${esc(locality.name)}</h2>
      <div class="sp-hto-steps">
        <span class="sp-hto-step"><i class="fa-brands fa-whatsapp"></i> Send your file on WhatsApp</span>
        <span class="sp-hto-arrow"><i class="fa-solid fa-arrow-right"></i></span>
        <span class="sp-hto-step"><i class="fa-solid fa-print"></i> We print it</span>
        <span class="sp-hto-arrow"><i class="fa-solid fa-arrow-right"></i></span>
        <span class="sp-hto-step"><i class="fa-solid fa-store"></i> Walk in and pick up</span>
      </div>
      <a href="${wa}" target="_blank" rel="noopener" class="sp-hto-cta">
        <i class="fa-brands fa-whatsapp"></i> WhatsApp for ${esc(service.name)}
      </a>
    </div>
  </section>

  <!-- Related links (internal linking) -->
  <section class="sp-steps">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <p class="sp-section-label text-center">Explore More</p>
          <h2 class="sp-section-title text-center mb-4">Related Pages &amp; Nearby Areas</h2>
          <ul class="sp-features-list">
            <li class="mb-2"><i class="fa-solid fa-house sp-check"></i> <a href="${SITE}/">Virar Stationery &amp; Jumbo Xerox — Home</a></li>
            <li class="mb-2"><i class="${service.icon} sp-check"></i> <a href="../services/${service.rootPage}">${esc(service.name)} — full service details</a></li>
${siblingLinks}
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Contact Bar -->
  <section class="sp-contact">
    <div class="container">
      <div class="row g-4">
        <div class="col-md-4 d-flex align-items-start">
          <span class="icon-circle"><i class="fa-solid fa-location-dot"></i></span>
          <div>
            <div class="sp-contact-label">Our Location</div>
            <div class="sp-contact-text">Shop No. 11, Takshashila Apt., Near Old Viva College, Ram Mandir Rd, Virar West – 401303</div>
          </div>
        </div>
        <div class="col-md-4 d-flex align-items-start">
          <span class="icon-circle"><i class="fa-solid fa-phone"></i></span>
          <div>
            <div class="sp-contact-label">Call Us</div>
            <a href="tel:+919702073424" class="sp-contact-link">+91 97020 73424</a><br>
            <div class="sp-contact-sub">Mon – Sun, 8 AM to 9 PM</div>
          </div>
        </div>
        <div class="col-md-4 d-flex align-items-start">
          <span class="icon-circle"><i class="fa-brands fa-whatsapp"></i></span>
          <div>
            <div class="sp-contact-label">WhatsApp</div>
            <a href="${wa}">+91 70210 72757</a><br>
            <div class="sp-contact-sub">Send your file directly</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <!-- PARTIAL:sp-footer:start -->
  <footer class="sp-footer">
    <div class="container">
      <p class="mb-1">&copy; 2026 <a href="https://virarprint.in">Virar Stationery &amp; Jumbo Xerox</a>. All rights reserved.</p>
      <p class="mb-0">Shop No. 11, Takshashila Apartment, Near Old Viva College, Virar West, Mumbai – 401303</p>
    </div>
  </footer>
  <!-- PARTIAL:sp-footer:end -->

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc4s9bIOgUxi8T/jzmcM5GN9f45C0lXHhvzc0v0pv0SB" crossorigin="anonymous"></script>

  <!-- Floating Actions (Sticky WhatsApp) -->
  <div class="floating-actions" aria-label="Floating action buttons">
    <a
      id="stickyWhatsAppBtn"
      class="sticky-whatsapp-btn is-visible"
      href="${wa}"
      aria-label="Chat with us on WhatsApp"
      target="_blank"
      rel="noopener noreferrer">
      <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
      <span class="sticky-whatsapp-tooltip">Chat with us</span>
    </a>
  </div>

  <script type="module" src="../assets/js/service-page.js?v=20260628-vt1"></script>
</body>
</html>
`;
}

// --- build ------------------------------------------------------------------
function build() {
  // Index services/localities by slug for fast, validated lookup.
  const lookup = {
    svc: Object.fromEntries(SERVICES.map(s => [s.slug, s])),
    loc: Object.fromEntries(LOCALITIES.map(l => [l.slug, l]))
  };

  // Validate every combination references real data before writing anything.
  for (const c of COMBINATIONS) {
    if (!lookup.svc[c.service]) throw new Error(`Unknown service slug: ${c.service}`);
    if (!lookup.loc[c.locality]) throw new Error(`Unknown locality slug: ${c.locality}`);
  }

  if (!fs.existsSync(AREAS_DIR)) fs.mkdirSync(AREAS_DIR, { recursive: true });

  const generated = [];
  for (const combo of COMBINATIONS) {
    const html = renderPage(combo, lookup);
    const outPath = path.join(AREAS_DIR, combo.file);
    fs.writeFileSync(outPath, html, 'utf8');
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    generated.push({ path: path.relative(ROOT, outPath), title });
    console.log(`  ✓ ${path.relative(ROOT, outPath)}`);
  }

  console.log(`\nbuild-local-pages: ${generated.length} page(s) generated into areas/.`);
  return generated;
}

if (require.main === module) {
  const generated = build();
  console.log('\n--- Generated pages + titles ---');
  for (const g of generated) {
    console.log(`${g.path}\n    ${g.title}`);
  }
  // Reminder for the build orchestrator / sitemap maintainer.
  console.log(
    `\nNOTE: add areas/*.html to sitemap.xml (lastmod ${TODAY}) and, if you want ` +
    `the shared footer kept in sync, add areas/ to inject-partials.js HTML_DIRS.`
  );
}

module.exports = { build, COMBINATIONS };
