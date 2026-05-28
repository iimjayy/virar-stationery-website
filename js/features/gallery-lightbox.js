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

  const syncLightboxContent = () => {
    const activeImage = galleryImages[activeIndex];
    if (!activeImage) {
      return;
    }

    lightboxImage.src = activeImage.currentSrc || activeImage.src;
    lightboxImage.alt = activeImage.alt || `Gallery image ${activeIndex + 1}`;
    lightboxCaption.textContent = activeImage.alt || `Gallery image ${activeIndex + 1} of ${galleryImages.length}`;
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

  const goToPrevious = () => {
    activeIndex = (activeIndex - 1 + galleryImages.length) % galleryImages.length;
    syncLightboxContent();
  };

  const goToNext = () => {
    activeIndex = (activeIndex + 1) % galleryImages.length;
    syncLightboxContent();
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
