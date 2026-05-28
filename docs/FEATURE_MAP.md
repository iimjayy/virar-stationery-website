# Virar Stationery & Jumbo Xerox — Feature Map

## Purpose

This document maps frontend features to their code locations, dependencies, and architectural notes. It exists to improve maintainability, speed up debugging, reduce accidental breakage, and help future contributors.

Update this file whenever features are added, refactored, or modules are extracted.

---

# Global Architecture

## Current JavaScript Module Structure

```
js/
├── main.js                ← orchestrator (~480 lines): imports all modules, initializes via safeRun
├── config.js              ← CONFIG object: business constants, hours, messages
├── core/
│   └── toast.js           ← toast notification system (ensureEnquiryToast, showEnquiryToast)
├── data/
│   └── business-data.js   ← searchCatalog, detailedServices, pricingConfig, pdfTemplates, addonRates
├── utils/
│   └── helpers.js         ← escapeHtml, normalizeText, toLookupKey, normalizePhoneNumber, buildWhatsAppUrl, etc.
└── features/
    ├── address-copy.js          ← address copy-to-clipboard
    ├── bulk-enquiry.js          ← multi-step bulk order form + file upload
    ├── chat-widget.js           ← floating chat panel with quick replies
    ├── counters.js              ← animated trust counter badges
    ├── faq.js                   ← FAQ accordion
    ├── floating-actions.js      ← desktop CTA rail + back-to-top button
    ├── gallery-lightbox.js      ← image gallery + keyboard/touch lightbox
    ├── navigation.js            ← header/mobile nav, scroll spy, active indicator
    ├── pdf-downloads.js         ← PDF generation + download buttons
    ├── quote-calculator.js      ← instant price estimator
    ├── reveal-animations.js     ← scroll-triggered section reveals + scroll progress bar
    ├── service-availability.js  ← service status badges (available/busy/limited)
    ├── service-interactions.js  ← dual-mode service panels (desktop grid + mobile slider)
    ├── smart-search.js          ← fuzzy search with keyboard nav + recent searches
    ├── sticky-whatsapp.js       ← sticky WhatsApp floating button
    └── testimonial-slider.js    ← testimonial card slider
```

**Total: 16 feature modules + 4 core/utility modules**

Entry point: `<script type="module" src="js/main.js">` in index.html.

## Shared Dependencies (resolved once in main.js)

* `businessWhatsAppNumber` — resolved at init, used by all WhatsApp-dependent features
* `businessEmail` — resolved at init, used by contact form and bulk enquiry
* `isMobileDevice` — resolved at init, used for WhatsApp URL differentiation
* `buildWhatsAppUrl(phone, message)` — shared URL builder (in helpers.js)
* `buildMailtoUrl(email, subject, body)` — shared mailto builder (in helpers.js)
* `openEnquiryChannel(whatsappUrl, mailtoUrl)` — shared channel opener with fallback (in helpers.js)

## Production Safety

* `safeRun(label, callback)` wraps every feature init — if one feature crashes, others still work
* `runAfterReady(callback)` ensures DOM readiness before any initialization
* Global `error`/`unhandledrejection` listeners trigger toast for user feedback

---

# FEATURES

---

## Smart Search

| Property | Value |
|---|---|
| Module | `js/features/smart-search.js` |
| Export | `initSmartSearch()` |
| Data | `searchCatalog` from `js/data/business-data.js` |
| DOM Targets | `#siteSearch`, `#siteSearchInput`, service/product/price cards |
| Dependencies | `escapeHtml`, `normalizeText`, `toLookupKey` from helpers |
| State | `activeSuggestionIndex`, `visibleSuggestions`, `previousQuery` (closure-scoped) |
| Storage | `localStorage` for recent searches |

---

## Quote Calculator

| Property | Value |
|---|---|
| Module | `js/features/quote-calculator.js` |
| Export | `initQuoteCalculator()` |
| Data | `pricingConfig`, `addonRates` from `js/data/business-data.js` |
| DOM Targets | `#quoteCalculator`, `#quoteService`, `#quoteWhatsAppBtn` |
| Dependencies | `buildWhatsAppUrl`, CONFIG |

---

## Service Interaction Panels

| Property | Value |
|---|---|
| Module | `js/features/service-interactions.js` |
| Export | `initServiceInteractions()` |
| Data | `detailedServices` from `js/data/business-data.js` |
| DOM Targets | `#services .service-grid`, `.service-card` |
| Dependencies | `CONFIG`, `escapeHtml`, `buildWhatsAppUrl` from helpers |
| State | `activeCard`, `sliderFocusCard`, slider pointer tracking (closure-scoped) |

### Slider Mode

* Activated at `max-width: 1199.98px`
* Horizontal scroll snapping with dot pagination
* Touch/pointer swipe detection to distinguish scroll vs click
* Resize handler uses rAF throttling for mobile performance

### Architecture Note

This module is intentionally kept as a **single file** because panel logic and slider logic share 8+ closure-scoped state variables with bidirectional coupling.

---

## Toast Notification System

| Property | Value |
|---|---|
| Module | `js/core/toast.js` |
| Exports | `ensureEnquiryToast()`, `showEnquiryToast()` |
| Used By | Contact form, bulk enquiry, smart search, quote calculator, address copy, error handler |

