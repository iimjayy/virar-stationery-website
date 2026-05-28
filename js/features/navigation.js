// js/features/navigation.js
// Self-contained Navigation System feature module.
// Owns: scrollspy active-link highlighting, sliding indicator, nav link clicks,
// mobile menu open/close state (Bootstrap Collapse bridge), keyboard/click dismiss.
// Dependencies: window.bootstrap (external CDN — guarded with existence check)

// ---------------------------------------------------------------------------
// initNavigation — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initNavigation = () => {
  // ---- Desktop nav active-link + indicator ----
  const navLinks = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
  if (!navLinks.length) {
    return;
  }

  const navList = document.querySelector('.nav-strip .navbar-nav');

  // Map each section href to its primary nav link (first occurrence wins).
  const sectionToPrimaryLink = new Map();
  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#') && !sectionToPrimaryLink.has(href)) {
      sectionToPrimaryLink.set(href, link);
    }
  });

  let activeLink = navLinks.find((link) => link.classList.contains('active')) || navLinks[0];
  let activeIndicator = null;

  // Reposition the sliding underline indicator under the active link.
  const positionIndicator = () => {
    if (!navList || !activeIndicator || !activeLink) {
      return;
    }

    // Hide indicator on mobile — it looks wrong in stacked layout.
    if (window.matchMedia('(max-width: 991px)').matches) {
      activeIndicator.style.opacity = '0';
      return;
    }

    const indicatorWidth = Math.min(58, Math.max(24, activeLink.offsetWidth - 28));
    const indicatorLeft = activeLink.offsetLeft + ((activeLink.offsetWidth - indicatorWidth) / 2);

    activeIndicator.style.width = `${indicatorWidth}px`;
    activeIndicator.style.transform = `translateX(${indicatorLeft}px)`;
    activeIndicator.style.opacity = '1';
  };

  // Set one link as active, deactivate all others.
  const setActiveLink = (link) => {
    if (!link) {
      return;
    }

    activeLink = link;
    navLinks.forEach((item) => {
      item.classList.toggle('active', item === link);
    });

    window.requestAnimationFrame(positionIndicator);
  };

  // Inject the sliding indicator element if it doesn't exist in the HTML.
  if (navList) {
    navList.classList.add('has-active-indicator');
    activeIndicator = navList.querySelector('.nav-active-indicator');

    if (!activeIndicator) {
      activeIndicator = document.createElement('span');
      activeIndicator.className = 'nav-active-indicator';
      navList.appendChild(activeIndicator);
    }

    window.requestAnimationFrame(positionIndicator);
    window.addEventListener('resize', positionIndicator);
  }

  // ---- Scrollspy via IntersectionObserver ----
  const observedSections = Array.from(sectionToPrimaryLink.keys())
    .map((href) => document.querySelector(href))
    .filter(Boolean);

  if (observedSections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        // Pick the most visible intersecting section.
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (!visibleEntry?.target?.id) {
          return;
        }

        const matchingLink = sectionToPrimaryLink.get(`#${visibleEntry.target.id}`);
        if (matchingLink) {
          setActiveLink(matchingLink);
        }
      },
      {
        rootMargin: '-38% 0px -52% 0px',
        threshold: [0.15, 0.35, 0.6]
      }
    );

    observedSections.forEach((section) => sectionObserver.observe(section));
  }

  // ---- Nav link clicks — set active + close mobile menu ----
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      setActiveLink(link);

      // Close Bootstrap mobile collapse if open.
      const navbarCollapse = document.querySelector('.navbar-collapse.show');
      if (navbarCollapse && window.bootstrap) {
        const collapseInstance = window.bootstrap.Collapse.getOrCreateInstance(navbarCollapse);
        collapseInstance.hide();
      }
    });
  });

  // ---- Mobile menu open/close ----
  const menuButton = document.querySelector('.mobile-menu-btn');
  const navbarCollapse = document.getElementById('mainNavbar');

  if (!menuButton || !navbarCollapse || !window.bootstrap) {
    return;
  }

  const desktopBreakpoint = window.matchMedia('(min-width: 992px)');
  const collapseInstance = window.bootstrap.Collapse.getOrCreateInstance(navbarCollapse, {
    toggle: false
  });

  const syncMenuState = () => {
    const isOpen = navbarCollapse.classList.contains('show');
    menuButton.classList.toggle('is-open', isOpen);
    menuButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.classList.toggle('mobile-nav-open', isOpen && !desktopBreakpoint.matches);
  };

  navbarCollapse.addEventListener('show.bs.collapse', () => {
    menuButton.classList.add('is-open');
    if (!desktopBreakpoint.matches) {
      document.body.classList.add('mobile-nav-open');
    }
    menuButton.setAttribute('aria-expanded', 'true');
  });

  navbarCollapse.addEventListener('hide.bs.collapse', () => {
    menuButton.classList.remove('is-open');
    document.body.classList.remove('mobile-nav-open');
    menuButton.setAttribute('aria-expanded', 'false');
  });

  navbarCollapse.addEventListener('shown.bs.collapse', syncMenuState);
  navbarCollapse.addEventListener('hidden.bs.collapse', syncMenuState);

  // Escape key dismisses mobile menu.
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !navbarCollapse.classList.contains('show')) {
      return;
    }

    collapseInstance.hide();
  });

  // Outside-click dismisses mobile menu.
  document.addEventListener('click', (event) => {
    if (desktopBreakpoint.matches || !navbarCollapse.classList.contains('show')) {
      return;
    }

    const target = event.target;
    if (navbarCollapse.contains(target) || menuButton.contains(target)) {
      return;
    }

    collapseInstance.hide();
  });

  // Restore correct state when breakpoint changes (e.g. orientation flip).
  const handleBreakpointChange = () => {
    if (desktopBreakpoint.matches) {
      document.body.classList.remove('mobile-nav-open');
      menuButton.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
    } else {
      syncMenuState();
    }
  };

  if (typeof desktopBreakpoint.addEventListener === 'function') {
    desktopBreakpoint.addEventListener('change', handleBreakpointChange);
  } else if (typeof desktopBreakpoint.addListener === 'function') {
    desktopBreakpoint.addListener(handleBreakpointChange);
  }

  syncMenuState();
};
