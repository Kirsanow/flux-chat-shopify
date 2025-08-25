import type { ActionFunctionArgs } from "@remix-run/node";
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    throw new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { session } = await authenticate.admin(request);
    const { message, storeId } = await request.json();

    // Get store with AI config
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return new Response(
        JSON.stringify({ error: "Store not found" }), 
        { 
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // We'll use our own API keys based on subscription
    const aiConfig = store.aiConfig as any || {};

    // Build simple system prompt
    let systemPrompt = `You are a helpful shopping assistant for ${store.storeName}.`;
    
    if (aiConfig.personality === "professional") {
      systemPrompt += " Speak professionally and formally.";
    } else if (aiConfig.personality === "casual") {
      systemPrompt += " Speak casually and relaxed.";
    } else {
      systemPrompt += " Speak in a friendly and helpful manner.";
    }

    if (aiConfig.customInstructions) {
      systemPrompt += ` Additional instructions: ${aiConfig.customInstructions}`;
    }

    systemPrompt += ` Keep responses concise and helpful. Focus on helping customers with their shopping needs.`;

    // Use our own API keys from environment
    // Later: Choose model based on subscription tier
    const model = openai('gpt-4o-mini'); // Default model for now
    
    // Get AI response with streaming
    const result = streamText({
      model,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
      maxTokens: 500,
      temperature: 0.7,
      onFinish: async ({ text: responseText }) => {
        // Save conversation when streaming is complete
        try {
          const conversation = await prisma.conversation.create({
            data: {
              storeId: store.id,
              sessionId: `test-${Date.now()}`,
              status: "active",
            },
          });

          await prisma.message.createMany({
            data: [
              {
                conversationId: conversation.id,
                role: "user",
                content: message,
                metadata: { timestamp: Date.now() }
              },
              {
                conversationId: conversation.id,
                role: "assistant", 
                content: responseText,
                metadata: { timestamp: Date.now() }
              }
            ]
          });
        } catch (dbError) {
          console.error("Failed to save conversation:", dbError);
        }
      }
    });

    // Return streaming response for useChat hook
    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to process chat request. Please check your API key and try again.",
        success: false 
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};