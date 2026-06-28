// js/features/smart-search.js
// Self-contained Smart Search feature module.
// Owns all search UI, suggestion rendering, keyboard navigation, and localStorage.
// Dependencies: CONFIG, searchCatalog (business-data), escapeHtml, normalizeText, toLookupKey (helpers)

import { CONFIG } from '../config.js';
import { searchCatalog } from '../data/business-data.js';
import { escapeHtml, normalizeText, toLookupKey } from '../utils/helpers.js';

// ---------------------------------------------------------------------------
// setupSmartSearch — initialises one search form instance
// ---------------------------------------------------------------------------
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
  const maxVisibleSuggestions = CONFIG.search.maxVisibleSuggestions;
  const maxRecentSearches = CONFIG.search.maxRecentSearches;
  const recentStorageKey = CONFIG.search.recentStorageKey;
  const categoryOrder = CONFIG.search.categoryOrder;

  let activeSuggestionIndex = -1;
  let visibleSuggestions = [];
  let isShowingAllResults = false;
  let previousQuery = '';

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

  const trendingLabels = CONFIG.search.trendingLabels;

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

  // eslint-disable-next-line no-use-before-define
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

  // ---- Event wiring ----
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

const stationeryProducts = [
  // Writing & Pens
  { name: 'Cello / Reynolds Pens', price: 10, category: 'pens', tags: ['pen', 'ball pen', 'writing', 'blue', 'black'] },
  { name: 'Gel Pens (Trimax, Octane)', price: 40, category: 'pens', tags: ['gel pen', 'ink', 'writing'] },
  { name: 'Highlighters', price: 25, category: 'pens', tags: ['marker', 'highlight', 'fluorescent'] },
  { name: 'Whiteboard Markers', price: 30, category: 'pens', tags: ['board pen', 'camlin', 'marker'] },
  { name: 'Permanent Markers', price: 20, category: 'pens', tags: ['cd marker', 'camlin'] },
  { name: 'Pencils (Apsara/Natraj)', price: 5, category: 'pens', tags: ['pencil', 'hb', 'drawing'] },
  { name: 'Mechanical Pencils', price: 35, category: 'pens', tags: ['lead pencil', 'click pencil', 'micro tip'] },

  // Notebooks & Paper
  { name: 'A4 Copier Paper (Ream)', price: 280, category: 'paper', tags: ['paper rim', 'a4 paper', 'xerox paper', 'bundle'] },
  { name: 'Spiral Notebooks', price: 60, category: 'paper', tags: ['notebook', 'college book', 'ruled'] },
  { name: 'Practical Journals', price: 45, category: 'paper', tags: ['journal', 'practical book', 'science'] },
  { name: 'Chart Paper', price: 8, category: 'paper', tags: ['chart', 'paper', 'school', 'craft'] },
  { name: 'Tinted / Colored Sheets', price: 3, category: 'paper', tags: ['color paper', 'origami'] },
  { name: 'Project Paper (1 Side Ruled)', price: 2, category: 'paper', tags: ['assignment', 'project'] },
  { name: 'Drawing Books', price: 40, category: 'paper', tags: ['sketch book', 'navneet', 'drawing'] },
  
  // Files & Folders
  { name: 'A3 Project File', price: 35, category: 'files', tags: ['file', 'project', 'a3', 'portfolio'] },
  { name: 'Spring Files', price: 25, category: 'files', tags: ['spring file', 'office file', 'cobra file'] },
  { name: 'L-Folders (Clear Bag)', price: 10, category: 'files', tags: ['l folder', 'transparent file', 'document bag'] },
  { name: 'Ring Binders', price: 80, category: 'files', tags: ['ring file', 'binder'] },
  { name: 'Box Files', price: 120, category: 'files', tags: ['box file', 'arch file'] },
  { name: 'Zipper Folders', price: 45, category: 'files', tags: ['zip bag', 'pouch'] },

  // Art Supplies
  { name: 'Camlin Water Colors', price: 60, category: 'art', tags: ['paint', 'water color', 'tube'] },
  { name: 'Poster Colors', price: 90, category: 'art', tags: ['poster', 'bottle color', 'paint'] },
  { name: 'Paint Brushes (Set)', price: 45, category: 'art', tags: ['brush', 'painting'] },
  { name: 'Oil Pastels', price: 50, category: 'art', tags: ['crayons', 'pastels'] },
  { name: 'Canvas Boards', price: 120, category: 'art', tags: ['canvas', 'acrylic'] },
  { name: 'Fevicryl Acrylic Colors', price: 25, category: 'art', tags: ['fabric color', 'acrylic'] },

  // Desk Essentials
  { name: 'Scientific Calculator', price: 450, category: 'desk', tags: ['calculator', 'casio', 'science', 'fx-991'] },
  { name: 'Basic Calculator', price: 150, category: 'desk', tags: ['calculator', 'math', 'citizen'] },
  { name: 'Geometry Box', price: 90, category: 'desk', tags: ['compass', 'geometry', 'rounder'] },
  { name: 'Fevicol MR / Glue', price: 20, category: 'desk', tags: ['glue', 'adhesive', 'gum', 'stick'] },
  { name: 'Stapler & Pins', price: 85, category: 'desk', tags: ['staples', 'office', 'kangaro'] },
  { name: 'Punching Machine', price: 95, category: 'desk', tags: ['punch', 'hole maker'] },
  { name: 'Sticky Notes (Post-it)', price: 35, category: 'desk', tags: ['notes', 'post it', 'slip'] },
  { name: 'Correction Pen (Whitener)', price: 30, category: 'desk', tags: ['fluid', 'white out', 'whitener'] },
  { name: 'Cello Tape / Brown Tape', price: 15, category: 'desk', tags: ['tape', 'adhesive', 'packing'] },
  
  // Tech & Accessories
  { name: 'Blank CDs/DVDs', price: 20, category: 'tech', tags: ['cd', 'dvd', 'disk', 'moserbaer'] },
  { name: 'Pendrives (USB)', price: 350, category: 'tech', tags: ['pendrive', 'usb', 'flash drive', 'sandisk'] },
  { name: 'ID Card & Lanyards', price: 30, category: 'tech', tags: ['id card', 'badge', 'ribbon', 'tag'] },
  { name: 'Mouse Pads', price: 50, category: 'tech', tags: ['mousepad'] }
];

