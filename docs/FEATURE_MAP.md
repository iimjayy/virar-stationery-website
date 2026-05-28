# Virar Stationery & Jumbo Xerox — Feature Map

## Purpose

This document maps frontend features to their code locations, dependencies, and architectural notes. It exists to improve maintainability, speed up debugging, reduce accidental breakage, and help future contributors.

Update this file whenever features are added, refactored, or modules are extracted.

---

# Global Architecture

## Current JavaScript Module Structure

```
js/
├── main.js              ← orchestrator: imports all modules, initializes all features
├── config.js            ← CONFIG object: business constants, hours, messages
├── core/toast.js        ← toast notification system
├── data/business-data.js ← searchCatalog, detailedServices, pricingConfig, pdfTemplates, addonRates
└── utils/helpers.js     ← escapeHtml, normalizeText, toLookupKey, normalizePhoneNumber, resolveBusinessWhatsAppNumber, resolveBusinessEmail
```

## Shared Dependencies (resolved once in main.js)

* `businessWhatsAppNumber` — resolved at init, used by all WhatsApp-dependent features
* `businessEmail` — resolved at init, used by contact form and bulk enquiry
* `isMobileDevice` — resolved at init, used for WhatsApp URL differentiation
* `buildWhatsAppUrl(phone, message)` — shared URL builder
* `buildMailtoUrl(email, subject, body)` — shared mailto builder
* `openEnquiryChannel(whatsappUrl, mailtoUrl)` — shared channel opener with fallback

## Production Safety

* `safeRun(label, callback)` wraps every feature init
* `runAfterReady(callback)` ensures DOM readiness
* Global error/rejection listeners trigger toast for user feedback

---

# FEATURES

---

## Smart Search

| Property | Value |
|---|---|
| Function | `setupSmartSearch(form)` |
| Location | `js/main.js` (called per `.search-box` element) |
| Data | `searchCatalog` from `js/data/business-data.js` |
| DOM Targets | `.search-box`, `.search-input`, service/product/price cards |
| Dependencies | `escapeHtml`, `normalizeText`, `toLookupKey` from helpers |
| State | `activeSuggestionIndex`, `visibleSuggestions`, `previousQuery` (closure-scoped) |
| Storage | `localStorage` for recent searches |

### Risks During Refactor

* DOM maps (`serviceCardMap`, `productCardMap`, `priceCardMap`) depend on heading selectors
* Keyboard navigation state machine is complex
* Document-level `pointerdown` listener for click-outside

---

## Quote Calculator

| Property | Value |
|---|---|
| Function | `setupQuoteCalculator()` |
| Location | `js/main.js` |
| Data | `pricingConfig`, `addonRates` from `js/data/business-data.js` |
| DOM Targets | `#quoteForm`, `#quoteService`, `#quoteWhatsAppBtn` |
| Dependencies | `buildWhatsAppUrl`, `businessWhatsAppNumber` |

### Risks During Refactor

* Pricing logic closely tied to data structure
* WhatsApp button href updated on every input change

---

## WhatsApp Ordering System

| Property | Value |
|---|---|
| Functions | `buildWhatsAppUrl()`, `buildMailtoUrl()`, `openEnquiryChannel()` |
| Location | `js/main.js` (shared references section) |
| Used By | Contact form, bulk enquiry, sticky button, chat widget, service panels, quote calculator |

### Risks During Refactor

* Most critical conversion system — test thoroughly after any change
* Mobile/desktop URL differentiation logic
* Popup fallback → email fallback chain

---

## Service Interaction Panels

| Property | Value |
|---|---|
| Function | `setupServiceInteractions()` |
| Location | `js/main.js` |
| Data | `detailedServices` from `js/data/business-data.js` |
| DOM Targets | `#services .service-grid`, `.service-card` |
| State | `activeCard`, `sliderFocusCard`, slider pointer tracking |

### Slider Mode

