// js/features/chat-widget.js
// Interactive AI assistant with local shop knowledge plus Gemini enhancement.

import { CONFIG } from '../config.js';
import { detailedServices, pricingConfig, addonRates } from '../data/business-data.js';
import {
  buildOrderMessage,
  buildWhatsAppUrl,
  normalizeText,
  resolveBusinessWhatsAppNumber
} from '../utils/helpers.js';

const GEMINI_API_KEY = atob('QUl6YVN5QU9LRXJHenRHdnUtNzFGdXBkX0Q0NFVuQ3htdlV3QnFJ');
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
const GEMINI_TIMEOUT_MS = 3500;

const BUSINESS_ADDRESS =
  'Shop No. 11, Takshashila Apartment, opposite Mahavir Hospital, near Old Viva College, Ram Mandir Road, Virar West, Mumbai 401303';

const SYSTEM_PROMPT = `You are the expert AI assistant for Virar Stationery & Jumbo Xerox.
Answer like a helpful shop employee. Keep replies short, concrete, and accurate.
Use these facts:
- Location: ${BUSINESS_ADDRESS}
- Open daily: 8:00 AM to 9:00 PM.
- WhatsApp/phone: ${CONFIG.business.phoneLabel}.
- File order flow: ask customer to send PDF/Word/JPEG/PNG on WhatsApp with quantity, size, color/B&W, finishing, and pickup deadline.
- Prices: B&W print A4 Rs 3, color print A4 Rs 10, xerox A4 Rs 1.5 B&W / Rs 9 color, lamination A4 Rs 10, spiral binding Rs 30, passport photos Rs 30, smart card Rs 80.
- Bulk orders get custom quotes. No home delivery; pickup from shop.
- Language: reply in the customer's style. If they use Hindi-English, Hinglish, or casual local slang, answer naturally in simple Hinglish. Examples: "Haan, file WhatsApp pe bhej do", "Aap pages aur copies bata do", "pickup shop se hoga".
Do not use markdown. If unsure, guide the customer to WhatsApp the owner.`;

const DEFAULT_SUGGESTIONS = [
  { label: 'Print price', value: 'What is the price for B&W and color printing?' },
  { label: 'Send file', value: 'How can I send my file for printing?' },
  { label: 'Bulk order', value: 'Do you offer bulk discount for 200 pages?' },
  { label: 'Directions', value: 'Where is your shop located?' }
];

const SERVICE_ALIASES = [
  { key: 'bw-print', label: 'Black & White Printing', words: ['bw', 'black white', 'black and white', 'b w', 'printout', 'printing'] },
  { key: 'color-print', label: 'Color Printing', words: ['color', 'colour', 'color print', 'colour print', 'photo print'] },
  { key: 'xerox', label: 'Xerox / Photocopy', words: ['xerox', 'photocopy', 'copy'] },
  { key: 'lamination', label: 'Lamination', words: ['lamination', 'laminate'] },
  { key: 'binding', label: 'Spiral Binding', words: ['binding', 'spiral', 'bind'] },
  { key: 'passport', label: 'Passport Photos', words: ['passport', 'photo', 'id photo'] },
  { key: 'smart-card', label: 'Smart Card', words: ['smart card', 'id card', 'card print'] },
  { key: 'jumbo-xerox', label: 'Jumbo Xerox', words: ['jumbo', 'a0', 'a1', 'a2', 'large format', 'plotting'] }
];

const formatCurrency = (amount) => {
  const rounded = Number.isInteger(amount) ? amount : Number(amount.toFixed(2));
  return `₹${rounded}`;
};

const isShopOpen = (date = new Date()) => {
  const hour = date.getHours() + date.getMinutes() / 60;
  return hour >= CONFIG.hours.openHour && hour < CONFIG.hours.closeHour;
};

const getOpenStatusLine = () =>
  isShopOpen()
    ? 'We are open now, until 9:00 PM today.'
    : 'We are closed right now, but you can still send files on WhatsApp. We open at 8:00 AM.';

const includesAny = (text, words) => words.some((word) => text.includes(word));

