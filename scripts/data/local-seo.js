'use strict';
/**
 * local-seo.js — Data source for the Local SEO landing-page generator.
 *
 * Two exports:
 *   LOCALITIES — real Virar-area places, each with genuinely unique local
 *                context (a real landmark, a "how to reach us" note, distance
 *                feel, and locality-specific FAQs) so every generated page is
 *                differentiated, not a thin doorway permutation.
 *   SERVICES   — the shop's services, each mapping to its REAL existing root
 *                service page under ../services/ plus a unique value paragraph.
 *
 * Consumed by scripts/build-local-pages.js.
 * Plain CommonJS (no build step / framework) to match the repo conventions.
 */

// ---------------------------------------------------------------------------
// LOCALITIES — real places around Virar, Maharashtra (Palghar district).
// `note` is written from the SHOP's point of view ("…from here, we are …").
// ---------------------------------------------------------------------------
const LOCALITIES = [
  {
    name: 'Virar West',
    slug: 'virar-west',
    landmark: 'Old Viva College / Ram Mandir Road',
    // How to reach the shop from the locality's anchor point.
    reach:
      'Our shop sits right on Ram Mandir Road, opposite Mahavir Hospital and ' +
      'beside Old Viva College — a 5-minute walk from the college gate and ' +
      'easy to find by auto from anywhere in Virar West.',
    distance: 'In the heart of Virar West — walking distance for most residents.',
    faqs: [
      {
        q: 'Where exactly is your shop in Virar West?',
        a:
          'We are at Shop No. 11, Takshashila Apartment on Ram Mandir Road, ' +
          'opposite Mahavir Hospital and next to Old Viva College, Virar West ' +
          '401303. Any auto driver knows the Viva College landmark.'
      },
      {
        q: 'Do I need to come to the shop or can I order from home in Virar West?',
        a:
          'Both work. Most Virar West customers simply WhatsApp the file to ' +
          '+91 70210 72757, we print it, and they walk in to collect — usually ' +
          'within the same hour.'
      }
    ]
  },
  {
    name: 'Virar East',
    slug: 'virar-east',
    landmark: 'Virar Railway Station (East exit)',
    reach:
      'From Virar East, take the foot-over-bridge across to the West exit of ' +
      'Virar Station, then it is a short auto ride down Ram Mandir Road to our ' +
      'shop near Old Viva College — about 8–10 minutes door to door.',
    distance: 'A short cross-station hop from Virar East — roughly 8–10 minutes.',
    faqs: [
      {
        q: 'I live in Virar East — is it worth coming to Virar West for printing?',
        a:
          'Yes. To save the trip, WhatsApp your file first to +91 70210 72757. ' +
          'We will have it printed and bound before you cross over from the ' +
          'East side, so you only walk in to collect and pay.'
      },
      {
        q: 'How do I reach you from Virar East station?',
        a:
          'Cross to the West exit via the station bridge, take an auto towards ' +
          'Old Viva College / Mahavir Hospital on Ram Mandir Road — our shop ' +
          '(Takshashila Apartment, Shop No. 11) is right there.'
      }
    ]
  },
  {
    name: 'Nala Sopara',
    slug: 'nala-sopara',
    landmark: 'Nallasopara Railway Station',
    reach:
      'From Nala Sopara, hop on any Virar-bound local — Virar is the very next ' +
      'station. Exit on the West side and take a quick auto to Old Viva College ' +
      'on Ram Mandir Road; the whole trip is about 12–15 minutes.',
    distance: 'One station up the line from Nallasopara — about 12–15 minutes.',
    faqs: [
      {
        q: 'Do you serve students and customers from Nala Sopara?',
        a:
          'Absolutely. Plenty of our regulars commute from Nallasopara. Virar ' +
          'is just one stop away, and you can WhatsApp the file ahead so it is ' +
          'ready the moment you arrive.'
      },
      {
        q: 'Can I get a thesis printed and bound the same day if I come from Nala Sopara?',
        a:
          'Yes. Send the PDF on WhatsApp from Nallasopara, we confirm the page ' +
          'count and binding, and your spiral-bound copy is ready to collect by ' +
          'the time you reach Virar West.'
      }
    ]
  },
  {
    name: 'Bolinj',
    slug: 'bolinj',
    landmark: 'Bolinj / Yashwant Viva Township area',
    reach:
      'Bolinj is just north of our shop along the Agashi/Bolinj Road. A 5–7 ' +
      'minute auto ride brings you down to Ram Mandir Road, Old Viva College ' +
      'and our shop opposite Mahavir Hospital.',
    distance: 'A 5–7 minute auto ride from Bolinj into central Virar West.',
    faqs: [
      {
        q: 'Is your shop convenient for Bolinj and Yashwant Viva Township residents?',
        a:
          'Very. We are a short auto ride down from Bolinj on the way to Virar ' +
          'Station. Many township families use us for school project printing, ' +
          'lamination and passport photos.'
      },
      {
        q: 'Can I WhatsApp my order from Bolinj instead of travelling twice?',
        a:
          'Yes — that is what most Bolinj customers do. Send the file to ' +
          '+91 70210 72757, we print it, and you make a single trip just to ' +
          'collect.'
      }
    ]
  },
  {
    name: 'Agashi',
    slug: 'agashi',
    landmark: 'Agashi Road / Agashi Jain Temple',
    reach:
      'From Agashi, head along Agashi Road towards Virar Station — our shop on ' +
      'Ram Mandir Road near Old Viva College is on the way, roughly a 10-minute ' +
      'ride opposite Mahavir Hospital.',
    distance: 'About 10 minutes from Agashi along Agashi Road towards Virar.',
    faqs: [
      {
        q: 'Do you print for customers coming from Agashi?',
        a:
          'Yes, we regularly serve the Agashi side. Since Agashi Road feeds ' +
          'straight into Virar West, you can drop your documents on the way or ' +
          'simply WhatsApp them ahead.'
      },
      {
        q: 'What is the fastest way to get a document from Agashi printed?',
        a:
          'WhatsApp the file to +91 70210 72757 before you leave Agashi. By the ' +
          'time you reach our shop near Old Viva College it will be printed and ' +
          'ready.'
      }
    ]
  },
  {
    name: 'Chandansar',
    slug: 'chandansar',
    landmark: 'Chandansar Road / Chandansar Lake',
    reach:
      'From Chandansar, come down Chandansar Road towards Ram Mandir Road — our ' +
      'shop near Old Viva College, opposite Mahavir Hospital, is a quick 8-minute ' +
      'auto ride away.',
    distance: 'Roughly 8 minutes from Chandansar down towards Ram Mandir Road.',
    faqs: [
      {
        q: 'Is your shop reachable from Chandansar?',
        a:
          'Easily. Chandansar Road connects directly to the Old Viva College ' +
          'area on Ram Mandir Road where we are located. Autos run frequently ' +
          'on this route.'
      },
      {
        q: 'Can I send a colour printout request from Chandansar in advance?',
        a:
          'Yes. WhatsApp your colour file to +91 70210 72757; we will confirm ' +
          'the page count and have your colour prints ready before you arrive ' +
          'from Chandansar.'
      }
    ]
  },
  {
    name: 'Virar Station',
    slug: 'virar-station',
    landmark: 'Virar Railway Station (West exit)',
    reach:
      'Step out of the West exit of Virar Station and take a 3–4 minute auto ' +
      'down Ram Mandir Road towards Old Viva College and Mahavir Hospital — our ' +
      'shop is right there, ideal for commuters.',
    distance: 'Just 3–4 minutes from the Virar Station West exit.',
    faqs: [
      {
        q: 'How close is your shop to Virar Station?',
        a:
          'Very close — a 3–4 minute auto from the West exit along Ram Mandir ' +
          'Road. Perfect if you need a quick xerox or printout while commuting.'
      },
      {
        q: 'Can I get last-minute prints on my way to catch a train at Virar Station?',
        a:
          'Yes. WhatsApp the file ahead to +91 70210 72757, collect the prints ' +
          'on your way to the station, and you will still make your train.'
      }
    ]
  },
  {
    name: 'Viva College Area',
    slug: 'viva-college',
    landmark: 'Viva College (Old & New campus)',
    reach:
      'We are literally next to Old Viva College on Ram Mandir Road — a ' +
      '2-minute walk from the college gate, opposite Mahavir Hospital. The ' +
      'closest reliable print shop for Viva students.',
    distance: 'Right beside Old Viva College — a 2-minute walk for students.',
    faqs: [
      {
        q: 'Are you the print shop near Viva College?',
        a:
          'Yes — we are right next to Old Viva College on Ram Mandir Road, ' +
          'opposite Mahavir Hospital. Viva students use us daily for ' +
          'assignments, journals, projects and thesis printing.'
      },
      {
        q: 'Can Viva College students get journals and projects bound same day?',
        a:
          'Absolutely. Send your file on WhatsApp between lectures, and your ' +
          'spiral-bound journal or project is ready to collect the same day — ' +
          'often within the hour.'
      }
    ]
  },
  {
    name: 'Global City',
    slug: 'global-city',
    landmark: 'Global City Township, Virar West',
    reach:
      'From Global City, take the main road back towards Virar Station and Old ' +
      'Viva College — our shop on Ram Mandir Road, opposite Mahavir Hospital, ' +
      'is about a 10-minute auto ride away.',
    distance: 'Around 10 minutes from Global City towards central Virar West.',
    faqs: [
      {
        q: 'Do you serve the Global City township in Virar West?',
        a:
          'Yes. Many Global City families rely on us for school projects, ' +
          'lamination, passport photos and bulk xerox. WhatsApp ahead to skip ' +
          'the wait.'
      },
      {
        q: 'Is it easier to order online from Global City?',
        a:
          'For most jobs, yes — WhatsApp the file to +91 70210 72757, we print ' +
          'it, and you make one short trip from Global City to collect.'
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// SERVICES — each maps to a REAL existing root page under ../services/.
// `rootPage` MUST point to a file that exists (printing.html, xerox.html,
// binding.html, lamination.html, passport-photos.html, thesis-printing.html).
// `price` lines use the official rate card.
// ---------------------------------------------------------------------------
const SERVICES = [
  {
    name: 'Xerox & Photocopy',
    slug: 'xerox',
    rootPage: 'xerox.html',
    icon: 'fa-solid fa-copy',
    keywords: ['xerox', 'photocopy', 'copy shop', 'document copy', 'bulk xerox'],
    priceLabel: 'Xerox A4 from ₹1.5/page',
    priceUnit: 'per page',
    priceValue: '₹1.5',
    offerName: 'A4 Black & White Xerox',
    offerPrice: '1.50',
    value:
      'Crisp, instant photocopies of documents, ID cards and records on our ' +
      'high-speed machine. A4 from just ₹1.5 a page, with cheaper rates on ' +
      'bulk orders of 100+ pages. Government documents like Aadhaar and PAN ' +
      'are copied every day, no fuss.'
  },
  {
    name: 'Colour Printing',
    slug: 'color-printing',
    rootPage: 'printing.html',
    icon: 'fa-solid fa-palette',
    keywords: ['color printing', 'colour printout', 'photo print', 'poster print'],
    priceLabel: 'Colour A4 ₹10/page',
    priceUnit: 'per page',
    priceValue: '₹10',
    offerName: 'A4 Colour Print',
    offerPrice: '10.00',
    value:
      'Vivid, true-to-screen colour printing for posters, presentations, ' +
      'photos, charts and cover pages. A4 colour at ₹10 a page on quality ' +
      'paper. Send the file on WhatsApp and we will match the colours and ' +
      'have it ready fast.'
  },
  {
    name: 'Black & White Printing',
    slug: 'bw-printing',
    rootPage: 'printing.html',
    icon: 'fa-solid fa-file-lines',
    keywords: ['black and white printing', 'b&w printout', 'document printing'],
    priceLabel: 'B&W A4 ₹3/page',
    priceUnit: 'per page',
    priceValue: '₹3',
    offerName: 'A4 Black & White Print',
    offerPrice: '3.00',
    value:
      'Sharp, dark black & white printing for assignments, notes, forms and ' +
      'reports at ₹3 a page. WhatsApp your PDF or Word file and collect clean, ' +
      'smudge-free prints the same day — ideal for students and offices.'
  },
  {
    name: 'Thesis & Project Printing',
    slug: 'thesis-printing',
    rootPage: 'thesis-printing.html',
    icon: 'fa-solid fa-graduation-cap',
    keywords: ['thesis printing', 'project printing', 'assignment printing', 'journal print'],
    priceLabel: 'B&W ₹3/page · Spiral ₹30',
    priceUnit: 'per page',
    priceValue: '₹3',
    offerName: 'Thesis Printing (B&W per page)',
    offerPrice: '3.00',
    value:
      'Complete thesis, project and journal printing with binding done same ' +
      'day. Mix B&W body pages (₹3) with colour charts and covers (₹10), add ' +
      'spiral binding (₹30) accepted by most colleges, and submit on time. ' +
      'A favourite of Viva College students.'
  },
  {
    name: 'Spiral Binding',
    slug: 'spiral-binding',
    rootPage: 'binding.html',
    icon: 'fa-solid fa-book',
    keywords: ['spiral binding', 'book binding', 'document binding', 'project binding'],
    priceLabel: 'Spiral Binding ₹30/set',
    priceUnit: 'per set',
    priceValue: '₹30',
    offerName: 'Spiral Binding (per set)',
    offerPrice: '30.00',
    value:
      'Neat spiral binding at ₹30 a set with a transparent front cover and a ' +
      'sturdy back card — accepted by most colleges and offices. Bring your ' +
      'printed pages or let us print and bind together in one same-day visit.'
  },
  {
    name: 'Lamination',
    slug: 'lamination',
    rootPage: 'lamination.html',
    icon: 'fa-solid fa-id-card',
    keywords: ['lamination', 'laminate documents', 'certificate lamination', 'id lamination'],
    priceLabel: 'Lamination A4 ₹10',
    priceUnit: 'per sheet',
    priceValue: '₹10',
    offerName: 'A4 Lamination (per sheet)',
    offerPrice: '10.00',
    value:
      'Protect important documents — certificates, mark sheets, ID cards and ' +
      'photos — with clean, bubble-free lamination from ₹10 for A4. Done while ' +
      'you wait, so your originals stay crisp and waterproof for years.'
  },
  {
    name: 'Passport Photos',
    slug: 'passport-photos',
    rootPage: 'passport-photos.html',
    icon: 'fa-solid fa-camera-retro',
    keywords: ['passport photo', 'passport size photo', 'id photo', 'visa photo'],
    priceLabel: 'Passport Photos ₹30/set',
    priceUnit: 'per set',
    priceValue: '₹30',
    offerName: 'Passport Size Photos (per set)',
    offerPrice: '30.00',
    value:
      'Studio-quality passport and ID photos at ₹30 a set, with the correct ' +
      'size and white background for passports, exams, visas and forms. Walk ' +
      'in and walk out with a printed set in minutes.'
  }
];

module.exports = { LOCALITIES, SERVICES };
