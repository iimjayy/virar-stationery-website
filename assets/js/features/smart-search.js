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

const setupSpotlightSearch = () => {
  const overlay = document.getElementById('spotlightOverlay');
  const input = document.getElementById('spotlightInput');
  const resultsContainer = document.getElementById('spotlightResults');
  const triggers = document.querySelectorAll('.search-box, .search-button, .search-input');

  if (!overlay || !input || !resultsContainer) return;

  const maxVisible = CONFIG.search.maxVisibleSuggestions || 8;
  let activeIndex = -1;
  let visibleSuggestions = [];

  const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightMatch = (text, query) => {
    const safeText = escapeHtml(text);
    if (!query.trim()) return safeText;
    const tokens = normalizeText(query).split(' ').filter(Boolean);
    if (!tokens.length) return safeText;
    const pattern = tokens.map(escapeRegExp).join('|');
    return safeText.replace(new RegExp(`(${pattern})`, 'ig'), '<mark>$1</mark>');
  };

  const flattenCatalog = Object.entries(searchCatalog).flatMap(([category, entries]) =>
    entries.map((entry, index) => ({
      id: `${toLookupKey(category)}-${index}`,
      category,
      label: entry.label,
      icon: entry.icon || 'fa-solid fa-magnifying-glass',
      target: entry.target,
      terms: [entry.label, ...(entry.keywords || [])],
      normalizedTerms: [entry.label, ...(entry.keywords || [])].map(toLookupKey).filter(Boolean)
    }))
  );

  const scoreEntry = (entry, queryKey) => {
    let bestScore = 0;
    entry.normalizedTerms.forEach(term => {
      if (term === queryKey) bestScore += 100;
      else if (term.startsWith(queryKey)) bestScore += 50;
      else if (term.includes(queryKey)) bestScore += 20;
    });
    return bestScore;
  };

  const scrollToElement = (element, block = 'center') => {
    element.scrollIntoView({ behavior: 'smooth', block });
    element.classList.add('search-target-pulse');
    setTimeout(() => element.classList.remove('search-target-pulse'), 1200);
  };

  const openTarget = (target) => {
    if (!target) return;
    overlay.classList.remove('is-active');
    
    if (target.type === 'url' || target.type === 'external') {
      const href = target.url || target.href;
      if (target.newTab || target.type === 'external') window.open(href, '_blank', 'noopener,noreferrer');
      else window.location.href = href;
      return;
    }
    
    const selector = target.selector || target.fallbackSelector;
    if (selector) {
      const el = document.querySelector(selector);
      if (el) scrollToElement(el, 'start');
    }
  };

  const renderSuggestions = (query) => {
    const queryKey = toLookupKey(query);
    let results = [];
    
    if (!queryKey) {
      results = flattenCatalog.filter(e => e.category === 'Popular').slice(0, maxVisible);
    } else {
      results = flattenCatalog
        .filter(e => e.category !== 'Popular')
        .map(entry => ({ entry, score: scoreEntry(entry, queryKey) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.entry)
        .slice(0, maxVisible);
    }

    visibleSuggestions = results;
    activeIndex = results.length ? 0 : -1;

    if (!results.length) {
      resultsContainer.innerHTML = `<div class="p-4 text-center text-muted">No results found for "${escapeHtml(query)}"</div>`;
      return;
    }

    // Group by category
    const grouped = {};
    results.forEach(r => {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push(r);
    });

    resultsContainer.innerHTML = Object.entries(grouped).map(([category, items]) => `
      <div class="spotlight-section">
        <div class="spotlight-section-title">${escapeHtml(category)}</div>
        ${items.map(item => {
          const globalIdx = results.indexOf(item);
          return `
            <button class="spotlight-item" data-index="${globalIdx}">
              <div class="spotlight-item-icon"><i class="${escapeHtml(item.icon)}"></i></div>
              <div class="spotlight-item-text">${highlightMatch(item.label, query)}</div>
            </button>
          `;
        }).join('')}
      </div>
    `).join('');
    
    updateActiveItem();
  };

  const updateActiveItem = () => {
    const items = resultsContainer.querySelectorAll('.spotlight-item');
    items.forEach((item, idx) => {
      if (idx === activeIndex) {
        item.classList.add('is-selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('is-selected');
      }
    });
  };

  const execute = (idx) => {
    const item = visibleSuggestions[idx];
    if (item) {
      openTarget(item.target);
    }
  };

  // Event Listeners
  input.addEventListener('input', () => renderSuggestions(input.value));
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = (activeIndex + 1) % visibleSuggestions.length; updateActiveItem(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = (activeIndex - 1 + visibleSuggestions.length) % visibleSuggestions.length; updateActiveItem(); }
    else if (e.key === 'Enter') { e.preventDefault(); execute(activeIndex); }
    else if (e.key === 'Escape') { e.preventDefault(); overlay.classList.remove('is-active'); }
  });

  resultsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.spotlight-item');
    if (btn) execute(Number(btn.dataset.index));
  });

  const openSpotlight = (e) => {
    if (e) e.preventDefault();
    overlay.classList.add('is-active');
    input.value = '';
    renderSuggestions('');
    setTimeout(() => input.focus(), 100);
  };

  triggers.forEach(t => {
    if (t.tagName === 'FORM') t.addEventListener('submit', openSpotlight);
    else t.addEventListener('click', openSpotlight);
  });

  // Global Keyboard Shortcut (Cmd+K / Ctrl+K)
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (overlay.classList.contains('is-active')) overlay.classList.remove('is-active');
      else openSpotlight();
    }
    if (e.key === 'Escape') overlay.classList.remove('is-active');
  });
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('is-active');
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
  setupSpotlightSearch();
  document
    .querySelectorAll('[data-module="stationery-search"]')
    .forEach((module) => setupStationerySearch(module));
};