const isHinglishMessage = (message) => {
  const text = normalizeText(message);
  return includesAny(text, [
    'hai',
    'hain',
    'kya',
    'kitna',
    'kitne',
    'kaise',
    'kaha',
    'kidhar',
    'bhej',
    'bhejna',
    'chahiye',
    'karna',
    'hoga',
    'jaldi',
    'urgent',
    'bhai',
    'sir',
    'aap',
    'mera',
    'mujhe'
  ]);
};

const localizeReply = (message, englishText, hinglishText) =>
  isHinglishMessage(message) ? hinglishText : englishText;

const detectService = (message) => {
  const text = normalizeText(message).replace(/\bcolour\b/g, 'color');
  return SERVICE_ALIASES.find((service) => includesAny(text, service.words)) || null;
};

const extractQuantity = (message) => {
  const normalized = normalizeText(message);
  const pagesMatch = normalized.match(/(\d{1,5})\s*(pages?|copies?|sets?|cards?|sheets?|printouts?)/);
  if (pagesMatch) return Number(pagesMatch[1]);

  const leadingNumber = normalized.match(/\b(\d{1,5})\b/);
  return leadingNumber ? Number(leadingNumber[1]) : null;
};

const detectSize = (message, serviceKey) => {
  const text = normalizeText(message).toUpperCase();
  const service = pricingConfig[serviceKey];
  if (!service) return 'A4';
  return service.sizes.find((size) => text.includes(size.toUpperCase())) || service.sizes[0];
};

const detectColor = (message, serviceKey) => {
  const text = normalizeText(message).replace(/\bcolour\b/g, 'color');
  const service = pricingConfig[serviceKey];
  if (!service) return 'bw';
  if (text.includes('color') && service.colors.includes('color')) return 'color';
  if ((text.includes('black') || text.includes('bw') || text.includes('b w')) && service.colors.includes('bw')) return 'bw';
  return service.colors[0];
};

const estimateFromMessage = (message) => {
  const detected = detectService(message);
  const quantity = extractQuantity(message);
  if (!detected || !quantity || !pricingConfig[detected.key]) return null;

  const service = pricingConfig[detected.key];
  const size = detectSize(message, detected.key);
  const color = detectColor(message, detected.key);
  const baseRate = service.rates?.[size]?.[color] ?? service.rates?.[size]?.bw ?? 0;
  const wantsLamination = /laminat/.test(normalizeText(message));
  const wantsBinding = /binding|spiral|bind/.test(normalizeText(message)) && service.addons?.includes('binding');
  const laminationRate = wantsLamination && service.addons?.includes('lamination')
    ? addonRates.lamination[size] || addonRates.lamination.A4
    : 0;
  const bindingFlatRate = wantsBinding ? addonRates.binding : 0;
  const perUnit = baseRate + laminationRate;
  if (!perUnit) return null;

  return {
    service: service.label,
    size,
    color,
    quantity,
    perUnit,
    bindingFlatRate,
    total: perUnit * quantity + bindingFlatRate,
    addons: [
      ...(laminationRate ? ['Lamination'] : []),
      ...(bindingFlatRate ? ['Spiral Binding'] : [])
    ]
  };
};

