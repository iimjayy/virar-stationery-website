// js/features/gallery-filter.js
// Category filtering for the mosaic gallery.
// Toggles .gallery-item visibility by data-category with a light reflow animation.
// Dependencies: none (pure DOM). Plays nicely with gallery-lightbox.js, which
// navigates only the currently-visible items.

export const initGalleryFilter = () => {
  const section = document.getElementById('gallery');
  if (!section) {
    return;
  }

  const buttons = Array.from(section.querySelectorAll('.gallery-filter'));
  const items = Array.from(section.querySelectorAll('.gallery-item'));
  const emptyMsg = section.querySelector('.gallery-empty');

  if (!buttons.length || !items.length) {
    return;
  }

  const applyFilter = (filter) => {
    let visibleCount = 0;

    items.forEach((item) => {
      const match = filter === 'all' || item.dataset.category === filter;

      if (match) {
        visibleCount += 1;
        item.classList.remove('is-hidden');
        // Trigger a brief fade/scale-in as tiles reflow.
        item.classList.add('is-filtering');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => item.classList.remove('is-filtering'));
        });
      } else {
        item.classList.add('is-hidden');
      }
    });

    if (emptyMsg) {
      emptyMsg.hidden = visibleCount !== 0;
    }
  };

  const setActive = (activeBtn) => {
    buttons.forEach((btn) => {
      const isActive = btn === activeBtn;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) {
        return;
      }
      setActive(btn);
      applyFilter(btn.dataset.filter || 'all');
    });
  });
};
