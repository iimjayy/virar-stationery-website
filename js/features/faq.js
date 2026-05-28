// js/features/faq.js
// Self-contained FAQ Accordion feature module.
// Owns open/close toggle, one-at-a-time accordion logic, and resize handling.
// Dependencies: none (pure DOM, zero imports)

// ---------------------------------------------------------------------------
// initFAQ — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initFAQ = () => {
  const faqItems = Array.from(document.querySelectorAll('.faq-item'));
  if (!faqItems.length) {
    return;
  }

  // Set a single item's open/closed visual + ARIA state.
  const setItemState = (item, isOpen) => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (!question || !answer) {
      return;
    }

    item.classList.toggle('is-open', isOpen);
    question.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    answer.style.maxHeight = isOpen ? `${answer.scrollHeight}px` : '0px';
  };

  // Wire each item — one click closes all others, then toggles the clicked one.
  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');
    if (!question) {
      return;
    }

    // Start all items closed.
    setItemState(item, false);

    question.addEventListener('click', () => {
      const shouldOpen = !item.classList.contains('is-open');

      faqItems.forEach((faqItem) => {
        setItemState(faqItem, faqItem === item ? shouldOpen : false);
      });
    });
  });

  // Recalculate open item height on resize (e.g. orientation change, zoom).
  window.addEventListener('resize', () => {
    faqItems.forEach((item) => {
      if (!item.classList.contains('is-open')) {
        return;
      }

      const answer = item.querySelector('.faq-answer');
      if (answer) {
        answer.style.maxHeight = `${answer.scrollHeight}px`;
      }
    });
  });
};
