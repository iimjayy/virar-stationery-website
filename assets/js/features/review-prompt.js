// js/features/review-prompt.js
// Shows the Google review prompt once after a high-intent quote action.

const REVIEW_PROMPT_KEY = 'hasSeenReviewPrompt';

export const initReviewPrompt = () => {
  const quoteWhatsAppBtn = document.getElementById('quoteWhatsAppBtn');
  const reviewModal = document.getElementById('reviewModal');

  if (!quoteWhatsAppBtn || !reviewModal || !window.bootstrap?.Modal) {
    return;
  }

  quoteWhatsAppBtn.addEventListener('click', () => {
    if (window.localStorage.getItem(REVIEW_PROMPT_KEY) === 'true') {
      return;
    }

    window.localStorage.setItem(REVIEW_PROMPT_KEY, 'true');

    window.setTimeout(() => {
      const modal = window.bootstrap.Modal.getOrCreateInstance(reviewModal);
      modal.show();
    }, 3000);
  });
};
