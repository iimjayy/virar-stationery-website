// js/features/chat-widget.js
// Self-contained Chat Widget feature module.
// Owns: panel open/close, quick-reply system, WhatsApp bridge link sync,
// keyboard dismiss (Escape), and accessibility state management.
// Dependencies: CONFIG (messages), buildWhatsAppUrl + resolveBusinessWhatsAppNumber (helpers)

import { CONFIG } from '../config.js';
import { buildWhatsAppUrl, resolveBusinessWhatsAppNumber } from '../utils/helpers.js';

// ---------------------------------------------------------------------------
// initChatWidget — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initChatWidget = () => {
  const chatWidget = document.getElementById('chatWidget');
  const chatFab = document.getElementById('chatFab');
  const chatPanel = document.getElementById('chatPanel');
  const chatClose = document.getElementById('chatClose');
  const chatMessages = document.getElementById('chatMessages');

  if (!chatWidget || !chatFab || !chatPanel || !chatClose || !chatMessages) {
    return;
  }

  const quickButtons = Array.from(
    chatPanel.querySelectorAll('[data-quick-reply]') || []
  );
  const whatsappLink = chatPanel.querySelector('[data-chat-whatsapp]');

  // Resolve phone once at boot — reads from page DOM links, falls back to CONFIG.
  const whatsAppNumber = resolveBusinessWhatsAppNumber();
  const defaultMessage = CONFIG.messages.chatDefault;

  // Sync the WhatsApp CTA link href with the current context message.
  const syncWhatsAppLink = (message) => {
    if (!whatsappLink) {
      return;
    }

    whatsappLink.href = buildWhatsAppUrl(whatsAppNumber, message || defaultMessage);
  };

  // Open or close the chat panel with full ARIA state management.
  const toggleChat = (shouldOpen) => {
    chatWidget.classList.toggle('is-open', shouldOpen);
    chatPanel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
    chatFab.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');

    if (shouldOpen) {
      syncWhatsAppLink(defaultMessage);
      // Defer focus until after the CSS transition starts.
      window.setTimeout(() => {
        chatPanel.focus();
      }, 0);
    }
  };

  // Append a chat bubble to the message list.
  const appendMessage = (text, type = 'user') => {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message is-${type}`;
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    messageEl.appendChild(paragraph);
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  // Quick-reply lookup: button text → agent response string.
  const quickReplies = {
    'Send files': 'Great! Please send your files on WhatsApp so we can confirm details quickly.',
    'Check price': 'Share quantity, size, and color preferences for a fast price estimate.',
    Location: 'We are near Old Viva College, Virar West. Tap WhatsApp for directions.'
  };

  // ---- Event wiring ----

  chatFab.addEventListener('click', () => {
    toggleChat(!chatWidget.classList.contains('is-open'));
  });

  chatClose.addEventListener('click', () => {
    toggleChat(false);
  });

  quickButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const reply = button.dataset.quickReply || '';
      appendMessage(reply, 'user');

      const response =
        quickReplies[reply] || 'We are here to help. Share your request on WhatsApp.';

      // Brief delay simulates the agent "thinking" before responding.
      window.setTimeout(() => {
        appendMessage(response, 'agent');
      }, 260);

      syncWhatsAppLink(`Chat request: ${reply}. Please assist.`);
    });
  });

  // Escape key closes the widget — keyboard accessibility.
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && chatWidget.classList.contains('is-open')) {
      toggleChat(false);
    }
  });
};
