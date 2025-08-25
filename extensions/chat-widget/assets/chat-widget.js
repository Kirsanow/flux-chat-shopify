/**
 * FluxChat Widget - Main Entry Point
 * Clean, organized architecture inspired by React components
 */

// Wait for all components and services to load
function waitForDependencies() {
  return new Promise((resolve) => {
    const check = () => {
      if (window.FluxChat?.Components?.ChatButton && 
          window.FluxChat?.Components?.ChatModal &&
          window.FluxChat?.Services?.ChatAPI &&
          window.FluxChat?.Utils?.EventBus) {
        resolve();
      } else {
        setTimeout(check, 10);
      }
    };
    check();
  });
}

// Import our organized modules (after they're loaded)
let ChatButton, ChatModal, ChatAPI, EventBus;

/**
 * Main ChatWidget Class - The "App" component
 */
class ChatWidget {
  constructor(config = {}) {
    this.config = {
      storeId: '',
      apiUrl: '/api/chat',
      position: 'bottom-right',
      theme: 'light',
      welcomeMessage: 'Hi! How can I help you today?',
      ...config
    };
    
    this.state = {
      isOpen: false,
      isConnected: false,
      messages: [],
      isTyping: false
    };
    
    this.components = {};
    this.services = {};
    
    this.init();
  }
  
  /**
   * Initialize the widget - like componentDidMount
   */
  async init() {
    try {
      // Wait for dependencies to load
      await waitForDependencies();
      
      // Get references to our components and services
      ChatButton = window.FluxChat.Components.ChatButton;
      ChatModal = window.FluxChat.Components.ChatModal;
      ChatAPI = window.FluxChat.Services.ChatAPI;
      EventBus = window.FluxChat.Utils.EventBus;
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    } catch (error) {
      console.error('FluxChat: Failed to initialize', error);
    }
  }
  
  /**
   * Setup all components and services
   */
  setup() {
    // Initialize services
    this.services.api = new ChatAPI(this.config);
    this.services.eventBus = new EventBus();
    
    // Initialize components
    this.components.button = new ChatButton({
      position: this.config.position,
      theme: this.config.theme,
      onClick: () => this.toggleChat()
    });
    
    this.components.modal = new ChatModal({
      theme: this.config.theme,
      welcomeMessage: this.config.welcomeMessage,
      onClose: () => this.closeChat(),
      onSendMessage: (message) => this.sendMessage(message)
    });
    
    // Render components
    this.render();
    
    // Setup event listeners
    this.bindEvents();
    
    console.log('FluxChat: Widget initialized successfully');
  }
  
  /**
   * Render all components - like React render
   */
  render() {
    this.components.button.render();
    this.components.modal.render();
  }
  
  /**
   * Bind global event listeners
   */
  bindEvents() {
    // Listen for escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.isOpen) {
        this.closeChat();
      }
    });
    
    // Listen for custom events
    this.services.eventBus.on('message:received', (message) => {
      this.addMessage(message);
    });
    
    this.services.eventBus.on('typing:start', () => {
      this.setState({ isTyping: true });
    });
    
    this.services.eventBus.on('typing:end', () => {
      this.setState({ isTyping: false });
    });
  }
  
  /**
   * State management - like React setState
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.updateUI();
  }
  
  /**
   * Update UI based on state changes
   */
  updateUI() {
    if (this.components.modal) {
      this.components.modal.updateState(this.state);
    }
    
    if (this.components.button) {
      this.components.button.updateState(this.state);
    }
  }
  
  /**
   * Toggle chat modal
   */
  toggleChat() {
    if (this.state.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }
  
  /**
   * Open chat modal
   */
  openChat() {
    this.setState({ isOpen: true });
    this.components.modal.show();
    
    // Auto-send welcome message if first time
    if (this.state.messages.length === 0) {
      this.addMessage({
        role: 'assistant',
        content: this.config.welcomeMessage,
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Close chat modal
   */
  closeChat() {
    this.setState({ isOpen: false });
    this.components.modal.hide();
  }
  
  /**
   * Send message to AI
   */
  async sendMessage(content) {
    if (!content.trim()) return;
    
    // Add user message
    const userMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    
    this.addMessage(userMessage);
    
    // Show typing indicator
    this.setState({ isTyping: true });
    
    try {
      // Send to API
      const response = await this.services.api.sendMessage({
        message: content,
        storeId: this.config.storeId
      });
      
      // Add AI response
      const aiMessage = {
        role: 'assistant',
        content: response.text || 'I apologize, but I encountered an issue. Please try again.',
        timestamp: new Date()
      };
      
      this.addMessage(aiMessage);
      
    } catch (error) {
      console.error('FluxChat: Failed to send message', error);
      
      // Add error message
      this.addMessage({
        role: 'assistant', 
        content: 'Sorry, I\'m having trouble connecting. Please try again in a moment.',
        timestamp: new Date(),
        isError: true
      });
    } finally {
      this.setState({ isTyping: false });
    }
  }
  
  /**
   * Add message to chat
   */
  addMessage(message) {
    this.setState({
      messages: [...this.state.messages, { ...message, id: Date.now() }]
    });
  }
  
  /**
   * Cleanup - like componentWillUnmount
   */
  destroy() {
    if (this.components.button) this.components.button.destroy();
    if (this.components.modal) this.components.modal.destroy();
    
    document.removeEventListener('keydown', this.handleKeyDown);
    this.services.eventBus.removeAllListeners();
  }
}

/**
 * Auto-initialize when script loads
 */
(() => {
  // Wait for FluxChatConfig to be available
  const initWidget = () => {
    if (window.FluxChatConfig) {
      window.FluxChatWidget = new ChatWidget(window.FluxChatConfig);
    } else {
      // Fallback config
      console.warn('FluxChat: No config found, using defaults');
      window.FluxChatWidget = new ChatWidget();
    }
  };
  
  // Initialize immediately or wait for config
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    setTimeout(initWidget, 100); // Small delay for config to load
  }
})();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.FluxChatWidget) {
    window.FluxChatWidget.destroy();
  }
});