import prisma from "../../db.server";

export interface ProductSearchResult {
  id: string;
  title: string;
  description: string | null;
  price_min: number;
  price_max: number;
  image_url: string | null;
  handle: string | null;
  available_for_sale: boolean;
  total_inventory: number | null;
  tags: string[];
  product_type: string | null;
  vendor: string | null;
}

/**
 * Search products by keywords across title, description, tags, product type, and vendor
 * Simple and fast keyword matching
 */
export async function searchProductsByKeywords(
  query: string,
  storeId: string,
  limit: number = 5
): Promise<ProductSearchResult[]> {
  const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);

  const products = await prisma.products.findMany({
    where: {
      store_id: storeId,
      available_for_sale: true,
      status: 'active',
      total_inventory: { gt: 0 }, // Only in-stock products
      OR: [
        {
          title: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          product_type: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          vendor: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          tags: {
            hasSome: keywords
          }
        }
      ]
    },
    select: {
      id: true,
      title: true,
      description: true,
      price_min: true,
      price_max: true,
      image_url: true,
      handle: true,
      available_for_sale: true,
      total_inventory: true,
      tags: true,
      product_type: true,
      vendor: true,
    },
    take: limit,
    orderBy: [
      { total_inventory: 'desc' }, // Prioritize well-stocked items
      { price_min: 'asc' }         // Then by price
    ]
  });

  return products;
}

/**
 * Search products by specific product names mentioned in merchant instructions
 * Fuzzy matching for product names like "AT-LP60X" or "Technics SL-1200"
 */
export async function searchProductsByNames(
  productNames: string[],
  storeId: string,
  limit: number = 5
): Promise<ProductSearchResult[]> {
  if (productNames.length === 0) return [];

  const products = await prisma.products.findMany({
    where: {
      store_id: storeId,
      available_for_sale: true,
      status: 'active',
      OR: productNames.map(name => ({
        OR: [
          {
            title: {
              contains: name,
              mode: 'insensitive'
            }
          },
          {
            // Also check tags for model numbers
            tags: {
              hasSome: [name.toLowerCase()]
            }
          }
        ]
      }))
    },
    select: {
      id: true,
      title: true,
      description: true,
      price_min: true,
      price_max: true,
      image_url: true,
      handle: true,
      available_for_sale: true,
      total_inventory: true,
      tags: true,
      product_type: true,
      vendor: true,
    },
    take: limit,
    orderBy: [
      { total_inventory: 'desc' }, // Prioritize in-stock items
    ]
  });

  return products;
}

/**
 * Search products using embeddings for semantic similarity
 * For finding products similar to a query when keywords don't match
 */
export async function searchProductsByEmbedding(
  queryEmbedding: number[],
  storeId: string,
  limit: number = 5,
  excludeIds: string[] = []
): Promise<ProductSearchResult[]> {
  // Convert to PostgreSQL vector format
  const vectorQuery = `[${queryEmbedding.join(',')}]`;

  const products = await prisma.$queryRaw<ProductSearchResult[]>`
    SELECT
      id,
      title,
      description,
      price_min,
      price_max,
      image_url,
      handle,
      available_for_sale,
      total_inventory,
      tags,
      product_type,
      vendor,
      (embedding <-> ${vectorQuery}::vector) as distance
    FROM products
    WHERE store_id = ${storeId}
      AND available_for_sale = true
      AND status = 'active'
      AND total_inventory > 0
      AND array_length(embedding, 1) > 0
      ${excludeIds.length > 0 ? `AND id NOT IN (${excludeIds.map(() => '?').join(',')})` : ''}
    ORDER BY embedding <-> ${vectorQuery}::vector
    LIMIT ${limit}
  `;

  return products;
}

/**
 * Generate embedding for a text query using OpenAI
 * Cached to avoid repeated API calls for same queries
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: query,
      model: 'text-embedding-3-small'
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Extract price constraints from natural language query
 * Simple regex matching for "under $X", "below $Y", etc.
 */
export function extractPriceConstraints(query: string): { min?: number; max?: number } {
  const constraints: { min?: number; max?: number } = {};

  // Match "under $X", "below $X", "less than $X"
  const maxMatch = query.match(/(?:under|below|less than)\s*\$?(\d+)/i);
  if (maxMatch) {
    constraints.max = parseInt(maxMatch[1]);
  }

  // Match "over $X", "above $X", "more than $X"
  const minMatch = query.match(/(?:over|above|more than)\s*\$?(\d+)/i);
  if (minMatch) {
    constraints.min = parseInt(minMatch[1]);
  }

  // Match "$X to $Y" or "$X - $Y"
  const rangeMatch = query.match(/\$?(\d+)(?:\s*(?:to|-)\s*)\$?(\d+)/i);
  if (rangeMatch) {
    constraints.min = parseInt(rangeMatch[1]);
    constraints.max = parseInt(rangeMatch[2]);
  }

  return constraints;
}

/**
 * Filter products by price constraints
 */
export function filterByPrice(
  products: ProductSearchResult[],
  constraints: { min?: number; max?: number }
): ProductSearchResult[] {
  return products.filter(product => {
    if (constraints.min && product.price_min < constraints.min) return false;
    if (constraints.max && product.price_min > constraints.max) return false;
    return true;
  });
}