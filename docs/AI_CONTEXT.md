# Virar Stationery & Jumbo Xerox — AI Context

## Project Overview

This project is a premium local-business website for a real stationery, printing, xerox, passport-photo, lamination, binding, and office-services shop located in Virar, India.

The website is intended to evolve beyond a simple promotional website into a smart digital operational platform that improves:

* customer experience
* operational efficiency
* repeat customer retention
* trust
* automation
* WhatsApp workflows
* local SEO
* mobile usability
* print ordering workflows
* business scalability

The website serves:

* students
* office workers
* local businesses
* project printing customers
* walk-in printing customers
* repeat assignment/notes customers

---

# Core Business Philosophy

The website should:

* feel premium but approachable
* feel operationally useful
* feel intelligent and trustworthy
* reduce friction
* simplify customer communication
* reduce repetitive WhatsApp clarification
* improve workflow efficiency
* create local business dominance

The goal is NOT flashy redesigns.

The goal is:
practical business improvement through high-quality digital systems.

---

# Current Tech Stack

Frontend:

* HTML5
* CSS3
* Vanilla JavaScript (ES6 Modules)
* Bootstrap 5

Hosting:

* GitHub Pages (static, served via CNAME: virarprint.in)

---

# Current Architecture

## JavaScript (ES6 Modules)

```
js/
├── main.js              ← application controller (~480 lines, imports modules, initializes features via safeRun)
├── config.js            ← CONFIG object: business constants, hours, messages
├── core/
│   └── toast.js         ← toast notification system (ensureEnquiryToast, showEnquiryToast)
├── data/
│   └── business-data.js ← searchCatalog, detailedServices, pricingConfig, pdfTemplates, addonRates
├── utils/
│   └── helpers.js       ← escapeHtml, normalizeText, toLookupKey, normalizePhoneNumber, buildWhatsAppUrl, etc.
└── features/
    ├── address-copy.js
    ├── bulk-enquiry.js
    ├── chat-widget.js
    ├── counters.js
    ├── faq.js
    ├── floating-actions.js
    ├── gallery-lightbox.js
    ├── navigation.js
    ├── pdf-downloads.js
    ├── quote-calculator.js
    ├── reveal-animations.js
    ├── service-availability.js
    ├── service-interactions.js   ← dual-mode service panel system (expandable grid + mobile slider)
    ├── smart-search.js
    ├── sticky-whatsapp.js
    └── testimonial-slider.js
```

Entry point: `<script type="module" src="js/main.js">` in index.html.

## CSS

* `style.css` — single global stylesheet (8414 lines, 163KB)
* `legal-pages.css` — styles for privacy/terms/sitemap pages

## HTML

* `index.html` — main single-page application (1504 lines)
* `privacy.html`, `terms.html`, `sitemap.html` — legal/info pages

---

# Important Existing Features

## Smart Search

Interactive search system with fuzzy matching, keyboard navigation, recent searches, and trending suggestions. Uses flattened catalog from business-data.js. Targets service cards, product cards, and price cards via DOM maps.

## Quote Calculator

Real-time pricing estimation for printing-related services. Uses pricingConfig and addonRates from business-data.js.

## WhatsApp Ordering

Core conversion workflow using pre-filled WhatsApp messages. Mobile/desktop URL differentiation via buildWhatsAppUrl(). Email fallback chain. Used by: contact form, bulk enquiry, chat widget, service panels, sticky button, quote calculator.

## Service Interaction Panels

Interactive expandable service cards with detail panels. Responsive slider mode for mobile (<1200px). Touch/pointer swipe detection to distinguish scroll vs click. Uses buildWhatsAppUrl for device-aware WhatsApp links.

## Open/Closed Status System

Displays operational shop timing information dynamically. Auto-refreshes every 60 seconds.

## Toast Notification System

Encapsulated toast module with timeout management. Used for feedback across all interactive features.

## Gallery & Lightbox

Image gallery with keyboard-navigable lightbox overlay. Touch swipe support.

## Responsive Mobile Experience

Mobile-first interactions, hamburger navigation, bottom action bar, sticky WhatsApp button.

---

# Architecture Notes

## Production Safety

* `safeRun(label, callback)` wraps every feature initialization — if one feature crashes, others continue working
* `runAfterReady(callback)` ensures DOM is loaded before any initialization
* Global `error` and `unhandledrejection` listeners report failures via toast

## Shared State

* `businessWhatsAppNumber` and `businessEmail` are resolved once at initialization, shared across features that need them
* `buildWhatsAppUrl()`, `buildMailtoUrl()`, and `openEnquiryChannel()` are shared utility functions in helpers.js

## Module Boundaries

* `config.js` — read-only configuration (frozen CONFIG object)
* `helpers.js` — pure functions with no DOM side effects
* `toast.js` — encapsulated UI component with module-scoped state
* `business-data.js` — static data exports only
* `main.js` — orchestrator: imports modules, resolves shared references, initializes all features
* `features/*.js` — self-contained feature modules with their own imports

---

# Engineering Standards

Code should be:

* maintainable
* modular
* scalable
* readable
* semantic
* responsive
* performant
* accessibility-aware
* mobile-first

Avoid:

* unnecessary frameworks
* bloated dependencies
* excessive libraries
* overengineering
* unnecessary backend complexity

Prefer:

* lightweight native solutions
* progressive enhancement
* incremental refactoring
* reusable utilities
* isolated feature modules

---

# Performance Priorities

Important:

* optimize for mobile devices common in India
* optimize for low/mid-range Android devices
* reduce layout shift
* reduce JS parse cost
* lazy-load noncritical logic
* optimize images
* reduce CSS duplication
* improve responsiveness
* use rAF throttling for scroll/resize handlers

---

# UX Priorities

The UX should:

* reduce cognitive load
* reduce communication friction
* simplify ordering
* increase trust
* improve discoverability
* feel smooth and premium
* prioritize WhatsApp workflows
* support fast student interactions

Important:
Most users are likely mobile users.

---

# Business Priorities

Primary goals:

* increase WhatsApp enquiries
* increase repeat customers
* reduce manual clarification effort
* improve operational workflow
* improve local trust
* improve customer convenience
* improve conversion rate
* improve student retention
* improve discoverability

---

# AI Collaboration Rules

When modifying the codebase:

## DO:

* preserve existing functionality
* preserve branding and visual identity
* prefer incremental refactors
* isolate changes carefully
* explain architectural risks
* identify dependencies
* identify side effects
* improve maintainability
* improve performance where relevant

## DO NOT:

* rewrite the entire website unnecessarily
* redesign without justification
* introduce heavy frameworks without reason
* break existing workflows
* remove working business features
* overcomplicate implementation

---

# Current Refactoring Phase

Current focus:
PHASE 3 — Production Optimization & Hardening

Completed:
* ✅ PHASE 1a — JavaScript modularization (config, data, utils, toast extracted)
* ✅ PHASE 1b — Workspace stabilization and cleanup
* ✅ PHASE 2 — Feature extraction (all 16 feature modules extracted from main.js)

Next priorities:
1. CSS modularization (163KB monolith → component files)
2. CSS performance optimization (backdrop-filter reduction, animation audit)
3. Image optimization (WebP conversion, srcset/sizes)
4. Contact form extraction to separate module

---

# Important Philosophy

This project should evolve into:

"A premium intelligent digital operating system for a real-world stationery and printing business."

Not merely:
"a visually attractive website."
