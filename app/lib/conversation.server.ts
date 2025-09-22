import prisma from "../db.server";
import { randomUUID } from "crypto";

export interface ConversationMessage {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

export interface ConversationWithMessages {
  id: string;
  sessionId: string;
  sessionType: string;
  lastMessageAt: Date | null;
  messages: ConversationMessage[];
}

export async function getOrCreateConversation(
  sessionId: string,
  sessionType: string,
  storeId: string,
  customerId?: string
) {
  // Find existing conversation
  let conversation = await prisma.conversations.findFirst({
    where: {
      session_id: sessionId,
      stores: { shopify_domain: storeId }
    },
    include: {
      messages: {
        orderBy: { created_at: 'asc' }
      }
    }
  });

  if (!conversation) {
    // Find or create store record
    let store = await prisma.stores.findUnique({
      where: { shopify_domain: storeId }
    });

    if (!store) {
      // Create basic store record (will be enhanced later)
      store = await prisma.stores.create({
        data: {
          id: randomUUID(),
          store_name: storeId.replace('.myshopify.com', ''),
          shopify_domain: storeId,
          shopify_access_token: '', // Will be updated during proper store setup
          is_active: true,
          updated_at: new Date()
        }
      });
    }

    // Create new conversation
    conversation = await prisma.conversations.create({
      data: {
        id: randomUUID(),
        session_id: sessionId,
        session_type: sessionType,
        customer_id: customerId,
        store_id: store.id,
        updated_at: new Date()
      },
      include: {
        messages: {
          orderBy: { created_at: 'asc' }
        }
      }
    });
  }

  return conversation;
}

export async function saveMessage(
  conversationId: string,
  role: string,
  content: string
) {
  const message = await prisma.messages.create({
    data: {
      id: randomUUID(),
      conversation_id: conversationId,
      role,
      content
    }
  });

  // Update conversation lastMessageAt
  await prisma.conversations.update({
    where: { id: conversationId },
    data: { last_message_at: new Date() }
  });

  return message;
}

export async function getConversationHistory(
  sessionId: string,
  storeId: string
): Promise<ConversationMessage[] | null> {
  const conversation = await prisma.conversations.findFirst({
    where: {
      session_id: sessionId,
      stores: { shopify_domain: storeId }
    },
    include: {
      messages: {
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          created_at: true
        }
      }
    }
  });

  // Map database fields to interface fields
  const messages = conversation?.messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.created_at
  })) || null;

  return messages;
}

export function formatDateGroup(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = today.getTime() - messageDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return messageDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}