* Activated at `max-width: 1199.98px`
* Horizontal scroll snapping with dot pagination
* Touch/pointer swipe detection to distinguish scroll vs click

### Risks During Refactor

* Largest and most complex feature (~560 lines)
* DOM insertion of detail panel depends on grid layout
* Multiple pointer event listeners for swipe tracking

---

## Toast Notification System

| Property | Value |
|---|---|
| Functions | `ensureEnquiryToast()`, `showEnquiryToast()` |
| Location | `js/core/toast.js` |
| Used By | Contact form, bulk enquiry, smart search, quote calculator, address copy, error handler |

---

## Open/Closed Status

| Property | Value |
|---|---|
| Function | `setupHeroOpenStatus()` |
| Location | `js/main.js` |
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
| Function | `setupBulkEnquiryForm()` |
| Location | `js/main.js` |
| DOM Targets | `#bulkEnquiryForm`, `#bulkUpload`, `#bulkFile` |
| Dependencies | `businessWhatsAppNumber`, `businessEmail`, `buildWhatsAppUrl`, toast |

### Note

* Shares identical validation logic with contact form (candidate for shared utility extraction)

---

## Gallery & Lightbox

| Property | Value |
|---|---|
| Function | `setupGalleryLightbox()` |
| Location | `js/main.js` |
| DOM Targets | `.gallery-grid img`, lightbox overlay |
| Features | Keyboard navigation, touch swipe, preloading |

---

## Chat Widget

| Property | Value |
|---|---|
| Function | `setupChatWidget()` |
| Location | `js/main.js` |
| DOM Targets | `#chatWidget`, `#chatFab`, `#chatPanel` |
| Dependencies | `businessWhatsAppNumber`, `buildWhatsAppUrl` |

---

## Navigation & Scroll Effects

| Feature | Function | Location |
|---|---|---|
| Header shadow | Inline (rAF-throttled scroll) | `js/main.js` |
| Scroll reveal | IntersectionObserver | `js/main.js` |
| Scroll progress | `setupScrollProgressIndicator()` | `js/main.js` |
| Back to top | `setupBackToTop()` | `js/main.js` |
| Desktop nav indicator | `setupNavigationExperience()` | `js/main.js` |
| Mobile nav | `setupMobileNavigationExperience()` | `js/main.js` |
| Desktop CTA rail | `setupDesktopCtaRailVisibility()` | `js/main.js` |

---

## Visual Effects

| Feature | Function |
|---|---|
| Counter animations | `setupCounterAnimations()` |
| Ripple effects | `setupRippleEffects()` |
| Tilt effects | `setupTiltEffects()` |
| Hero parallax | `setupHeroParallax()` |
| Hero typing line | `setupHeroTypingLine()` |
| Image skeletons | `setupImageLoadingSkeletons()` |
| Testimonial slider | `setupTestimonialSlider()` |

---

## Utility Features

| Feature | Function |
|---|---|
| Address copy | `setupAddressCopy()` |
| Sticky WhatsApp | `setupStickyWhatsAppButton()` |
| PDF downloads | `setupPdfDownloads()` |
| Service availability | `setupServiceAvailability()` |

---

# Feature Initialization Order

All features are initialized via `safeRun` in this order (from `js/main.js`):

1. `scroll-progress`
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
17. `bulk-enquiry`
18. `pdf-downloads`
19. `chat-widget`
20. `quote-calculator`
21. `service-availability`

Note: Contact form and Smart Search are initialized before `safeRun` features (directly in the `runAfterReady` callback).

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

# Next Refactoring Phase

## Phase 2 — Feature Extraction

Priority order:

1. Extract shared form utilities → `js/utils/form-helpers.js`
2. Extract smart search → `js/features/smart-search.js`
3. Extract service panels → `js/features/service-panel.js`
4. Extract quote calculator → `js/features/quote-calculator.js`
5. Extract gallery/lightbox → `js/features/gallery-lightbox.js`

Goal: Reduce main.js from ~3400 lines to ~200 lines (orchestrator only).
