// js/features/lazy-google-map.js
// Loads the Google Maps embed only when the contact map is likely to be seen.

export const initLazyGoogleMap = () => {
  const iframe = document.querySelector('[data-map-src]');
  const container = document.querySelector('[data-map-container]') || iframe;

  if (!iframe || !container) {
    return;
  }

  const activateMap = () => {
    if (iframe.src) {
      return;
    }
    iframe.src = iframe.dataset.mapSrc;
    iframe.removeAttribute('data-map-src');
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          activateMap();
          observer.disconnect();
        }
      },
      { rootMargin: '240px 0px' }
    );

    observer.observe(container);
    return;
  }

  window.setTimeout(activateMap, 2500);
};
