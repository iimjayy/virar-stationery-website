// js/features/quote-calculator.js
// Self-contained Quote Calculator feature module.
// Owns pricing calculation, option sync, WhatsApp link construction, and all form listeners.
// Dependencies: CONFIG, pricingConfig, addonRates (business-data), normalizePhoneNumber (helpers)

import { CONFIG } from '../config.js';
import { pricingConfig, addonRates } from '../data/business-data.js';
import { normalizePhoneNumber, resolveBusinessWhatsAppNumber, buildOrderMessage } from '../utils/helpers.js';

const PDF_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const MAX_PDF_SIZE_BYTES = 25 * 1024 * 1024;

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 KB';
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / 1024).toFixed(1)} KB`;
};

const readFileAsArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read the selected PDF.'));
    reader.readAsArrayBuffer(file);
  });

// ---------------------------------------------------------------------------
// initQuoteCalculator — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initQuoteCalculator = () => {
  const quoteForm = document.getElementById('quoteCalculator');
  if (!quoteForm) {
    return;
  }

  const serviceSelect = quoteForm.querySelector('#quoteService');
  const sizeSelect = quoteForm.querySelector('#quoteSize');
  const colorSelect = quoteForm.querySelector('#quoteColor');
  const quantityInput = quoteForm.querySelector('#quoteQty');
  const laminationAddon = quoteForm.querySelector('#quoteAddonLamination');
  const bindingAddon = quoteForm.querySelector('#quoteAddonBinding');
  const unitCostEl = document.getElementById('quoteUnitCost');
  const totalCostEl = document.getElementById('quoteTotalCost');
  const summaryLine = document.getElementById('quoteSummaryLine');
  const whatsappBtn = document.getElementById('quoteWhatsAppBtn');
  const pdfDropZone = document.getElementById('quotePdfDrop');
  const pdfPreview = document.getElementById('quotePdfPreview');

  if (
    !serviceSelect || !sizeSelect || !colorSelect || !quantityInput ||
    !unitCostEl || !totalCostEl || !summaryLine || !whatsappBtn
  ) {
    return;
  }

  // Resolve phone number once — same pattern as main.js shared references
  const quoteWhatsAppNumber = resolveBusinessWhatsAppNumber();

  const isMobileDevice = /Android|iPhone|iPad|iPod|Windows Phone|webOS|Mobile/i.test(
    navigator.userAgent || ''
  );

  const buildWhatsAppUrl = (message) => {
    const safePhone = normalizePhoneNumber(quoteWhatsAppNumber);
    const encodedMessage = encodeURIComponent(message || '');

    if (isMobileDevice) {
      return `https://wa.me/${safePhone}?text=${encodedMessage}`;
    }

    return `https://api.whatsapp.com/send?phone=${safePhone}&text=${encodedMessage}`;
  };

  const formatCurrency = (value) => {
    if (!Number.isFinite(value)) {
      return '\u2014';
    }

    const formatted = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
    return `Rs ${formatted}`;
  };

  const syncOptions = (service) => {
    const sizes = service.sizes || [];
    const colors = service.colors || [];

    Array.from(sizeSelect.options).forEach((option) => {
      const isAllowed = sizes.includes(option.value) || (option.value === 'A4' && sizes.length === 0);
      option.disabled = !isAllowed;
      option.hidden = !isAllowed;
    });

    if (!sizes.includes(sizeSelect.value)) {
      sizeSelect.value = sizes[0] || 'A4';
    }

    Array.from(colorSelect.options).forEach((option) => {
      const isAllowed = colors.includes(option.value);
      option.disabled = !isAllowed;
      option.hidden = !isAllowed;
    });

    if (!colors.includes(colorSelect.value)) {
      colorSelect.value = colors[0] || 'bw';
    }

    sizeSelect.disabled = sizes.length <= 1;
    colorSelect.disabled = colors.length <= 1;

    const allowLamination = service.addons.includes('lamination');
    const allowBinding = service.addons.includes('binding');

    laminationAddon.disabled = !allowLamination;
    bindingAddon.disabled = !allowBinding;

    if (!allowLamination) {
      laminationAddon.checked = false;
    }

    if (!allowBinding) {
      bindingAddon.checked = false;
    }
  };

  const calculateQuote = () => {
    const serviceKey = serviceSelect.value;
    const service = pricingConfig[serviceKey];

    if (!service) {
      unitCostEl.textContent = '\u2014';
      totalCostEl.textContent = '\u2014';
      summaryLine.textContent = 'Select a service to calculate pricing.';
      whatsappBtn.href = buildWhatsAppUrl(CONFIG.messages.quoteDefault);
      const grid = unitCostEl.closest('.quote-summary-grid');
      if (grid) grid.classList.add('is-empty');
      return;
    }

    // Remove empty state when a real service is selected
    const grid = unitCostEl.closest('.quote-summary-grid');
    if (grid) grid.classList.remove('is-empty');

    syncOptions(service);

    const size = sizeSelect.value;
    const color = colorSelect.value;
    const quantity = Math.max(1, Number(quantityInput.value || 1));
    if (quantityInput.value !== String(quantity)) {
      quantityInput.value = quantity;
    }
    const baseRate = service.rates?.[size]?.[color] ?? service.rates?.[size]?.bw ?? 0;

    const laminationRate = laminationAddon.checked
      ? (addonRates.lamination[size] || addonRates.lamination.A4)
      : 0;
    const bindingRate = bindingAddon.checked ? addonRates.binding : 0;

    const perUnit = baseRate + laminationRate + bindingRate;
    const total = perUnit * quantity;

    unitCostEl.textContent = formatCurrency(perUnit);
    totalCostEl.textContent = formatCurrency(total);

    const detailLine = `${service.label} | ${size} | ${color === 'bw' ? 'B&W' : 'Color'} | Qty ${quantity}`;
    summaryLine.textContent = detailLine;

    const addons = [];
    if (laminationAddon.checked) addons.push('Lamination');
    if (bindingAddon.checked) addons.push('Spiral Binding');

    const message = buildOrderMessage({
      service: service.label,
      size,
      type: color === 'bw' ? 'Black & White' : 'Color',
      qty: quantity,
      addons,
      total: formatCurrency(total),
      source: 'Quote Calculator'
    });

    whatsappBtn.href = buildWhatsAppUrl(message);
  };

  // ---- Event wiring ----
  serviceSelect.addEventListener('change', calculateQuote);
  sizeSelect.addEventListener('change', calculateQuote);
  colorSelect.addEventListener('change', calculateQuote);
  quantityInput.addEventListener('input', calculateQuote);
  laminationAddon.addEventListener('change', calculateQuote);
  bindingAddon.addEventListener('change', calculateQuote);

  const initPdfPageCounter = () => {
    if (!pdfDropZone || !pdfPreview) {
      return;
    }

    if (typeof window.pdfjsLib === 'undefined') {
      pdfDropZone.classList.add('is-disabled');
      pdfPreview.innerHTML = '<p class="pdf-status-message is-error">PDF page counting is unavailable right now.</p>';
      return;
    }

    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf';
    fileInput.hidden = true;
    pdfDropZone.insertAdjacentElement('afterend', fileInput);

    const setPdfStatus = (message, type = 'info') => {
      pdfPreview.innerHTML = `<p class="pdf-status-message is-${type}">${message}</p>`;
    };

    const setLoading = (isLoading) => {
      pdfDropZone.classList.toggle('is-loading', isLoading);
      pdfDropZone.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    };

    const parsePdfFile = async (file) => {
      if (!file) {
        return;
      }

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        setPdfStatus('Please choose a valid PDF file.', 'error');
        return;
      }

      if (file.size > MAX_PDF_SIZE_BYTES) {
        setPdfStatus(`PDF is ${formatFileSize(file.size)}. Please upload a file below 25 MB.`, 'error');
        return;
      }

      setLoading(true);
      setPdfStatus('Reading PDF pages...', 'info');

      try {
        const arrayBuffer = await readFileAsArrayBuffer(file);
        const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pageCount = pdf.numPages;

        quantityInput.value = String(pageCount);
        quantityInput.dispatchEvent(new Event('input', { bubbles: true }));

        pdfDropZone.classList.add('has-file');
        setPdfStatus(`✅ ${pageCount} page${pageCount === 1 ? '' : 's'} detected`, 'success');
      } catch (error) {
        console.error('[quote-calculator] PDF page counting failed:', error);
        setPdfStatus('Could not read this PDF. Try another file or enter pages manually.', 'error');
      } finally {
        setLoading(false);
      }
    };

    pdfDropZone.addEventListener('click', () => fileInput.click());
    pdfDropZone.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', () => {
      parsePdfFile(fileInput.files?.[0]);
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      pdfDropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        pdfDropZone.classList.add('is-active');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      pdfDropZone.addEventListener(eventName, (event) => {
        event.preventDefault();
        pdfDropZone.classList.remove('is-active');
      });
    });

    pdfDropZone.addEventListener('drop', (event) => {
      parsePdfFile(event.dataTransfer?.files?.[0]);
    });
  };

  // Run once on init to populate the UI
  calculateQuote();
  initPdfPageCounter();
};
