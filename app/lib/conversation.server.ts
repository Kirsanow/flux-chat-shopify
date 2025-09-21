import prisma from "../db.server";

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
  let conversation = await prisma.conversation.findFirst({
    where: {
      sessionId,
      store: { shopifyDomain: storeId }
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!conversation) {
    // Find or create store record
    let store = await prisma.store.findUnique({
      where: { shopifyDomain: storeId }
    });

    if (!store) {
      // Create basic store record (will be enhanced later)
      store = await prisma.store.create({
        data: {
          storeName: storeId.replace('.myshopify.com', ''),
          shopifyDomain: storeId,
          shopifyAccessToken: '', // Will be updated during proper store setup
          isActive: true
        }
      });
    }

    // Create new conversation
    conversation = await prisma.conversation.create({
      data: {
        sessionId,
        sessionType,
        customerId,
        storeId: store.id
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
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
  const message = await prisma.message.create({
    data: {
      conversationId,
      role,
      content
    }
  });

  // Update conversation lastMessageAt
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() }
  });

  return message;
}

export async function getConversationHistory(
  sessionId: string,
  storeId: string
): Promise<ConversationMessage[] | null> {
  const conversation = await prisma.conversation.findFirst({
    where: {
      sessionId,
      store: { shopifyDomain: storeId }
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true
        }
      }
    }
  });

  return conversation?.messages || null;
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