// js/features/bulk-enquiry.js
// Self-contained Bulk Enquiry Form feature module.
// Owns: all form state, file upload lifecycle (click/drag-drop/DataTransfer),
// file preview rendering, Web Share API bridge, field validation, WhatsApp/email
// enquiry channel orchestration, and form reset on success.
//
// HIGH-RISK NOTES (preserved from original):
// - DataTransfer API is used to sync the hidden <input type="file"> after a drag-drop.
//   This is guarded with typeof DataTransfer check for older Android browsers.
// - Web Share API (navigator.share) is attempted first for file sharing on mobile.
//   Falls back to direct WhatsApp link open if share fails or is unsupported.
// - URL.createObjectURL is used for image previews; URL.revokeObjectURL is called
//   on clearFilePreview to prevent memory leaks.
// - openEnquiryChannel handles the mobile WhatsApp-direct / desktop popup / email
//   fallback chain — it is imported from helpers.js (promoted in Phase 5).
//
// Dependencies:
//   CONFIG                     — upload limits, messages
//   buildWhatsAppUrl           — device-aware WA URL builder
//   buildMailtoUrl             — mailto URL builder
//   resolveBusinessWhatsAppNumber — reads WA number from page links
//   resolveBusinessEmail       — reads email from page mailto links
//   openEnquiryChannel         — WA + email fallback channel opener
//   showEnquiryToast           — user-facing toast notifications

import { CONFIG } from '../config.js';
import {
  buildWhatsAppUrl,
  buildMailtoUrl,
  resolveBusinessWhatsAppNumber,
  resolveBusinessEmail,
  openEnquiryChannel
} from '../utils/helpers.js';
import { showEnquiryToast } from '../core/toast.js';
import { captureLead } from '../core/firebase.js';

