import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { streamText } from 'ai';
import { aiModel, systemPrompt } from '~/lib/ai.server';
import { cors } from "remix-utils/cors";

export async function action({ request }: ActionFunctionArgs) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    const response = new Response('Method not allowed', { status: 405 });
    return await cors(request, response);
  }

  let messages: any[] = [];

  try {
    const body = await request.json();
    messages = body.messages;

    // Validate messages array
    if (!Array.isArray(messages)) {
      const response = new Response('Invalid messages format', { status: 400 });
      return await cors(request, response);
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

    // Return streaming response with CORS
    const streamResponse = result.toTextStreamResponse({
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

    return await cors(request, streamResponse);

  } catch (error) {
    console.error('Chat API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: messages,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY
    });

    const errorResponse = new Response(
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

    return await cors(request, errorResponse);
  }
}

// Handle preflight CORS requests
export async function loader({ request }: LoaderFunctionArgs) {
  // Handle OPTIONS preflight request
  if (request.method === 'OPTIONS') {
    const response = json({ status: 200 });
    return await cors(request, response);
  }

  // For other GET requests, still return CORS headers
  const response = new Response(null);
  return await cors(request, response);
}