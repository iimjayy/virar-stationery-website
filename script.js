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
