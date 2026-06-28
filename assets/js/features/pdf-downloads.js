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
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 48;
    const maxWidth = pageWidth - (marginX * 2);
    
    // --- BRAND COLORS ---
    const brandNavy = [11, 42, 91];     // #0b2a5b
    const brandYellow = [252, 203, 6];  // #fccb06
    const brandText = [33, 37, 41];     // #212529
    const brandMuted = [108, 117, 125]; // #6c757d
    const brandHighlightBg = [255, 250, 230]; // Light yellow tint
    const brandHighlightBorder = [252, 203, 6];

    let cursorY = 0;

    // --- 1. HEADER BANNER ---
    doc.setFillColor(...brandNavy);
    doc.rect(0, 0, pageWidth, 110, 'F');
    
    // Title
    cursorY = 48;
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(template.title, marginX, cursorY);
    
    // Subtitle in Yellow
    cursorY += 26;
    doc.setTextColor(...brandYellow);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(template.subtitle, marginX, cursorY);

    // --- 2. META INFO ---
    cursorY = 140;
    if (Array.isArray(template.meta)) {
      doc.setTextColor(...brandMuted);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      template.meta.forEach((line) => {
        doc.text(line, marginX, cursorY);
        cursorY += 18;
      });
    }

    // Interactive Links
    if (template.whatsapp || template.website) {
      cursorY += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      
      let linkX = marginX;
      
      if (template.whatsapp) {
        doc.setTextColor(37, 211, 102); // WhatsApp Green
        const waText = `WhatsApp: +91 ${template.whatsapp}`;
        doc.textWithLink(waText, linkX, cursorY, { url: `https://wa.me/91${template.whatsapp}` });
        linkX += doc.getTextWidth(waText) + 20;
      }
      
      if (template.website) {
        doc.setTextColor(...brandNavy);
        const webText = `Website: ${template.website}`;
        doc.textWithLink(webText, linkX, cursorY, { url: `https://${template.website}` });
      }
      cursorY += 20;
    }

    // Divider
    cursorY += 10;
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(1);
    doc.line(marginX, cursorY, marginX + maxWidth, cursorY);
    cursorY += 25;

    // --- 3. SECTIONS ---
    if (Array.isArray(template.sections)) {
      template.sections.forEach((section) => {
        // Prevent page overflow
        if (cursorY > pageHeight - 140) {
          doc.addPage();
          cursorY = 50;
        }

        if (section.isHighlight) {
          // Calculate precise box height
          let boxHeight = 50; // padding top + title space
          section.items.forEach((item) => {
            const wrapped = doc.splitTextToSize(item, maxWidth - 40);
            boxHeight += (18 * wrapped.length) + 8; // 18 line-height + 8 paragraph spacing
          });
          boxHeight += 10; // padding bottom

          // Draw Highlight Box
          doc.setFillColor(...brandHighlightBg);
          doc.setDrawColor(...brandHighlightBorder);
          doc.setLineWidth(1.5);
          doc.rect(marginX, cursorY, maxWidth, boxHeight, 'FD'); // Fill and Draw
          
          cursorY += 28; // Padding Top
          doc.setTextColor(...brandNavy);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(13);
          doc.text(section.title, marginX + 15, cursorY);
          
          cursorY += 20;
          doc.setTextColor(...brandText);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          
          section.items.forEach((item) => {
            const wrapped = doc.splitTextToSize(item, maxWidth - 40);
            doc.text('•', marginX + 15, cursorY);
            wrapped.forEach((line) => {
              doc.text(line, marginX + 25, cursorY);
              cursorY += 18; // Line height
            });
            cursorY += 8; // Paragraph spacing
          });
          cursorY += 25; // Space after box
        } else {
          // Standard Section
          doc.setTextColor(...brandNavy);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text(section.title, marginX, cursorY);
          
          cursorY += 22;
          doc.setTextColor(...brandText);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);
          
          section.items.forEach((item) => {
            const wrapped = doc.splitTextToSize(item, maxWidth - 25);
            // Draw custom styled bullet point
            doc.setFillColor(...brandYellow);
            doc.circle(marginX + 4, cursorY - 4, 3, 'F');
            
            wrapped.forEach((line) => {
              doc.text(line, marginX + 18, cursorY);
              cursorY += 18; // Line height
            });
            cursorY += 8; // Paragraph spacing
          });
          cursorY += 15; // Space after section
        }
      });
    }

    // --- 4. FOOTER ---
    // Push footer to bottom if there's space, else just put it after a gap
    if (cursorY < pageHeight - 60) {
      cursorY = pageHeight - 60;
    } else {
      cursorY += 20;
    }
    
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(1);
    doc.line(marginX, cursorY, marginX + maxWidth, cursorY);
    
    cursorY += 15;
    doc.setTextColor(...brandMuted);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    if (Array.isArray(template.footerLines)) {
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
