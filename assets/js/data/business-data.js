// js/data/business-data.js
// Static business data extracted from the monolithic script.
// Exported as plain objects/arrays — no logic, no DOM access.

import { CONFIG } from '../config.js';

/**
 * Search catalog used by the Smart Search feature.
 * Categories → arrays of search entries with labels, icons, keywords, and targets.
 */
export const searchCatalog = {
  Popular: [
    {
      label: 'Color Printout',
      icon: 'fa-solid fa-palette',
      keywords: ['color print', 'colour', 'printout'],
      target: { type: 'service', text: 'Color Printing', fallbackSelector: '#services' }
    },
    {
      label: 'Spiral Binding',
      icon: 'fa-solid fa-book-open',
      keywords: ['binding', 'book binding'],
      target: { type: 'service', text: 'Spiral Binding', fallbackSelector: '#services' }
    },
    {
      label: 'Store Timings',
      icon: 'fa-solid fa-clock',
      keywords: ['hours', 'open time', 'when are you open'],
      target: { type: 'section', selector: '#contact' }
    },
    {
      label: 'Price List',
      icon: 'fa-solid fa-indian-rupee-sign',
      keywords: ['cost', 'pricing', 'rates'],
      target: { type: 'link', url: 'pages/pricing.html' }
    },
    {
      label: 'Send Files via WhatsApp',
      icon: 'fa-brands fa-whatsapp',
      keywords: ['whatsapp', 'send order', 'quick print'],
      target: { type: 'link', url: 'https://wa.me/917021072757' }
    }
  ],
  'Quick Links': [
    {
      label: 'Privacy Policy',
      icon: 'fa-solid fa-shield',
      keywords: ['privacy', 'policy', 'data'],
      target: { type: 'link', url: 'pages/privacy.html' }
    },
    {
      label: 'Terms & Conditions',
      icon: 'fa-solid fa-file-contract',
      keywords: ['terms', 'conditions', 'rules'],
      target: { type: 'link', url: 'pages/terms.html' }
    },
    {
      label: 'Sitemap',
      icon: 'fa-solid fa-sitemap',
      keywords: ['sitemap', 'all pages'],
      target: { type: 'link', url: 'pages/sitemap.html' }
    }
  ],
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
      target: { type: 'service', text: 'Cartridge Refilling', fallbackSelector: '#services' }
    },
    {
      label: 'Printer Ink',
      icon: 'fa-solid fa-fill-drip',
      keywords: ['ink refill', 'ink bottle'],
      target: { type: 'service', text: 'Cartridge Refilling', fallbackSelector: '#services' }
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
      target: { type: 'url', href: `https://wa.me/${CONFIG.business.whatsAppNumber}`, newTab: true }
    },
    {
      label: 'Call now',
      icon: 'fa-solid fa-phone',
      keywords: ['phone number', 'contact call'],
      target: { type: 'url', href: `tel:+${CONFIG.business.whatsAppNumber}` }
    },
    {
      label: 'Directions',
      icon: 'fa-solid fa-map-location-dot',
      keywords: ['google maps', 'navigate to shop'],
      target: {
        type: 'url',
        href: CONFIG.business.mapsUrl,
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
      label: 'Same-Day In-Store Pickup',
      icon: 'fa-solid fa-circle-question',
      keywords: ['same day print', 'urgent service'],
      target: { type: 'section', selector: '#services' }
    },
    {
      label: 'WhatsApp document printing',
      icon: 'fa-brands fa-whatsapp',
      keywords: ['send files on whatsapp', 'document print whatsapp'],
      target: { type: 'url', href: `https://wa.me/${CONFIG.business.whatsAppNumber}`, newTab: true }
    }
  ]
};

/**
 * Detailed service information displayed in the expandable service card panels.
 */