const createKnowledgeAnswer = (message) => {
  const text = normalizeText(message).replace(/\bcolour\b/g, 'color');
  const estimate = estimateFromMessage(message);

  if (estimate) {
    const bindingNote = estimate.bindingFlatRate
      ? ` + ${formatCurrency(estimate.bindingFlatRate)} spiral binding`
      : '';
    return {
      text: localizeReply(
        message,
        `${estimate.service} estimate: ${estimate.quantity} ${pricingConfig[detectService(message).key].unit}s x ${formatCurrency(estimate.perUnit)}${bindingNote} = ${formatCurrency(estimate.total)}. Final price is confirmed after checking the file and paper choice.`,
        `${estimate.service} ka approx estimate: ${estimate.quantity} ${pricingConfig[detectService(message).key].unit}s x ${formatCurrency(estimate.perUnit)}${bindingNote} = ${formatCurrency(estimate.total)}. Final price file aur paper dekh ke confirm hoga.`
      ),
      suggestions: [
        { label: 'Send quote', value: 'I want to send this quote on WhatsApp' },
        { label: 'Add binding', value: `${estimate.quantity} ${estimate.size} pages with spiral binding` },
        { label: 'Shop timing', value: 'Are you open now?' }
      ],
      handoff: {
        service: estimate.service,
        size: estimate.size,
        type: estimate.color === 'bw' ? 'Black & White' : 'Color',
        qty: estimate.quantity,
        addons: estimate.addons,
        total: formatCurrency(estimate.total)
      }
    };
  }

  if (includesAny(text, ['price', 'rate', 'cost', 'charges', 'kitna', 'how much'])) {
    if ((text.includes('b w') || text.includes('bw') || text.includes('black')) && text.includes('color')) {
      return {
        text: localizeReply(
          message,
          'A4 B&W printing starts at ₹3 per side, and A4 color printing starts at ₹10 per side. Share your page count and file on WhatsApp for a confirmed total.',
          'A4 B&W print ₹3 per side se start hai, aur A4 color print ₹10 per side se. Pages aur file WhatsApp pe bhej do, total confirm kar denge.'
        ),
        suggestions: [
          { label: '50 B&W pages', value: 'Estimate 50 pages B&W printing' },
          { label: '20 color pages', value: 'Estimate 20 pages color printing' },
          { label: 'Send file', value: 'How can I send my file?' }
        ]
      };
    }

    const service = detectService(message);
    if (service) {
      const details = detailedServices[service.label] || detailedServices[pricingConfig[service.key]?.label];
      if (details) {
        return {
          text: localizeReply(
            message,
            `${details.priceTag}. ${details.startingPrice.join(' | ')}. Bulk or special paper orders get a custom quote on WhatsApp.`,
            `${details.priceTag}. ${details.startingPrice.join(' | ')}. Bulk ya special paper ke liye WhatsApp pe custom quote mil jayega.`
          ),
          suggestions: [
            { label: 'Estimate total', value: `Estimate ${service.label} for 50 pages` },
            { label: 'Bulk discount', value: 'Do you offer bulk discount?' },
            { label: 'Send file', value: 'How can I send my file?' }
          ]
        };
      }
    }

    return {
      text: localizeReply(
        message,
        'Popular starting prices: Xerox A4 ₹1.5, B&W print A4 ₹3, color print A4 ₹10, lamination from ₹10, spiral binding from ₹30, passport photos ₹30.',
        'Popular rates: A4 Xerox ₹1.5, A4 B&W print ₹3, A4 color print ₹10, lamination ₹10 se, spiral binding ₹30 se, passport photos ₹30.'
      ),
      suggestions: [
        { label: '50 page estimate', value: 'Estimate 50 pages B&W printing' },
        { label: 'Color print', value: 'Color print price' },
        { label: 'Passport photos', value: 'Passport photo price' }
      ]
    };
  }

  if (includesAny(text, ['send file', 'upload', 'pdf', 'word', 'jpeg', 'png', 'whatsapp', 'order'])) {
    return {
      text: localizeReply(
        message,
        `Send your file on WhatsApp to ${CONFIG.business.phoneLabel}. PDF is best; Word, JPEG and PNG also work. Mention copies, A4/A3 size, B&W/color, finishing, and pickup time.`,
        `File WhatsApp pe ${CONFIG.business.phoneLabel} par bhej do. PDF best hai, Word/JPEG/PNG bhi chalega. Copies, A4/A3 size, B&W/color, finishing aur pickup time likh dena.`
      ),
      suggestions: [
        { label: 'WhatsApp format', value: 'What should I write on WhatsApp?' },
        { label: 'File types', value: 'Which file formats do you accept?' },
        { label: 'Urgent print', value: 'Can you print urgently today?' }
      ]
    };
  }

  if (includesAny(text, ['payment', 'upi', 'gpay', 'phonepe', 'cash', 'pay'])) {
    return {
      text: localizeReply(
        message,
        'We accept cash, UPI, Google Pay and PhonePe at the shop. For orders sent on WhatsApp, the owner will confirm the final amount before printing.',
        'Shop pe cash, UPI, Google Pay aur PhonePe accept hai. WhatsApp order me print se pehle owner final amount confirm kar denge.'
      ),
      suggestions: [
        { label: 'Send file', value: 'How can I send my file?' },
        { label: 'Prices', value: 'Show popular prices' },
        { label: 'Open now?', value: 'Are you open now?' }
      ]
    };
  }

  if (includesAny(text, ['open', 'timing', 'time', 'hours', 'closed', 'today'])) {
    return {
      text: localizeReply(
        message,
        `${getOpenStatusLine()} Regular timings are 8:00 AM to 9:00 PM, all 7 days.`,
        `${getOpenStatusLine()} Daily timing 8:00 AM se 9:00 PM hai, saare 7 din.`
      ),
      suggestions: [
        { label: 'Directions', value: 'How do I reach your shop?' },
        { label: 'Send file', value: 'Can I send file now?' },
        { label: 'Call shop', value: 'What is your phone number?' }
      ]
    };
  }

  if (includesAny(text, ['where', 'location', 'address', 'direction', 'map', 'near', 'viva', 'mahavir'])) {
    return {
      text: localizeReply(
        message,
        `We are at ${BUSINESS_ADDRESS}. Landmark: opposite Mahavir Hospital, near Old Viva College.`,
        `Shop yaha hai: ${BUSINESS_ADDRESS}. Landmark: Mahavir Hospital ke opposite, Old Viva College ke paas.`
      ),
      suggestions: [
        { label: 'Open now?', value: 'Are you open now?' },
        { label: 'WhatsApp', value: 'Send me WhatsApp contact' },
        { label: 'Services', value: 'What services do you provide?' }
      ]
    };
  }

  if (includesAny(text, ['bulk', 'discount', 'office', 'school', 'college', 'hundred', '500', '1000'])) {
    return {
      text: localizeReply(
        message,
        'Yes, bulk discounts are available for students, offices, schools and coaching classes. Share page count, print type, paper size and deadline on WhatsApp for the best quote.',
        'Haan, bulk discount available hai students, offices, schools aur coaching classes ke liye. Page count, print type, paper size aur deadline WhatsApp pe bhej do.'
      ),
      suggestions: [
        { label: '200 pages quote', value: 'Estimate 200 pages xerox' },
        { label: 'Project binding', value: 'Do you do project printing and binding?' },
        { label: 'Send file', value: 'How can I send files?' }
      ]
    };
  }

  if (includesAny(text, ['service', 'provide', 'available', 'do you do', 'what all'])) {
    return {
      text: localizeReply(
        message,
        'We do printing, xerox, lamination, spiral binding, passport photos, project printing, smart cards, visiting cards, scanning, jumbo xerox and stationery products.',
        'Haan, printing, xerox, lamination, spiral binding, passport photos, project printing, smart cards, visiting cards, scanning, jumbo xerox aur stationery sab available hai.'
      ),
      suggestions: [
        { label: 'Prices', value: 'Show popular prices' },
        { label: 'Project work', value: 'Do you do college project work?' },
        { label: 'Stationery', value: 'What stationery products are available?' }
      ]
    };
  }

  if (includesAny(text, ['passport', 'photo'])) {
    return {
      text: localizeReply(
        message,
        'Passport photos start from ₹30 per set and are usually ready in about 10 minutes. You can walk in or WhatsApp your photo first.',
        'Passport photos ₹30 per set se start hai aur usually 10 minutes me ready ho jata hai. Aap walk-in kar sakte ho ya photo pehle WhatsApp kar do.'
      ),
      suggestions: [
        { label: 'Open now?', value: 'Are you open now?' },
        { label: 'Location', value: 'Where is your shop?' },
        { label: 'Lamination', value: 'Do you laminate ID cards?' }
      ]
    };
  }

  if (includesAny(text, ['delivery', 'home delivery', 'courier'])) {
    return {
      text: localizeReply(
        message,
        'Home delivery is not available right now. Send files on WhatsApp, we will confirm the price and readiness time, then you can collect from the shop.',
        'Abhi home delivery available nahi hai. File WhatsApp pe bhej do, price aur ready time confirm hoga, phir shop se pickup kar lena.'
      ),
      suggestions: [
        { label: 'Pickup time', value: 'How fast can I collect?' },
        { label: 'Send file', value: 'How can I send my file?' },
        { label: 'Directions', value: 'Where is the shop?' }
      ]
    };
  }

  return null;
};

