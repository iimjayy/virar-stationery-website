const fs = require('fs');
const path = require('path');

const cssFiles = [
  'base/variables.css',
  'base/reset.css',
  'base/typography.css',
  'base/animations.css',
  'layout/header.css',
  'layout/footer.css',
  'layout/sections.css',
  'components/buttons.css',
  'components/forms.css',
  'components/badges.css',
  'components/cards.css',
  'components/modals.css',
  'components/review-modal.css',
  'features/hero.css',
  'features/services.css',
  'features/gallery.css',
  'features/contact.css',
  'features/products.css',
  'features/testimonials.css',
  'features/why-choose.css',
  'features/quote-calculator.css',
  'features/stationery-search.css',
  'features/bulk-order.css',
  'features/order-status.css',
  'utilities/trust-counters.css',
  'utilities/interactive.css',
  'utilities/responsive-mobile.css',
  'themes/dark.css'
];

let bundle = '/* Bundled CSS */\n\n';

cssFiles.forEach(file => {
  const filePath = path.join(__dirname, 'assets', 'css', file);
  if (fs.existsSync(filePath)) {
    bundle += `/* --- ${file} --- */\n`;
    bundle += fs.readFileSync(filePath, 'utf8') + '\n\n';
  } else {
    console.warn(`Warning: Could not find ${filePath}`);
  }
});

fs.writeFileSync(path.join(__dirname, 'assets', 'css', 'main.bundle.css'), bundle);
console.log('Successfully bundled CSS into assets/css/main.bundle.css');
