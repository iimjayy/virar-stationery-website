# Virar Stationery & Jumbo Xerox

Premium local-business website for a stationery, printing, xerox, passport-photo, lamination, binding, and office-services shop in Virar, India.

**Live:** [virarprint.in](https://virarprint.in)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (semantic, accessible) |
| Styling | CSS3 + Bootstrap 5 |
| Logic | Vanilla JavaScript (ES6 modules) |
| Hosting | GitHub Pages (static) |

## Architecture

```
├── index.html               ← main application (single page)
├── style.css                ← global styles (8356 lines)
├── legal-pages.css          ← styles for legal pages
├── privacy.html / terms.html / sitemap.html
│
└── js/                      ← ES6 module architecture
    ├── main.js              ← application controller + all feature init
    ├── config.js            ← centralized business configuration
    ├── core/toast.js        ← toast notification system
    ├── data/business-data.js ← search catalog, services, pricing
    └── utils/helpers.js     ← pure utility functions
```

## Key Features

- Smart Search (command-palette style service finder)
- Interactive service detail panels with slider mode
- WhatsApp ordering & enquiry system (primary conversion channel)
- Quote calculator with real-time pricing
- Gallery & lightbox
- Chat widget, FAQ accordion, testimonials
- Open/closed status, service availability badges
- Responsive mobile-first UX

## Development

```bash
# Serve locally (ES modules require a server)
python3 -m http.server 8000
# or
npx -y serve .
```

## Engineering Notes

- `safeRun` wraps all features for fault tolerance
- `runAfterReady` ensures DOM readiness before init
- No build tools — native ES modules via `<script type="module">`
- All business config centralized in `js/config.js`