---

## Open/Closed Status

| Property | Value |
|---|---|
| Function | `setupHeroOpenStatus()` |
| Location | `js/main.js` (inline, low complexity) |
| Config | `CONFIG.hours.openHour`, `CONFIG.hours.closeHour` |
| DOM Targets | `#heroOpenStatus`, `.hero-open-text` |
| Timer | `setInterval` every 60 seconds |

---

## Contact Form

| Property | Value |
|---|---|
| Location | `js/main.js` (directly in `runAfterReady`, not in `safeRun`) |
| DOM Targets | `#contactForm`, `#name`, `#service`, `#message` |
| Dependencies | `businessWhatsAppNumber`, `businessEmail`, `buildWhatsAppUrl`, toast |

---

## Bulk Enquiry Form

| Property | Value |
|---|---|
| Module | `js/features/bulk-enquiry.js` |
| Export | `initBulkEnquiry()` |
| DOM Targets | `#bulkEnquiryForm`, `#bulkUpload`, `#bulkFile` |
| Dependencies | `CONFIG`, `buildWhatsAppUrl`, `buildMailtoUrl`, `openEnquiryChannel`, toast |

---

## Gallery & Lightbox

| Property | Value |
|---|---|
| Module | `js/features/gallery-lightbox.js` |
| Export | `initGalleryLightbox()` |
| DOM Targets | `.gallery-grid img`, `#galleryLightbox` |
| Features | Keyboard navigation (←/→/Esc), touch swipe, preloading |

---

## Chat Widget

| Property | Value |
|---|---|
| Module | `js/features/chat-widget.js` |
| Export | `initChatWidget()` |
| DOM Targets | `#chatWidget`, `#chatFab`, `#chatPanel` |
| Dependencies | `CONFIG`, `buildWhatsAppUrl` |

---

## Navigation & Scroll Effects

| Feature | Module/Location |
|---|---|
| Navigation (header, mobile, scroll spy) | `js/features/navigation.js` |
| Floating actions (desktop CTA rail, back-to-top) | `js/features/floating-actions.js` |
| Reveal animations + scroll progress | `js/features/reveal-animations.js` |
| Header shadow (rAF-throttled scroll) | `js/main.js` (inline) |

---

## Visual Effects

| Feature | Location |
|---|---|
| Counter animations | `js/features/counters.js` |
| Ripple effects | `js/main.js` (inline, `setupRippleEffects()`) |
| Tilt effects | `js/main.js` (inline, `setupTiltEffects()`) |
| Hero parallax | `js/main.js` (inline, `setupHeroParallax()` — rAF-throttled) |
| Hero typing line | `js/main.js` (inline, `setupHeroTypingLine()`) |
| Image skeletons | `js/main.js` (inline, `setupImageLoadingSkeletons()`) |
| Testimonial slider | `js/features/testimonial-slider.js` |

---

## Utility Features

| Feature | Module |
|---|---|
| Address copy | `js/features/address-copy.js` |
| Sticky WhatsApp | `js/features/sticky-whatsapp.js` |
| PDF downloads | `js/features/pdf-downloads.js` |
| Service availability | `js/features/service-availability.js` |

---

# Feature Initialization Order

All features are initialized via `safeRun` in this order (from `js/main.js`):

1. `scroll-progress` (reveal-animations)
2. `hero-typing`
3. `image-skeletons`
4. `counters`
5. `faq`
6. `ripples`
7. `testimonial-slider`
8. `tilt-effects`
9. `hero-parallax`
10. `navigation`
11. `mobile-navigation`
12. `desktop-cta-rail`
13. `back-to-top`
14. `gallery-lightbox`
15. `address-copy`
16. `sticky-whatsapp`
17. `smart-search`
18. `quote-calculator`
19. `floating-actions`
20. `chat-widget`
21. `bulk-enquiry`
22. `pdf-downloads`
23. `service-availability`
24. `service-interactions`

Note: Contact form is initialized before `safeRun` features (directly in the `runAfterReady` callback).

---

# Refactoring Rules

When extracting modules:

## ALWAYS:

* identify dependencies first
* preserve functionality
* isolate feature scope
* migrate incrementally
* test after each extraction
* maintain backward compatibility

## NEVER:

* refactor multiple unrelated systems simultaneously
* rewrite entire architecture at once
* remove working business workflows
* introduce unnecessary complexity

---

# Refactoring Status

## Completed Phases

* ✅ **Phase 1a** — JavaScript modularization (config, data, utils, toast extracted)
* ✅ **Phase 1b** — Workspace stabilization and cleanup
* ✅ **Phase 2** — Feature extraction (all 16 feature modules extracted from main.js)

## Current State

* main.js reduced from ~3400 lines to ~480 lines (orchestrator only)
* 16 self-contained feature modules in `js/features/`
* 4 core/utility modules (`config.js`, `toast.js`, `business-data.js`, `helpers.js`)

## Next Phase

* **Phase 3** — CSS modularization (163KB monolith → component files)
* **Phase 3** — CSS performance (backdrop-filter reduction, animation audit)
* **Phase 3** — Image optimization (WebP, srcset/sizes)
* **Phase 3** — Contact form extraction to `js/features/contact-form.js`
