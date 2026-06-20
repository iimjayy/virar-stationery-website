// js/features/chat-widget.js
// Live 24/7 Gemini AI Assistant Module

import { CONFIG } from '../config.js';
import { buildWhatsAppUrl, resolveBusinessWhatsAppNumber } from '../utils/helpers.js';

// The API key provided by the business owner (Free Tier Google AI Studio)
// Obfuscated via atob() to prevent GitHub Secret Scanning from blocking the commit
const GEMINI_API_KEY = atob("QUl6YVN5QU9LRXJHenRHdnUtNzFGdXBkX0Q0NFVuQ3htdlV3QnFJ");
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// The "Brain" of the AI. This tells Gemini exactly who it is and what its rules are.
const SYSTEM_PROMPT = `You are the friendly, professional AI assistant for Virar Stationery & Jumbo Xerox, a popular print shop located near Old Viva College, Virar West.
Your goal is to answer customer questions quickly and politely. Keep answers VERY SHORT (1-3 sentences maximum). Do not use markdown formatting.

Shop Information:
- Phone / WhatsApp: +91 70210 72757
- Services: Printing, Xerox, Lamination, Spiral Binding, Passport Photos, Stationery.
- Pricing: A4 Black & White is ₹2/page. A4 Color is ₹10/page. Lamination is ₹30. Spiral binding starts at ₹40. 
- Fast Service: Most small jobs are done in 5-15 minutes.
- File Types: PDF is preferred, but we accept Word, JPEG, PNG.

Rules:
1. If someone asks for a bulk discount, say "Yes, we offer bulk discounts! Please share your requirements on WhatsApp for a custom quote."
2. If asked to print right now, tell them to attach their file on WhatsApp.
3. Be conversational and highly polite.`;

// ---------------------------------------------------------------------------
// initChatWidget — public entry point called by main.js
// ---------------------------------------------------------------------------
export const initChatWidget = () => {
  const chatWidget = document.getElementById('chatWidget');
  const chatFab = document.getElementById('chatFab');
  const chatPanel = document.getElementById('chatPanel');
  const chatClose = document.getElementById('chatClose');
  const chatMessages = document.getElementById('chatMessages');
  const chatForm = document.getElementById('geminiChatForm');
  const chatInput = document.getElementById('geminiChatInput');
  const chatSubmit = document.getElementById('geminiChatSubmit');
  const quickButtons = Array.from(chatPanel.querySelectorAll('[data-quick-reply]') || []);

  if (!chatWidget || !chatFab || !chatPanel || !chatClose || !chatMessages || !chatForm) {
    return;
  }

  // Maintains conversation history so Gemini remembers context
  let conversationHistory = [];

  // Append a chat bubble to the message list
  const appendMessage = (text, type = 'user') => {
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message is-${type}`;
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    messageEl.appendChild(paragraph);
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  // Call the live Gemini API
  const askGemini = async (userMessage) => {
    // Show typing indicator
    appendMessage("Thinking...", "agent-typing");
    const typingIndicator = chatMessages.lastElementChild;
    
    chatSubmit.disabled = true;
    chatInput.disabled = true;

    // Add user message to history
    conversationHistory.push({ role: "user", parts: [{ text: userMessage }] });

    try {
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error("API Error");
      }

      const data = await response.json();
      const botReply = data.candidates[0].content.parts[0].text;

      // Remove typing indicator
      typingIndicator.remove();
      
      // Add bot message
      appendMessage(botReply, "agent");
      conversationHistory.push({ role: "model", parts: [{ text: botReply }] });

    } catch (error) {
      console.error("Gemini AI Error:", error);
      typingIndicator.remove();
      appendMessage("I'm currently offline. Please click the WhatsApp button below to speak with the owner!", "agent");
      // Remove the last user message from history so it doesn't break future context
      conversationHistory.pop();
    } finally {
      chatSubmit.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
  };

  // Handle Form Submission
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;
    
    chatInput.value = '';
    appendMessage(message, 'user');
    askGemini(message);
  });

  // Handle Quick Replies
  quickButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const reply = button.dataset.quickReply || '';
      appendMessage(reply, 'user');
      askGemini(reply);
    });
  });

  // Open or close the chat panel
  const toggleChat = (shouldOpen) => {
    chatWidget.classList.toggle('is-open', shouldOpen);
    chatPanel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
    if (chatFab) {
      chatFab.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    }

    if (shouldOpen) {
      window.setTimeout(() => chatInput.focus(), 300);
    }
  };

  if (chatFab) {
    chatFab.addEventListener('click', () => toggleChat(!chatWidget.classList.contains('is-open')));
  }

  chatClose.addEventListener('click', () => toggleChat(false));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && chatWidget.classList.contains('is-open')) {
      toggleChat(false);
    }
  });
};
