// js/features/stationery-stock-search.js
// Smart "Search" for Stationery Stock Availability

const stationeryProducts = [
  { name: 'Scientific Calculator', price: '450', keywords: ['casio', 'fx-991es', 'calculator', 'math'] },
  { name: 'A3 Project File', price: '50', keywords: ['a3 file', 'portfolio', 'architecture file', 'drawing file'] },
  { name: 'Cello Pens (Box)', price: '80', keywords: ['blue pen', 'black pen', 'ball pen', 'cello'] },
  { name: 'Chart Paper', price: '10', keywords: ['color paper', 'craft paper', 'poster'] },
  { name: 'Spring Files', price: '20', keywords: ['office file', 'folder', 'clip file'] },
  { name: 'Double A Paper Ream', price: '380', keywords: ['a4 paper', 'xerox paper', 'printer paper', 'bundle'] },
  { name: 'Whiteboard Markers', price: '35', keywords: ['marker', 'camlin', 'board pen'] },
  { name: 'Sticky Notes (Post-it)', price: '40', keywords: ['post it', 'memo pad', 'sticky slip'] },
  { name: 'Geometry Box', price: '90', keywords: ['compass', 'rounder', 'protractor', 'camlin'] },
  { name: 'Fevicol MR / Glue', price: '20', keywords: ['stick', 'adhesive', 'gum'] },
  { name: 'A4 Envelopes (Pack)', price: '50', keywords: ['brown cover', 'courier cover', 'mailer'] },
  { name: 'ID Card Holder & Lanyard', price: '30', keywords: ['badge', 'tag', 'ribbon', 'id card'] },
  { name: 'Stapler & Pins', price: '45', keywords: ['staple', 'pin box', 'kangaro'] },
  { name: 'Correction Pen (Whitener)', price: '30', keywords: ['fluid', 'white out', 'whitener'] },
  { name: 'Highlighters', price: '25', keywords: ['fluorescent', 'marker', 'neon'] }
];

export const initStationeryStockSearch = () => {
  const input = document.getElementById('stationerySearchInput');
  const resultsContainer = document.getElementById('stationerySearchResults');

  if (!input || !resultsContainer) return;

  const performSearch = () => {
    const query = input.value.trim().toLowerCase();
    
    if (!query) {
      resultsContainer.innerHTML = '';
      resultsContainer.classList.add('d-none');
      return;
    }

    resultsContainer.classList.remove('d-none');

    // Filter products
    const matches = stationeryProducts.filter(item => {
      const matchName = item.name.toLowerCase().includes(query);
      const matchKeyword = item.keywords.some(kw => kw.toLowerCase().includes(query));
      return matchName || matchKeyword;
    });

    if (matches.length > 0) {
      let html = '<ul class="list-group shadow-sm">';
      matches.forEach(item => {
        html += `
          <li class="list-group-item d-flex justify-content-between align-items-center" style="background: var(--surface-2); color: var(--text-primary); border-color: var(--border-color);">
            <div>
              <i class="fa-solid fa-check-circle text-success me-2"></i>
              <strong>${item.name}</strong>
            </div>
            <span class="badge bg-success rounded-pill px-3 py-2">In Stock from ₹${item.price}</span>
          </li>
        `;
      });
      html += '</ul>';
      resultsContainer.innerHTML = html;
    } else {
      resultsContainer.innerHTML = `
        <div class="alert alert-warning mb-0 border-0 shadow-sm d-flex align-items-center" style="background: rgba(255, 193, 7, 0.1); color: var(--text-primary);">
          <i class="fa-solid fa-triangle-exclamation fs-4 me-3 text-warning"></i>
          <div>
            <strong>Not found instantly!</strong>
            <div class="small mt-1">We might still have it. Click the WhatsApp button to check real-time availability!</div>
          </div>
        </div>
      `;
    }
  };

  input.addEventListener('input', performSearch);
};
