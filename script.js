// Replace placeholder phone numbers, WhatsApp links, addresses, and images with real business details before deployment.

document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((element) => observer.observe(element));

  const header = document.querySelector('.site-header');
  const updateHeaderShadow = () => {
    if (window.scrollY > 12) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  updateHeaderShadow();
  window.addEventListener('scroll', updateHeaderShadow, { passive: true });

  const setupHeroOpenStatus = () => {
    const statusPill = document.getElementById('heroOpenStatus');
    if (!statusPill) {
      return;
    }

    const statusText = statusPill.querySelector('.hero-open-text');
    if (!statusText) {
      return;
    }

    const openHour = 8;
    const closeHour = 21;

    const formatHour = (hour24) => {
      const suffix = hour24 >= 12 ? 'pm' : 'am';
      const normalizedHour = ((hour24 + 11) % 12) + 1;
      return `${normalizedHour}${suffix}`;
    };

    const updateOpenStatus = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const openMinutes = openHour * 60;
      const closeMinutes = closeHour * 60;
      const isOpenNow = currentMinutes >= openMinutes && currentMinutes < closeMinutes;

      statusPill.classList.remove('is-loading', 'is-open', 'is-closed');

      if (isOpenNow) {
        statusPill.classList.add('is-open');
        statusText.textContent = `Open Now · Closes at ${formatHour(closeHour)}`;
      } else {
        statusPill.classList.add('is-closed');
        const isAfterClosing = currentMinutes >= closeMinutes;
        statusText.textContent = isAfterClosing
          ? `Closed Now · Opens tomorrow ${formatHour(openHour)}`
          : `Closed Now · Opens ${formatHour(openHour)}`;
      }

      statusPill.setAttribute('aria-label', statusText.textContent);
    };

    updateOpenStatus();

    const now = new Date();
    const delayToNextMinute = ((60 - now.getSeconds()) * 1000) - now.getMilliseconds();

    window.setTimeout(() => {
      updateOpenStatus();
      window.setInterval(updateOpenStatus, 60000);
    }, Math.max(400, delayToNextMinute));
  };

  setupHeroOpenStatus();

  const contactForm = document.getElementById('contactForm');
  const searchForms = document.querySelectorAll('.search-box');

  if (contactForm) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';

      window.setTimeout(() => {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        contactForm.reset();
        window.alert('Thank you. Your inquiry has been prepared. Replace this demo action with your real form handler before going live.');
      }, 700);
    });
  }

  const setupSmartSearch = (form) => {
    if (!form) {
      return;
    }

    const input = form.querySelector('.search-input');
    if (!input) {
      return;
    }

    const dropdown = document.createElement('div');
    dropdown.className = 'smart-search-dropdown';
    dropdown.setAttribute('aria-hidden', 'true');
    dropdown.setAttribute('role', 'listbox');
    dropdown.innerHTML = '<div class="smart-search-scroll"></div>';
    form.appendChild(dropdown);

    const dropdownScroll = dropdown.querySelector('.smart-search-scroll');
    const maxVisibleSuggestions = 10;
    const maxRecentSearches = 6;
    const recentStorageKey = 'virarSmartSearchRecent';
    const categoryOrder = ['Services', 'Products', 'Popular Searches', 'Contact & Location', 'Customer Queries', 'Recent Searches'];

    let activeSuggestionIndex = -1;
    let visibleSuggestions = [];
    let isShowingAllResults = false;
    let previousQuery = '';

    const normalizeText = (value) =>
      String(value ?? '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    const toLookupKey = (value) =>
      normalizeText(value)
        .replace(/\bcolour\b/g, 'color')
        .replace(/\bprinting\b/g, 'print')
        .replace(/\bprintout\b/g, 'print')
        .replace(/\s+/g, ' ')
        .trim();

    const escapeHtml = (value) => {
      const text = String(value ?? '');
      return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    };

    const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const fuzzySequentialMatch = (source, query) => {
      if (!source || !query) {
        return false;
      }

      let queryIndex = 0;
      for (const char of source) {
        if (char === query[queryIndex]) {
          queryIndex += 1;
          if (queryIndex === query.length) {
            return true;
          }
        }
      }

      return false;
    };

    const highlightMatch = (text, query) => {
      const safeText = escapeHtml(text);
      const tokens = normalizeText(query)
        .split(' ')
        .filter(Boolean)
        .sort((first, second) => second.length - first.length);

      if (!tokens.length) {
        return safeText;
      }

      const pattern = tokens.map((token) => escapeRegExp(token)).join('|');
      if (!pattern) {
        return safeText;
      }

      const matcher = new RegExp(`(${pattern})`, 'ig');
      return safeText.replace(matcher, '<mark>$1</mark>');
    };

    const createCardMap = (cardSelector, headingSelector) => {
      const map = new Map();
      const cards = document.querySelectorAll(cardSelector);

      cards.forEach((card) => {
        const heading = card.querySelector(headingSelector);
        if (!heading) {
          return;
        }

        const key = toLookupKey(heading.textContent);
        if (!key) {
          return;
        }

        map.set(key, card);
      });

      return map;
    };

    const serviceCardMap = createCardMap('#services .service-card', 'h3');
    const productCardMap = createCardMap('#stationery .product-card', '.product-body h3');
    const priceCardMap = createCardMap('#popular-prices .price-card', 'h3');

    const searchCatalog = {
      Services: [
        {
          label: 'Xerox',
          icon: 'fa-solid fa-copy',
          keywords: ['photocopy', 'xerox service', 'copy center'],
          target: { type: 'service', text: 'Xerox / Photocopy', fallbackSelector: '#services' }
        },
        {
          label: 'Black & White Printing',
          icon: 'fa-solid fa-print',
          keywords: ['bw print', 'printout', 'document print'],
          target: { type: 'service', text: 'Black & White Printing', fallbackSelector: '#services' }
        },
        {
          label: 'Colour Printing',
          icon: 'fa-solid fa-palette',
          keywords: ['color print', 'colour printout', 'brochure printing'],
          target: { type: 'service', text: 'Color Printing', fallbackSelector: '#services' }
        },
        {
          label: 'Lamination',
          icon: 'fa-solid fa-layer-group',
          keywords: ['document protection', 'laminate sheet'],
          target: { type: 'service', text: 'Lamination', fallbackSelector: '#services' }
        },
        {
          label: 'Spiral Binding',
          icon: 'fa-solid fa-clipboard-list',
          keywords: ['binding', 'project binding'],
          target: { type: 'service', text: 'Spiral Binding', fallbackSelector: '#services' }
        },
        {
          label: 'Passport Photos',
          icon: 'fa-solid fa-camera',
          keywords: ['passport size photo', 'id photo'],
          target: { type: 'service', text: 'Passport Photos', fallbackSelector: '#services' }
        },
        {
          label: 'Project Printing',
          icon: 'fa-solid fa-folder-open',
          keywords: ['college project', 'assignment print'],
          target: { type: 'service', text: 'Project Printing', fallbackSelector: '#services' }
        },
        {
          label: 'ID Card Printing',
          icon: 'fa-solid fa-id-card',
          keywords: ['id card', 'smart card', 'card print'],
          target: { type: 'service', text: 'Smart Card', fallbackSelector: '#services' }
        },
        {
          label: 'Smart Card Printing',
          icon: 'fa-solid fa-address-card',
          keywords: ['smart card', 'id card print'],
          target: { type: 'price', text: 'Smart Card', fallbackSelector: '#popular-prices' }
        },
        {
          label: 'Visiting Card Printing',
          icon: 'fa-solid fa-address-card',
          keywords: ['business card', 'visiting card'],
          target: { type: 'service', text: 'Visiting Card', fallbackSelector: '#services' }
        },
        {
          label: 'Rubber Stamp',
          icon: 'fa-solid fa-stamp',
          keywords: ['stamp making', 'office stamp'],
          target: { type: 'section', selector: '#contact' }
        },
        {
          label: 'Autocad Plotting',
          icon: 'fa-solid fa-ruler-combined',
          keywords: ['plotting', 'engineering drawing', 'a0 print'],
          target: { type: 'service', text: 'Jumbo Xerox', fallbackSelector: '#services' }
        },
        {
          label: 'Jumbo Xerox',
          icon: 'fa-solid fa-expand',
          keywords: ['a3', 'a2', 'a1', 'a0 xerox'],
          target: { type: 'service', text: 'Jumbo Xerox', fallbackSelector: '#services' }
        },
        {
          label: 'Digital Print',
          icon: 'fa-solid fa-file-lines',
          keywords: ['digital printing', 'high quality print'],
          target: { type: 'service', text: 'Color Printing', fallbackSelector: '#services' }
        },
        {
          label: 'Letterhead Printing',
          icon: 'fa-solid fa-heading',
          keywords: ['letterhead', 'business stationery print'],
          target: { type: 'service', text: 'Letterhead Print', fallbackSelector: '#services' }
        },
        {
          label: 'Aadhar Card Print',
          icon: 'fa-solid fa-id-card',
          keywords: ['aadhaar print', 'identity print', 'id proof print'],
          target: { type: 'service', text: 'Black & White Printing', fallbackSelector: '#services' }
        },
        {
          label: 'Resume Print',
          icon: 'fa-solid fa-file-lines',
          keywords: ['cv print', 'resume color print', 'job resume print'],
          target: { type: 'service', text: 'Black & White Printing', fallbackSelector: '#services' }
        }
      ],
      Products: [
        {
          label: 'Pens',
          icon: 'fa-solid fa-pen',
          keywords: ['ball pen', 'gel pen'],
          target: { type: 'product', text: 'Pens', fallbackSelector: '#stationery' }
        },
        {
          label: 'Notebooks',
          icon: 'fa-solid fa-book',
          keywords: ['notebook', 'register'],
          target: { type: 'product', text: 'Notebooks', fallbackSelector: '#stationery' }
        },
        {
          label: 'Files',
          icon: 'fa-solid fa-folder',
          keywords: ['document file', 'folder'],
          target: { type: 'product', text: 'Files', fallbackSelector: '#stationery' }
        },
        {
          label: 'Charts',
          icon: 'fa-solid fa-chart-column',
          keywords: ['chart paper', 'presentation chart'],
          target: { type: 'product', text: 'Charts', fallbackSelector: '#stationery' }
        },
        {
          label: 'Sticky Notes',
          icon: 'fa-solid fa-note-sticky',
          keywords: ['post it notes', 'memo notes'],
          target: { type: 'product', text: 'Sticky Notes', fallbackSelector: '#stationery' }
        },
        {
          label: 'Project Paper',
          icon: 'fa-solid fa-file',
          keywords: ['project materials', 'project sheets'],
          target: { type: 'product', text: 'Project Materials', fallbackSelector: '#stationery' }
        },
        {
          label: 'A4 Sheets',
          icon: 'fa-solid fa-file-lines',
          keywords: ['a4 paper', 'print paper'],
          target: { type: 'product', text: 'Project Materials', fallbackSelector: '#stationery' }
        },
        {
          label: 'Markers',
          icon: 'fa-solid fa-pen-clip',
          keywords: ['marker pen', 'highlight marker'],
          target: { type: 'section', selector: '#stationery' }
        },
        {
          label: 'Folders',
          icon: 'fa-solid fa-folder-open',
          keywords: ['document folder', 'office folder'],
          target: { type: 'product', text: 'Files', fallbackSelector: '#stationery' }
        },
        {
          label: 'Cartridges',
          icon: 'fa-solid fa-print',
          keywords: ['printer cartridge', 'toner'],
          target: { type: 'service', text: 'Cartridge Refelling', fallbackSelector: '#services' }
        },
        {
          label: 'Printer Ink',
          icon: 'fa-solid fa-fill-drip',
          keywords: ['ink refill', 'ink bottle'],
          target: { type: 'service', text: 'Cartridge Refelling', fallbackSelector: '#services' }
        },
        {
          label: 'Calculators',
          icon: 'fa-solid fa-calculator',
          keywords: ['scientific calculator', 'student calculator'],
          target: { type: 'product', text: 'Calculators', fallbackSelector: '#stationery' }
        },
        {
          label: 'Art Supplies',
          icon: 'fa-solid fa-paintbrush',
          keywords: ['drawing supplies', 'art material'],
          target: { type: 'product', text: 'Art Supplies', fallbackSelector: '#stationery' }
        },
        {
          label: 'Envelopes',
          icon: 'fa-solid fa-envelope-open-text',
          keywords: ['covers', 'office envelope'],
          target: { type: 'section', selector: '#stationery' }
        }
      ],
      'Popular Searches': [
        {
          label: 'Xerox near me',
          icon: 'fa-solid fa-magnifying-glass',
          keywords: ['nearby xerox', 'local xerox'],
          target: { type: 'service', text: 'Xerox / Photocopy', fallbackSelector: '#services' }
        },
        {
          label: 'Printout near me',
          icon: 'fa-solid fa-magnifying-glass',
          keywords: ['print near me', 'printing nearby'],
          target: { type: 'service', text: 'Black & White Printing', fallbackSelector: '#services' }
        },
        {
          label: 'Colour print price',
          icon: 'fa-solid fa-magnifying-glass',
          keywords: ['color print rate', 'colour printing cost'],
          target: { type: 'price', text: 'Colour Printout', fallbackSelector: '#popular-prices' }
        },
        {
          label: 'Passport photo price',
          icon: 'fa-solid fa-magnifying-glass',
          keywords: ['passport photo rate', 'photo print price'],
          target: { type: 'price', text: 'Passport Photos', fallbackSelector: '#popular-prices' }
        },
        {
          label: 'Lamination near me',
          icon: 'fa-solid fa-magnifying-glass',
          keywords: ['lamination service nearby'],
          target: { type: 'service', text: 'Lamination', fallbackSelector: '#services' }
        },
        {
          label: 'Project printing',
          icon: 'fa-solid fa-magnifying-glass',
          keywords: ['project print', 'assignment printing'],
          target: { type: 'service', text: 'Project Printing', fallbackSelector: '#services' }
        },
        {
          label: 'College project work',
          icon: 'fa-solid fa-magnifying-glass',
          keywords: ['college print work', 'project binding'],
          target: { type: 'service', text: 'Project Printing', fallbackSelector: '#services' }
        },
        {
          label: 'Stationery shop in Virar',
          icon: 'fa-solid fa-magnifying-glass',
          keywords: ['virar stationery', 'stationery near virar'],
          target: { type: 'section', selector: '#stationery' }
        },
        {
          label: 'Xerox shop near Viva College',
          icon: 'fa-solid fa-magnifying-glass',
          keywords: ['viva college xerox', 'near viva college'],
          target: { type: 'section', selector: '#contact' }
        },
        {
          label: 'Xerox Near Viva College',
          icon: 'fa-solid fa-magnifying-glass',
          keywords: ['xerox near viva', 'viva college xerox shop'],
          target: { type: 'section', selector: '#contact' }
        },
        {
          label: 'Jumbo Xerox',
          icon: 'fa-solid fa-magnifying-glass',
          keywords: ['a0 xerox', 'large xerox'],
          target: { type: 'service', text: 'Jumbo Xerox', fallbackSelector: '#services' }
        },
        {
          label: 'Visiting card print',
          icon: 'fa-solid fa-magnifying-glass',
          keywords: ['business card print'],
          target: { type: 'service', text: 'Visiting Card', fallbackSelector: '#services' }
        },
        {
          label: 'Spiral binding price',
          icon: 'fa-solid fa-magnifying-glass',
          keywords: ['binding rate'],
          target: { type: 'price', text: 'Spiral Binding', fallbackSelector: '#popular-prices' }
        },
        {
          label: 'Smart card printing',
          icon: 'fa-solid fa-magnifying-glass',
          keywords: ['smart card print'],
          target: { type: 'price', text: 'Smart Card', fallbackSelector: '#popular-prices' }
        },
        {
          label: 'Same day printing',
          icon: 'fa-solid fa-magnifying-glass',
          keywords: ['urgent print', 'quick print service'],
          target: { type: 'section', selector: '#services' }
        }
      ],
      'Contact & Location': [
        {
          label: 'Virar West',
          icon: 'fa-solid fa-location-dot',
          keywords: ['virar location', 'shop location'],
          target: { type: 'section', selector: '#contact' }
        },
        {
          label: 'Near Viva College',
          icon: 'fa-solid fa-location-dot',
          keywords: ['viva college', 'near old viva college'],
          target: { type: 'section', selector: '#contact' }
        },
        {
          label: 'Shop timings',
          icon: 'fa-solid fa-clock',
          keywords: ['opening time', 'closing time', 'timings'],
          target: { type: 'section', selector: '#contact' }
        },
        {
          label: 'WhatsApp inquiry',
          icon: 'fa-brands fa-whatsapp',
          keywords: ['send file on whatsapp', 'whatsapp print'],
          target: { type: 'url', href: 'https://wa.me/917021072757', newTab: true }
        },
        {
          label: 'Call now',
          icon: 'fa-solid fa-phone',
          keywords: ['phone number', 'contact call'],
          target: { type: 'url', href: 'tel:+917021072757' }
        },
        {
          label: 'Directions',
          icon: 'fa-solid fa-map-location-dot',
          keywords: ['google maps', 'navigate to shop'],
          target: {
            type: 'url',
            href: 'https://www.google.com/maps?q=Shop%20No.%2011%2C%20Takshashila%20Apartment%2C%20opp%20mahavir%20hospital%2C%20Near%20Old%20Viva%20College%2C%20ram%20mandir%20rd%2C%20Virar%20West%2C%20Mumbai%20-%20401303',
            newTab: true
          }
        },
        {
          label: 'Shop address',
          icon: 'fa-solid fa-store',
          keywords: ['address', 'location details'],
          target: { type: 'section', selector: '#contact' }
        },
        {
          label: 'Open now',
          icon: 'fa-solid fa-clock',
          keywords: ['is shop open', 'current timings'],
          target: { type: 'section', selector: '#contact' }
        }
      ],
      'Customer Queries': [
        {
          label: 'Xerox price',
          icon: 'fa-solid fa-circle-question',
          keywords: ['xerox rate', 'photocopy price'],
          target: { type: 'price', text: 'Xerox / Photocopy', fallbackSelector: '#popular-prices' }
        },
        {
          label: 'Printout price',
          icon: 'fa-solid fa-circle-question',
          keywords: ['print rate', 'document print price'],
          target: { type: 'price', text: 'Colour Printout', fallbackSelector: '#popular-prices' }
        },
        {
          label: 'Colour print price',
          icon: 'fa-solid fa-circle-question',
          keywords: ['color print cost'],
          target: { type: 'price', text: 'Colour Printout', fallbackSelector: '#popular-prices' }
        },
        {
          label: 'Lamination cost',
          icon: 'fa-solid fa-circle-question',
          keywords: ['lamination price'],
          target: { type: 'price', text: 'Lamination', fallbackSelector: '#popular-prices' }
        },
        {
          label: 'Binding cost',
          icon: 'fa-solid fa-circle-question',
          keywords: ['spiral binding price'],
          target: { type: 'price', text: 'Spiral Binding', fallbackSelector: '#popular-prices' }
        },
        {
          label: 'Passport photo timing',
          icon: 'fa-solid fa-circle-question',
          keywords: ['passport photo time'],
          target: { type: 'service', text: 'Passport Photos', fallbackSelector: '#services' }
        },
        {
          label: 'How long does printing take',
          icon: 'fa-solid fa-circle-question',
          keywords: ['printing time', 'delivery time'],
          target: { type: 'service', text: 'Project Printing', fallbackSelector: '#services' }
        },
        {
          label: 'Bulk printing discount',
          icon: 'fa-solid fa-circle-question',
          keywords: ['bulk order discount', 'printing bulk rate'],
          target: { type: 'section', selector: '#contact' }
        },
        {
          label: 'Same-day delivery',
          icon: 'fa-solid fa-circle-question',
          keywords: ['same day print', 'urgent service'],
          target: { type: 'section', selector: '#services' }
        },
        {
          label: 'WhatsApp document printing',
          icon: 'fa-brands fa-whatsapp',
          keywords: ['send files on whatsapp', 'document print whatsapp'],
          target: { type: 'url', href: 'https://wa.me/917021072757', newTab: true }
        }
      ]
    };

    const flattenCatalog = Object.entries(searchCatalog).flatMap(([category, entries]) =>
      entries.map((entry, index) => {
        const label = entry.label;
        const terms = [label, ...(entry.keywords || [])];

        return {
          id: `${toLookupKey(category)}-${index}`,
          category,
          label,
          icon: entry.icon || 'fa-solid fa-magnifying-glass',
          target: entry.target,
          terms,
          normalizedTerms: terms.map((term) => toLookupKey(term)).filter(Boolean)
        };
      })
    );

    const catalogByLabel = new Map(flattenCatalog.map((entry) => [toLookupKey(entry.label), entry]));

    const createRecentQueryEntry = (query) => ({
      id: `recent-query-${toLookupKey(query)}`,
      category: 'Recent Searches',
      label: query,
      icon: 'fa-solid fa-clock-rotate-left',
      target: { type: 'query', query },
      terms: [query],
      normalizedTerms: [toLookupKey(query)]
    });

    const readRecentSearches = () => {
      try {
        const data = JSON.parse(window.localStorage.getItem(recentStorageKey) || '[]');
        if (!Array.isArray(data)) {
          return [];
        }

        return data.filter((item) => typeof item === 'string' && item.trim());
      } catch {
        return [];
      }
    };

    const saveRecentSearches = (recentSearches) => {
      try {
        window.localStorage.setItem(recentStorageKey, JSON.stringify(recentSearches));
      } catch {
        // Ignore storage errors.
      }
    };

    const addRecentSearch = (term) => {
      const normalizedTerm = term.trim();
      if (normalizedTerm.length < 2) {
        return;
      }

      const existing = readRecentSearches().filter(
        (entry) => toLookupKey(entry) !== toLookupKey(normalizedTerm)
      );
      const updated = [normalizedTerm, ...existing].slice(0, maxRecentSearches);
      saveRecentSearches(updated);
    };

    const getRecentSearchEntries = () =>
      readRecentSearches()
        .slice(0, maxRecentSearches)
        .map((term) => catalogByLabel.get(toLookupKey(term)) || createRecentQueryEntry(term));

    const trendingLabels = [
      'Xerox near me',
      'Printout near me',
      'Colour print price',
      'Passport photo price',
      'Lamination near me',
      'Project printing',
      'Stationery shop in Virar',
      'Same day printing'
    ];

    const trendingEntries = trendingLabels
      .map((label) => catalogByLabel.get(toLookupKey(label)) || createRecentQueryEntry(label))
      .slice(0, maxVisibleSuggestions);

    const getCategoryRank = (category) => {
      const rank = categoryOrder.indexOf(category);
      if (rank === -1) {
        return categoryOrder.length + 1;
      }

      return rank;
    };

    const scoreEntry = (entry, query) => {
      const queryKey = toLookupKey(query);
      if (!queryKey) {
        return 0;
      }

      const queryCompact = queryKey.replace(/\s+/g, '');
      const queryTokens = queryKey.split(' ').filter(Boolean);
      let bestScore = 0;

      entry.normalizedTerms.forEach((term, termIndex) => {
        if (!term) {
          return;
        }

        const termCompact = term.replace(/\s+/g, '');
        let score = 0;

        if (term === queryKey) {
          score += 200;
        }

        if (term.startsWith(queryKey)) {
          score += 140;
        }

        if (term.includes(queryKey)) {
          score += 110;
        }

        if (fuzzySequentialMatch(termCompact, queryCompact)) {
          score += 65;
        }

        queryTokens.forEach((token) => {
          if (token.length < 2) {
            if (term.startsWith(token)) {
              score += 14;
            }
            return;
          }

          if (term.startsWith(token)) {
            score += 22;
          } else if (term.includes(token)) {
            score += 12;
          }
        });

        if (termIndex > 0) {
          score -= 6;
        }

        bestScore = Math.max(bestScore, score);
      });

      if (!bestScore) {
        return 0;
      }

      const categoryBoost = Math.max(0, 8 - getCategoryRank(entry.category));
      return bestScore + categoryBoost;
    };

    const groupSuggestions = (entries) => {
      const grouped = new Map();

      entries.forEach((entry) => {
        const category = entry.category;
        if (!grouped.has(category)) {
          grouped.set(category, []);
        }

        grouped.get(category).push(entry);
      });

      return categoryOrder
        .map((category) => ({ category, entries: grouped.get(category) || [] }))
        .filter((group) => group.entries.length);
    };

    const getRankedResults = (query, includeAll = false) => {
      const scored = flattenCatalog
        .map((entry) => ({ entry, score: scoreEntry(entry, query) }))
        .filter((item) => item.score >= 38)
        .sort((first, second) => {
          if (second.score !== first.score) {
            return second.score - first.score;
          }

          return getCategoryRank(first.entry.category) - getCategoryRank(second.entry.category);
        })
        .map((item) => item.entry);

      if (includeAll) {
        return scored;
      }

      return scored.slice(0, maxVisibleSuggestions);
    };

    const scrollToElement = (element, block = 'center') => {
      if (!element) {
        return;
      }

      element.scrollIntoView({ behavior: 'smooth', block });
      element.classList.add('search-target-pulse');
      window.setTimeout(() => {
        element.classList.remove('search-target-pulse');
      }, 1200);
    };

    const resolveTargetElement = (target) => {
      if (!target || !target.type) {
        return null;
      }

      const key = toLookupKey(target.text || '');
      if (!key) {
        return null;
      }

      if (target.type === 'service') {
        return serviceCardMap.get(key) || null;
      }

      if (target.type === 'product') {
        return productCardMap.get(key) || null;
      }

      if (target.type === 'price') {
        return priceCardMap.get(key) || null;
      }

      return null;
    };

    const openDropdown = () => {
      dropdown.classList.add('is-open');
      dropdown.setAttribute('aria-hidden', 'false');
      form.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
    };

    const closeDropdown = () => {
      dropdown.classList.remove('is-open');
      dropdown.setAttribute('aria-hidden', 'true');
      form.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
      activeSuggestionIndex = -1;
    };

    const buildSuggestionButton = (entry, index, query) => `
      <button type="button" class="smart-suggestion-item" data-index="${index}" role="option" aria-selected="false">
        <span class="smart-item-icon"><i class="${escapeHtml(entry.icon)}" aria-hidden="true"></i></span>
        <span class="smart-item-text">${highlightMatch(entry.label, query)}</span>
        <span class="smart-suggestion-pill">${escapeHtml(entry.category)}</span>
        <span class="smart-item-arrow"><i class="fa-solid fa-angle-right" aria-hidden="true"></i></span>
      </button>
    `;

    const updateActiveSuggestion = () => {
      const suggestionButtons = dropdownScroll.querySelectorAll('.smart-suggestion-item');
      suggestionButtons.forEach((button, index) => {
        const isActive = index === activeSuggestionIndex;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');

        if (isActive) {
          button.scrollIntoView({ block: 'nearest' });
        }
      });
    };

    const renderNoResults = (query) => {
      const alternatives = [
        catalogByLabel.get(toLookupKey('Xerox near me')),
        catalogByLabel.get(toLookupKey('Colour print price')),
        catalogByLabel.get(toLookupKey('Passport photo price')),
        catalogByLabel.get(toLookupKey('Stationery shop in Virar')),
        catalogByLabel.get(toLookupKey('WhatsApp inquiry'))
      ].filter(Boolean);

      visibleSuggestions = alternatives;
      activeSuggestionIndex = alternatives.length ? 0 : -1;

      const alternativesHtml = alternatives
        .map((entry, index) => buildSuggestionButton(entry, index, ''))
        .join('');

      dropdownScroll.innerHTML = `
        <div class="smart-search-empty">
          <h4>No results found for "${escapeHtml(query)}"</h4>
          <p>Try shorter keywords like xerox, lamination, stationery, or timings.</p>
        </div>
        <div class="smart-search-group">
          <div class="smart-search-category">Helpful Alternatives</div>
          ${alternativesHtml}
        </div>
      `;

      openDropdown();
      updateActiveSuggestion();
    };

    const renderSuggestionList = (query) => {
      const normalizedQuery = query.trim();

      if (!normalizedQuery) {
        const recentEntries = getRecentSearchEntries();
        const emptyGroups = [];

        if (recentEntries.length) {
          emptyGroups.push({ category: 'Recent Searches', entries: recentEntries });
        }

        emptyGroups.push({ category: 'Popular Searches', entries: trendingEntries });

        let indexCounter = 0;
        const html = emptyGroups
          .map((group) => {
            const groupHtml = group.entries
              .map((entry) => {
                const markup = buildSuggestionButton(entry, indexCounter, '');
                indexCounter += 1;
                return markup;
              })
              .join('');

            return `
              <div class="smart-search-group">
                <div class="smart-search-category">${escapeHtml(group.category)}</div>
                ${groupHtml}
              </div>
            `;
          })
          .join('');

        visibleSuggestions = emptyGroups.flatMap((group) => group.entries);
        activeSuggestionIndex = visibleSuggestions.length ? 0 : -1;
        dropdownScroll.innerHTML = html;
        openDropdown();
        updateActiveSuggestion();
        return;
      }

      const allMatches = getRankedResults(normalizedQuery, true);
      if (!allMatches.length) {
        renderNoResults(normalizedQuery);
        return;
      }

      const displayedMatches = isShowingAllResults
        ? allMatches
        : allMatches.slice(0, maxVisibleSuggestions);

      visibleSuggestions = displayedMatches;
      activeSuggestionIndex = displayedMatches.length ? 0 : -1;

      const grouped = groupSuggestions(displayedMatches);
      let indexCounter = 0;
      const groupedHtml = grouped
        .map((group) => {
          const itemsHtml = group.entries
            .map((entry) => {
              const markup = buildSuggestionButton(entry, indexCounter, normalizedQuery);
              indexCounter += 1;
              return markup;
            })
            .join('');

          return `
            <div class="smart-search-group">
              <div class="smart-search-category">${escapeHtml(group.category)}</div>
              ${itemsHtml}
            </div>
          `;
        })
        .join('');

      const seeAllButton =
        !isShowingAllResults && allMatches.length > displayedMatches.length
          ? '<button type="button" class="smart-see-all-btn" data-search-action="see-all">See all results</button>'
          : '';

      dropdownScroll.innerHTML = groupedHtml + seeAllButton;
      openDropdown();
      updateActiveSuggestion();
    };

    const openTarget = (target) => {
      if (!target) {
        return;
      }

      if (target.type === 'query') {
        const targetQuery = target.query || input.value.trim();
        const topMatch = getRankedResults(targetQuery, true)[0];
        if (topMatch) {
          executeSuggestion(topMatch, { recentTerm: targetQuery });
        } else {
          renderNoResults(targetQuery);
        }
        return;
      }

      if (target.type === 'url') {
        const href = target.href || '#contact';
        if (href.startsWith('#')) {
          const section = document.querySelector(href);
          if (section) {
            scrollToElement(section, 'start');
          }
          return;
        }

        if (href.startsWith('tel:') || href.startsWith('mailto:')) {
          window.location.href = href;
          return;
        }

        if (target.newTab) {
          window.open(href, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = href;
        }
        return;
      }

      if (target.type === 'section') {
        const section = document.querySelector(target.selector || '#services');
        if (section) {
          scrollToElement(section, 'start');
        }
        return;
      }

      const targetElement = resolveTargetElement(target);
      if (targetElement) {
        scrollToElement(targetElement, 'center');

        if (target.type === 'service') {
          window.setTimeout(() => {
            targetElement.click();
          }, 260);
        }
        return;
      }

      if (target.fallbackSelector) {
        const fallback = document.querySelector(target.fallbackSelector);
        if (fallback) {
          scrollToElement(fallback, 'start');
        }
      }
    };

    const executeSuggestion = (entry, options = {}) => {
      if (!entry) {
        return;
      }

      const recentTerm = options.recentTerm || entry.label;
      addRecentSearch(recentTerm);
      input.value = entry.label;
      closeDropdown();
      openTarget(entry.target);
    };

    const triggerFirstMatch = () => {
      const query = input.value.trim();
      if (!query) {
        renderSuggestionList('');
        return;
      }

      const topMatch = getRankedResults(query, true)[0];
      if (topMatch) {
        executeSuggestion(topMatch, { recentTerm: query });
      } else {
        renderNoResults(query);
      }
    };

    const moveActiveSuggestion = (direction) => {
      if (!visibleSuggestions.length) {
        return;
      }

      if (activeSuggestionIndex < 0) {
        activeSuggestionIndex = 0;
      } else {
        activeSuggestionIndex =
          (activeSuggestionIndex + direction + visibleSuggestions.length) % visibleSuggestions.length;
      }

      updateActiveSuggestion();
    };

    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-expanded', 'false');
    form.classList.add('smart-search-ready');

    input.addEventListener('input', () => {
      isShowingAllResults = false;

      if (previousQuery !== input.value.trim()) {
        activeSuggestionIndex = -1;
      }

      previousQuery = input.value.trim();
      renderSuggestionList(input.value);
      input.setAttribute('aria-expanded', 'true');
    });

    input.addEventListener('focus', () => {
      isShowingAllResults = false;
      renderSuggestionList(input.value);
      input.setAttribute('aria-expanded', 'true');
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!dropdown.classList.contains('is-open')) {
          renderSuggestionList(input.value);
        }
        moveActiveSuggestion(1);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (!dropdown.classList.contains('is-open')) {
          renderSuggestionList(input.value);
        }
        moveActiveSuggestion(-1);
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();

        if (visibleSuggestions.length && activeSuggestionIndex >= 0) {
          executeSuggestion(visibleSuggestions[activeSuggestionIndex], {
            recentTerm: input.value.trim() || visibleSuggestions[activeSuggestionIndex].label
          });
          return;
        }

        triggerFirstMatch();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        closeDropdown();
        input.blur();
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      triggerFirstMatch();
    });

    dropdown.addEventListener('mousedown', (event) => {
      if (event.target.closest('.smart-suggestion-item, .smart-see-all-btn')) {
        event.preventDefault();
      }
    });

    dropdown.addEventListener('click', (event) => {
      const seeAllButton = event.target.closest('[data-search-action="see-all"]');
      if (seeAllButton) {
        isShowingAllResults = true;
        renderSuggestionList(input.value);
        return;
      }

      const suggestionButton = event.target.closest('.smart-suggestion-item');
      if (!suggestionButton) {
        return;
      }

      const suggestionIndex = Number(suggestionButton.dataset.index);
      if (Number.isNaN(suggestionIndex) || !visibleSuggestions[suggestionIndex]) {
        return;
      }

      executeSuggestion(visibleSuggestions[suggestionIndex], {
        recentTerm: input.value.trim() || visibleSuggestions[suggestionIndex].label
      });
    });

    document.addEventListener('pointerdown', (event) => {
      if (form.contains(event.target)) {
        return;
      }

      closeDropdown();
      input.setAttribute('aria-expanded', 'false');
    });

    form.addEventListener('focusout', () => {
      window.setTimeout(() => {
        if (!form.contains(document.activeElement)) {
          closeDropdown();
          input.setAttribute('aria-expanded', 'false');
        }
      }, 0);
    });
  };

  searchForms.forEach((form) => {
    setupSmartSearch(form);
  });

  const setupServiceInteractions = () => {
    const servicesRow = document.querySelector('#services .service-grid') || document.querySelector('#services .row.g-4');
    if (!servicesRow) {
      return;
    }

    servicesRow.classList.add('service-grid');

    const cardColumns = Array.from(servicesRow.children).filter((column) => column.querySelector('.service-card'));
    const serviceCards = cardColumns
      .map((column) => column.querySelector('.service-card'))
      .filter(Boolean);

    if (!serviceCards.length) {
      return;
    }

    const phoneHref = '917021072757';
    const phoneLabel = '+91 70210 72757';

    const buildWhatsAppLink = (serviceName) => {
      const message = `Hi, I want details for ${serviceName}.`;
      return `https://wa.me/${phoneHref}?text=${encodeURIComponent(message)}`;
    };

    const escapeHtml = (value) => {
      const text = String(value ?? '');
      return text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    };

    const renderList = (items) => {
      if (!Array.isArray(items) || !items.length) {
        return '<li>Details available on request.</li>';
      }

      return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    };

    const detailedServices = {
      'Black & White Printing': {
        explanation: 'Crisp monochrome prints for forms, notes, assignments, and office files.',
        commonUses: ['Assignments and exam notes', 'Office forms and records', 'Bulk handouts'],
        startingPrice: ['₹3 per side'],
        deliveryTime: ['2 to 5 minutes for regular work'],
        addOns: ['Stapling', 'Spiral binding', 'Lamination'],
        badge: 'Fast Service',
        priceTag: 'Starting from ₹3'
      },
      'Color Printing': {
        explanation: 'Vibrant color printing with accurate tones for presentations and project sheets.',
        commonUses: ['Project covers and charts', 'Flyers and notices', 'Brochures and invitations'],
        startingPrice: ['A4 Colour Print: ₹10 per side'],
        deliveryTime: ['5 to 10 minutes'],
        addOns: ['Glossy paper', 'Premium matte paper', 'Lamination'],
        badge: 'Most Popular',
        priceTag: 'Starting from ₹10'
      },
      'Xerox / Photocopy': {
        explanation: 'Fast photocopy service for everyday document duplication and bulk jobs.',
        commonUses: ['Government forms', 'Legal documents', 'Student notes and records'],
        startingPrice: ['Single copy: ₹1.5 per side', 'Bulk copies: Discount available'],
        deliveryTime: ['Instant for small sets', '15 to 30 min for bulk'],
        addOns: ['Sorting', 'Stapling', 'File set arrangement'],
        badge: 'Most Popular',
        priceTag: 'Starting from ₹1.5'
      },
      Lamination: {
        explanation: 'Neat edge-sealed lamination that protects documents from wear and moisture.',
        commonUses: ['Certificates', 'ID cards', 'Office notices and menus'],
        startingPrice: ['Small lamination: ₹10 onwards', 'A4 lamination: ₹20 onwards'],
        deliveryTime: ['About 5 minutes per sheet'],
        addOns: ['Glossy finish', 'Matte finish', 'Corner trim'],
        badge: 'Fast Service',
        priceTag: 'Starting from ₹10'
      },
      'Spiral Binding': {
        explanation: 'Professional spiral binding for reports, projects, and presentation copies.',
        commonUses: ['Project files', 'Office reports', 'Training booklets'],
        startingPrice: ['Small file: ₹30 onwards', 'Thick file: ₹50 onwards'],
        deliveryTime: ['10 to 20 minutes'],
        addOns: ['Transparent covers', 'Cardboard back sheet', 'Name label'],
        badge: 'Student Favorite',
        priceTag: 'Starting from ₹30'
      },
      'Passport Photos': {
        explanation: 'Quick passport photo prints with clean framing for official and personal use.',
        commonUses: ['Passport and visa forms', 'Admissions and job forms', 'Government IDs'],
        startingPrice: ['20 passport-size photos: ₹30 onwards'],
        deliveryTime: ['10 to 15 minutes'],
        addOns: ['Soft copy sharing', 'Basic face adjustment', 'Extra print sets'],
        badge: 'Fast Service',
        priceTag: 'Starting from ₹30'
      },
      'Project Printing': {
        explanation: 'Complete project printing support with neat finishing for school and college work.',
        commonUses: ['Seminar reports', 'Assignment submissions', 'Practical files'],
        startingPrice: ['Typical projects start from ₹50 onwards', 'Final pricing depends on pages, color printing, and binding'],
        deliveryTime: ['Same day delivery for regular quantity'],
        addOns: ['Spiral bind', 'Color cover pages', 'Lamination'],
        badge: 'Student Favorite',
        priceTag: 'Starting from ₹50'
      },
      'Stationery Products': {
        explanation: 'Everyday stationery stock for students, offices, and routine shop needs.',
        commonUses: ['Notebooks and pens', 'Files and folders', 'Craft and chart materials'],
        startingPrice: ['Pens from ₹10', 'Notebooks from ₹30', 'Files from ₹20', 'Calculators from ₹150', 'Cartridges from ₹250', 'Smart Card from ₹80'],
        deliveryTime: ['Instant in-store pickup'],
        addOns: ['Combo packs', 'Bulk school sets', 'Institution pricing'],
        badge: 'Bulk Discount Available',
        priceTag: 'Starting from ₹10'
      },
      'Blackbook Printing': {
        explanation: 'Durable blackbook print with consistent quality for project submissions.',
        commonUses: ['Engineering records', 'College submissions', 'Archival copies'],
        startingPrice: ['Quote based on size and quantity'],
        deliveryTime: ['Same day for standard jobs'],
        addOns: ['Spiral binding', 'Cover lamination', 'Additional copies'],
        badge: 'Student Favorite',
        priceTag: 'Custom quote'
      },
      'Letterhead Print': {
        explanation: 'Branded letterhead printing for businesses and professional communication.',
        commonUses: ['Company letters', 'Invoices and proposals', 'Office documentation'],
        startingPrice: ['Starts from ₹2 per sheet in bulk'],
        deliveryTime: ['1 to 2 days depending on quantity'],
        addOns: ['Logo alignment support', 'Paper upgrades', 'Bulk packing'],
        badge: 'Bulk Discount Available',
        priceTag: 'Bulk pricing'
      },
      'Visiting Card': {
        explanation: 'Clean and professional visiting card prints with premium finish options.',
        commonUses: ['Business networking', 'Shop and service branding', 'Personal profile cards'],
        startingPrice: ['Starts from ₹150 per 100 cards'],
        deliveryTime: ['Same day or next day'],
        addOns: ['Matte/gloss finish', 'Rounded corners', 'Lamination'],
        badge: 'Most Popular',
        priceTag: 'From ₹150'
      },
      'Billbook Print': {
        explanation: 'Custom billbook and invoice booklet printing for daily business operations.',
        commonUses: ['Retail billing', 'Service invoicing', 'Manual receipts'],
        startingPrice: ['Pricing depends on pages, copies, and size'],
        deliveryTime: ['1 to 2 days'],
        addOns: ['Numbering', 'Duplicate/triplicate sets', 'Custom branding'],
        badge: 'Bulk Discount Available',
        priceTag: 'Custom quote'
      },
      'Smart Card': {
        explanation: 'Smart card printing for ID cards, membership cards, office cards and custom cards.',
        commonUses: ['ID cards', 'Membership cards', 'Access cards'],
        startingPrice: ['Starting from ₹80'],
        deliveryTime: ['Same day for small batches'],
        addOns: ['Lanyard slot', 'Barcode printing', 'Name personalization'],
        badge: 'Fast Service',
        priceTag: 'Starting from ₹80'
      },
      'Jumbo Xerox': {
        explanation: 'Large-format xerox and copy services for plans, drawings, and posters.',
        commonUses: ['Architecture plans', 'Engineering drawings', 'Large charts and posters'],
        startingPrice: ['A3/A2/A1/A0 rates available on request'],
        deliveryTime: ['10 to 30 minutes based on size'],
        addOns: ['Roll to sheet trim', 'Set sorting', 'Tube packing'],
        badge: 'Fast Service',
        priceTag: 'All sizes available'
      },
      'Cartridge Refelling': {
        explanation: 'Reliable ink and toner refilling to keep your printer running affordably.',
        commonUses: ['Home printer refill', 'Office laser printer maintenance', 'Emergency refill support'],
        startingPrice: ['Pricing based on cartridge model'],
        deliveryTime: ['Usually 20 to 40 minutes'],
        addOns: ['Basic nozzle cleaning', 'Print quality check', 'Cartridge handling tips'],
        badge: 'Fast Service',
        priceTag: 'Model-based price'
      },
      'All Size Scanning': {
        explanation: 'Document scanning in multiple sizes for digital record-keeping and online submissions.',
        commonUses: ['PDF archive', 'Online application uploads', 'Email and WhatsApp sharing'],
        startingPrice: ['Scanning starts from ₹20 per page'],
        deliveryTime: ['2 to 10 minutes'],
        addOns: ['PDF merge', 'Image enhancement', 'Cloud/email send'],
        badge: 'Fast Service',
        priceTag: 'Starts at ₹20'
      },
      'Computer Accessories': {
        explanation: 'Essential accessories for day-to-day computer and printer usage.',
        commonUses: ['USB cables and adapters', 'Keyboard/mouse needs', 'Printer consumables'],
        startingPrice: ['Multiple budget and premium options available'],
        deliveryTime: ['Instant pickup for in-stock products'],
        addOns: ['Bulk office supply support', 'Product guidance', 'Quick replacement options'],
        badge: 'Bulk Discount Available',
        priceTag: 'Value pricing'
      }
    };

    const fallbackBadges = ['Fast Service', 'Most Popular', 'Student Favorite', 'Bulk Discount Available'];

    const defaultDetails = (title, summary, iconClass) => {
      const hash = title.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
      return {
        title,
        explanation: summary || `Reliable ${title.toLowerCase()} support for students, offices, and everyday needs.`,
        commonUses: ['Student requirements', 'Office documentation', 'Local business support'],
        startingPrice: ['Call or WhatsApp for latest rates'],
        deliveryTime: ['Usually available on the same day'],
        addOns: ['Bulk quantity support', 'Counter guidance'],
        badge: fallbackBadges[hash % fallbackBadges.length],
        priceTag: 'Ask for price',
        iconClass
      };
    };

    const getServiceDetails = (card) => {
      const titleNode = card.querySelector('h3');
      const summaryNode = card.querySelector('p');
      const iconNode = card.querySelector('.card-icon i');

      if (!titleNode) {
        return null;
      }

      const title = titleNode.textContent.trim();
      const summary = summaryNode ? summaryNode.textContent.trim() : '';
      const iconClass = iconNode ? iconNode.className : 'fa-solid fa-file-lines';
      const customDetails = detailedServices[title];

      if (!customDetails) {
        return defaultDetails(title, summary, iconClass);
      }

      return {
        title,
        explanation: customDetails.explanation || summary,
        commonUses: customDetails.commonUses || [],
        startingPrice: customDetails.startingPrice || ['Call or WhatsApp for latest rates'],
        deliveryTime: customDetails.deliveryTime || ['Usually available on the same day'],
        addOns: customDetails.addOns || [],
        badge: customDetails.badge || 'Fast Service',
        priceTag: customDetails.priceTag || 'Ask for price',
        iconClass: customDetails.iconClass || iconClass
      };
    };

    const buildDetailPanelMarkup = (details) => {
      const whatsappHref = buildWhatsAppLink(details.title);
      return `
        <div class="service-row-detail-shell">
          <button type="button" class="service-row-close" aria-label="Close service details">
            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
          <div class="service-row-left">
            <div class="service-detail-icon-large">
              <i class="${escapeHtml(details.iconClass)}" aria-hidden="true"></i>
            </div>
            <div>
              <h3>${escapeHtml(details.title)}</h3>
              <p class="service-detail-summary">${escapeHtml(details.explanation)}</p>
              <div class="service-detail-badges">
                <span class="service-detail-badge tag">${escapeHtml(details.badge)}</span>
                <span class="service-detail-badge price">${escapeHtml(details.priceTag)}</span>
              </div>
              <h4>Common Uses</h4>
              <ul class="service-detail-list">${renderList(details.commonUses)}</ul>
            </div>
          </div>
          <div class="service-row-right">
            <div class="service-detail-block">
              <h4>Starting Price</h4>
              <ul class="service-detail-list compact">${renderList(details.startingPrice)}</ul>
            </div>
            <div class="service-detail-block">
              <h4>Delivery Time</h4>
              <ul class="service-detail-list compact">${renderList(details.deliveryTime)}</ul>
            </div>
            <div class="service-detail-block">
              <h4>Add-on Services</h4>
              <ul class="service-detail-list compact">${renderList(details.addOns)}</ul>
            </div>
            <div class="service-row-cta">
              <a class="service-cta-btn" href="${whatsappHref}" target="_blank" rel="noopener">WhatsApp Inquiry</a>
              <a class="service-cta-btn is-outline" href="tel:${phoneHref}">Call Now</a>
              <a class="service-cta-btn is-light" href="#contact">Get Quote</a>
            </div>
            <p class="service-row-contact-note">Need quick help? Call ${escapeHtml(phoneLabel)}.</p>
          </div>
        </div>
      `;
    };

    const detailColumn = document.createElement('div');
    detailColumn.className = 'col-12 service-row-detail-col';
    detailColumn.innerHTML = '<div class="service-row-detail-panel" aria-hidden="true"></div>';
    const detailPanel = detailColumn.querySelector('.service-row-detail-panel');
    let activeCard = null;

    const getServiceColumns = () =>
      Array.from(servicesRow.children).filter((column) => column.classList.contains('service-grid-col') || column.querySelector('.service-card'));

    const getRowLastColumn = (cardColumn) => {
      const serviceColumns = getServiceColumns();
      const targetTop = cardColumn.offsetTop;
      const sameRowColumns = serviceColumns.filter((column) => Math.abs(column.offsetTop - targetTop) <= 6);
      return sameRowColumns[sameRowColumns.length - 1] || cardColumn;
    };

    const placeDetailPanelAfterRow = (card) => {
      const cardColumn = card.closest('.service-grid-col') || card.closest('[class*="col-"]');
      if (!cardColumn) {
        return;
      }

      const rowLastColumn = getRowLastColumn(cardColumn);
      servicesRow.insertBefore(detailColumn, rowLastColumn.nextSibling);
    };

    const setCardState = (card, isActive) => {
      card.classList.toggle('is-active', isActive);

      const cardLink = card.querySelector('.card-link');
      const label = card.querySelector('.service-link-label');

      if (label) {
        label.textContent = isActive ? 'Hide Details' : 'View Details';
      }

      if (cardLink) {
        cardLink.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      }
    };

    const closePanel = () => {
      detailPanel.classList.remove('is-open');
      detailPanel.setAttribute('aria-hidden', 'true');

      if (activeCard) {
        setCardState(activeCard, false);
        activeCard = null;
      }

      window.setTimeout(() => {
        if (!detailPanel.classList.contains('is-open') && detailColumn.parentElement) {
          detailColumn.remove();
        }
      }, 380);
    };

    const openPanelForCard = (card) => {
      const details = getServiceDetails(card);
      if (!details) {
        return;
      }

      if (activeCard && activeCard !== card) {
        setCardState(activeCard, false);
      }

      activeCard = card;
      setCardState(card, true);
      detailPanel.innerHTML = buildDetailPanelMarkup(details);
      placeDetailPanelAfterRow(card);
      detailPanel.setAttribute('aria-hidden', 'false');

      window.requestAnimationFrame(() => {
        detailPanel.classList.add('is-open');
      });
    };

    const toggleCardDetails = (card) => {
      if (activeCard === card && detailPanel.classList.contains('is-open')) {
        closePanel();
        return;
      }

      openPanelForCard(card);
    };

    detailColumn.addEventListener('click', (event) => {
      if (event.target.closest('.service-row-close')) {
        event.preventDefault();
        closePanel();
      }
    });

    serviceCards.forEach((card, index) => {
      const cardColumn = cardColumns[index];
      if (cardColumn) {
        cardColumn.classList.add('service-grid-col');
        cardColumn.style.transitionDelay = `${(index % 4) * 60}ms`;
      }

      card.classList.add('premium-service-card');
      card.setAttribute('tabindex', '0');

      const cardLink = card.querySelector('.card-link');
      if (cardLink) {
        cardLink.setAttribute('href', '#');
        cardLink.setAttribute('role', 'button');
        cardLink.setAttribute('aria-expanded', 'false');
        cardLink.innerHTML = `
          <span class="service-link-label">View Details</span>
          <span class="service-link-meta">
            <i class="fa-solid fa-arrow-right-long service-chevron" aria-hidden="true"></i>
          </span>
        `;
      }

      card.addEventListener('click', (event) => {
        if (event.target.closest('.card-link')) {
          event.preventDefault();
        }

        if (event.target.closest('a') && !event.target.closest('.card-link')) {
          return;
        }

        toggleCardDetails(card);
      });

      card.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }

        event.preventDefault();
        toggleCardDetails(card);
      });
    });

    window.addEventListener('resize', () => {
      if (!activeCard || !detailPanel.classList.contains('is-open')) {
        return;
      }

      placeDetailPanelAfterRow(activeCard);
    });
  };

  setupServiceInteractions();

  const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const navbarCollapse = document.querySelector('.navbar-collapse.show');
      if (navbarCollapse && window.bootstrap) {
        const collapseInstance = bootstrap.Collapse.getOrCreateInstance(navbarCollapse);
        collapseInstance.hide();
      }
    });
  });
});
