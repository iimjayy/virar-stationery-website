// js/features/pdf-parser.js
// Self-contained PDF Parser feature module.
// Integrates with Mozilla's pdf.js (loaded via CDN <script> tag) to enable
// client-side PDF page counting and thumbnail preview in the quote calculator.
// Dependencies: showEnquiryToast (toast.js), window.pdfjsLib (CDN)
'use strict';

import { showEnquiryToast } from '../core/toast.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** @type {string} pdf.js Web Worker CDN URL (v3.11.174) */
const PDF_WORKER_SRC =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/** @type {number} Maximum allowed file size in bytes (25 MB) */
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

/** @type {number} Thumbnail render scale (fraction of full page size) */
const THUMBNAIL_SCALE = 0.3;

// ---------------------------------------------------------------------------
// Helper — formatFileSize
// ---------------------------------------------------------------------------

/**
 * Convert a byte count into a human-readable string (KB or MB).
 * @param {number} bytes — raw file size in bytes
 * @returns {string} Formatted size string, e.g. "1.4 MB" or "320 KB"
 */
const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 KB';
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
};

// ---------------------------------------------------------------------------
// Helper — renderPdfThumbnail
// ---------------------------------------------------------------------------

/**
 * Render the first page of a parsed PDF document to an off-screen canvas and
 * return the result as a data-URL (PNG).
 * @param {Object} pdf — resolved pdf.js document proxy (`PDFDocumentProxy`)
 * @param {number} [scale=0.3] — render scale relative to the page's natural size
 * @returns {Promise<string>} Base-64 PNG data URL of the rendered thumbnail
 */
const renderPdfThumbnail = async (pdf, scale = THUMBNAIL_SCALE) => {
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;

  return canvas.toDataURL('image/png');
};

// ---------------------------------------------------------------------------
// initPdfParser — public entry point called by main.js
// ---------------------------------------------------------------------------

/**
 * Initialise the PDF drag-and-drop parser tied to the quote calculator.
 *
 * Looks for `#quotePdfDrop` in the DOM; if absent the feature silently
 * no-ops (null-guard pattern consistent with all other feature modules).
 *
 * When a PDF is dropped or selected:
 * 1. Validates MIME type and file size.
 * 2. Parses the PDF with pdf.js to extract the page count.
 * 3. Renders a thumbnail of page 1.
 * 4. Auto-fills `#quoteQty` and dispatches an `input` event for recalculation.
 * 5. Displays a preview card in `#quotePdfPreview`.
 */