// ---------------------------------------------------------------------------
// initBulkEnquiry — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initBulkEnquiry = () => {
  const bulkForm = document.getElementById('bulkEnquiryForm');
  if (!bulkForm) {
    return;
  }

  // Resolve business contact details once at boot from page DOM links.
  const businessWhatsAppNumber = resolveBusinessWhatsAppNumber();
  const businessEmail = resolveBusinessEmail();
  const bulkSubject = CONFIG.messages.bulkSubject;

  // DOM references — all scoped to the form to avoid polluting global selectors.
  const submitButton  = bulkForm.querySelector('.bulk-submit-btn');
  const statusLabel   = bulkForm.querySelector('#bulkFormStatus');
  const uploadZone    = bulkForm.querySelector('#bulkUpload');
  const fileInput     = bulkForm.querySelector('#bulkFile');
  const filePreview   = bulkForm.querySelector('#bulkFilePreview');
  const shareButton   = bulkForm.querySelector('#bulkShareBtn');
  const browseButton  = uploadZone?.querySelector('button');

  const requiredFields = [
    bulkForm.querySelector('#bulkName'),
    bulkForm.querySelector('#bulkBusiness'),
    bulkForm.querySelector('#bulkPhone'),
    bulkForm.querySelector('#bulkService'),
    bulkForm.querySelector('#bulkQuantity'),
    bulkForm.querySelector('#bulkDescription')
  ].filter(Boolean);

  // ---- Upload state ----
  let selectedFile = null;
  let previewUrl = null;

  // ---- Status helpers ----

  const setStatus = (message, options = {}) => {
    if (!statusLabel) {
      return;
    }

    statusLabel.textContent = message;
    statusLabel.classList.toggle('is-error', options.isError === true);
  };

  const setSubmitLoading = (isLoading) => {
    if (!submitButton) {
      return;
    }

    if (!submitButton.dataset.originalHtml) {
      submitButton.dataset.originalHtml = submitButton.innerHTML;
    }

    submitButton.disabled = isLoading;
    submitButton.classList.toggle('is-loading', isLoading);
    submitButton.setAttribute('aria-busy', isLoading ? 'true' : 'false');

    submitButton.innerHTML = isLoading
      ? '<span class="btn-spinner" aria-hidden="true"></span><span>Sending...</span>'
      : submitButton.dataset.originalHtml;
  };

  // ---- File helpers ----

  const formatFileSize = (size) => {
    if (!size || Number.isNaN(size)) {
      return '';
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Render a file preview card inside #bulkFilePreview.
  const renderFilePreview = () => {
    if (!filePreview) {
      return;
    }

    filePreview.innerHTML = '';

    if (!selectedFile) {
      return;
    }

    const isImage = selectedFile.type.startsWith('image/');
    const fileCard = document.createElement('div');
    fileCard.className = 'bulk-file-card';

    const thumb = document.createElement('div');
    thumb.className = 'bulk-file-thumb';

    if (isImage) {
      // Create an object URL for inline image preview — revoked on clear.
      previewUrl = URL.createObjectURL(selectedFile);
      const img = document.createElement('img');
      img.src = previewUrl;
      img.alt = 'Uploaded preview';
      thumb.appendChild(img);
    } else {
      thumb.innerHTML = '<i class="fa-solid fa-file-lines" aria-hidden="true"></i>';
    }

    const info = document.createElement('div');
    info.className = 'bulk-file-info';
    info.innerHTML = `
      <h4>${selectedFile.name}</h4>
      <p>${formatFileSize(selectedFile.size)} file ready for review</p>
    `;

    fileCard.appendChild(thumb);
    fileCard.appendChild(info);
    filePreview.appendChild(fileCard);

    if (shareButton) {
      shareButton.disabled = false;
    }
  };

  // Clear file state, revoke object URL to prevent memory leaks.
  const clearFilePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }

    selectedFile = null;

    if (fileInput) {
      fileInput.value = '';
    }

    if (filePreview) {
      filePreview.innerHTML = '';
    }

    if (shareButton) {
      shareButton.disabled = true;
    }
  };

  // Validate file size and MIME type against CONFIG limits.
  const validateFile = (file) => {
    if (!file) {
      return true;
    }

    if (file.size > CONFIG.upload.maxFileSizeBytes) {
      setStatus('File too large. Please upload files under 10MB.', { isError: true });
      return false;
    }

    if (file.type && !CONFIG.upload.allowedTypes.includes(file.type)) {
      setStatus('Unsupported file type. Upload PDF, DOC, or JPG files.', { isError: true });
      return false;
    }

    return true;
  };

  const handleFileSelection = (file) => {
    clearFilePreview();

    if (!file) {
      return;
    }

    if (!validateFile(file)) {
      return;
    }

    selectedFile = file;
    renderFilePreview();
    setStatus('File attached. We will review it shortly.', { isError: false });
  };

  // ---- Upload zone event wiring ----

  if (uploadZone && fileInput) {
    // Click on zone opens the native file picker.
    uploadZone.addEventListener('click', () => {
      fileInput.click();
    });

    // Separate click on the Browse button — prevent event from bubbling to zone.
    if (browseButton) {
      browseButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        fileInput.click();
      });
    }

    // Native file picker selection.
    fileInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0];
      handleFileSelection(file);
    });

    // Drag-over: show drop-target highlight.
    uploadZone.addEventListener('dragover', (event) => {
      event.preventDefault();
      uploadZone.classList.add('is-dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('is-dragover');
    });

    // Drop: sync the file into the <input> via DataTransfer (if available),
    // then process the file normally.
    uploadZone.addEventListener('drop', (event) => {
      event.preventDefault();
      uploadZone.classList.remove('is-dragover');

      const file = event.dataTransfer?.files?.[0];
      if (!file) {
        return;
      }

      // Sync dropped file into the hidden file input so form submission can
      // access it. DataTransfer is guarded for older browsers.
      if (fileInput && typeof DataTransfer !== 'undefined') {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
      }

      handleFileSelection(file);
    });
  }

  // ---- Share button ----
  // Attempts native Web Share API with file attachment on supported devices.
  // Falls back to WhatsApp link with a text prompt to attach manually.

  if (shareButton) {
    shareButton.addEventListener('click', async () => {
      if (!selectedFile) {
        setStatus('Please select a file to share first.', { isError: true });
        return;
      }

      const shareMessage = `Bulk enquiry file: ${selectedFile.name}`;

      if (navigator.share && navigator.canShare?.({ files: [selectedFile] })) {
        try {
          await navigator.share({
            files: [selectedFile],
            title: 'Virar Stationery Bulk Enquiry',
            text: shareMessage
          });
          setStatus('Share sheet opened. Please choose WhatsApp.', { isError: false });
          return;
        } catch {
          // User cancelled or share failed — fall through to WhatsApp fallback.
        }
      }

      // WhatsApp fallback: open chat with a prompt to attach manually.
      const fallbackMessage = `${shareMessage}. Please confirm the best way to send this file.`;
      const whatsAppUrl = buildWhatsAppUrl(businessWhatsAppNumber, fallbackMessage);
      window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
      setStatus('WhatsApp opened. Attach the file manually if needed.', { isError: false });
    });
  }

  // ---- Validation ----

  const validateRequiredFields = () => {
    let firstInvalidField = null;

    requiredFields.forEach((field) => {
      const rawValue = String(field.value ?? '');
      let hasValue = field.tagName === 'SELECT' ? rawValue !== '' : rawValue.trim() !== '';

      if (field.type === 'number') {
        const numericValue = Number(rawValue);
        hasValue = Number.isFinite(numericValue) && numericValue > 0;
      }

      field.classList.toggle('is-invalid', !hasValue);
      field.setAttribute('aria-invalid', hasValue ? 'false' : 'true');

      if (!hasValue && !firstInvalidField) {
        firstInvalidField = field;
      }
    });

    if (firstInvalidField) {
      firstInvalidField.focus();
      setStatus('Please complete all required fields.', { isError: true });
      showEnquiryToast('Please complete all required fields.', {
        isError: true,
        duration: 2300
      });
      return false;
    }

    return true;
  };

  // Clear error state as the user corrects each field.
  requiredFields.forEach((field) => {
    const clearErrorState = () => {
      const rawValue = String(field.value ?? '');
      let hasValue = field.tagName === 'SELECT' ? rawValue !== '' : rawValue.trim() !== '';

      if (field.type === 'number') {
        const numericValue = Number(rawValue);
        hasValue = Number.isFinite(numericValue) && numericValue > 0;
      }

      if (hasValue) {
        field.classList.remove('is-invalid');
        field.setAttribute('aria-invalid', 'false');
      }
    };

    field.addEventListener('input', clearErrorState);
    field.addEventListener('change', clearErrorState);
  });

  // ---- WhatsApp message builder ----

  const buildBulkMessage = () => {
    const name        = String(bulkForm.querySelector('#bulkName')?.value        ?? '').trim();
    const business    = String(bulkForm.querySelector('#bulkBusiness')?.value    ?? '').trim();
    const phone       = String(bulkForm.querySelector('#bulkPhone')?.value       ?? '').trim();
    const email       = String(bulkForm.querySelector('#bulkEmail')?.value       ?? '').trim();
    const service     = String(bulkForm.querySelector('#bulkService')?.value     ?? '').trim();
    const quantity    = String(bulkForm.querySelector('#bulkQuantity')?.value    ?? '').trim();
    const description = String(bulkForm.querySelector('#bulkDescription')?.value ?? '').trim();

    const fileLine = selectedFile
      ? `File: ${selectedFile.name} (${formatFileSize(selectedFile.size)}) - please confirm best way to share.`
      : 'File: Not attached';

    return [
      'Bulk / Business Enquiry',
      '',
      `Name: ${name}`,
      `Business: ${business}`,
      `Phone: ${phone}`,
      `Email: ${email || 'N/A'}`,
      `Service: ${service}`,
      `Quantity: ${quantity}`,
      `Notes: ${description}`,
      fileLine
    ].join('\n');
  };

  // ---- Form submit ----

  bulkForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!validateRequiredFields()) {
      return;
    }

    setSubmitLoading(true);
    setStatus('Opening WhatsApp for your business enquiry...', { isError: false });

    const enquiryMessage = buildBulkMessage();
    const whatsAppUrl    = buildWhatsAppUrl(businessWhatsAppNumber, enquiryMessage);
    const mailtoUrl      = buildMailtoUrl(businessEmail, bulkSubject, enquiryMessage);

    // Persist the bulk lead to Firestore (best-effort, non-blocking).
    captureLead('bulk', {
      name:        String(document.getElementById('bulkName')?.value ?? '').trim(),
      business:    String(document.getElementById('bulkBusiness')?.value ?? '').trim(),
      phone:       String(document.getElementById('bulkPhone')?.value ?? '').trim(),
      email:       String(document.getElementById('bulkEmail')?.value ?? '').trim(),
      service:     String(document.getElementById('bulkService')?.value ?? '').trim(),
      quantity:    String(document.getElementById('bulkQuantity')?.value ?? '').trim(),
      description: String(document.getElementById('bulkDescription')?.value ?? '').trim(),
    });

    // Brief delay before navigating — gives the loading state time to render.
    window.setTimeout(() => {
      const opened = openEnquiryChannel(whatsAppUrl, mailtoUrl);
      setSubmitLoading(false);

      if (opened) {
        bulkForm.reset();
        clearFilePreview();
        requiredFields.forEach((field) => {
          field.classList.remove('is-invalid');
          field.setAttribute('aria-invalid', 'false');
        });
        setStatus('WhatsApp opened. Please send your enquiry.', { isError: false });
        showEnquiryToast('WhatsApp opened for your bulk enquiry.', { duration: 2200 });
      } else {
        setStatus('WhatsApp unavailable. Opening email fallback...', { isError: true });
        showEnquiryToast('WhatsApp unavailable. Opening email fallback...', {
          isError: true,
          duration: 2800
        });
      }
    }, 450);
  });
};
