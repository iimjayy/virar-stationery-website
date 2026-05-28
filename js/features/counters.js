// js/features/counters.js
// Self-contained Counter Animations feature module.
// Owns IntersectionObserver setup, easing animation, and number formatting.
// Optimized for low-end Android devices (rAF-based, fires once per element).
// Dependencies: none (pure DOM + Web APIs, zero imports)

// ---------------------------------------------------------------------------
// initCounters — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initCounters = () => {
  const counters = Array.from(
    document.querySelectorAll('.counter-value[data-counter-target]')
  );

  if (!counters.length) {
    return;
  }

  // Animate a single counter from 0 to its data-counter-target value.
  const animateCounter = (counterElement) => {
    // Guard: only animate once.
    if (counterElement.dataset.counterAnimated === 'true') {
      return;
    }

    counterElement.dataset.counterAnimated = 'true';

    const targetValue = Number(counterElement.dataset.counterTarget || 0);
    const suffix = counterElement.dataset.counterSuffix || '';
    const duration = 1500;
    const startTime = performance.now();

    // Smooth deceleration curve.
    const easeOutCubic = (value) => 1 - ((1 - value) ** 3);

    // Locale-aware formatting for large numbers (e.g. 1,000 → 1,000 in en-IN).
    const formatter = (value) => {
      if (targetValue >= 1000) {
        return Math.round(value).toLocaleString('en-IN');
      }

      return String(Math.round(value));
    };

    const step = (now) => {
      const elapsed = Math.min(1, (now - startTime) / duration);
      const eased = easeOutCubic(elapsed);
      const currentValue = targetValue * eased;

      counterElement.textContent = `${formatter(currentValue)}${suffix}`;

      if (elapsed < 1) {
        window.requestAnimationFrame(step);
      } else {
        // Ensure the final value is pixel-perfect.
        counterElement.textContent = `${formatter(targetValue)}${suffix}`;
      }
    };

    window.requestAnimationFrame(step);
  };

  // Use IntersectionObserver to trigger only when visible — avoids wasted
  // animation on elements below the fold, which matters on mid-range devices.
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.35,
        rootMargin: '0px 0px -8% 0px'
      }
    );

    counters.forEach((counter) => counterObserver.observe(counter));
    return;
  }

  // Fallback for browsers without IntersectionObserver — animate immediately.
  counters.forEach(animateCounter);
};
