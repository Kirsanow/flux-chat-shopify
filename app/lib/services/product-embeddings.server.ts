import { PrismaClient } from "@prisma/client";

// Use a dedicated Prisma instance for background operations to avoid connection conflicts
const backgroundPrisma = new PrismaClient();

// Cleanup on process exit
process.on('beforeExit', async () => {
  await backgroundPrisma.$disconnect();
});

/**
 * Generate embeddings for products that don't have them or have outdated embeddings
 */
export async function generateProductEmbeddings(storeId: string, batchSize: number = 10) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured for embeddings');
  }

  console.log(`Starting embedding generation for store: ${storeId}`);

  // Get products without embeddings
  const productsToEmbed = await backgroundPrisma.products.findMany({
    where: {
      store_id: storeId,
      available_for_sale: true,
      status: 'active',
      OR: [
        { embedding: { equals: [] } }, // Empty embedding array
        { last_embedded: null },       // Never embedded
      ]
    },
    select: {
      id: true,
      title: true,
      description: true,
      product_type: true,
      vendor: true,
      tags: true,
      price_min: true,
      price_max: true,
    },
    take: batchSize
  });

  if (productsToEmbed.length === 0) {
    console.log('No products need embedding generation');
    return { embedded: 0, skipped: 0 };
  }

  console.log(`Found ${productsToEmbed.length} products needing embeddings`);

  let embedded = 0;
  let skipped = 0;

  for (const product of productsToEmbed) {
    try {
      // Create embedding text from product data
      const embeddingText = createEmbeddingText(product);

      // Generate embedding via OpenAI
      const embedding = await generateEmbedding(embeddingText);

      // Update product with embedding
      await backgroundPrisma.products.update({
        where: { id: product.id },
        data: {
          embedding: embedding,
          embedding_model: 'text-embedding-3-small',
          last_embedded: new Date(),
          search_metadata: {
            embedding_text: embeddingText,
            embedding_length: embedding.length
          }
        }
      });

      embedded++;
      console.log(`✅ Generated embedding for: ${product.title}`);

    } catch (error) {
      console.error(`❌ Failed to generate embedding for ${product.title}:`, error);
      skipped++;
    }

    // Rate limiting - 100 requests per minute for text-embedding-3-small
    await new Promise(resolve => setTimeout(resolve, 600)); // 600ms delay
  }

  console.log(`Embedding generation complete: ${embedded} embedded, ${skipped} skipped`);
  return { embedded, skipped };
}

/**
 * Create searchable text from product data for embedding generation
 */
function createEmbeddingText(product: any): string {
  const parts = [];

  // Product title (most important)
  parts.push(product.title);

  // Product type and vendor for categorization
  if (product.product_type) parts.push(`Category: ${product.product_type}`);
  if (product.vendor) parts.push(`Brand: ${product.vendor}`);

  // Description for detailed context
  if (product.description) {
    // Clean up HTML and limit length
    const cleanDescription = product.description
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim()
      .slice(0, 500);          // Limit to 500 chars
    parts.push(cleanDescription);
  }

  // Tags for additional context
  if (product.tags && product.tags.length > 0) {
    parts.push(`Features: ${product.tags.join(', ')}`);
  }

  // Price range for budget queries
  if (product.price_min !== null) {
    const minPrice = Number(product.price_min);
    const maxPrice = Number(product.price_max);
    if (minPrice === maxPrice) {
      parts.push(`Price: $${minPrice.toFixed(2)}`);
    } else {
      parts.push(`Price: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`);
    }
  }

  return parts.join(' | ');
}

/**
 * Generate embedding using OpenAI API
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small' // 1536 dimensions, cost-effective
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Regenerate all embeddings for a store (full refresh)
 */
export async function regenerateAllEmbeddings(storeId: string) {
  console.log(`Starting full embedding regeneration for store: ${storeId}`);

  // Clear existing embeddings first
  await backgroundPrisma.products.updateMany({
    where: {
      store_id: storeId,
    },
    data: {
      embedding: [],
      embedding_model: null,
      last_embedded: null,
      search_metadata: null
    }
  });

  // Generate embeddings in batches
  let totalEmbedded = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await generateProductEmbeddings(storeId, 20);
    totalEmbedded += result.embedded;
    hasMore = result.embedded > 0; // Continue if we embedded any products
  }

  console.log(`Full regeneration complete: ${totalEmbedded} products embedded`);
  return { totalEmbedded };
}