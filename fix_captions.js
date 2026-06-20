const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const updates = [
  {
    file: 'shop-entrance.jpeg',
    oldAlt: 'Shop entrance and name board',
    newAlt: 'Inside the shop showing the main Xerox machine and customer service counter'
  },
  {
    file: 'stationery-shelves.jpeg',
    oldAlt: 'Stationery shelves inside the shop',
    newAlt: 'Wide range of stationery, calculators, and office supplies'
  },
  {
    file: 'printer-machine.jpeg',
    oldAlt: 'Printer machine and customer counter',
    newAlt: 'Customer service counter for colour prints and quick xerox'
  },
  {
    file: 'printing-work-area.jpeg',
    oldAlt: 'Printing and xerox work area',
    newAlt: 'View from inside the shop looking towards the street entrance'
  },
  {
    file: 'shop-interior.jpg',
    oldAlt: 'Shop interior with service counter',
    newAlt: 'Virar Stationery & Jumbo Xerox main shop entrance and sign board'
  },
  {
    file: 'spiral-binding.jpeg',
    oldAlt: 'Spiral binding and document stack section',
    newAlt: 'Heavy-duty Canon copier machines for fast bulk xerox'
  },
  {
    file: 'large-format-printer.jpeg',
    oldAlt: 'Large-format printer and equipment setup',
    newAlt: 'Large-format printer setup for A3, A2, A1, and A0 size prints'
  },
  {
    file: 'smart-card-display.jpg',
    oldAlt: 'Smart card and stationery display area',
    newAlt: 'Professional blackbook and thesis binding for college students'
  },
  {
    file: 'shop-front-signage.jpg',
    oldAlt: 'Shop front and signage view',
    newAlt: 'Custom printed billbooks, receipt books, and digital payment setup'
  }
];

let changed = 0;
updates.forEach(u => {
  let searchStr = `src="assets/images/gallery/${u.file}" alt="${u.oldAlt}" loading="lazy" decoding="async" data-lightbox-caption="${u.oldAlt}"`;
  let replaceStr = `src="assets/images/gallery/${u.file}" alt="${u.newAlt}" loading="lazy" decoding="async" data-lightbox-caption="${u.newAlt}"`;
  
  if (html.includes(searchStr)) {
    html = html.replace(searchStr, replaceStr);
    changed++;
  } else {
    console.log('Could not find exact string for:', u.file);
  }
});

fs.writeFileSync('index.html', html);
console.log('Fixed captions count:', changed);

