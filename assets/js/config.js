// js/config.js
// Centralised business configuration.
// All hardcoded phone numbers, emails, URLs, and default messages live here.

export const CONFIG = Object.freeze({
  business: {
    name: 'Virar Stationery & Jumbo Xerox',
    whatsAppNumber: '917021072757',
    phoneHref: '917021072757',
    phoneLabel: '+91 70210 72757',
    email: 'virarcopy123@gmail.com',
    mapsUrl:
      'https://www.google.com/maps?q=Shop%20No.%2011%2C%20Takshashila%20Apartment%2C%20opp%20mahavir%20hospital%2C%20Near%20Old%20Viva%20College%2C%20ram%20mandir%20rd%2C%20Virar%20West%2C%20Mumbai%20-%20401303',
  },

  hours: {
    openHour: 8,
    closeHour: 21,
  },

  messages: {
    enquirySubject: 'New Website Enquiry - Virar Stationery & Jumbo Xerox',
    bulkSubject: 'Bulk / Business Enquiry - Virar Stationery & Jumbo Xerox',
    defaultWhatsApp: '🖨️ New Enquiry — virarprint.in\n━━━━━━━━━━━━━━━━━━\nHi! I\'d like to place an order.\n━━━━━━━━━━━━━━━━━━\nSource: Website\n\n📎 Please attach your file below this message.',
    stickyWhatsAppDefault: '🖨️ New Enquiry — virarprint.in\n━━━━━━━━━━━━━━━━━━\nHi! I\'d like to place an order.\n━━━━━━━━━━━━━━━━━━\nSource: Sticky Button\n\n📎 Please attach your file below this message.',
    chatDefault: '🖨️ New Enquiry — virarprint.in\n━━━━━━━━━━━━━━━━━━\nHi! I need help with printing.\n━━━━━━━━━━━━━━━━━━\nSource: Chat Widget\n\n📎 Please attach your file below this message.',
    quoteDefault: '🖨️ New Enquiry — virarprint.in\n━━━━━━━━━━━━━━━━━━\nHi! I need a print quote.\n━━━━━━━━━━━━━━━━━━\nSource: Quote Calculator\n\n📎 Please attach your file below this message.',
  },

  search: {
    maxVisibleSuggestions: 10,
    maxRecentSearches: 6,
    recentStorageKey: 'virarSmartSearchRecent',
    categoryOrder: [
      'Services',
      'Products',
      'Popular Searches',
      'Contact & Location',
      'Customer Queries',
      'Recent Searches',
    ],
    trendingLabels: [
      'Xerox near me',
      'Printout near me',
      'Colour print price',
      'Passport photo price',
      'Lamination near me',
      'Project printing',
      'Stationery shop in Virar',
      'Same day printing',
    ],
  },

  upload: {
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ],
  },
});
