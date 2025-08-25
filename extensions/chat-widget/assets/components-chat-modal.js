/**
 * ChatModal Component - Chat interface modal
 * Clean, self-contained component like a React component
 */

window.FluxChat = window.FluxChat || {};
window.FluxChat.Components = window.FluxChat.Components || {};

window.FluxChat.Components.ChatModal = class ChatModal {
  constructor(props = {}) {
    this.props = {
      theme: 'light',
      welcomeMessage: 'Hi! How can I help you today?',
      onClose: () => {},
      onSendMessage: () => {},
      ...props
    };
    
    this.state = {
      isVisible: false,
      messages: [],
      isTyping: false,
      inputValue: '',
      isMinimized: false
    };
    
    this.element = null;
    this.messageContainer = null;
    this.messageInput = null;
    this.id = 'flux-chat-modal';
  }
  
  /**
   * Component template - like JSX
   */
  template() {
    return `
      <div 
        id="${this.id}"
        class="flux-chat-modal flux-chat-modal--${this.props.theme} ${this.state.isMinimized ? 'flux-chat-modal--minimized' : ''}"
        role="dialog"
        aria-labelledby="flux-chat-title"
        aria-describedby="flux-chat-messages"
      >
        <div class="flux-chat-modal__backdrop"></div>
        <div class="flux-chat-modal__container">
          
          <!-- Header -->
          <div class="flux-chat-modal__header">
            <div class="flux-chat-modal__header-content">
              <h2 id="flux-chat-title" class="flux-chat-modal__title">
                Chat Support
              </h2>
              <div class="flux-chat-modal__status">
                <div class="flux-chat-modal__status-dot"></div>
                <span class="flux-chat-modal__status-text">Online</span>
              </div>
            </div>
            
            <div class="flux-chat-modal__header-actions">
              <button 
                type="button" 
                class="flux-chat-modal__minimize-btn"
                aria-label="Minimize chat"
                title="Minimize"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
              
              <button 
                type="button" 
                class="flux-chat-modal__close-btn"
                aria-label="Close chat"
                title="Close"
              >
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          
          <!-- Messages -->
          <div 
            class="flux-chat-modal__messages" 
            id="flux-chat-messages"
            aria-live="polite"
            aria-relevant="additions"
          >
            ${this.renderMessages()}
            ${this.state.isTyping ? this.renderTypingIndicator() : ''}
          </div>
          
          <!-- Input -->
          <div class="flux-chat-modal__input-container">
            <form class="flux-chat-modal__input-form">
              <div class="flux-chat-modal__input-wrapper">
                <textarea
                  class="flux-chat-modal__input"
                  placeholder="Type your message..."
                  rows="1"
                  aria-label="Message input"
                  maxlength="1000"
                ></textarea>
                
                <button 
                  type="submit"
                  class="flux-chat-modal__send-btn"
                  aria-label="Send message"
                  title="Send"
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              
              <div class="flux-chat-modal__input-footer">
                <span class="flux-chat-modal__char-count">0/1000</span>
              </div>
            </form>
          </div>
          
        </div>
      </div>
    `;
  }
  
  /**
   * Render messages list
   */
  renderMessages() {
    if (this.state.messages.length === 0) {
      return `
        <div class="flux-chat-modal__welcome">
          <div class="flux-chat-modal__welcome-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C10.3596 22 8.82946 21.6284 7.49543 20.9654L3 22L4.03456 17.5046C3.37164 16.1705 3 14.6404 3 13C3 7.47715 7.47715 3 13 3Z" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <h3 class="flux-chat-modal__welcome-title">Welcome!</h3>
          <p class="flux-chat-modal__welcome-text">${this.props.welcomeMessage}</p>
        </div>
      `;
    }
    
    return this.state.messages.map(message => this.renderMessage(message)).join('');
  }
  
  /**
   * Render single message
   */
  renderMessage(message) {
    const isUser = message.role === 'user';
    const timestamp = this.formatTime(message.timestamp);
    
    return `
      <div class="flux-chat-modal__message flux-chat-modal__message--${message.role} ${message.isError ? 'flux-chat-modal__message--error' : ''}">
        <div class="flux-chat-modal__message-avatar">
          ${isUser ? this.renderUserAvatar() : this.renderBotAvatar()}
        </div>
        
        <div class="flux-chat-modal__message-content">
          <div class="flux-chat-modal__message-text">
            ${this.formatMessageContent(message.content)}
          </div>
          <div class="flux-chat-modal__message-time">
            ${timestamp}
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render typing indicator
   */
  renderTypingIndicator() {
    return `
      <div class="flux-chat-modal__message flux-chat-modal__message--assistant flux-chat-modal__message--typing">
        <div class="flux-chat-modal__message-avatar">
          ${this.renderBotAvatar()}
        </div>
        
        <div class="flux-chat-modal__message-content">
          <div class="flux-chat-modal__typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render user avatar
   */
  renderUserAvatar() {
    return `
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2"/>
        <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
      </svg>
    `;
  }
  
  /**
   * Render bot avatar
   */
  renderBotAvatar() {
    return `
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
        <circle cx="12" cy="5" r="2" stroke="currentColor" stroke-width="2"/>
        <path d="M12 7V11" stroke="currentColor" stroke-width="2"/>
        <path d="M8 16H8.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M16 16H16.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  }
  
  /**
   * Format message content (basic HTML safety)
   */
  formatMessageContent(content) {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .trim();
  }
  
  /**
   * Format timestamp
   */
  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  /**
   * Render component to DOM - like React render
   */
  render() {
    // Remove existing element
    this.destroy();
    
    // Create new element
    const container = document.createElement('div');
    container.innerHTML = this.template();
    this.element = container.firstElementChild;
    
    // Cache important elements
    this.messageContainer = this.element.querySelector('.flux-chat-modal__messages');
    this.messageInput = this.element.querySelector('.flux-chat-modal__input');
    
    // Append to body
    document.body.appendChild(this.element);
    
    // Bind events
    this.bindEvents();
    
    // Apply initial state
    this.updateDOM();
    
    return this.element;
  }
  
  /**
   * Bind event listeners
   */
  bindEvents() {
    if (!this.element) return;
    
    // Close button
    const closeBtn = this.element.querySelector('.flux-chat-modal__close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.handleClose());
    }
    
    // Minimize button
    const minimizeBtn = this.element.querySelector('.flux-chat-modal__minimize-btn');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', () => this.handleMinimize());
    }
    
    // Backdrop click
    const backdrop = this.element.querySelector('.flux-chat-modal__backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', () => this.handleClose());
    }
    
    // Message form
    const form = this.element.querySelector('.flux-chat-modal__input-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
    
    // Input events
    if (this.messageInput) {
      this.messageInput.addEventListener('input', (e) => this.handleInputChange(e));
      this.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.isVisible) {
        this.handleClose();
      }
    });
  }
  
  /**
   * Handle close button
   */
  handleClose() {
    this.props.onClose();
  }
  
  /**
   * Handle minimize button
   */
  handleMinimize() {
    this.setState({ isMinimized: !this.state.isMinimized });
  }
  
  /**
   * Handle form submit
   */
  handleSubmit(e) {
    e.preventDefault();
    
    const message = this.state.inputValue.trim();
    if (!message) return;
    
    // Send message
    this.props.onSendMessage(message);
    
    // Clear input
    this.setState({ inputValue: '' });
    if (this.messageInput) {
      this.messageInput.value = '';
      this.updateCharCount();
    }
  }
  
  /**
   * Handle input change
   */
  handleInputChange(e) {
    const value = e.target.value;
    this.setState({ inputValue: value });
    this.updateCharCount();
    this.autoResize();
  }
  
  /**
   * Handle key down (Enter to send)
   */
  handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSubmit(e);
    }
  }
  
  /**
   * Update character count
   */
  updateCharCount() {
    const charCount = this.element?.querySelector('.flux-chat-modal__char-count');
    if (charCount && this.messageInput) {
      const count = this.messageInput.value.length;
      charCount.textContent = `${count}/1000`;
      
      if (count > 900) {
        charCount.classList.add('flux-chat-modal__char-count--warning');
      } else {
        charCount.classList.remove('flux-chat-modal__char-count--warning');
      }
    }
  }
  
  /**
   * Auto-resize textarea
   */
  autoResize() {
    if (!this.messageInput) return;
    
    this.messageInput.style.height = 'auto';
    this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
  }
  
  /**
   * Update state - like React setState
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.updateDOM();
  }
  
  /**
   * Update props - like React prop changes
   */
  updateProps(newProps) {
    this.props = { ...this.props, ...newProps };
    this.updateDOM();
  }
  
  /**
   * Update global state from parent
   */
  updateState(globalState) {
    // Update messages and typing state
    this.setState({
      messages: globalState.messages || [],
      isTyping: globalState.isTyping || false
    });
    
    // Auto-scroll to bottom when new messages arrive
    this.scrollToBottom();
  }
  
  /**
   * Update DOM based on state/props
   */
  updateDOM() {
    if (!this.element) return;
    
    // Update visibility
    this.element.style.display = this.state.isVisible ? 'block' : 'none';
    
    // Update minimized state
    if (this.state.isMinimized) {
      this.element.classList.add('flux-chat-modal--minimized');
    } else {
      this.element.classList.remove('flux-chat-modal--minimized');
    }
    
    // Update messages if changed
    if (this.messageContainer) {
      const newMessagesHTML = this.renderMessages() + (this.state.isTyping ? this.renderTypingIndicator() : '');
      if (this.messageContainer.innerHTML !== newMessagesHTML) {
        this.messageContainer.innerHTML = newMessagesHTML;
        this.scrollToBottom();
      }
    }
    
    // Update send button state
    const sendBtn = this.element.querySelector('.flux-chat-modal__send-btn');
    if (sendBtn) {
      const hasText = this.state.inputValue.trim().length > 0;
      sendBtn.disabled = !hasText;
      
      if (hasText) {
        sendBtn.classList.add('flux-chat-modal__send-btn--active');
      } else {
        sendBtn.classList.remove('flux-chat-modal__send-btn--active');
      }
    }
  }
  
  /**
   * Scroll messages to bottom
   */
  scrollToBottom() {
    if (this.messageContainer && !this.state.isMinimized) {
      setTimeout(() => {
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
      }, 100);
    }
  }
  
  /**
   * Show modal with animation
   */
  show() {
    this.setState({ isVisible: true, isMinimized: false });
    
    if (this.element) {
      this.element.classList.add('flux-chat-modal--entering');
      
      setTimeout(() => {
        if (this.element) {
          this.element.classList.remove('flux-chat-modal--entering');
        }
        
        // Focus input
        if (this.messageInput) {
          this.messageInput.focus();
        }
      }, 300);
      
      this.scrollToBottom();
    }
  }
  
  /**
   * Hide modal with animation
   */
  hide() {
    if (this.element) {
      this.element.classList.add('flux-chat-modal--leaving');
      
      setTimeout(() => {
        this.setState({ isVisible: false });
        if (this.element) {
          this.element.classList.remove('flux-chat-modal--leaving');
        }
      }, 300);
    }
  }
  
  /**
   * Cleanup - like componentWillUnmount
   */
  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.element = null;
    this.messageContainer = null;
    this.messageInput = null;
  }
};