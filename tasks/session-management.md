# Session Management Implementation Tasks (Pareto-Focused)

## Core Essentials Only

### Task 1: Create Simple Storage Utility
**File:** `extensions/chat-widget/assets/chat-storage.js`

**What:** Basic localStorage wrapper that handles the essential edge cases

```javascript
class FluxChatStorage {
  constructor(storeId) {
    this.sessionKey = `flux-chat/session-${storeId}`;
  }

  getSessionId() {
    try {
      return localStorage.getItem(this.sessionKey);
    } catch (e) {
      return null; // Private browsing fallback
    }
  }

  createSession() {
    const sessionId = crypto.randomUUID ? crypto.randomUUID() : this.fallbackUUID();
    try {
      localStorage.setItem(this.sessionKey, sessionId);
    } catch (e) {
      // Storage failed, continue without persistence
    }
    return sessionId;
  }

  clearSession() {
    try {
      localStorage.removeItem(this.sessionKey);
    } catch (e) {}
  }

  fallbackUUID() {
    return Date.now().toString(36) + Math.random().toString(36);
  }
}
```

**Why:** Handles 95% of cases with minimal code. No complex validation, just basic error recovery.

### Task 2: Integrate Lazy Session Creation
**File:** `extensions/chat-widget/assets/chat-widget.js`

**What:** Modify `sendMessage()` to create session only on first user message

```javascript
async sendMessage(message) {
  if (!message.trim()) return;

  // Lazy session creation
  let sessionId = this.storage.getSessionId();
  if (!sessionId) {
    sessionId = this.storage.createSession();
    // Clear welcome message on first interaction
    const messagesContainer = this.container.querySelector('.flux-chat-messages');
    const welcomeMessage = messagesContainer.querySelector('.flux-welcome-message');
    if (welcomeMessage) welcomeMessage.remove();
  }

  // Rest of existing sendMessage logic...
  // Just add sessionId to the API payload
}
```

**Why:** Simple implementation of competitor's pattern. No complex state management.

### Task 3: Update Chat API for Sessions
**File:** `app/routes/api.proxy.tsx`

**What:** Add session handling to existing chat API

```javascript
export async function action({ request }: ActionFunctionArgs) {
  const body = await request.json();
  const { messages, sessionId } = body;

  // Save messages to database if sessionId provided
  if (sessionId) {
    await saveConversation(sessionId, session.shop, messages);
  }

  // Existing AI logic stays the same
  const result = await streamText({...});
  return result.toTextStreamResponse();
}
```

**Why:** Minimal changes to working system. Session saving is optional enhancement.

### Task 4: Add "Reset Conversation" Button
**File:** `extensions/chat-widget/assets/chat-widget.js`

**What:** Add reset option to chat header (like competitor)

```javascript
renderModal() {
  return `
    <div class="flux-chat-modal">
      <div class="flux-chat-header">
        <!-- existing header content -->
        <div class="flux-chat-menu">
          <button class="flux-menu-trigger">⋯</button>
          <div class="flux-menu-dropdown">
            <button class="flux-reset-conversation">Reset conversation</button>
          </div>
        </div>
      </div>
      <!-- rest of modal -->
    </div>
  `;
}

resetConversation() {
  this.storage.clearSession();
  // Clear messages and show welcome message
  const messagesContainer = this.container.querySelector('.flux-chat-messages');
  messagesContainer.innerHTML = '<div class="flux-welcome-message">Hi! How can I help you today?</div>';
}
```

**Why:** Essential UX feature that users expect. Simple implementation.

### Task 5: Load Conversation History (Optional Enhancement)
**File:** `app/routes/api.conversations.tsx`

**What:** Simple endpoint to load previous messages

```javascript
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) return json({ messages: [] });

  const messages = await getConversationMessages(sessionId);
  return json({ messages });
}
```

**Why:** Nice-to-have for returning users. Optional if development time is limited.

## What We're NOT Building (Avoiding Over-Engineering)

❌ **User Authentication** - Sessions already provide persistence
❌ **Cross-device sync** - Sessions are browser-specific, which is fine
❌ **Advanced analytics** - Focus on core chat functionality first
❌ **Offline queuing** - Network issues are rare, not worth complexity
❌ **Multi-tab coordination** - Edge case that doesn't affect most users
❌ **Compression/optimization** - Premature optimization
❌ **Session expiry** - Let backend handle cleanup, frontend doesn't care

## FINAL APPROACH: Backend Session Detection (No Frontend Detection!)

**Key Discovery:** Shopify's `authenticate.public.appProxy(request)` provides all context:
- **Store Owner (Admin/Theme Editor):** `session.shop` available
- **Logged-in Customer (Storefront):** `logged_in_customer_id` parameter
- **Anonymous Visitor (Storefront):** Both `session` and `logged_in_customer_id` are null/empty

### New Task 1A: Backend Session Detection (Simplified)
**File:** `app/routes/api.proxy.tsx`

**What:** Let backend handle all session context detection

```javascript
export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  const body = await request.json();
  const { messages, sessionId } = body;

  // Backend determines real session ID based on Shopify context
  let realSessionId;
  if (session) {
    // Store owner in admin/theme editor
    realSessionId = `admin-${session.shop}`;
  } else {
    // Check for logged-in customer
    const customerId = url.searchParams.get('logged_in_customer_id');
    if (customerId) {
      realSessionId = `customer-${customerId}`;
    } else {
      // Anonymous visitor - use frontend UUID
      realSessionId = sessionId;
    }
  }

  // Save conversation with appropriate session ID
  if (realSessionId) {
    await saveConversation(realSessionId, session?.shop || 'anonymous', messages);
  }

  // Existing AI logic stays the same
  const result = await streamText({...});
  return result.toTextStreamResponse();
}
```

**Why:** Backend already knows context - no complex frontend detection needed!

### New Task 1B: Fix Message Persistence in DOM
**File:** `extensions/chat-widget/assets/chat-widget.js`

**What:** Prevent modal re-rendering that destroys messages

```javascript
toggle() {
  this.isOpen = !this.isOpen;
  this.updateModalVisibility(); // Don't call render()!
}

updateModalVisibility() {
  const modal = this.container.querySelector('.flux-chat-modal');
  if (modal) {
    modal.style.display = this.isOpen ? 'flex' : 'none';
  }

  const button = this.container.querySelector('.flux-chat-button');
  if (button) {
    button.classList.toggle('open', this.isOpen);
  }
}
```

**Why:** Core issue - render() destroys messages. Just show/hide existing modal.

### Session Strategy Summary:
1. **Frontend:** Always uses localStorage UUID (simple, no detection)
2. **Backend:** Detects context and maps to appropriate session:
   - Admin session → `admin-{shop}`
   - Customer session → `customer-{id}`
   - Anonymous → frontend UUID

## Implementation Progress

✅ **Task 1 Complete:** FluxChatStorage utility created and integrated into Liquid template
✅ **Task 2 Complete:** Lazy session creation integrated into chat widget
✅ **Task 4 Complete:** Reset conversation button with popover menu
⏳ **Task 1A Pending:** Backend session detection (api.proxy.tsx)
⏳ **Task 1B Pending:** Fix DOM message persistence (chat-widget.js)
⏳ **Task 3 Optional:** Advanced conversation loading from backend
⏳ **Task 5 Optional:** Database conversation history

## Success Criteria

✅ Sessions created only when user actually chats
✅ Sessions persist across page reloads
✅ Users can reset conversations
✅ Works in private browsing (graceful degradation)
✅ No complex error handling needed - simple fallbacks

This gives us 90% of the competitor's functionality with 20% of the complexity.