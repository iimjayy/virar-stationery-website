// js/features/pdf-downloads.js
// Self-contained PDF Download feature module.
// Owns: lazy CDN loading of jsPDF, PDF document construction, button loading states,
// and async error handling with user-facing toasts.
//
// ASYNC SAFETY NOTES:
// - jsPDF is NOT bundled — it is loaded on-demand from jsDelivr CDN on first click.
// - A singleton Promise (jsPdfPromise) ensures the CDN script is only injected once
//   even if multiple buttons are clicked rapidly.
// - window.jspdf is checked first to avoid re-injection if jsPDF was already loaded
//   by another script on the page.
//
// Dependencies: pdfTemplates (business-data.js), showEnquiryToast (toast.js)

import { pdfTemplates } from '../data/business-data.js';
import { showEnquiryToast } from '../core/toast.js';

// ---------------------------------------------------------------------------
// initPdfDownloads — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initPdfDownloads = () => {
  const downloadButtons = Array.from(document.querySelectorAll('.pdf-download-btn'));
  if (!downloadButtons.length) {
    return;
  }

  // Singleton promise — only one CDN script injection, regardless of click count.
  let jsPdfPromise = null;

  // Lazy-load jsPDF from CDN only when the first download is triggered.
  const loadJsPdf = () => {
    // Already loaded by a previous click or by the page host.
    if (window.jspdf?.jsPDF) {
      return Promise.resolve(window.jspdf);
    }

    // Return existing in-flight promise to deduplicate concurrent requests.
    if (jsPdfPromise) {
      return jsPdfPromise;
    }

    jsPdfPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      script.async = true;
      script.onload = () => resolve(window.jspdf);
      script.onerror = () => reject(new Error('jsPDF failed to load from CDN'));
      document.head.appendChild(script);
    });

    return jsPdfPromise;
  };

  // Toggle button loading state — preserves the original button HTML for restoration.
  const setButtonLoading = (button, isLoading) => {
    button.classList.toggle('is-loading', isLoading);
    button.disabled = isLoading;
  };

  // Build and trigger a PDF download from a template object.
  // Template shape: { title, subtitle, meta[], sections[]|lines[], footerLines[], filename }
  const buildPdf = (template) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = 48;
    let cursorY = 64;
    const maxWidth = 520;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(template.title, marginX, cursorY);

    // Subtitle
    cursorY += 24;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(template.subtitle, marginX, cursorY);

    // Meta lines (e.g. date, address)
    if (Array.isArray(template.meta)) {
      cursorY += 18;
      doc.setFontSize(10);
      doc.setTextColor(90);
      template.meta.forEach((line) => {
        doc.text(line, marginX, cursorY);
        cursorY += 14;
      });
    }

    // Divider rule
    cursorY += 12;
    doc.setDrawColor(230);
    doc.line(marginX, cursorY, marginX + maxWidth, cursorY);
    cursorY += 18;

    doc.setTextColor(20);
    doc.setFontSize(11);

    // Sectioned content or flat line list
    if (Array.isArray(template.sections)) {
      template.sections.forEach((section) => {
        doc.setFont('helvetica', 'bold');
        doc.text(section.title, marginX, cursorY);
        cursorY += 16;

        doc.setFont('helvetica', 'normal');
        (section.items || []).forEach((item) => {
          const wrapped = doc.splitTextToSize(`- ${item}`, maxWidth);
          doc.text(wrapped, marginX, cursorY);
          cursorY += 14 * wrapped.length;
        });

        cursorY += 8;
      });
    } else {
      (template.lines || []).forEach((line) => {
        doc.text(line, marginX, cursorY);
        cursorY += 18;
      });
    }

    // Footer lines (small grey text)
    if (Array.isArray(template.footerLines)) {
      cursorY += 6;
      doc.setTextColor(90);
      doc.setFontSize(9);
      template.footerLines.forEach((line) => {
        const wrapped = doc.splitTextToSize(line, maxWidth);
        doc.text(wrapped, marginX, cursorY);
        cursorY += 12 * wrapped.length;
      });
    }

    doc.save(template.filename);
  };

  // Wire each download button.
  downloadButtons.forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();

      const template = pdfTemplates[button.dataset.pdfType];
      if (!template) {
        return;
      }

      setButtonLoading(button, true);
      showEnquiryToast('Preparing your PDF download...', { duration: 1600 });

      try {
        await loadJsPdf();
        buildPdf(template);
        showEnquiryToast('Download started.', { duration: 1800 });
      } catch {
        showEnquiryToast('Unable to download now. Please try again.', {
          isError: true,
          duration: 2400
        });
      } finally {
        // Brief delay before re-enabling — gives the user visual feedback.
        window.setTimeout(() => {
          setButtonLoading(button, false);
        }, 300);
      }
    });
  });
};
