// FluxChat Widget - Vanilla JavaScript
/* global FluxChatStorage */
class FluxChatWidget {
  constructor(container) {
    this.container = container;
    this.isOpen = false;
    this.config = this.getConfig();
    this.storage = new FluxChatStorage(this.config.storeId);
    this.sessionId = null; // Will be set on first message
    this.init();
  }

  getConfig() {
    return {
      storeName: this.container.dataset.storeName || 'Store',
      storeId: this.container.dataset.storeId || 'unknown-store',
      theme: this.container.dataset.theme || 'professional',
      apiUrl: this.container.dataset.apiUrl || '/api/chat'
    };
  }

  init() {
    this.render();
    this.bindEvents();
    this.loadExistingSession();
  }

  // Check if user has existing session and load conversation history
  async loadExistingSession() {
    const existingSessionId = this.storage.getSessionId();
    if (existingSessionId) {
      console.log('FluxChat: Found existing session:', existingSessionId);
      console.log('FluxChat: Loading conversation history...');

      try {
        await this.loadConversationHistory(existingSessionId);
      } catch (error) {
        console.error('FluxChat: Failed to load conversation history:', error);
      }
    } else {
      console.log('FluxChat: No existing session found');
    }
  }

  // Load conversation history from server
  async loadConversationHistory(sessionId) {
    // Use app proxy path (works from both theme editor and storefront)
    const url = new URL('/apps/flux-chat/api/conversation', window.location.origin);
    url.searchParams.set('sessionId', sessionId);
    url.searchParams.set('shop', this.config.storeId);

    // Add logged_in_customer_id if available (for customer sessions)
    const customerId = this.getLoggedInCustomerId();
    if (customerId) {
      url.searchParams.set('logged_in_customer_id', customerId);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to load conversation: ${response.status}`);
    }

    const data = await response.json();

    if (data.messages && data.messages.length > 0) {
      console.log('FluxChat: Loaded', data.messages.length, 'messages');
      this.displayConversationHistory(data.messages);
      this.sessionId = data.sessionId; // Update sessionId from server
    } else {
      console.log('FluxChat: No conversation history found');
    }
  }

  // Display loaded conversation history in chat
  displayConversationHistory(messages) {
    const messagesContainer = this.container.querySelector('.flux-chat-messages');
    if (!messagesContainer) return;

    // Clear any existing messages
    messagesContainer.innerHTML = '';

    // Add each message to the chat
    messages.forEach(message => {
      this.addMessage(message.content, message.role);
    });

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Helper to get logged in customer ID (for Shopify customer sessions)
  getLoggedInCustomerId() {
    // Check URL params first (most reliable)
    const urlParams = new URLSearchParams(window.location.search);
    const customerId = urlParams.get('logged_in_customer_id');

    if (customerId) {
      return customerId;
    }

    // Fallback: check if there's a customer object in Shopify theme
    if (typeof window.Shopify !== 'undefined' && window.Shopify.customerid) {
      return window.Shopify.customerid;
    }

    return null;
  }

  render() {
    this.container.innerHTML = `
      <div class="flux-chat-widget" data-theme="${this.config.theme}">
        ${this.renderButton()}
        ${this.renderModal()}
      </div>
    `;

    // Set initial visibility state
    this.updateModalVisibility();
  }

  renderButton() {
    return `
      <button class="flux-chat-button ${this.isOpen ? 'open' : ''}" aria-label="${this.isOpen ? 'Close chat' : 'Open chat'}">
        ${this.isOpen ? this.getCloseIcon() : this.getChatIcon()}
      </button>
    `;
  }

  renderModal() {
    return `
      <div class="flux-chat-modal">
        <div class="flux-chat-header">
          <div class="flux-chat-header-content">
            <div class="flux-chat-avatar">
              ${this.getChatIcon()}
            </div>
            <div class="flux-chat-info">
              <h3>${this.config.storeName}</h3>
              <div class="flux-chat-status">
                <div class="flux-status-dot"></div>
                <span>We are online</span>
              </div>
            </div>
          </div>
          <div class="flux-chat-header-actions">
            <div class="flux-chat-menu">
              <button class="flux-chat-menu-button" aria-label="Chat menu">
                ${this.getMenuIcon()}
              </button>
              <div class="flux-chat-popover">
                <button class="flux-popover-item flux-reset-conversation">
                  ${this.getResetIcon()}
                  Reset conversation
                </button>
              </div>
            </div>
            <button class="flux-chat-close" aria-label="Close chat">
              ${this.getCloseIcon()}
            </button>
          </div>
        </div>
        <div class="flux-chat-messages">
          <div class="flux-welcome-message">
            <div class="flux-message-avatar">💬</div>
            <p>Hi! How can I help you today?</p>
          </div>
        </div>
        <div class="flux-chat-input">
          <div class="flux-input-container">
            <input type="text" placeholder="Type your message..." class="flux-message-input">
            <button class="flux-send-button" aria-label="Send message">
              ${this.getSendIcon()}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  getChatIcon() {
    return `
      <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M4.87713 0.0917969C2.5487 0.0917969 0.661133 1.97936 0.661133 4.30779V10.3598C0.661133 12.6882 2.5487 14.5758 4.87713 14.5758H16.9051C18.8952 14.6617 20.5592 16.0055 21.122 17.8321C21.1357 17.8767 21.1767 17.9077 21.2234 17.9077C21.2813 17.9077 21.3283 17.8607 21.3283 17.8028V10.5643C21.3315 10.4965 21.3331 10.4284 21.3331 10.3598V4.3078C21.3331 1.97936 19.4456 0.0917969 17.1171 0.0917969H4.87713Z" fill="currentColor"/>
        <rect x="4.87695" y="4.7832" width="2.584" height="4.42" rx="1.292" fill="#434343"/>
        <rect x="10.998" y="4.7832" width="2.584" height="4.42" rx="1.292" fill="#434343"/>
      </svg>
    `;
  }

  getCloseIcon() {
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  }

  getSendIcon() {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  getMenuIcon() {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor"/>
        <path d="M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor"/>
        <path d="M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" fill="currentColor"/>
      </svg>
    `;
  }

  getResetIcon() {
    return `
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path d="M17.7782 9.16601C17.7782 9.62625 17.4051 9.99935 16.9449 9.99935C16.4846 9.99935 16.1115 9.62625 16.1115 9.16601C16.1115 7.32507 14.6192 5.83268 12.7782 5.83268H5.48268L6.73096 7.21966C7.03884 7.56175 7.01111 8.08865 6.66902 8.39654C6.32692 8.70442 5.80002 8.67669 5.49213 8.3346L2.99213 5.55682C2.69564 5.22738 2.70889 4.72349 3.02229 4.41009L5.52229 1.91009C5.84773 1.58466 6.37536 1.58466 6.7008 1.91009C7.02624 2.23553 7.02624 2.76317 6.7008 3.0886L5.62339 4.16601H12.7782C15.5396 4.16601 17.7782 6.40459 17.7782 9.16601Z" fill="currentColor"/>
        <path d="M2.22266 10.8327C2.22266 10.3724 2.59575 9.99935 3.05599 9.99935C3.51623 9.99935 3.88932 10.3724 3.88932 10.8327C3.88932 12.6736 5.38171 14.166 7.22266 14.166H14.5182L13.2699 12.779C12.962 12.4369 12.9898 11.91 13.3319 11.6022C13.6739 11.2943 14.2009 11.322 14.5087 11.6641L17.0087 14.4419C17.3052 14.7713 17.292 15.2752 16.9786 15.5886L14.4786 18.0886C14.1531 18.414 13.6255 18.414 13.3001 18.0886C12.9746 17.7632 12.9746 17.2355 13.3001 16.9101L14.3775 15.8327H7.22266C4.46123 15.8327 2.22266 13.5941 2.22266 10.8327Z" fill="currentColor"/>
      </svg>
    `;
  }

  bindEvents() {
    // Toggle chat
    const button = this.container.querySelector('.flux-chat-button');
    const closeBtn = this.container.querySelector('.flux-chat-close');

    if (button) {
      button.addEventListener('click', () => this.toggle());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Handle menu popover
    const menuBtn = this.container.querySelector('.flux-chat-menu-button');
    const popover = this.container.querySelector('.flux-chat-popover');
    const resetBtn = this.container.querySelector('.flux-reset-conversation');

    if (menuBtn && popover) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        popover.classList.toggle('visible');
      });

      // Close popover when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.container.contains(e.target)) {
          popover.classList.remove('visible');
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.resetConversation();
        popover.classList.remove('visible');
      });
    }

    // Handle message input
    const input = this.container.querySelector('.flux-message-input');
    const sendBtn = this.container.querySelector('.flux-send-button');

    if (input && sendBtn) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage(input.value);
          input.value = '';
        }
      });

      sendBtn.addEventListener('click', () => {
        this.sendMessage(input.value);
        input.value = '';
      });
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.updateModalVisibility();
    this.updateButtonState();
  }

  close() {
    this.isOpen = false;
    this.updateModalVisibility();
    this.updateButtonState();
  }

  updateModalVisibility() {
    const modal = this.container.querySelector('.flux-chat-modal');
    if (modal) {
      modal.style.display = this.isOpen ? 'flex' : 'none';
    } else if (this.isOpen) {
      // Modal doesn't exist yet, create it
      this.render();
      this.bindEvents();
    }
  }

  updateButtonState() {
    const button = this.container.querySelector('.flux-chat-button');
    if (button) {
      if (this.isOpen) {
        button.classList.add('open');
        button.setAttribute('aria-label', 'Close chat');
        button.innerHTML = this.getCloseIcon();
      } else {
        button.classList.remove('open');
        button.setAttribute('aria-label', 'Open chat');
        button.innerHTML = this.getChatIcon();
      }
    }
  }

  resetConversation() {
    // Clear session storage
    this.storage.clearSession();
    this.sessionId = null;

    // Clear messages and show welcome message
    const messagesContainer = this.container.querySelector('.flux-chat-messages');
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="flux-welcome-message">
          <div class="flux-message-avatar">💬</div>
          <p>Hi! How can I help you today?</p>
        </div>
      `;
    }

    console.log('FluxChat: Conversation reset');
  }

  async sendMessage(message) {
    if (!message.trim()) return;

    // LAZY SESSION CREATION: Only create session on first user message
    if (!this.sessionId) {
      this.sessionId = this.storage.getSessionId();

      if (!this.sessionId) {
        // First message ever - create new session
        this.sessionId = this.storage.createSession();
        console.log('FluxChat: Created new session for first message:', this.sessionId);

        // Clear welcome message on first interaction
        const messagesContainer = this.container.querySelector('.flux-chat-messages');
        const welcomeMessage = messagesContainer.querySelector('.flux-welcome-message');
        if (welcomeMessage) {
          welcomeMessage.remove();
          console.log('FluxChat: Cleared welcome message');
        }
      } else {
        console.log('FluxChat: Using existing session:', this.sessionId);
      }
    }

    // Add user message to chat
    this.addMessageToChat('user', message);

    // Add AI message placeholder for streaming
    const aiMessageId = this.addMessageToChat('ai', '');

    let response;

    try {
      // Build conversation history
      const messages = this.getConversationHistory();

      console.log('Sending request to:', this.config.apiUrl);
      console.log('Session ID:', this.sessionId);
      console.log('Messages:', messages);

      // Call streaming API with session ID
      response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          messages,
          sessionId: this.sessionId,
          storeId: this.config.storeId
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Try to get error details
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}. Details: ${errorText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';

      if (reader) {
        console.log('Starting to read stream...');

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('Stream finished');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          console.log('Received chunk:', chunk);

          aiResponse += chunk;

          // Update the AI message in real-time
          this.updateMessage(aiMessageId, aiResponse);
        }
      } else {
        console.error('No readable stream available');
        // Fallback: try to read as regular text
        const text = await response.text();
        console.log('Fallback text response:', text);
        this.updateMessage(aiMessageId, text);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        apiUrl: this.config.apiUrl,
        response: response ? {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries())
        } : 'No response object'
      });
      this.updateMessage(aiMessageId, `Error: ${error.message}. Check console for details.`);
    }
  }

  addMessageToChat(role, content) {
    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
    const messagesContainer = this.container.querySelector('.flux-chat-messages');

    if (!messagesContainer) return messageId;

    const messageDiv = document.createElement('div');
    messageDiv.className = `flux-message flux-message-${role}`;
    messageDiv.id = messageId;

    messageDiv.innerHTML = `
      <div class="flux-message-content">
        <div class="flux-message-text">${content}</div>
      </div>
    `;

    // Remove welcome message if it exists
    const welcomeMessage = messagesContainer.querySelector('.flux-welcome-message');
    if (welcomeMessage && role === 'user') {
      welcomeMessage.remove();
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageId;
  }

  updateMessage(messageId, content) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
      const textElement = messageElement.querySelector('.flux-message-text');
      if (textElement) {
        textElement.textContent = content;

        // Auto-scroll to bottom
        const messagesContainer = this.container.querySelector('.flux-chat-messages');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }
    }
  }

  getConversationHistory() {
    const messages = [];
    const messageElements = this.container.querySelectorAll('.flux-message');

    messageElements.forEach(msgEl => {
      const role = msgEl.classList.contains('flux-message-user') ? 'user' : 'assistant';
      const content = msgEl.querySelector('.flux-message-text')?.textContent || '';

      if (content.trim()) {
        messages.push({ role, content });
      }
    });

    return messages;
  }
}

// Initialize widget when DOM is ready
function initFluxChat() {
  console.log('FluxChat: Attempting initialization...');
  const container = document.getElementById('flux-chat-widget');
  console.log('FluxChat: Container found:', !!container);

  if (container) {
    // Check if widget already initialized
    if (container.dataset.initialized === 'true') {
      console.log('FluxChat: Widget already initialized, skipping');
      return;
    }

    new FluxChatWidget(container);
    container.dataset.initialized = 'true';
    console.log('FluxChat widget initialized successfully');
  } else {
    console.log('FluxChat: Container not found, widget cannot initialize');
  }
}

// Multiple initialization attempts to ensure it works
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFluxChat);
} else {
  initFluxChat();
}

// Fallback with timeout
setTimeout(initFluxChat, 100);