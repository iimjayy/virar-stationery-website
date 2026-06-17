// js/features/gallery-lightbox.js
// Self-contained Gallery Lightbox feature module.
// Owns lightbox open/close/navigate logic, keyboard navigation, and focus management.
// Dependencies: none (pure DOM, zero imports)

// ---------------------------------------------------------------------------
// initGalleryLightbox — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initGalleryLightbox = () => {
  const lightbox = document.getElementById('galleryLightbox');
  const galleryImages = Array.from(document.querySelectorAll('#gallery .gallery-item img'));

  if (!lightbox || !galleryImages.length) {
    return;
  }

  const lightboxImage = lightbox.querySelector('.gallery-lightbox-image');
  const lightboxCaption = lightbox.querySelector('.gallery-lightbox-caption');
  const closeButton = lightbox.querySelector('.gallery-lightbox-close');
  const prevButton = lightbox.querySelector('.gallery-lightbox-nav.is-prev');
  const nextButton = lightbox.querySelector('.gallery-lightbox-nav.is-next');

  if (!lightboxImage || !lightboxCaption || !closeButton || !prevButton || !nextButton) {
    return;
  }

  let activeIndex = 0;
  let triggerElement = null;

  // --- Image counter element ---
  const counterEl = document.createElement('span');
  counterEl.className = 'lightbox-counter';
  counterEl.setAttribute('aria-live', 'polite');
  lightbox.appendChild(counterEl);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // --- Preload adjacent images ---
  const preloadAdjacent = (index) => {
    const prevIdx = (index - 1 + galleryImages.length) % galleryImages.length;
    const nextIdx = (index + 1) % galleryImages.length;
    [prevIdx, nextIdx].forEach((i) => {
      const img = new Image();
      img.src = galleryImages[i].currentSrc || galleryImages[i].src;
    });
  };

  // --- Update counter text ---
  const updateCounter = () => {
    counterEl.textContent = `${activeIndex + 1} of ${galleryImages.length}`;
  };

  const syncLightboxContent = () => {
    const activeImage = galleryImages[activeIndex];
    if (!activeImage) {
      return;
    }

    lightboxImage.src = activeImage.currentSrc || activeImage.src;
    lightboxImage.alt = activeImage.alt || `Gallery image ${activeIndex + 1}`;
    lightboxCaption.textContent = activeImage.alt || `Gallery image ${activeIndex + 1} of ${galleryImages.length}`;
    updateCounter();
    preloadAdjacent(activeIndex);
  };

  const openLightbox = (index) => {
    activeIndex = (index + galleryImages.length) % galleryImages.length;
    triggerElement = galleryImages[activeIndex];
    syncLightboxContent();

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');

    window.setTimeout(() => {
      closeButton.focus();
    }, 0);
  };

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');

    if (triggerElement) {
      triggerElement.focus();
    }
  };

  // --- Smooth image transition helper ---
  const transitionAndSync = (newIndex) => {
    const nextImage = galleryImages[newIndex];
    if (!nextImage) {
      return;
    }

    if (prefersReducedMotion.matches) {
      activeIndex = newIndex;
      syncLightboxContent();
      return;
    }

    lightboxImage.classList.add('lightbox-transitioning');
    window.setTimeout(() => {
      activeIndex = newIndex;
      syncLightboxContent();

      // Wait for the new image to load before fading back in
      if (lightboxImage.complete) {
        lightboxImage.classList.remove('lightbox-transitioning');
      } else {
        lightboxImage.addEventListener('load', () => {
          lightboxImage.classList.remove('lightbox-transitioning');
        }, { once: true });
      }
    }, 150);
  };

  const goToPrevious = () => {
    const newIndex = (activeIndex - 1 + galleryImages.length) % galleryImages.length;
    transitionAndSync(newIndex);
  };

  const goToNext = () => {
    const newIndex = (activeIndex + 1) % galleryImages.length;
    transitionAndSync(newIndex);
  };

  // Make each gallery image keyboard-accessible and clickable
  galleryImages.forEach((image, index) => {
    image.setAttribute('tabindex', '0');
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', `Open image preview: ${image.alt || `Gallery image ${index + 1}`}`);

    image.addEventListener('click', () => {
      openLightbox(index);
    });

    image.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      openLightbox(index);
    });
  });

  // Lightbox control buttons
  closeButton.addEventListener('click', closeLightbox);
  prevButton.addEventListener('click', goToPrevious);
  nextButton.addEventListener('click', goToNext);

  // Click on backdrop closes lightbox
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  // --- Touch / pointer swipe navigation ---
  let pointerStartX = null;

  lightbox.addEventListener('pointerdown', (event) => {
    if (!lightbox.classList.contains('is-open')) {
      return;
    }
    pointerStartX = event.clientX;
  });

  lightbox.addEventListener('pointerup', (event) => {
    if (pointerStartX === null) {
      return;
    }

    const distance = event.clientX - pointerStartX;
    pointerStartX = null;

    // Ignore small movements (< 10px) to avoid interfering with clicks
    if (Math.abs(distance) < 10) {
      return;
    }

    // Require > 50px swipe to trigger navigation
    if (Math.abs(distance) > 50) {
      if (distance < 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  });

  lightbox.addEventListener('pointercancel', () => {
    pointerStartX = null;
  });

  // Keyboard navigation while lightbox is open
  document.addEventListener('keydown', (event) => {
    if (!lightbox.classList.contains('is-open')) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeLightbox();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToPrevious();
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToNext();
    }
  });
};
