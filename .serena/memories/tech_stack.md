# FluxChat Tech Stack

## Core Framework
- **Shopify Remix App**: Full-stack web framework for Shopify integration
- **TypeScript**: Type-safe development with strict typing
- **Vite**: Build tool with HMR for development
- **Node.js**: Runtime (^18.20 || ^20.10 || >=21.0.0)

## Frontend
- **React 18**: UI library for admin dashboard
- **Shopify Polaris**: Design system for admin interface
- **Vanilla JavaScript**: Chat widget (for theme extension compatibility)
- **CSS**: Custom styling for widget with responsive design

## Backend & Database
- **Prisma**: Database ORM with type generation
- **Supabase**: PostgreSQL database with real-time capabilities
- **Shopify API**: Store data, products, and authentication

## AI & Chat
- **Vercel AI SDK**: Streaming AI responses and chat management
- **OpenAI GPT-4**: AI model for product recommendations
- **localStorage**: Client-side session persistence

## Development Tools
- **ESLint**: Code linting with Remix configuration
- **Prettier**: Code formatting
- **TypeScript**: Type checking and IntelliSense
- **Shopify CLI**: App development and deployment

## Deployment
- **Shopify App Store**: Distribution platform
- **Theme App Extensions**: Storefront integration
- **App Proxy**: Secure API communication

## Key Dependencies
- `@shopify/shopify-app-remix`: Shopify integration
- `@ai-sdk/openai`: AI model integration  
- `@supabase/supabase-js`: Database client
- `ai`: Vercel AI SDK for streaming
- `prisma`: Database management
- `remix-utils`: Utilities like CORS handling