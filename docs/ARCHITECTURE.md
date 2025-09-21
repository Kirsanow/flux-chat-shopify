# FluxChat Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────┐
│   Shopify Store     │
│   (Frontend)        │
├─────────────────────┤
│  • Chat Widget      │
│  • Theme Extension  │
│  • App Embed Block  │
└──────────┬──────────┘
           │ HTTPS (Proxy)
           ▼
┌─────────────────────┐
│   Shopify CDN       │
│   (App Proxy)       │
├─────────────────────┤
│  • Authentication   │
│  • Request Routing  │
│  • Security Layer   │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│   Remix App Server  │
│   (Backend)         │
├─────────────────────┤
│  • API Routes       │
│  • AI Integration   │
│  • Session Mgmt     │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│   External Services │
├─────────────────────┤
│  • OpenAI API       │
│  • Supabase DB      │
│  • Shopify Admin    │
└─────────────────────┘
```

## Component Details

### 1. Chat Widget (Frontend)

**Location**: `extensions/chat-widget/assets/chat-widget.js`

**Responsibilities**:
- Render chat UI elements
- Handle user interactions
- Manage message state
- Process streaming responses
- Maintain conversation context

**Key Features**:
```javascript
class FluxChatWidget {
  constructor(container)     // Initialize widget
  sendMessage(message)       // Send to API
  addMessageToChat(role)     // Display messages
  updateMessage(id, content) // Stream updates
  getConversationHistory()   // Context management
}
```

### 2. Theme App Extension

**Location**: `extensions/chat-widget/`

**Structure**:
```
chat-widget/
├── blocks/
│   └── chat-widget.liquid    # App embed configuration
├── assets/
│   ├── chat-widget.js       # Main widget logic
│   └── chat-widget.css      # Styling
└── locales/
    └── en.default.json      # Translations
```

**App Embed Settings**:
- Position: Bottom right/left
- Theme: Professional/Modern/Minimal
- Welcome message customization

### 3. API Routes

#### App Proxy Route (`api.proxy.tsx`)

**Purpose**: Handle chat requests through Shopify's proxy

**Authentication Flow**:
```typescript
const { session } = await authenticate.public.appProxy(request);
if (!session) return new Response("Unauthorized", { status: 401 });
```

**Request Processing**:
1. Validate session
2. Parse message payload
3. Stream AI response
4. Return text stream

#### Direct API Route (`api.chat.tsx`)

**Purpose**: Alternative endpoint with CORS support (not used in production)

**Features**:
- CORS headers via remix-utils
- OPTIONS preflight handling
- Direct streaming response

### 4. AI Integration

**Location**: `app/lib/ai.server.ts`

**Configuration**:
```typescript
export const aiModel = openai('gpt-4o-mini', {
  // Model configuration
});

export const systemPrompt = `
  You are FluxChat, an intelligent AI shopping assistant...
`;
```

**Integration Points**:
- Vercel AI SDK for streaming
- OpenAI API for completions
- Customizable prompts per store

## Data Flow

### Message Processing Pipeline

1. **User Input**
   ```
   User types message → Widget captures input
   ```

2. **API Request**
   ```javascript
   POST /apps/flux-chat/api/proxy
   Headers: {
     'Content-Type': 'application/json',
     'ngrok-skip-browser-warning': 'true'
   }
   Body: { messages: [...conversation] }
   ```

3. **Proxy Routing**
   ```
   Shopify receives → Authenticates → Forwards to app server
   ```

4. **AI Processing**
   ```typescript
   streamText({
     model: aiModel,
     system: systemPrompt,
     messages: messages,
     maxTokens: 500,
     temperature: 0.7
   })
   ```

5. **Response Streaming**
   ```
   AI generates → Server streams → Widget displays
   ```

## Security Architecture

### Authentication Layers

1. **Shopify App Proxy**
   - Validates store origin
   - Adds authentication headers
   - Prevents unauthorized access

2. **Session Validation**
   ```typescript
   authenticate.public.appProxy(request)
   ```

3. **CORS Protection**
   - Not needed with proxy (same-origin)
   - Backup direct API has CORS headers

### Data Protection

- No sensitive data in client-side code
- API keys stored in environment variables
- Session-based authentication
- HTTPS-only communication

## Configuration Management

### Environment Variables

**Development** (`.env`):
```env
NGROK_URL=https://xxx.ngrok-free.app
SHOPIFY_APP_URL=https://xxx.ngrok-free.app
OPENAI_API_KEY=sk-xxx
DATABASE_URL=postgresql://xxx
```

### App Configuration

**Shopify** (`shopify.app.toml`):
```toml
[app_proxy]
url = "https://xxx.ngrok-free.app"
subpath = "flux-chat"
prefix = "apps"
```

### Dynamic URL Management

**Update Script** (`scripts/update-ngrok.js`):
- Updates `.env` file
- Updates `shopify.app.toml`
- Maintains consistency across configs

## Development Workflow

### Local Development Setup

```bash
# 1. Start ngrok tunnel
ngrok http 3000

# 2. Update URLs
bun run update-ngrok https://new-url.ngrok-free.app

# 3. Start dev server
shopify app dev --tunnel-url https://new-url.ngrok-free.app

# 4. Deploy changes
bun run deploy
```

### Build & Deployment

1. **Development Build**
   - Vite handles HMR
   - Remix compiles routes
   - Extensions auto-reload

2. **Production Build**
   ```bash
   bun run build
   bun run deploy
   ```

## Performance Considerations

### Optimizations

1. **Streaming Responses**
   - Better perceived performance
   - Reduced time-to-first-byte
   - Progressive rendering

2. **Message Batching**
   - Send full conversation context
   - Maintain coherent responses
   - Limit context window (500 tokens)

3. **Caching Strategy**
   - Widget assets cached by CDN
   - No server-side caching (real-time)
   - Browser caches static resources

### Scalability

- **Horizontal**: App proxy handles distribution
- **Vertical**: Streaming reduces memory usage
- **Rate Limiting**: Handled by Shopify proxy

## Error Handling

### Client-Side
```javascript
catch (error) {
  console.error('Error details:', {
    message: error.message,
    apiUrl: this.config.apiUrl,
    response: response
  });
  this.updateMessage(id, `Error: ${error.message}`);
}
```

### Server-Side
```typescript
catch (error) {
  console.error('Chat API error:', error);
  return new Response(JSON.stringify({
    error: 'Failed to process request',
    message: error.message
  }), { status: 500 });
}
```

## Testing Strategy

### Current Coverage
- ✅ Manual testing in development
- ✅ Browser console debugging
- ✅ Network inspection for streaming

### Future Testing
- [ ] Unit tests for widget functions
- [ ] Integration tests for API routes
- [ ] E2E tests with Playwright
- [ ] Load testing for scalability

---

*Architecture Version: 1.0*
*Last Updated: September 2025*