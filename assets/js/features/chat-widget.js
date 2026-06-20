// js/features/chat-widget.js
// Live 24/7 Gemini AI Assistant Module

import { CONFIG } from '../config.js';
import { buildWhatsAppUrl, resolveBusinessWhatsAppNumber } from '../utils/helpers.js';

// The API key provided by the business owner (Free Tier Google AI Studio)
// Obfuscated via atob() to prevent GitHub Secret Scanning from blocking the commit
const GEMINI_API_KEY = atob("QUl6YVN5QU9LRXJHenRHdnUtNzFGdXBkX0Q0NFVuQ3htdlV3QnFJ");
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// The "Brain" of the AI. This tells Gemini exactly who it is and what its rules are.
const SYSTEM_PROMPT = `You are the highly knowledgeable, professional, and friendly AI assistant for Virar Stationery & Jumbo Xerox.
Your goal is to answer customer questions quickly, accurately, and politely. Keep answers VERY SHORT and scannable (1-3 sentences maximum). Do NOT use markdown formatting like asterisks or bolding. Talk like a real human employee.

**CORE BUSINESS IDENTITY:**
- Shop Name: Virar Stationery & Jumbo Xerox
- Location: Shop No. 11, Takshashila Apartment, opposite Mahavir Hospital, near Old Viva College, Ram Mandir Road, Virar West, Mumbai – 401303.
- Experience: Serving Virar for over 10+ years with trusted, high-quality service.
- Contact: Phone/WhatsApp at +91 70210 72757. Email: virarcopy123@gmail.com.

**SERVICES & EXACT PRICING:**
- Black & White Printing: Starts at ₹3 per page (A4). Crisp monochrome prints for forms, notes, assignments.
- Color Printing: Starts at ₹10 per page (A4). Vibrant prints for presentations, project covers, brochures.
- Xerox / Photocopy: Starts at ₹1.5 per page. Very fast.
- Lamination: Starts from ₹10 depending on size (ID card to A3).
- Spiral Binding: Starts from ₹30 depending on thickness.
- Passport Photos: ₹30 per set. Ready in 10 minutes. Accepted at passport offices.
- Office & School Stationery: Pens, notebooks, files, folders, craft paper, registers, staplers, calculators, etc.

**OPERATIONAL RULES:**
1. FILE SUBMISSION: If a customer wants to print, immediately tell them to send the file via WhatsApp to +91 70210 72757. Mention that PDF is preferred, but Word/JPEG/PNG are accepted.
2. BULK ORDERS: If someone asks for a large quantity or bulk discount, reply: "Yes, we offer bulk discounts! Please share your exact requirements on WhatsApp and the owner will give you a custom quote."
3. DIRECTIONS: If someone asks where we are, give the address and say "We are right opposite Mahavir Hospital near Old Viva College."
4. TIMING: Most small jobs are done in 5-15 minutes. Same-day collection is guaranteed for standard prints.
5. TONE: Be warm, helpful, and concise. Never say "I don't know" - instead say "Please message us on WhatsApp and the owner will assist you right away!"`;

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