export const initPdfParser = () => {
  // --- Guard: required DOM element ---
  const dropZone = document.getElementById('quotePdfDrop');
  if (!dropZone) {
    return;
  }

  // --- Guard: pdf.js library availability ---
  if (typeof window.pdfjsLib === 'undefined') {
    console.warn(
      '[pdf-parser] window.pdfjsLib is not available. ' +
      'Ensure the pdf.js CDN script is loaded before this module.'
    );
    dropZone.classList.add('is-disabled');
    dropZone.setAttribute('title', 'PDF parsing unavailable — library not loaded');
    return;
  }

  // Configure the pdf.js web-worker
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

  const previewContainer = document.getElementById('quotePdfPreview');
  const quantityInput = document.getElementById('quoteQty');

  // -----------------------------------------------------------------------
  // Internal state
  // -----------------------------------------------------------------------

  /** @type {boolean} Prevents duplicate processing while a file is loading */
  let isProcessing = false;

  // -----------------------------------------------------------------------
  // UI helpers
  // -----------------------------------------------------------------------

  /**
   * Apply or remove the visual loading state on the drop zone.
   * @param {boolean} loading — whether to show the loading indicator
   */
  const setLoadingState = (loading) => {
    dropZone.classList.toggle('is-loading', loading);
    isProcessing = loading;
  };

  /**
   * Build and render the PDF preview card inside `#quotePdfPreview`.
   * @param {{ thumbnailUrl: string, fileName: string, pageCount: number, fileSize: number }} info
   */
  const renderPreviewCard = ({ thumbnailUrl, fileName, pageCount, fileSize }) => {
    if (!previewContainer) {
      return;
    }

    previewContainer.innerHTML = '';

    // --- Card wrapper ---
    const card = document.createElement('div');
    card.className = 'pdf-preview-card';

    // --- Thumbnail ---
    const img = document.createElement('img');
    img.src = thumbnailUrl;
    img.alt = `Preview of ${fileName}`;
    img.className = 'pdf-preview-card__thumb';
    card.appendChild(img);

    // --- Info block ---
    const info = document.createElement('div');
    info.className = 'pdf-preview-card__info';

    const nameEl = document.createElement('p');
    nameEl.className = 'pdf-preview-card__name';
    nameEl.textContent = fileName;
    info.appendChild(nameEl);

    const metaEl = document.createElement('p');
    metaEl.className = 'pdf-preview-card__meta';
    metaEl.textContent = `${pageCount} page${pageCount !== 1 ? 's' : ''} · ${formatFileSize(fileSize)}`;
    info.appendChild(metaEl);

    card.appendChild(info);

    // --- Clear button ---
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'pdf-preview-card__clear';
    clearBtn.setAttribute('aria-label', 'Remove PDF');
    clearBtn.textContent = '✕';
    clearBtn.addEventListener('click', resetPdf);
    card.appendChild(clearBtn);

    previewContainer.appendChild(card);
    previewContainer.classList.add('is-visible');
  };

  /**
   * Clear the current PDF selection — reset preview, drop zone, and quantity.
   */
  const resetPdf = () => {
    if (previewContainer) {
      previewContainer.innerHTML = '';
      previewContainer.classList.remove('is-visible');
    }

    dropZone.classList.remove('is-loading', 'is-active', 'has-file');

    if (quantityInput) {
      quantityInput.value = '1';
      quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    showEnquiryToast('PDF removed.', { duration: 1400 });
  };

  // -----------------------------------------------------------------------
  // Core processing
  // -----------------------------------------------------------------------

  /**
   * Process a user-selected or dropped PDF file.
   * Validates, parses, extracts page count, renders thumbnail, and
   * updates the quote calculator quantity field.
   * @param {File} file — the PDF File object from the browser
   */
  const processPdfFile = async (file) => {
    // --- Validate MIME type ---
    if (file.type !== 'application/pdf') {
      showEnquiryToast('Please upload a valid PDF file.', { isError: true });
      return;
    }

    // --- Validate file size ---
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showEnquiryToast(
        `File too large (${formatFileSize(file.size)}). Maximum is 25 MB.`,
        { isError: true }
      );
      return;
    }

    if (isProcessing) {
      return;
    }

    setLoadingState(true);

    try {
      // Read file into ArrayBuffer
      const arrayBuffer = await readFileAsArrayBuffer(file);

      // Parse with pdf.js
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const pageCount = pdf.numPages;

      // Render first-page thumbnail
      const thumbnailUrl = await renderPdfThumbnail(pdf, THUMBNAIL_SCALE);

      // Auto-set quantity
      if (quantityInput) {
        quantityInput.value = String(pageCount);
        quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Show preview card
      renderPreviewCard({
        thumbnailUrl,
        fileName: file.name,
        pageCount,
        fileSize: file.size
      });

      dropZone.classList.add('has-file');

      showEnquiryToast(
        `PDF loaded — ${pageCount} page${pageCount !== 1 ? 's' : ''} detected.`,
        { duration: 2200 }
      );
    } catch (error) {
      handlePdfError(error);
    } finally {
      setLoadingState(false);
    }
  };

  /**
   * Read a File object as an ArrayBuffer.
   * @param {File} file
   * @returns {Promise<ArrayBuffer>}
   */
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read the file.'));
      reader.readAsArrayBuffer(file);
    });
  };

  /**
   * Translate pdf.js and file-reading errors into user-friendly toasts.
   * @param {Error} error
   */
  const handlePdfError = (error) => {
    const message = error?.message || '';

    if (message.includes('password')) {
      showEnquiryToast(
        'This PDF is password-protected and cannot be parsed.',
        { isError: true, duration: 3000 }
      );
    } else if (message.includes('Invalid PDF') || message.includes('Invalid or corrupted')) {
      showEnquiryToast(
        'The file appears to be corrupted or is not a valid PDF.',
        { isError: true, duration: 3000 }
      );
    } else {
      showEnquiryToast(
        'Unable to process this PDF. Please try another file.',
        { isError: true, duration: 3000 }
      );
    }

    console.error('[pdf-parser] PDF processing error:', error);
  };

  // -----------------------------------------------------------------------
  // Drag-and-drop event handlers
  // -----------------------------------------------------------------------

  /**
   * Prevent default browser behaviour and add the active visual cue.
   * @param {DragEvent} event
   */
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropZone.classList.add('is-active');
  };

  /**
   * Remove the active visual cue when the drag leaves the zone.
   * @param {DragEvent} event
   */
  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropZone.classList.remove('is-active');
  };

  /**
   * Handle the file drop — extract the first file and process it.
   * @param {DragEvent} event
   */
  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropZone.classList.remove('is-active');

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      processPdfFile(file);
    }
  };

  // -----------------------------------------------------------------------
  // Click-to-browse handler
  // -----------------------------------------------------------------------

  /**
   * Open a hidden file input when the drop zone is clicked,
   * allowing users to browse for a PDF.
   */
  const handleClick = () => {
    if (isProcessing) {
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (file) {
        processPdfFile(file);
      }
      fileInput.remove();
    });

    document.body.appendChild(fileInput);
    fileInput.click();
  };

  // -----------------------------------------------------------------------
  // Wire events
  // -----------------------------------------------------------------------

  dropZone.addEventListener('dragover', handleDragOver);
  dropZone.addEventListener('dragleave', handleDragLeave);
  dropZone.addEventListener('drop', handleDrop);
  dropZone.addEventListener('click', handleClick);
};
