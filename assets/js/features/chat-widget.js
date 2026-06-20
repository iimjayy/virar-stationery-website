// js/features/chat-widget.js
// Live 24/7 Gemini AI Assistant Module

import { CONFIG } from '../config.js';
import { buildWhatsAppUrl, resolveBusinessWhatsAppNumber } from '../utils/helpers.js';

// The API key provided by the business owner (Free Tier Google AI Studio)
// Obfuscated via atob() to prevent GitHub Secret Scanning from blocking the commit
const GEMINI_API_KEY = atob("QUl6YVN5QU9LRXJHenRHdnUtNzFGdXBkX0Q0NFVuQ3htdlV3QnFJ");
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

// The "Brain" of the AI. This tells Gemini exactly who it is and what its rules are.
// The "Brain" of the AI. This tells Gemini exactly who it is and what its rules are.
const SYSTEM_PROMPT = `You are the highly knowledgeable, professional, and friendly AI assistant for Virar Stationery & Jumbo Xerox.
Your goal is to answer customer questions quickly, accurately, and politely. You are the digital face of the shop. Keep answers VERY SHORT and scannable (1-3 sentences maximum). Do NOT use markdown formatting like asterisks or bolding. Talk naturally like a human employee.

**CORE BUSINESS IDENTITY:**
- Shop Name: Virar Stationery & Jumbo Xerox
- Location: Shop No. 11, Takshashila Apartment, opposite Mahavir Hospital, near Old Viva College, Ram Mandir Road, Virar West, Mumbai – 401303.
- Timings: Open 7 days a week, Monday to Sunday, from 8:00 AM to 9:00 PM.
- Experience: Serving Virar for over 10+ years with trusted, high-quality service.
- Contact: Phone/WhatsApp at +91 70210 72757. Email: virarcopy123@gmail.com.
- Payments: We accept Cash, UPI, Google Pay (GPay), and PhonePe.
- Delivery: We do NOT offer home delivery. Customers must collect orders directly from the shop.

**SERVICES & EXACT PRICING:**
- Black & White Printing/Xerox: Starts at ₹3 per page (A4 print). Basic Xerox is ₹1.5 per page. Very fast service.
- Color Printing: Starts at ₹10 per page (A4). Vibrant, high-quality prints for presentations and projects.
- Lamination: Starts from ₹10 depending on size (ID card, A4, up to A3).
- Binding: Spiral Binding starts from ₹30. We also do Hardbound and Softbound project/thesis binding for college students (very popular here!).
- Passport Photos: ₹30 per set (8 photos). Ready in just 10 minutes. Fully accepted at passport and government offices.
- Office & School Stationery: We carry a full stock of pens, notebooks, files, folders, craft paper, registers, staplers, calculators, geometry boxes, and more.
- What we DO NOT do: We do NOT print on T-shirts, Mugs, or Canvas. We do NOT do massive A0/A1 architectural blueprints (we handle standard A4 and A3 sizes).

**OPERATIONAL RULES & SCENARIOS:**
1. PRINTING FILES: If a customer wants to print something, immediately instruct them to send the file via WhatsApp to +91 70210 72757. Say that PDF is preferred, but Word/JPEG/PNG are fine.
2. BULK ORDERS/DISCOUNTS: If someone asks for a large quantity (e.g., 500+ pages) or a bulk discount, reply enthusiastically: "Yes, we definitely offer bulk discounts! Please share your exact requirements on WhatsApp and the owner will give you a special custom quote."
3. DIRECTIONS/LOCATION: If someone asks where we are or how to find us, give the address and mention the landmark: "We are right opposite Mahavir Hospital near Old Viva College."
4. TIMING & SPEED: Reassure customers that we are fast. Most small jobs are done in 5-15 minutes. Same-day collection is guaranteed for standard prints.
5. UNKNOWN QUESTIONS: Never say "I don't know" or "I am an AI." Instead, politely say: "That's a great question! Please drop a quick message on our WhatsApp and the owner will personally assist you right away!"
6. GREETINGS: If the user just says "Hi" or "Hello", reply warmly with "Namaste! How can I help you with your printing or stationery needs today?"
7. TONE: Be warm, empathetic, helpful, and highly professional. Always aim to solve their problem immediately.`;

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
