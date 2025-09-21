import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { streamText } from 'ai';
import { aiModel, systemPrompt } from '../lib/ai.server';
import { authenticate } from "../shopify.server";
import { getOrCreateConversation, saveMessage } from '../lib/conversation.server';

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
      customerId: url.searchParams.get('logged_in_customer_id')
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

    // Create streaming response
    const result = await streamText({
      model: aiModel,
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7, // Balanced creativity
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