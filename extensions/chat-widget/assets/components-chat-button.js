/**
 * ChatButton Component - Floating chat button
 * Clean, self-contained component like a React component
 */

window.FluxChat = window.FluxChat || {};
window.FluxChat.Components = window.FluxChat.Components || {};

window.FluxChat.Components.ChatButton = class ChatButton {
  constructor(props = {}) {
    this.props = {
      position: 'bottom-right',
      theme: 'light',
      onClick: () => {},
      ...props
    };
    
    this.state = {
      isVisible: true,
      hasUnread: false,
      isHovered: false
    };
    
    this.element = null;
    this.id = 'flux-chat-button';
  }
  
  /**
   * Component template - like JSX
   */
  template() {
    return `
      <button 
        id="${this.id}"
        class="flux-chat-button flux-chat-button--${this.props.position} flux-chat-button--${this.props.theme}"
        type="button"
        aria-label="Open chat"
        title="Chat with us"
      >
        <div class="flux-chat-button__icon">
          <svg class="flux-chat-button__icon-chat" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C10.3596 22 8.82946 21.6284 7.49543 20.9654L3 22L4.03456 17.5046C3.37164 16.1705 3 14.6404 3 13C3 7.47715 7.47715 3 13 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 12H8.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 12H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16 12H16.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          
          <svg class="flux-chat-button__icon-close" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        
        ${this.state.hasUnread ? '<div class="flux-chat-button__badge"></div>' : ''}
        
        <div class="flux-chat-button__pulse"></div>
      </button>
    `;
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
    
    this.element.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleClick();
    });
    
    this.element.addEventListener('mouseenter', () => {
      this.setState({ isHovered: true });
    });
    
    this.element.addEventListener('mouseleave', () => {
      this.setState({ isHovered: false });
    });
  }
  
  /**
   * Handle button click
   */
  handleClick() {
    // Add click animation
    this.element.classList.add('flux-chat-button--clicked');
    
    setTimeout(() => {
      if (this.element) {
        this.element.classList.remove('flux-chat-button--clicked');
      }
    }, 200);
    
    // Call onClick prop
    this.props.onClick();
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
    // Update button based on global chat state
    if (this.element) {
      if (globalState.isOpen) {
        this.element.classList.add('flux-chat-button--active');
      } else {
        this.element.classList.remove('flux-chat-button--active');
      }
    }
  }
  
  /**
   * Update DOM based on state/props
   */
  updateDOM() {
    if (!this.element) return;
    
    // Update visibility
    this.element.style.display = this.state.isVisible ? 'flex' : 'none';
    
    // Update theme classes
    this.element.className = `flux-chat-button flux-chat-button--${this.props.position} flux-chat-button--${this.props.theme}`;
    
    // Update hover state
    if (this.state.isHovered) {
      this.element.classList.add('flux-chat-button--hovered');
    } else {
      this.element.classList.remove('flux-chat-button--hovered');
    }
    
    // Update unread badge
    const existingBadge = this.element.querySelector('.flux-chat-button__badge');
    if (this.state.hasUnread && !existingBadge) {
      this.element.insertAdjacentHTML('beforeend', '<div class="flux-chat-button__badge"></div>');
    } else if (!this.state.hasUnread && existingBadge) {
      existingBadge.remove();
    }
  }
  
  /**
   * Show unread indicator
   */
  showUnread() {
    this.setState({ hasUnread: true });
  }
  
  /**
   * Hide unread indicator
   */
  hideUnread() {
    this.setState({ hasUnread: false });
  }
  
  /**
   * Show button with animation
   */
  show() {
    this.setState({ isVisible: true });
    if (this.element) {
      this.element.classList.add('flux-chat-button--entering');
      setTimeout(() => {
        if (this.element) {
          this.element.classList.remove('flux-chat-button--entering');
        }
      }, 300);
    }
  }
  
  /**
   * Hide button with animation
   */
  hide() {
    if (this.element) {
      this.element.classList.add('flux-chat-button--leaving');
      setTimeout(() => {
        this.setState({ isVisible: false });
        if (this.element) {
          this.element.classList.remove('flux-chat-button--leaving');
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
  }
};