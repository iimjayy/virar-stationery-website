// js/features/mobile-condense.js
// Mobile-only "tap to reveal" for heavy sections that are collapsed on phones.
// A button with [data-mreveal="#targetId"] reveals the matching .mobile-collapsible
// and scrolls it into view. Buttons are hidden on desktop (Bootstrap d-md-none),
// so this wiring is inert there. Dependencies: none.

export const initMobileCondense = () => {
  const buttons = document.querySelectorAll('[data-mreveal]');
  if (!buttons.length) {
    return;
  }

  buttons.forEach((btn) => {
    const target = document.querySelector(btn.getAttribute('data-mreveal'));
    if (!target) {
      return;
    }

    btn.setAttribute('aria-expanded', 'false');

    btn.addEventListener('click', () => {
      target.classList.add('mreveal-open');
      btn.setAttribute('aria-expanded', 'true');
      btn.hidden = true;
      // Let layout settle, then bring the revealed content into view.
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  });
};
