# FluxChat - Shopify AI Assistant

## Project Overview

FluxChat is a Shopify-native AI chat assistant that helps customers find products, get recommendations, and make purchases directly in the chat interface.

## Key Features

- **Inventory-aware AI** - Knows real-time stock levels and suggests alternatives
- **Smart product recommendations** - Upselling and cross-selling based on store data
- **Visual product cards** - Show products with images, prices, variants in chat
- **Direct add-to-cart** - Customers can purchase without leaving chat
- **Store context awareness** - Custom AI instructions per store

## Value Proposition

AI sales manager that understands your entire product catalog and helps customers find exactly what they need while maximizing sales through intelligent recommendations.

## Technical Architecture

### Shopify Remix App Structure

```
flux-chat-shopify/
├── app/
│   ├── routes/                    # Admin dashboard routes
│   ├── lib/
│   │   ├── ai.ts                 # AI integration (Vercel AI SDK)
│   │   ├── db.ts                 # Supabase connection
│   │   └── shopify.ts            # Shopify API helpers
│   └── types/
│       └── chat.ts               # Chat message types
├── extensions/
│   └── theme-app/                # Storefront chat widget
│       ├── blocks/
│       └── assets/
├── prisma/                       # Database schema (or direct Supabase)
└── shopify.app.toml
```

### Database Schema (Supabase)

#### Core Tables

1. **user_profiles** - Store owner profiles
2. **stores** - Shopify store configurations with AI settings
3. **products** - Cached product data for AI search
4. **conversations** - Chat history and sessions

#### AI Configuration per Store

```json
{
  "personality": "professional|friendly|casual",
  "custom_instructions": "We offer free shipping over $50",
  "business_hours": "9-5 EST",
  "features": {
    "upselling": true,
    "inventory_alerts": true,
    "recommendations": true
  }
}
```

## Implementation Steps

### Phase 1: Setup & Foundation (Week 1)

1. **Create Shopify App**
   ```bash
   shopify app create flux-chat
   # Choose: Remix
   ```

2. **Setup Database**
   - Configure Supabase project
   - Create database tables (same schema as discussed)
   - Add environment variables

3. **Basic App Structure**
   - Shopify OAuth authentication
   - Admin dashboard layout (Polaris)
   - Basic store configuration

### Phase 2: Core Chat System (Week 2)

4. **Theme App Extension**
   - Create theme app extension for chat widget
   - Floating chat button (Liquid + CSS)
   - Chat interface modal/panel
   - Basic message display

5. **AI Integration**
   - Install Vercel AI SDK
   - Create chat API route (/api/chat)
   - Connect to OpenAI/Anthropic
   - Basic product knowledge integration

6. **Product Sync**
   - Shopify product webhook handlers
   - Cache products in Supabase
   - Real-time inventory checks

### Phase 3: Advanced Features (Week 3)

7. **Smart Recommendations**
   - Product similarity algorithms
   - Upselling/cross-selling logic
   - Out-of-stock alternatives

8. **Visual Product Cards**
   - Product card component (Liquid template)
   - Add-to-cart functionality via Shopify Ajax API
   - Variant selection in chat

9. **Store Configuration**
   - Admin dashboard for AI settings
   - Custom instructions editor
   - Feature toggles

### Phase 4: Polish & Launch (Week 4)

10. **Testing & QA**
    - Test with development stores
    - Mobile responsiveness
    - Performance optimization

11. **App Store Submission**
    - App listing preparation
    - Screenshots and videos
    - Privacy policy and terms

## Key Components to Build

### Admin Dashboard (Polaris)
- Store configuration page
- Chat analytics and history
- AI personality settings
- Feature management

### Theme Extension (Liquid + JS)
- Floating chat button
- Chat interface modal
- Message bubbles (user/AI)
- Product card display
- Add-to-cart integration

### API Routes (Remix)
- `/api/chat` - Main AI chat endpoint
- `/api/products/sync` - Product synchronization
- `/api/webhooks/*` - Shopify webhook handlers

## Data Flow

1. Customer opens chat → Theme extension loads
2. User sends message → POST to `/api/chat`
3. AI processes → Searches products, generates response
4. Response with products → Theme displays product cards
5. Add to cart → Shopify Ajax API → Cart updated

## Environment Variables Needed

```bash
# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# AI Service
OPENAI_API_KEY=
# or ANTHROPIC_API_KEY=

# Shopify (auto-generated)
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
```

## Competitive Advantages

- **Superior AI** - More advanced than basic Shopify apps
- **Real-time inventory** - Always accurate stock info
- **Visual shopping** - Rich product cards vs text-only
- **Native integration** - Seamless Shopify experience
- **Smart upselling** - AI-driven recommendations

## Success Metrics

- Installation rate and onboarding completion
- Chat engagement (messages per session)
- Conversion rate (chat users → purchases)
- Revenue attribution per store
- Customer satisfaction ratings

## Shopify Theme App Extensions - App Embeds Guide

### Correct Structure for App Embeds

App embeds are blocks that appear site-wide and can be toggled on/off in the theme editor under "App embeds". Here's the correct way to create them:

#### 1. Extension Configuration (`shopify.extension.toml`)
```toml
name = "chat-widget"
type = "theme"
```

**Important**: Use `type = "theme"` NOT `type = "app_embed"`. The latter is not a valid extension type.

#### 2. Directory Structure
```
extensions/
└── chat-widget/
    ├── shopify.extension.toml
    ├── blocks/
    │   └── chat-widget.liquid    # Your app embed block
    ├── assets/
    │   ├── chat-widget.css
    │   ├── chat-widget.js
    │   └── (other assets)
    └── locales/
        └── en.default.json
```

#### 3. App Embed Block Configuration

In your `blocks/chat-widget.liquid` file:

```liquid
{% comment %}
  Your app embed block - appears in theme editor App embeds section
{% endcomment %}

<!-- Your HTML/CSS/JS here -->

{% schema %}
{
  "name": "FluxChat Widget",
  "target": "body",
  "settings": [
    {
      "type": "select",
      "id": "position", 
      "label": "Widget Position",
      "options": [
        { "value": "bottom-right", "label": "Bottom Right" },
        { "value": "bottom-left", "label": "Bottom Left" }
      ],
      "default": "bottom-right"
    }
  ]
}
{% endschema %}
```

#### 4. Key Points

- **Target Options**: Use `"target": "body"`, `"target": "head"`, or `"target": "compliance_head"`
- **Settings Access**: Use `{{ block.settings.setting_name | json }}` in liquid
- **Merchant Control**: App embeds are disabled by default; merchants enable them in theme editor
- **Site-wide**: App embeds load on all pages when enabled

#### 5. Common Mistakes to Avoid

❌ Don't use `type = "app_embed"` in TOML  
❌ Don't create `app_embed.liquid` in root  
❌ Don't use `app.embeds.extension_name.settings`  

✅ Use `type = "theme"` in TOML  
✅ Create blocks in `blocks/` directory  
✅ Use `block.settings` for settings access  

### Deployment

After setting up the correct structure:
```bash
shopify app deploy
```

The app embed will appear in theme editor under "App embeds" section where merchants can toggle it on/off and configure settings.

---

**Next Steps**: Create new repo, run `shopify app create`, and start with Phase 1 setup.