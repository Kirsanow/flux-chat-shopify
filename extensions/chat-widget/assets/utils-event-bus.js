/**
 * EventBus Utility - Simple event system for component communication
 * Clean event bus implementation like React's event system
 */

window.FluxChat = window.FluxChat || {};
window.FluxChat.Utils = window.FluxChat.Utils || {};

window.FluxChat.Utils.EventBus = class EventBus {
  constructor() {
    this.events = {};
    this.maxListeners = 50; // Prevent memory leaks
  }
  
  /**
   * Subscribe to an event
   */
  on(event, callback) {
    if (typeof callback !== 'function') {
      console.warn('FluxChat EventBus: Callback must be a function');
      return;
    }
    
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    // Prevent memory leaks
    if (this.events[event].length >= this.maxListeners) {
      console.warn(`FluxChat EventBus: Maximum listeners (${this.maxListeners}) exceeded for event "${event}"`);
      return;
    }
    
    this.events[event].push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }
  
  /**
   * Subscribe to an event (one-time only)
   */
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    
    return this.on(event, wrapper);
  }
  
  /**
   * Unsubscribe from an event
   */
  off(event, callback) {
    if (!this.events[event]) return;
    
    if (!callback) {
      // Remove all listeners for this event
      delete this.events[event];
      return;
    }
    
    const index = this.events[event].indexOf(callback);
    if (index > -1) {
      this.events[event].splice(index, 1);
      
      // Clean up empty arrays
      if (this.events[event].length === 0) {
        delete this.events[event];
      }
    }
  }
  
  /**
   * Emit an event to all subscribers
   */
  emit(event, ...args) {
    if (!this.events[event]) return;
    
    // Create a copy to avoid issues if listeners modify the array
    const listeners = [...this.events[event]];
    
    listeners.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`FluxChat EventBus: Error in event "${event}" listener:`, error);
      }
    });
  }
  
  /**
   * Get list of events with listener counts
   */
  getEvents() {
    const eventList = {};
    
    for (const [event, listeners] of Object.entries(this.events)) {
      eventList[event] = listeners.length;
    }
    
    return eventList;
  }
  
  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.events = {};
  }
  
  /**
   * Get listener count for an event
   */
  listenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }
  
  /**
   * Set maximum number of listeners per event
   */
  setMaxListeners(max) {
    this.maxListeners = max;
  }
  
  /**
   * Check if event has any listeners
   */
  hasListeners(event) {
    return !!(this.events[event] && this.events[event].length > 0);
  }
};