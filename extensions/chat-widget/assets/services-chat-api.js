/**
 * ChatAPI Service - Handles API communication
 * Clean service class for chat API interactions
 */

window.FluxChat = window.FluxChat || {};
window.FluxChat.Services = window.FluxChat.Services || {};

window.FluxChat.Services.ChatAPI = class ChatAPI {
  constructor(config = {}) {
    this.config = {
      apiUrl: '/api/chat',
      timeout: 30000,
      ...config
    };
    
    // AbortController for request cancellation
    this.currentRequest = null;
  }
  
  /**
   * Send message to AI chat API
   */
  async sendMessage(data) {
    // Cancel any existing request
    this.cancelCurrentRequest();
    
    // Create new AbortController
    this.currentRequest = new AbortController();
    
    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: data.message,
          storeId: data.storeId,
          sessionId: this.getSessionId(),
          timestamp: new Date().toISOString()
        }),
        signal: this.currentRequest.signal,
        timeout: this.config.timeout
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Clear the current request since it completed successfully
      this.currentRequest = null;
      
      return {
        text: result.text || result.message || '',
        timestamp: new Date(),
        ...result
      };
      
    } catch (error) {
      // Clear the current request
      this.currentRequest = null;
      
      if (error.name === 'AbortError') {
        console.log('FluxChat: Request was cancelled');
        throw new Error('Request was cancelled');
      }
      
      console.error('FluxChat: API request failed', error);
      throw error;
    }
  }
  
  /**
   * Stream messages from AI (for future streaming implementation)
   */
  async streamMessage(data, onChunk, onComplete) {
    // Cancel any existing request
    this.cancelCurrentRequest();
    
    // Create new AbortController
    this.currentRequest = new AbortController();
    
    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message: data.message,
          storeId: data.storeId,
          sessionId: this.getSessionId(),
          stream: true,
          timestamp: new Date().toISOString()
        }),
        signal: this.currentRequest.signal
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { value, done } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const chunk = JSON.parse(line.slice(6));
              onChunk(chunk);
            } catch (e) {
              console.warn('FluxChat: Failed to parse streaming chunk', e);
            }
          }
        }
      }
      
      // Clear the current request since it completed successfully
      this.currentRequest = null;
      
      if (onComplete) {
        onComplete();
      }
      
    } catch (error) {
      // Clear the current request
      this.currentRequest = null;
      
      if (error.name === 'AbortError') {
        console.log('FluxChat: Stream was cancelled');
        throw new Error('Stream was cancelled');
      }
      
      console.error('FluxChat: Stream request failed', error);
      throw error;
    }
  }
  
  /**
   * Cancel current API request
   */
  cancelCurrentRequest() {
    if (this.currentRequest) {
      this.currentRequest.abort();
      this.currentRequest = null;
    }
  }
  
  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('flux-chat-session-id');
    
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('flux-chat-session-id', sessionId);
    }
    
    return sessionId;
  }
  
  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Clear session (for logout/reset)
   */
  clearSession() {
    sessionStorage.removeItem('flux-chat-session-id');
  }
  
  /**
   * Health check for API
   */
  async healthCheck() {
    try {
      const response = await fetch(this.config.apiUrl.replace('/chat', '/health'), {
        method: 'GET',
        timeout: 5000
      });
      
      return response.ok;
    } catch (error) {
      console.warn('FluxChat: Health check failed', error);
      return false;
    }
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
};