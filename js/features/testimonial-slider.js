// js/features/testimonial-slider.js
// Self-contained Testimonial Slider feature module.
// Owns scroll snap tracking, dot navigation, prev/next buttons, and responsive sync.
// rAF-throttled scroll handler for performance on mid-range devices.
// Dependencies: none (pure DOM + Web APIs, zero imports)

// ---------------------------------------------------------------------------
// initTestimonialSlider — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initTestimonialSlider = () => {
  const track = document.getElementById('testimonialsTrack');
  const previousButton = document.getElementById('testimonialsPrevBtn');
  const nextButton = document.getElementById('testimonialsNextBtn');
  const dotsContainer = document.getElementById('testimonialsDots');

  if (!track || !previousButton || !nextButton || !dotsContainer) {
    return;
  }

  const slides = Array.from(track.querySelectorAll('.testimonial-slide'));
  if (!slides.length) {
    return;
  }

  const mobileBreakpoint = window.matchMedia('(max-width: 991px)');
  let activeIndex = 0;
  let scrollTicking = false;

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

  // Update dot states, prev/next disabled states.
  const setActiveIndex = (index) => {
    activeIndex = Math.max(0, Math.min(slides.length - 1, index));

    dotButtons.forEach((dotButton, dotIndex) => {
      dotButton.classList.toggle('is-active', dotIndex === activeIndex);
    });

    previousButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === slides.length - 1;
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

  // rAF-throttled scroll handler — tracks active slide as user swipes.
  track.addEventListener(
    'scroll',
    () => {
      if (!mobileBreakpoint.matches || scrollTicking) {
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
    centerSlide(activeIndex - 1, 'smooth');
  });

  nextButton.addEventListener('click', () => {
    centerSlide(activeIndex + 1, 'smooth');
  });

  // Sync state when viewport switches between mobile and desktop.
  const syncSliderState = () => {
    if (!mobileBreakpoint.matches) {
      setActiveIndex(0);
      return;
    }

    window.requestAnimationFrame(() => {
      setActiveIndex(getNearestSlideIndex());
    });
  };

  if (typeof mobileBreakpoint.addEventListener === 'function') {
    mobileBreakpoint.addEventListener('change', syncSliderState);
  } else if (typeof mobileBreakpoint.addListener === 'function') {
    // Legacy Safari fallback.
    mobileBreakpoint.addListener(syncSliderState);
  }

  syncSliderState();
};
