import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { streamText } from 'ai';
import { aiModel, systemPrompt } from '../lib/ai.server.js';
import { authenticate } from "../shopify.server.js";

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

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let messages: any[] = [];

  try {
    const body = await request.json();
    messages = body.messages;

    // Validate messages array
    if (!Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    // Create streaming response
    const result = await streamText({
      model: aiModel,
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      maxTokens: 500, // Limit response length for testing
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