const setupStationerySearch = (module) => {
  const input = module.querySelector('[data-stationery-search-input]');
  const results = module.querySelector('[data-stationery-search-results]');
  const empty = module.querySelector('[data-stationery-search-empty]');
  const categoryPills = module.querySelectorAll('[data-stationery-category]');
  
  const cartContainer = module.querySelector('.stationery-cart-container');
  const cartCount = module.querySelector('.stationery-cart-count');
  const cartCheckoutBtn = module.querySelector('.stationery-cart-checkout');

  if (!input || !results || !empty) {
    return;
  }

  let activeCategory = 'all';
  let inquiryCart = new Set(); 

  const renderProducts = (products, query) => {
    results.innerHTML = products
      .map((product, i) => {
        const isInCart = inquiryCart.has(product.name);
        return `
        <div class="stationery-result-card ${isInCart ? 'in-cart' : ''}" role="listitem" style="animation-delay: ${i * 0.03}s">
          <div class="stationery-card-content">
            <h3>${highlightMatchForInventory(product.name, query)}</h3>
            <p>✅ Starting at ₹${product.price}</p>
          </div>
          <button type="button" class="btn stationery-add-btn ${isInCart ? 'btn-success' : 'btn-outline-primary'}" data-item="${escapeHtml(product.name)}">
            ${isInCart ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-plus"></i> Add'}
          </button>
        </div>
      `;
      })
      .join('');
  };

  const updateCartUI = () => {
    if (!cartContainer || !cartCount || !cartCheckoutBtn) return;
    
    if (inquiryCart.size > 0) {
      cartContainer.classList.add('visible');
      cartCount.textContent = inquiryCart.size;
      
      const itemsList = Array.from(inquiryCart).map((item, i) => `${i + 1}. ${item}`).join('%0A');
      const waText = `Hi Virar Stationery,%0AI want to check availability for the following items:%0A%0A${itemsList}%0A%0APlease let me know!`;
      cartCheckoutBtn.href = `https://wa.me/917021072757?text=${waText}`;
    } else {
      cartContainer.classList.remove('visible');
    }
  };

  const handleCartAction = (e) => {
    const btn = e.target.closest('.stationery-add-btn');
    if (!btn) return;
    
    const item = btn.dataset.item;
    if (inquiryCart.has(item)) {
      inquiryCart.delete(item);
      btn.classList.remove('btn-success');
      btn.classList.add('btn-outline-primary');
      btn.innerHTML = '<i class="fa-solid fa-plus"></i> Add';
      btn.closest('.stationery-result-card').classList.remove('in-cart');
    } else {
      inquiryCart.add(item);
      btn.classList.remove('btn-outline-primary');
      btn.classList.add('btn-success');
      btn.innerHTML = '<i class="fa-solid fa-check"></i>';
      btn.closest('.stationery-result-card').classList.add('in-cart');
    }
    updateCartUI();
  };

  const updateResults = () => {
    const query = input.value.trim();
    const normalizedQuery = toLookupKey(query);

    let filtered = stationeryProducts;
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }

    if (normalizedQuery) {
      filtered = filtered.filter((product) => {
        const productTerms = [product.name, ...product.tags].map((term) => toLookupKey(term));
        return productTerms.some((term) => term.includes(normalizedQuery));
      });
    }

    if (!normalizedQuery && activeCategory === 'all') {
      filtered = filtered.slice(0, 9);
    }

    renderProducts(filtered, query);
    empty.hidden = filtered.length > 0;
  };

  const highlightMatchForInventory = (text, query) => {
    if (!query.trim()) {
      return escapeHtml(text);
    }

    const safeText = escapeHtml(text);
    const token = escapeHtml(query.trim()).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safeText.replace(new RegExp(`(${token})`, 'ig'), '<mark>$1</mark>');
  };

  input.addEventListener('input', updateResults);
  
  if (categoryPills) {
    categoryPills.forEach(pill => {
      pill.addEventListener('click', () => {
        categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeCategory = pill.dataset.stationeryCategory;
        updateResults();
      });
    });
  }
  
  results.addEventListener('click', handleCartAction);

  updateResults();
  updateCartUI();
};

// ---------------------------------------------------------------------------
// initSmartSearch — public entry point called by main.js
// Finds all .search-box forms and initialises each one.
// ---------------------------------------------------------------------------
export const initSmartSearch = () => {
  const searchForms = document.querySelectorAll('.search-box');
  searchForms.forEach((form) => setupSmartSearch(form));

  document
    .querySelectorAll('[data-module="stationery-search"]')
    .forEach((module) => setupStationerySearch(module));
};
