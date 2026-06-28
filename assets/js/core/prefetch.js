// core/prefetch.js
// Prefetch same-origin pages as their links scroll into view.
// Primes the browser's HTTP cache so cross-document View Transitions
// feel instantaneous (no network wait on tap).

const prefetched = new Set();

const scheduleLink = (href) => {
  if (prefetched.has(href)) return;
  prefetched.add(href);
  try {
    const url = new URL(href, location.href);
    // Skip external, hash-only, and current-page links
    if (url.origin !== location.origin) return;
    if (!url.pathname || (url.hash && url.pathname === location.pathname)) return;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'document';
    link.href = href;
    document.head.appendChild(link);
  } catch {
    // Invalid URL — skip silently
  }
};

const initPrefetch = () => {
  if (!('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        scheduleLink(entry.target.href);
      });
    },
    { rootMargin: '0px 0px 300px 0px' }
  );

  document.querySelectorAll('a[href]').forEach((a) => {
    if (a.href) io.observe(a);
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPrefetch);
} else {
  initPrefetch();
}

export {};
