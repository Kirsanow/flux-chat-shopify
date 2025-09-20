// FluxChat Widget - Vanilla JavaScript
class FluxChatWidget {
  constructor(container) {
    this.container = container;
    this.isOpen = false;
    this.config = this.getConfig();
    this.init();
  }

  getConfig() {
    return {
      storeName: this.container.dataset.storeName || 'Store',
      theme: this.container.dataset.theme || 'professional',
      apiUrl: this.container.dataset.apiUrl || '/api/chat'
    };
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="flux-chat-widget" data-theme="${this.config.theme}">
        ${this.renderButton()}
        ${this.isOpen ? this.renderModal() : ''}
      </div>
    `;
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
          <button class="flux-chat-close" aria-label="Close chat">
            ${this.getCloseIcon()}
          </button>
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
    this.render();
    this.bindEvents();
  }

  close() {
    this.isOpen = false;
    this.render();
    this.bindEvents();
  }

  sendMessage(message) {
    if (!message.trim()) return;

    // Add user message to chat
    // TODO: Implement actual message handling
    console.log('Sending message:', message);
  }
}

// Initialize widget when DOM is ready
function initFluxChat() {
  const container = document.getElementById('flux-chat-widget');
  if (container) {
    new FluxChatWidget(container);
    console.log('FluxChat widget initialized');
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