// js/features/testimonial-slider.js
// Self-contained Testimonial Slider feature module.
// Owns scroll snap tracking, dot navigation, prev/next buttons, and responsive sync.
// rAF-throttled scroll handler for performance on mid-range devices.
// Testimonial cards are rendered server-side in index.html for reliability.

// ---------------------------------------------------------------------------
// initTestimonialSlider — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initTestimonialSlider = () => {
  const track = document.getElementById('testimonialsTrack');
  if (!track) return;


  const previousButton = document.getElementById('testimonialsPrevBtn');
  const nextButton = document.getElementById('testimonialsNextBtn');
  const dotsContainer = document.getElementById('testimonialsDots');

  if (!previousButton || !nextButton || !dotsContainer) {
    return;
  }

  const slides = Array.from(track.querySelectorAll('.testimonial-slide'));
  if (!slides.length) {
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeIndex = 0;
  let scrollTicking = false;
  let autoAdvanceTimer = null;

  // Build dot navigation — one button per slide.
  dotsContainer.innerHTML = '';
  const dotButtons = slides.map((_, index) => {
    const dotButton = document.createElement('button');
    dotButton.type = 'button';
    dotButton.className = 'testimonial-slider-dot';
    dotButton.setAttribute('aria-label', `Go to testimonial ${index + 1}`);

    dotButton.addEventListener('click', () => {
      centerSlide(index, 'smooth');
    });

    dotsContainer.appendChild(dotButton);
    return dotButton;
  });

  // Update dot states and ARIA for prev/next buttons (wrapping navigation).
  const setActiveIndex = (index) => {
    // Wrap around at boundaries.
    if (index < 0) {
      activeIndex = slides.length - 1;
    } else if (index >= slides.length) {
      activeIndex = 0;
    } else {
      activeIndex = index;
    }

    dotButtons.forEach((dotButton, dotIndex) => {
      dotButton.classList.toggle('is-active', dotIndex === activeIndex);
    });

    // Buttons always enabled because navigation wraps.
    previousButton.disabled = false;
    nextButton.disabled = false;
  };

  // Find the slide whose center is closest to the track viewport center.
  const getNearestSlideIndex = () => {
    const viewportCenter = track.scrollLeft + (track.clientWidth / 2);

    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + (slide.offsetWidth / 2);
      const distance = Math.abs(slideCenter - viewportCenter);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  };

  // Scroll the track to center a specific slide.
  const centerSlide = (index, behavior = 'smooth') => {
    const slide = slides[index];
    if (!slide) {
      return;
    }

    const targetLeft = slide.offsetLeft - ((track.clientWidth - slide.offsetWidth) / 2);
    track.scrollTo({ left: Math.max(0, targetLeft), behavior });
    setActiveIndex(index);
  };

  // rAF-throttled scroll handler — tracks active slide as user swipes or scrolls.
  track.addEventListener(
    'scroll',
    () => {
      if (scrollTicking) {
        return;
      }

      scrollTicking = true;
      window.requestAnimationFrame(() => {
        scrollTicking = false;
        setActiveIndex(getNearestSlideIndex());
      });
    },
    { passive: true }
  );

  previousButton.addEventListener('click', () => {
    const prevIndex = activeIndex - 1 < 0 ? slides.length - 1 : activeIndex - 1;
    centerSlide(prevIndex, 'smooth');
  });

  nextButton.addEventListener('click', () => {
    const nextIndex = activeIndex + 1 >= slides.length ? 0 : activeIndex + 1;
    centerSlide(nextIndex, 'smooth');
  });

  // Sync state initially
  window.requestAnimationFrame(() => {
    setActiveIndex(getNearestSlideIndex());
  });

  // ---------------------------------------------------------------------------
  // Auto-advance (every 5 s). Paused on hover, pointer/touch, or reduced motion.
  // ---------------------------------------------------------------------------
  const AUTO_ADVANCE_MS = 5000;

  const startAutoAdvance = () => {
    if (prefersReducedMotion.matches) return;
    stopAutoAdvance();
    autoAdvanceTimer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % slides.length;
      centerSlide(nextIndex, 'smooth');
    }, AUTO_ADVANCE_MS);
  };

  const stopAutoAdvance = () => {
    if (autoAdvanceTimer !== null) {
      clearInterval(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  };

  // Pause on hover.
  track.addEventListener('mouseenter', stopAutoAdvance);
  track.addEventListener('mouseleave', startAutoAdvance);

  // Pause during pointer / touch interaction.
  track.addEventListener('pointerdown', stopAutoAdvance);
  track.addEventListener('pointerup', startAutoAdvance);

  // Re-evaluate when the reduced-motion preference changes at runtime.
  const onMotionPrefChange = () => {
    if (prefersReducedMotion.matches) {
      stopAutoAdvance();
    } else {
      startAutoAdvance();
    }
  };

  if (typeof prefersReducedMotion.addEventListener === 'function') {
    prefersReducedMotion.addEventListener('change', onMotionPrefChange);
  } else if (typeof prefersReducedMotion.addListener === 'function') {
    prefersReducedMotion.addListener(onMotionPrefChange);
  }

  startAutoAdvance();
};