export const detailedServices = {
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
  'Cartridge Refilling': {
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

/**
 * PDF download templates used by the setupPdfDownloads feature.
 */
export const pdfTemplates = {
  'price-list': {
    filename: 'Virar-Stationery-Price-List.pdf',
    title: 'Virar Stationery & Jumbo Xerox',
    subtitle: 'Official Price List & Service Guide',
    meta: [
      `Updated: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      'Location: Opposite Mahavir Hospital, Near Old Viva College, Virar West',
      'Timings: Open Daily 8:00 AM to 9:00 PM'
    ],
    whatsapp: '7021072757',
    website: 'www.virarprint.in',
    sections: [
      {
        title: 'Printing & Photocopy',
        items: [
          'A4 Black & White Print: Rs. 3 per side',
          'A4 Color Print: Rs. 10 per side',
          'A4 Xerox / Photocopy: Rs. 1.5 (B&W) / Rs. 9 (Color)',
          'A3 Color Print: Rs. 20 per side'
        ]
      },
      {
        title: 'Finishing & Binding',
        items: [
          'A4 Lamination (Thick): Rs. 10 per sheet',
          'A3 Lamination: Rs. 20 per sheet',
          'Spiral Binding: Rs. 30 per set (Standard)',
          'Project Hard Binding: Price on request (Bulk only)'
        ]
      },
      {
        title: 'Identity & Large Format',
        items: [
          'Passport Photos (Urgent): Rs. 30 per set (10 mins)',
          'Smart ID Card (PVC): Rs. 80 per card',
          'Visiting Cards (100 pcs): From Rs. 150',
          'Jumbo Xerox / Plotting (A2/A1/A0): Starting Rs. 30'
        ]
      },
      {
        isHighlight: true,
        title: 'PRO TIP: How to get the best results & save money',
        items: [
          'File Format: Always save your files as PDF. Word documents can change formatting on different computers.',
          'Bulk Orders: For bulk printing (100+ pages) or coaching class notes, message us for special discounted rates.',
          'Skip the Line: Send your files on WhatsApp from home, and we will keep it printed and ready for pickup. No waiting!'
        ]
      },
      {
        title: 'Why Choose Us?',
        items: [
          'Speed: High-speed industrial printers ensure you never wait long.',
          'Quality: We use premium 75GSM+ paper for all standard prints, ensuring crisp text and no ink bleed.',
          'Convenience: Order on WhatsApp, pay via UPI, and pick up instantly.'
        ]
      }
    ],
    footerLines: [
      'Bulk orders and student discounts available on selected services.',
      'Prices are indicative starting estimates. Final pricing depends on paper quality and finishing options.'
    ]
  },
  'service-guide': {
    filename: 'Virar-Print-Service-Guide.pdf',
    title: 'Virar Stationery & Jumbo Xerox',
    subtitle: 'Complete Service & Ordering Guide',
    meta: [
      `Updated: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      'Location: Opposite Mahavir Hospital, Near Old Viva College, Virar West',
      'Timings: Open Daily 8:00 AM to 9:00 PM'
    ],
    whatsapp: '7021072757',
    website: 'www.virarprint.in',
    sections: [
      {
        title: 'Our Core Services',
        items: [
          'High-Speed Document Printing & Xerox (A4, A3)',
          'Professional Project & Thesis Spiral Binding',
          'Urgent Passport Photos & PVC Smart Cards',
          'Large Format Printing (A2, A1, A0) for Engineering Drawings'
        ]
      },
      {
        isHighlight: true,
        title: 'FASTEST METHOD: How to Order via WhatsApp',
        items: [
          'Step 1: Save our number 70210 72757 or click the link on our website.',
          'Step 2: Send us your document (PDF preferred).',
          'Step 3: Mention the details: Page count, Color or B&W, and any Binding needs.',
          'Step 4: We will reply with the total price and when it will be ready.',
          'Step 5: Walk into the shop, skip the line, pay, and pick up your prints!'
        ]
      },
      {
        title: 'File Preparation Checklist (Important)',
        items: [
          'File Format: Export to PDF to ensure fonts and layout do not break when printed.',
          'Resolution: For color prints and photos, ensure images are high resolution (300 DPI is ideal).',
          'Margins: Leave at least 0.5-inch margins on the left if you want spiral binding.',
          'WhatsApp Settings: Send documents as "Document", not "Image", so WhatsApp does not compress and ruin the quality.'
        ]
      },
      {
        title: 'Popular Add-Ons',
        items: [
          'Thick Lamination: Protect your important documents, certificates, and ID cards from water and wear.',
          'Spiral Binding: We offer transparent front covers and thick back covers to keep your project files neat and professional.',
          'Jumbo Printing: We have dedicated plotters for engineering and architectural A2/A1/A0 drawings.'
        ]
      }
    ],
    footerLines: [
      'We accept Cash, UPI, Google Pay, and PhonePe at the shop.',
      'For heavy files, you can bring them on a USB drive directly to our counter.'
    ]
  }
};

/**
 * Quote calculator pricing configuration.
 */
export const pricingConfig = {
  'bw-print': {
    label: 'Black & White Printing',
    sizes: ['A4', 'A3'],
    colors: ['bw'],
    rates: { A4: { bw: 3 }, A3: { bw: 6 } },
    unit: 'page',
    addons: ['lamination', 'binding']
  },
  'color-print': {
    label: 'Color Printing',
    sizes: ['A4', 'A3'],
    colors: ['color'],
    rates: { A4: { color: 10 }, A3: { color: 20 } },
    unit: 'page',
    addons: ['lamination', 'binding']
  },
  xerox: {
    label: 'Xerox / Photocopy',
    sizes: ['A4', 'A3'],
    colors: ['bw', 'color'],
    rates: { A4: { bw: 1.5, color: 9 }, A3: { bw: 3, color: 18 } },
    unit: 'page',
    addons: ['binding']
  },
  lamination: {
    label: 'Lamination',
    sizes: ['A4', 'A3', 'A2'],
    colors: ['bw'],
    rates: { A4: { bw: 10 }, A3: { bw: 20 }, A2: { bw: 35 } },
    unit: 'sheet',
    addons: []
  },
  binding: {
    label: 'Spiral Binding',
    sizes: ['Standard'],
    colors: ['bw'],
    rates: { Standard: { bw: 30 } },
    unit: 'set',
    addons: []
  },
  passport: {
    label: 'Passport Photos',
    sizes: ['Standard'],
    colors: ['color'],
    rates: { Standard: { color: 30 } },
    unit: 'set',
    addons: []
  },
  'smart-card': {
    label: 'Smart Card',
    sizes: ['Standard'],
    colors: ['color'],
    rates: { Standard: { color: 80 } },
    unit: 'card',
    addons: []
  },
  'jumbo-xerox': {
    label: 'Jumbo Xerox',
    sizes: ['A2', 'A1', 'A0'],
    colors: ['bw'],
    rates: { A2: { bw: 30 }, A1: { bw: 55 }, A0: { bw: 80 } },
    unit: 'sheet',
    addons: []
  }
};

/**
 * Add-on rates for the quote calculator.
 */
export const addonRates = {
  lamination: { A4: 10, A3: 20, A2: 35, A1: 55, A0: 80 },
  binding: 30
};
