# Virar Stationery & Jumbo Xerox — Feature Map

## Purpose

This document maps:

* frontend features
* code ownership
* dependencies
* DOM relationships
* related CSS
* related JavaScript
* business logic
* conversion purpose
* operational importance

This document exists to:

* improve maintainability
* reduce AI context wastage
* speed up debugging
* improve modularization
* simplify feature extraction
* reduce accidental breakage
* help future contributors
* improve AI-assisted development quality

This file should be updated whenever:

* new features are added
* features are refactored
* modules are extracted
* dependencies change
* selectors change
* workflows change

---

# Global Architecture Notes

## Current State

* Monolithic HTML structure
* Large global CSS file
* Large global JavaScript file
* Shared DOM/event dependencies
* Multiple global event listeners
* Multiple repeated responsive blocks

## Target State

* Modular JavaScript
* Modular CSS
* Isolated feature systems
* Clear dependency boundaries
* Reusable utilities
* Shared state minimization

---

# FEATURES

# Smart Search

## Business Purpose

Helps users quickly discover:

* services
* stationery items
* sections
* business offerings

Reduces navigation friction and improves discoverability.

## UX Purpose

Acts as:

* command palette
* instant navigation layer
* service finder
* conversion accelerator

Important because many users arrive with a specific intent.

---

## Current Location

### JavaScript

script.js
(Search initialization and catalog logic)

### HTML

Search bar section in hero/navigation area

### CSS

Search-related styles inside style.css

---

## Planned Extraction

/js/features/smart-search.js

---

## Dependencies

### DOM Dependencies

* search input
* suggestion container
* service cards
* anchor sections
* search result renderer

### Shared Utilities

* toast system
* smooth scroll utilities
* section highlighting

### Event Dependencies

* input listeners
* focus listeners
* click-outside listeners
* keyboard navigation listeners

---

## Risks During Refactor

* breaking navigation behavior
* duplicate listeners
* mobile interaction conflicts
* scroll positioning issues

---

## Future Improvements

* lazy-loaded catalog
* fuzzy search
* search analytics
* recent searches
* quick actions
* service shortcuts

---

# Quote Calculator

## Business Purpose

Allows users to estimate printing/project costs before enquiry.

Reduces pricing uncertainty and increases WhatsApp conversions.

Acts as a trust-building operational tool.

---

## UX Purpose

Makes the business feel:

* transparent
* modern
* operationally mature

---

## Current Location

### JavaScript

script.js

### HTML

Quote/pricing calculator section

### CSS

Calculator-related styles inside style.css

---

## Planned Extraction

/js/features/quote-calculator.js

---

## Dependencies

### DOM Dependencies

* quantity inputs
* pricing selectors
* result displays
* CTA buttons

### Shared Dependencies

* WhatsApp message generator
* toast notifications

---

## Future Improvements

* structured print ordering
* deadline-based pricing
* live cost previews
* saved print preferences
* quick reorder shortcuts

---

# WhatsApp Ordering System

## Business Purpose

Primary conversion channel.

Most important operational workflow.

---

## UX Purpose

Provides:

* low-friction communication
* fast enquiries
* familiar workflow for Indian users

---

## Current Location

### JavaScript

script.js

### HTML

CTA buttons
forms
service cards
bottom action bar

---

## Planned Extraction

/js/core/whatsapp.js

---

## Responsibilities

* generate WhatsApp URLs
* build enquiry messages
* structured order formatting
* phone routing
* service-specific enquiries

---

## Dependencies

### Shared Across

* quote calculator
* contact form
* service cards
* enquiry CTAs
* sticky buttons

---

## Future Improvements

* structured print requests
* repeat order templates
* urgency handling
* order summaries
* customer preference integration

---

# Toast Notification System

## Purpose

Provides interaction feedback across the website.

Used for:

* success messages
* copy confirmations
* interaction feedback
* operational guidance

---

## Current Location

### JavaScript

script.js

---

## Planned Extraction

