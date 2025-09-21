// FluxChat Storage Utility - Simple localStorage wrapper with error handling
class FluxChatStorage {
  constructor(storeId) {
    this.storeId = storeId;
    this.sessionKey = `flux-chat/session-${storeId}`;
    this.isStorageSupported = this.checkStorageSupport();
  }

  // Test if localStorage is available (handles private browsing)
  checkStorageSupport() {
    try {
      const test = '__flux_storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('FluxChat: localStorage not available, using session-only mode');
      return false;
    }
  }

  // Get existing session ID from storage
  getSessionId() {
    if (!this.isStorageSupported) {
      return null;
    }

    try {
      const sessionId = localStorage.getItem(this.sessionKey);
      if (sessionId && this.isValidSessionId(sessionId)) {
        return sessionId;
      }
      // Clean up invalid session
      if (sessionId) {
        this.clearSession();
      }
      return null;
    } catch (e) {
      console.warn('FluxChat: Failed to read session', e);
      return null;
    }
  }

  // Create new session and save to storage
  createSession() {
    const sessionId = this.generateSessionId();

    if (this.isStorageSupported) {
      try {
        localStorage.setItem(this.sessionKey, sessionId);
        console.log('FluxChat: Created new session', sessionId);
      } catch (e) {
        console.warn('FluxChat: Failed to save session, continuing without persistence', e);
      }
    }

    return sessionId;
  }

  // Clear session from storage
  clearSession() {
    if (!this.isStorageSupported) {
      return;
    }

    try {
      localStorage.removeItem(this.sessionKey);
      console.log('FluxChat: Session cleared');
    } catch (e) {
      console.warn('FluxChat: Failed to clear session', e);
    }
  }

  // Generate UUID with fallback for older browsers
  generateSessionId() {
    // Use crypto.randomUUID() if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback for older browsers - timestamp + random
    return this.fallbackUUID();
  }

  // Simple UUID fallback that's good enough for session tracking
  fallbackUUID() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${randomPart}-${Math.random().toString(36).substring(2, 6)}`;
  }

  // Basic validation for session ID format
  isValidSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
      return false;
    }

    // Should be either UUID format or our fallback format
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const fallbackPattern = /^[0-9a-z]+-[0-9a-z]+-[0-9a-z]+$/i;

    return uuidPattern.test(sessionId) || fallbackPattern.test(sessionId);
  }

  // Get storage info for debugging
  getStorageInfo() {
    return {
      isSupported: this.isStorageSupported,
      hasSession: !!this.getSessionId(),
      sessionId: this.getSessionId(),
      storeId: this.storeId
    };
  }
}

// Initialize storage when script loads (but don't create session yet)
console.log('FluxChat: Storage utility loaded');