export const initChatWidget = () => {
  const chatWidget = document.getElementById('chatWidget');
  const chatFab = document.getElementById('chatFab');
  const chatPanel = document.getElementById('chatPanel');
  const chatClose = document.getElementById('chatClose');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('geminiChatForm');
  const chatInput = document.getElementById('geminiChatInput');
  const chatSubmit = document.getElementById('geminiChatSubmit');
  const quickReplies = document.getElementById('chatQuickReplies');
  const whatsappLink = chatPanel?.querySelector('[data-chat-whatsapp]');
  const heroSection = document.getElementById('home') || document.querySelector('.hero-section');

  if (!chatWidget || !chatFab || !chatPanel || !chatClose || !chatMessages || !chatForm || !chatInput || !chatSubmit) {
    return;
  }

  const phoneNumber = resolveBusinessWhatsAppNumber();
  let conversationHistory = [];
  let latestCustomerNeed = '';
  let latestHandoff = null;
  const aiResponseCache = new Map();
  let chatRevealVisible = false;
  let revealTicking = false;

  const updateWhatsAppLink = (notes = latestCustomerNeed, handoff = latestHandoff) => {
    if (!whatsappLink) return;

    const message = buildOrderMessage({
      ...(handoff || {}),
      notes: notes ? `Chat summary: ${notes}` : 'Customer needs help from the AI chat.',
      source: 'AI Chat Widget'
    });

    whatsappLink.href = buildWhatsAppUrl(phoneNumber, message);
  };

  const createMessageShell = (type) => {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message is-${type}`;

    if (type !== 'user') {
      const avatar = document.createElement('div');
      avatar.className = 'chat-msg-avatar';
      avatar.innerHTML = '<i class="fa-solid fa-robot" aria-hidden="true"></i>';
      messageEl.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = 'chat-msg-bubble';
    messageEl.appendChild(bubble);
    return { messageEl, bubble };
  };

  const appendMessage = (text, type = 'user', options = {}) => {
    const { messageEl, bubble } = createMessageShell(type);
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    bubble.appendChild(paragraph);

    if (options.meta) {
      const meta = document.createElement('span');
      meta.className = 'chat-msg-time';
      meta.textContent = options.meta;
      bubble.appendChild(meta);
    }

    if (options.actions?.length) {
      const actions = document.createElement('div');
      actions.className = 'chat-action-row';
      options.actions.forEach((action) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chat-action-btn';
        button.textContent = action.label;
        button.addEventListener('click', () => handleUserMessage(action.value || action.label));
        actions.appendChild(button);
      });
      bubble.appendChild(actions);
    }

    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageEl;
  };

  const renderSuggestions = (suggestions = DEFAULT_SUGGESTIONS) => {
    if (!quickReplies) return;

    quickReplies.innerHTML = '';
    suggestions.slice(0, 6).forEach((suggestion) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chat-quick-btn';
      button.dataset.quickReply = suggestion.value;
      button.textContent = suggestion.label;
      button.addEventListener('click', () => handleUserMessage(suggestion.value));
      quickReplies.appendChild(button);
    });
  };

  const setBusy = (isBusy) => {
    chatSubmit.disabled = isBusy;
    chatInput.disabled = isBusy;
    chatPanel.classList.toggle('is-thinking', isBusy);
  };

  const applyChatReveal = (shouldShow) => {
    const shouldStayVisible = shouldShow || chatWidget.classList.contains('is-open');
    if (shouldStayVisible === chatRevealVisible) {
      return;
    }

    chatRevealVisible = shouldStayVisible;
    chatWidget.classList.toggle('is-visible', shouldStayVisible);
    chatWidget.setAttribute('aria-hidden', shouldStayVisible ? 'false' : 'true');
    chatFab.tabIndex = shouldStayVisible ? 0 : -1;
  };

  const syncChatReveal = () => {
    if (!heroSection) {
      applyChatReveal(true);
      return;
    }

    const heroBottom = heroSection.getBoundingClientRect().bottom;
    applyChatReveal(heroBottom <= 80);
  };

  const queueChatReveal = () => {
    if (revealTicking) {
      return;
    }

    revealTicking = true;
    window.requestAnimationFrame(() => {
      revealTicking = false;
      syncChatReveal();
    });
  };

  const askGemini = async (userMessage, localAnswer) => {
    const cacheKey = normalizeText(userMessage);
    if (aiResponseCache.has(cacheKey)) {
      appendMessage(aiResponseCache.get(cacheKey), 'agent', {
        meta: 'Instant answer',
        actions: [
          { label: 'Send on WhatsApp', value: 'I want to continue on WhatsApp' },
          { label: 'Estimate price', value: 'Estimate price for my print job' }
        ]
      });
      return;
    }

    const typingIndicator = appendMessage('Thinking...', 'agent-typing');
    setBusy(true);
    conversationHistory.push({ role: 'user', parts: [{ text: userMessage }] });

    const localContext = localAnswer ? `Local verified answer: ${localAnswer}` : '';
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: `${SYSTEM_PROMPT}\n${localContext}` }] },
          contents: conversationHistory.slice(-8)
        })
      });

      if (!response.ok) throw new Error('Gemini API error');

      const data = await response.json();
      const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!botReply) throw new Error('Empty Gemini response');

      typingIndicator.remove();
      aiResponseCache.set(cacheKey, botReply);
      appendMessage(botReply, 'agent', {
        meta: 'AI assisted',
        actions: [
          { label: 'Send on WhatsApp', value: 'I want to continue on WhatsApp' },
          { label: 'Estimate price', value: 'Estimate price for my print job' }
        ]
      });
      conversationHistory.push({ role: 'model', parts: [{ text: botReply }] });
    } catch (error) {
      console.error('Gemini AI Error:', error);
      typingIndicator.remove();
      if (!localAnswer) {
        appendMessage(
          'I can answer prices, timing, files and location instantly. For a custom request, tap WhatsApp and the owner will assist right away.',
          'agent',
          { actions: DEFAULT_SUGGESTIONS }
        );
      }
      conversationHistory.pop();
    } finally {
      window.clearTimeout(timeoutId);
      setBusy(false);
      chatInput.focus();
    }
  };

  const handleUserMessage = (message) => {
    const cleanMessage = String(message || '').trim();
    if (!cleanMessage) return;

    latestCustomerNeed = cleanMessage;
    appendMessage(cleanMessage, 'user');
    updateWhatsAppLink(cleanMessage);

    const localAnswer = createKnowledgeAnswer(cleanMessage);
    if (localAnswer) {
      latestHandoff = localAnswer.handoff || latestHandoff;
      updateWhatsAppLink(cleanMessage, latestHandoff);
      appendMessage(localAnswer.text, 'agent', {
        meta: getOpenStatusLine(),
        actions: [
          { label: 'WhatsApp owner', value: 'I want to continue on WhatsApp' },
          { label: 'More prices', value: 'Show popular prices' }
        ]
      });
      renderSuggestions(localAnswer.suggestions);
      conversationHistory.push({ role: 'user', parts: [{ text: cleanMessage }] });
      conversationHistory.push({ role: 'model', parts: [{ text: localAnswer.text }] });
      return;
    }

    askGemini(cleanMessage);
  };

  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    chatInput.value = '';
    handleUserMessage(message);
  });

  renderSuggestions();
  updateWhatsAppLink();

  const toggleChat = (shouldOpen) => {
    chatWidget.classList.toggle('is-open', shouldOpen);
    chatPanel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
    chatFab.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    syncChatReveal();

    if (shouldOpen) {
      window.setTimeout(() => chatInput.focus(), 300);
    }
  };

  syncChatReveal();

  if (heroSection && 'IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(
      () => {
        queueChatReveal();
      },
      { threshold: [0, 0.2, 0.5, 1], rootMargin: '-60px 0px 0px 0px' }
    );
    heroObserver.observe(heroSection);
  }

  window.addEventListener('scroll', queueChatReveal, { passive: true });
  window.addEventListener('resize', queueChatReveal);

  chatFab.addEventListener('click', () => toggleChat(!chatWidget.classList.contains('is-open')));
  chatClose.addEventListener('click', () => toggleChat(false));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && chatWidget.classList.contains('is-open')) {
      toggleChat(false);
    }
  });
};
