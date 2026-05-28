// js/features/address-copy.js
// Self-contained Address Copy feature module.
// Owns clipboard API, textarea fallback, copy animation, and toast notification.
// Dependencies: showEnquiryToast (toast.js)

import { showEnquiryToast } from '../core/toast.js';

// ---------------------------------------------------------------------------
// initAddressCopy — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initAddressCopy = () => {
  const copyTarget = document.querySelector('[data-copy-address]');
  if (!copyTarget) {
    return;
  }

  // Prefer data-copy-text attribute over innerText (handles whitespace noise).
  const rawText = copyTarget.dataset.copyText || copyTarget.textContent || '';
  const copyText = rawText.replace(/\s+/g, ' ').trim();

  // Textarea-based execCommand fallback for older browsers / non-HTTPS contexts.
  const fallbackCopy = (value) => {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch {
      copied = false;
    }

    document.body.removeChild(textarea);
    return copied;
  };

  // Brief CSS animation to confirm the copy action.
  const runCopyAnimation = () => {
    copyTarget.classList.add('is-copied');
    window.setTimeout(() => {
      copyTarget.classList.remove('is-copied');
    }, 700);
  };

  const handleCopy = async () => {
    if (!copyText) {
      showEnquiryToast('Address unavailable. Please copy manually.', {
        isError: true,
        duration: 2400
      });
      return;
    }

    let copied = false;

    // Prefer the async Clipboard API when available in a secure context (HTTPS).
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(copyText);
        copied = true;
      } catch {
        copied = false;
      }
    }

    // Fall back to the textarea trick if Clipboard API failed or is unavailable.
    if (!copied) {
      copied = fallbackCopy(copyText);
    }

    runCopyAnimation();
    showEnquiryToast(
      copied ? 'Address copied' : 'Unable to copy. Please copy manually.',
      { isError: !copied, duration: copied ? 1800 : 2400 }
    );
  };

  copyTarget.addEventListener('click', (event) => {
    event.preventDefault();
    handleCopy();
  });
};
