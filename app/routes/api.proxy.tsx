import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { streamText, stepCountIs } from 'ai';
import { aiModel, systemPrompt } from '../lib/ai.server';
import { authenticate } from "../shopify.server";
import { getOrCreateConversation, saveMessage } from '../lib/conversation.server';
import { randomUUID } from "crypto";
import { searchProducts } from '../lib/ai/product-tools.server';
import prisma from '../db.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.public.appProxy(request);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Handle health check or GET requests
  return new Response(JSON.stringify({ status: "FluxChat proxy active" }), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let messages: any[] = [];
  let sessionId: string | null = null;

  try {
    const body = await request.json();
    messages = body.messages;
    sessionId = body.sessionId;

    // Backend session detection based on Shopify context
    let realSessionId: string;
    let sessionType: string;
    let storeId: string;

    if (session) {
      // Store owner in admin/theme editor
      realSessionId = `admin-${session.shop}`;
      sessionType = 'admin';
      storeId = session.shop;
    } else {
      // Check for logged-in customer
      const customerId = url.searchParams.get('logged_in_customer_id');
      const shopDomain = url.searchParams.get('shop');

      if (!shopDomain) {
        return new Response('Missing shop parameter', { status: 400 });
      }

      storeId = shopDomain;

      if (customerId) {
        realSessionId = `customer-${customerId}`;
        sessionType = 'customer';
      } else {
        // Anonymous visitor - use frontend UUID or create new
        realSessionId = sessionId || `anon-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        sessionType = 'anonymous';
      }
    }

    console.log('FluxChat Session Detection:', {
      realSessionId,
      sessionType,
      storeId,
      hasShopifySession: !!session,
      sessionObject: session,
      customerId: url.searchParams.get('logged_in_customer_id'),
      shopParam: url.searchParams.get('shop'),
      frontendSessionId: sessionId
    });

    // Validate messages array
    if (!Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation(
      realSessionId,
      sessionType,
      storeId,
      sessionType === 'customer' ? url.searchParams.get('logged_in_customer_id') || undefined : undefined
    );

    // Save user message if this is a new message (not just loading conversation)
    const userMessage = messages[messages.length - 1];
    if (userMessage && userMessage.role === 'user' && conversation) {
      await saveMessage(conversation.id, 'user', userMessage.content);
    }

    // Get store record with AI instructions
    const store = await prisma.stores.findUnique({
      where: { shopify_domain: storeId },
      select: {
        id: true,
        ai_config: true,
        store_name: true
      }
    });

    // Extract merchant instructions from AI config
    const merchantInstructions = store?.ai_config && typeof store.ai_config === 'object'
      ? (store.ai_config as any).instructions || ''
      : '';

    // Get a sample of products to understand what the store sells
    const sampleProducts = await prisma.products.findMany({
      where: {
        store_id: store?.id || storeId,
        available_for_sale: true,
        status: 'active'
      },
      select: {
        title: true,
        product_type: true
      },
      take: 5
    });

    const productTypes = [...new Set(sampleProducts.map(p => p.product_type).filter(Boolean))];
    const productNames = sampleProducts.map(p => p.title).slice(0, 3);

    // Create enhanced system prompt with store context
    const enhancedSystemPrompt = `${systemPrompt}

STORE CONTEXT:
- Store Name: ${store?.store_name || 'Our Store'}
- You are the AI assistant for THIS specific store
${productTypes.length > 0 ? `- Main Product Categories: ${productTypes.join(', ')}` : ''}
${productNames.length > 0 ? `- Example Products: ${productNames.join(', ')}` : ''}

${merchantInstructions ? `Store-Specific Sales Instructions:
${merchantInstructions}` : ''}

CRITICAL INSTRUCTIONS:
1. When customers ask "what products do you have" or similar, IMMEDIATELY use searchProducts with a broad query
2. Always pass "${store?.id || storeId}" as the storeId parameter when using searchProducts
3. Show enthusiasm about the actual products in THIS store's inventory
4. Never pretend you don't know what products are available - you have direct access via searchProducts tool`;

    // Create streaming response with product search tools
    const result = await streamText({
      model: aiModel,
      system: enhancedSystemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      tools: {
        searchProducts
      },
      toolChoice: 'auto',
      stopWhen: stepCountIs(3), // Allow tool call + response
      temperature: 0.7, // Balanced creativity
      onFinish: async (result) => {
        // Save the complete AI response when streaming finishes
        if (conversation && result.text) {
          console.log('Saving AI response:', result.text);
          await saveMessage(conversation.id, 'assistant', result.text);
        }
      },
    });

    // Return streaming response
    return result.toTextStreamResponse({
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API Proxy error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: messages,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY
    });

    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}