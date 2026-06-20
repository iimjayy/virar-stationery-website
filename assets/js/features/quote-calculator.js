// js/features/quote-calculator.js
// Self-contained Quote Calculator feature module.
// Owns pricing calculation, option sync, WhatsApp link construction, and all form listeners.
// Dependencies: CONFIG, pricingConfig, addonRates (business-data), normalizePhoneNumber (helpers)

import { CONFIG } from '../config.js';
import { pricingConfig, addonRates } from '../data/business-data.js';
import { normalizePhoneNumber, resolveBusinessWhatsAppNumber } from '../utils/helpers.js';

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

    const message = [
      'Instant Quote Request',
      `Service: ${service.label}`,
      `Size: ${size}`,
      `Type: ${color === 'bw' ? 'Black & White' : 'Color'}`,
      `Quantity: ${quantity}`,
      laminationAddon.checked ? 'Add-on: Lamination' : null,
      bindingAddon.checked ? 'Add-on: Spiral Binding' : null,
      `Estimated Total: ${formatCurrency(total)}`
    ].filter(Boolean).join('\n');

    whatsappBtn.href = buildWhatsAppUrl(message);
  };

  // ---- Event wiring ----
  serviceSelect.addEventListener('change', calculateQuote);
  sizeSelect.addEventListener('change', calculateQuote);
  colorSelect.addEventListener('change', calculateQuote);
  quantityInput.addEventListener('input', calculateQuote);
  laminationAddon.addEventListener('change', calculateQuote);
  bindingAddon.addEventListener('change', calculateQuote);

  // Run once on init to populate the UI
  calculateQuote();
};