/js/core/toast.js

---

## Dependencies

### Used By

* search
* forms
* WhatsApp interactions
* clipboard actions
* utility actions

---

## Risks

Because multiple systems use toast notifications,
refactoring requires careful dependency tracking.

---

# Open/Closed Status System

## Business Purpose

Communicates live operational availability.

Important for:

* walk-in customers
* urgency-based visits
* trust
* operational professionalism

---

## Current Location

### JavaScript

script.js

### HTML

Hero status area

---

## Planned Extraction

/js/business/hero-status.js

---

## Future Improvements

* busy indicators
* queue visibility
* best visit timing
* holiday overrides
* live announcements

---

# Gallery & Lightbox

## Business Purpose

Provides:

* trust
* proof of work
* visual quality assurance

---

## UX Purpose

Makes business feel:

* active
* professional
* premium
* authentic

---

## Current Location

### JavaScript

script.js

### CSS

Gallery/lightbox styles

### HTML

Gallery section

---

## Planned Extraction

/js/features/gallery-lightbox.js

---

## Dependencies

### DOM Dependencies

* gallery grid
* image overlays
* modal/lightbox container

---

## Future Improvements

* categorized galleries
* before/after examples
* customer project showcases
* lazy loading
* optimized image delivery

---

# Contact Form

## Business Purpose

Lead generation and enquiry collection.

---

## Current Behavior

Generates WhatsApp-based enquiries.

---

## Planned Improvements

Transform into:
step-based conversational workflow.

Example:

1. service selection
2. quantity
3. urgency
4. preferences
5. WhatsApp order generation

---

## Planned Extraction

/js/features/contact-form.js

---

# Testimonials

## Business Purpose

Trust amplification.

---

## Current Issue

Placeholder/sample testimonials reduce authenticity.

---

## Planned Improvements

* real Google reviews
* review snippets
* local customer references
* project examples
* recent customer feedback

---

# Navigation System

## Purpose

Website orientation and service discovery.

---

## Current Issues

Some navigation items point to the same section instead of specific service anchors.

---

## Planned Improvements

* service-specific anchors
* smart section scrolling
* contextual highlighting
* improved mobile navigation

---

## Planned Extraction

/js/navigation/

---

# Mobile Bottom Action Bar

## Business Purpose

High-conversion mobile actions.

---

## Current Actions

* WhatsApp
* Call
* Directions

---

## Future Improvements

Possible priority changes:

* WhatsApp
* Prices
* Directions

Based on mobile user behavior analysis.

---

# Performance Optimization

## Current Issues

* large JS parse cost
* duplicated responsive CSS
* image layout shifts
* synchronous catalog loading

---

## Planned Improvements

* lazy-loaded search catalog
* image dimensions
* consolidated media queries
* modular CSS
* deferred noncritical effects

---

# SEO Systems

## Current State

Basic local SEO structure exists.

---

## Future Opportunities

* service-specific pages
* FAQ schema
* LocalBusiness schema
* review schema
* location-specific landing pages

---

# Analytics Opportunities

## Important Events To Track

* WhatsApp clicks
* quote generation
* search usage
* popular services
* form interactions
* mobile action usage

---

# Operational Systems (Future)

Potential future systems:

* Google Sheets order tracking
* repeat customer memory
* order status system
* queue visibility
* student utility ecosystem
* print workflow automation

---

# Refactoring Rules

When extracting modules:

## ALWAYS:

* identify dependencies first
* preserve functionality
* isolate feature scope
* migrate incrementally
* test after each extraction
* maintain backward compatibility where possible

## NEVER:

* refactor multiple unrelated systems simultaneously
* rewrite entire architecture at once
* remove working business workflows
* introduce unnecessary complexity

---

# Current Refactoring Priority

## Phase 1

1. whatsapp.js
2. toast.js
3. smart-search.js
4. quote-calculator.js
5. gallery-lightbox.js

Goal:
Improve maintainability without breaking production behavior.
