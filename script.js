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

  const contactForm = document.getElementById('contactForm');
  const searchForm = document.querySelector('.search-box');

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

  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = searchForm.querySelector('input[type="search"]');
      const query = input.value.trim();

      if (!query) {
        window.alert('Type a service or product name to search.');
        return;
      }

      const target = document.querySelector('#services, #stationery, #gallery, #contact');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

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
        startingPrice: ['2+ copies from ₹3 per side', 'Single copy from ₹5 per side'],
        deliveryTime: ['2 to 5 minutes for regular work'],
        addOns: ['Stapling', 'Spiral binding', 'Lamination'],
        badge: 'Fast Service',
        priceTag: 'Starts at ₹3'
      },
      'Color Printing': {
        explanation: 'Vibrant color printing with accurate tones for presentations and project sheets.',
        commonUses: ['Project covers and charts', 'Flyers and notices', 'Brochures and invitations'],
        startingPrice: ['A4 color print starts from ₹20 per page'],
        deliveryTime: ['5 to 10 minutes'],
        addOns: ['Glossy paper', 'Premium matte paper', 'Lamination'],
        badge: 'Most Popular',
        priceTag: 'Starts at ₹20'
      },
      'Xerox / Photocopy': {
        explanation: 'Fast photocopy service for everyday document duplication and bulk jobs.',
        commonUses: ['Government forms', 'Legal documents', 'Student notes and records'],
        startingPrice: ['Bulk Xerox from ₹3 per page'],
        deliveryTime: ['Instant for small sets', '15 to 30 min for bulk'],
        addOns: ['Sorting', 'Stapling', 'File set arrangement'],
        badge: 'Most Popular',
        priceTag: 'From ₹3 per page'
      },
      Lamination: {
        explanation: 'Neat edge-sealed lamination that protects documents from wear and moisture.',
        commonUses: ['Certificates', 'ID cards', 'Office notices and menus'],
        startingPrice: ['Small card lamination from ₹30', 'A4 lamination from ₹50'],
        deliveryTime: ['About 5 minutes per sheet'],
        addOns: ['Glossy finish', 'Matte finish', 'Corner trim'],
        badge: 'Fast Service',
        priceTag: 'Starts at ₹30'
      },
      'Spiral Binding': {
        explanation: 'Professional spiral binding for reports, projects, and presentation copies.',
        commonUses: ['Project files', 'Office reports', 'Training booklets'],
        startingPrice: ['Binding starts from ₹40 depending on pages'],
        deliveryTime: ['10 to 20 minutes'],
        addOns: ['Transparent covers', 'Cardboard back sheet', 'Name label'],
        badge: 'Student Favorite',
        priceTag: 'Starts at ₹40'
      },
      'Passport Photos': {
        explanation: 'Quick passport photo prints with clean framing for official and personal use.',
        commonUses: ['Passport and visa forms', 'Admissions and job forms', 'Government IDs'],
        startingPrice: ['Passport photo sheet from ₹50'],
        deliveryTime: ['10 to 15 minutes'],
        addOns: ['Soft copy sharing', 'Basic face adjustment', 'Extra print sets'],
        badge: 'Fast Service',
        priceTag: 'Starts at ₹50'
      },
      'Project Printing': {
        explanation: 'Complete project printing support with neat finishing for school and college work.',
        commonUses: ['Seminar reports', 'Assignment submissions', 'Practical files'],
        startingPrice: ['Basic project sets from ₹50'],
        deliveryTime: ['Same day delivery for regular quantity'],
        addOns: ['Spiral bind', 'Color cover pages', 'Lamination'],
        badge: 'Student Favorite',
        priceTag: 'From ₹50'
      },
      'Stationery Products': {
        explanation: 'Everyday stationery stock for students, offices, and routine shop needs.',
        commonUses: ['Notebooks and pens', 'Files and folders', 'Craft and chart materials'],
        startingPrice: ['Budget items from ₹10 onward'],
        deliveryTime: ['Instant in-store pickup'],
        addOns: ['Combo packs', 'Bulk school sets', 'Institution pricing'],
        badge: 'Bulk Discount Available',
        priceTag: 'From ₹10'
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
      Smartcard: {
        explanation: 'Smartcard printing support for identity, membership, and institutional use.',
        commonUses: ['ID cards', 'Membership cards', 'Access cards'],
        startingPrice: ['Rates vary by card quality and quantity'],
        deliveryTime: ['Same day for small batches'],
        addOns: ['Lanyard slot', 'Barcode printing', 'Name personalization'],
        badge: 'Fast Service',
        priceTag: 'Custom quote'
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
