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

  const setupServiceAccordions = () => {
    const serviceCards = document.querySelectorAll('#services .service-card');
    if (!serviceCards.length) {
      return;
    }

    const buildWhatsAppLink = (serviceName) => {
      const message = `Hi, I want details for ${serviceName}.`;
      return `https://wa.me/917021072757?text=${encodeURIComponent(message)}`;
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
        explanation: 'Ideal for assignments, notes, forms, and office papers where speed and clarity matter most.',
        commonUses: ['School and college assignments', 'Exam notes and handouts', 'Office forms and records'],
        startingPrice: ['Less than 2 copies: ₹5 per side', 'More than 2 copies: ₹3 per side'],
        deliveryTime: ['Usually ready in 2 to 3 minutes'],
        addOns: ['Stapling', 'Spiral binding', 'Lamination'],
        ctaLabel: 'Print on WhatsApp',
        badges: {
          price: 'Starting from ₹3',
          tag: 'Fast Service'
        }
      },
      'Color Printing': {
        explanation: 'Perfect for creative and presentation material where vibrant colors and clean output are important.',
        commonUses: ['Project covers', 'Charts and presentations', 'Flyers and invitations'],
        startingPrice: ['A4 color print starts from ₹20 per page'],
        deliveryTime: ['Usually completed in 5 to 10 minutes'],
        addOns: ['Glossy paper', 'Lamination', 'Spiral binding'],
        ctaLabel: 'Ask for Colour Print Price',
        badges: {
          price: 'Starting from ₹20',
          tag: 'Most Popular'
        }
      },
      'Xerox Services': {
        explanation: 'Fast and reliable copying support for everyday student, office, and legal document needs.',
        commonUses: ['School notes and forms', 'Office files', 'Government applications', 'Legal paperwork'],
        startingPrice: ['Starts from ₹3 per page for bulk copies'],
        deliveryTime: ['Instant for small jobs', 'Large batches in 15 to 30 minutes'],
        addOns: ['Sorting', 'Stapling', 'File arrangement'],
        ctaLabel: 'Get Xerox Now',
        badges: {
          price: 'Starting from ₹3',
          tag: 'Most Popular'
        }
      },
      'Passport Photos': {
        explanation: 'Studio-finish passport photos for IDs, forms, admissions, and visa submissions.',
        commonUses: ['Passport application', 'Job application forms', 'College and school admission', 'Official documentation'],
        startingPrice: ['Passport photo sheet starts from ₹50'],
        deliveryTime: ['Ready in 10 to 15 minutes'],
        addOns: ['Basic face correction', 'Background touch-up', 'Soft copy sharing'],
        ctaLabel: 'Book Passport Photo',
        badges: {
          price: 'Starting from ₹50',
          tag: 'Fast Service'
        }
      },
      Lamination: {
        explanation: 'Protect your important documents with clean edge-sealed lamination in multiple sizes.',
        commonUses: ['ID cards', 'Certificates', 'School marksheets', 'Business notices'],
        startingPrice: ['Small card lamination starts from ₹30', 'A4 document lamination starts from ₹50'],
        deliveryTime: ['Usually done in around 5 minutes for single sheets'],
        addOns: ['Matte finish', 'Glossy finish', 'Corner rounding'],
        ctaLabel: 'Laminate My Document',
        badges: {
          price: 'Starting from ₹30',
          tag: 'Document Safety'
        }
      },
      'Document Scanning': {
        explanation: 'Get sharp digital copies for email, online submissions, and backup records in minutes.',
        commonUses: ['Online forms', 'Email attachments', 'PDF archive', 'Application documents'],
        startingPrice: ['Scanning starts from ₹20 per page'],
        deliveryTime: ['2 to 5 minutes per document'],
        addOns: ['PDF merging', 'Image enhancement', 'Email and WhatsApp sharing'],
        ctaLabel: 'Scan & Share',
        badges: {
          price: 'Starting from ₹20',
          tag: 'Digital Ready'
        }
      },
      'Project Printing': {
        explanation: 'Complete project printing support for schools and colleges with neat finishing and quick turnaround.',
        commonUses: ['School and college project reports', 'Blackbook printing', 'Seminar handouts', 'Bulk assignment sets'],
        startingPrice: ['Basic project sets start from ₹50'],
        deliveryTime: ['Same day for regular orders', 'Express 1 to 2 hour option available'],
        addOns: ['Color cover page', 'Spiral binding', 'Transparent front sheet'],
        ctaLabel: 'Print My Project',
        badges: {
          price: 'Starting from ₹50',
          tag: 'Student Favorite'
        }
      },
      'Stationery Essentials': {
        explanation: 'Daily school and office stationery stocked in-store with reliable quality and budget options.',
        commonUses: ['Notebooks and pens', 'Files and folders', 'Art and craft basics', 'School daily needs'],
        startingPrice: ['Affordable options from ₹10 depending on product'],
        deliveryTime: ['Instant pickup for in-stock items', 'Bulk school orders packed same day'],
        addOns: ['Combo packs', 'Class-wise stationery sets', 'Bulk discounts for institutions'],
        ctaLabel: 'Order Stationery',
        badges: {
          price: 'Starting from ₹10',
          tag: 'Daily Essentials'
        }
      }
    };

    const defaultDetails = (title, summary) => ({
      explanation: summary || `Reliable ${title.toLowerCase()} support for students, offices, and local businesses.`,
      commonUses: ['Student requirements', 'Office documentation', 'Local business work'],
      startingPrice: ['Call or WhatsApp for latest pricing'],
      deliveryTime: ['Usually available on the same day'],
      addOns: ['Bulk quantity support', 'Guidance at the counter'],
      ctaLabel: 'Ask on WhatsApp',
      badges: {
        price: 'Ask for Price',
        tag: 'Custom Quote'
      }
    });

    const createPanelMarkup = (title, details) => {
      const ctaHref = details.ctaHref || buildWhatsAppLink(title);
      return `
        <div class="service-detail-divider"></div>
        <div class="service-expand-inner">
          <p>${escapeHtml(details.explanation)}</p>
          <h4>Common Uses</h4>
          <ul>${renderList(details.commonUses)}</ul>
          <h4>Starting Price</h4>
          <ul>${renderList(details.startingPrice)}</ul>
          <h4>Delivery Time</h4>
          <ul>${renderList(details.deliveryTime)}</ul>
          <h4>Optional Add-ons</h4>
          <ul>${renderList(details.addOns)}</ul>
          <div class="service-expand-actions">
            <a class="service-cta-btn" href="${ctaHref}" target="_blank" rel="noopener">${escapeHtml(details.ctaLabel)}</a>
          </div>
        </div>
      `;
    };

    const setCardClosed = (card) => {
      const panel = card.querySelector('.service-expand-panel');
      const label = card.querySelector('.service-link-label');
      const cardLink = card.querySelector('.card-link');

      if (!panel) {
        return;
      }

      card.classList.remove('is-open');
      panel.style.maxHeight = '0px';
      if (label) {
        label.textContent = 'View Details';
      }
      if (cardLink) {
        cardLink.setAttribute('aria-expanded', 'false');
      }
    };

    const setCardOpen = (card) => {
      const panel = card.querySelector('.service-expand-panel');
      const label = card.querySelector('.service-link-label');
      const cardLink = card.querySelector('.card-link');

      if (!panel) {
        return;
      }

      card.classList.add('is-open');
      panel.style.maxHeight = `${panel.scrollHeight}px`;
      if (label) {
        label.textContent = 'Close Details';
      }
      if (cardLink) {
        cardLink.setAttribute('aria-expanded', 'true');
      }
    };

    serviceCards.forEach((card) => {
      const titleNode = card.querySelector('h3');
      const summaryNode = card.querySelector('p');
      const cardLink = card.querySelector('.card-link');

      if (!titleNode || !cardLink) {
        return;
      }

      const title = titleNode.textContent.trim();
      const summary = summaryNode ? summaryNode.textContent.trim() : '';
      const details = detailedServices[title] || defaultDetails(title, summary);

      card.classList.add('accordion-enabled');

      const badgeWrap = document.createElement('div');
      badgeWrap.className = 'service-top-badges';
      badgeWrap.innerHTML = `
        <span class="service-badge price">${escapeHtml(details.badges.price)}</span>
        <span class="service-badge tag">${escapeHtml(details.badges.tag)}</span>
      `;
      card.insertBefore(badgeWrap, card.firstChild);

      cardLink.setAttribute('href', '#');
      cardLink.setAttribute('role', 'button');
      cardLink.setAttribute('aria-expanded', 'false');
      cardLink.innerHTML = `
        <span class="service-link-label">View Details</span>
        <span class="service-link-meta">
          <i class="fa-solid fa-chevron-down service-chevron" aria-hidden="true"></i>
        </span>
      `;

      const detailPanel = document.createElement('div');
      detailPanel.className = 'service-expand-panel';
      detailPanel.innerHTML = createPanelMarkup(title, details);
      card.appendChild(detailPanel);

      cardLink.addEventListener('click', (event) => {
        event.preventDefault();
        if (card.classList.contains('is-open')) {
          setCardClosed(card);
        } else {
          setCardOpen(card);
        }
      });
    });

    window.addEventListener('resize', () => {
      serviceCards.forEach((card) => {
        if (!card.classList.contains('is-open')) {
          return;
        }

        const openPanel = card.querySelector('.service-expand-panel');
        if (openPanel) {
          openPanel.style.maxHeight = `${openPanel.scrollHeight}px`;
        }
      });
    });
  };

  setupServiceAccordions();

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
