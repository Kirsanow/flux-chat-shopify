import { tool } from 'ai';
import { z } from 'zod';
import {
  searchProductsByKeywords,
  searchProductsByNames,
  searchProductsByEmbedding,
  generateQueryEmbedding,
  extractPriceConstraints,
  filterByPrice,
  type ProductSearchResult
} from '../services/product-search.server';

/**
 * Product search tool for AI to find products in the store
 * Uses keyword search, semantic search, and price filtering
 */
export const searchProducts = tool({
  description: 'Search for products in the store catalog by keywords, product names, or semantic similarity. Returns available products with pricing and stock information.',
  parameters: z.object({
    query: z.string().describe('The search query - can be keywords, product names, or descriptions'),
    searchType: z.enum(['keyword', 'semantic', 'exact_names']).default('keyword').describe('Type of search to perform'),
    maxResults: z.number().default(5).describe('Maximum number of products to return'),
    storeId: z.string().describe('The store ID to search products in')
  }),
  execute: async ({ query, searchType, maxResults, storeId }) => {
    console.log(`🔍 AI Tool: Searching products with query "${query}" using ${searchType} search`);

    let results: ProductSearchResult[] = [];

    try {
      switch (searchType) {
        case 'keyword':
          // Standard keyword search across multiple fields
          results = await searchProductsByKeywords(query, storeId, maxResults);
          break;

        case 'semantic':
          // Use embeddings for semantic similarity search
          const embedding = await generateQueryEmbedding(query);
          results = await searchProductsByEmbedding(embedding, storeId, maxResults);
          break;

        case 'exact_names':
          // Extract potential product names from the query and search
          const productNames = extractProductNamesFromQuery(query);
          results = await searchProductsByNames(productNames, storeId, maxResults);
          break;
      }

      // Apply price filtering if query contains price constraints
      const priceConstraints = extractPriceConstraints(query);
      if (priceConstraints.min || priceConstraints.max) {
        results = filterByPrice(results, priceConstraints);
      }

      console.log(`✅ Found ${results.length} products matching query`);

      // Format results for AI consumption
      return {
        success: true,
        productsFound: results.length,
        products: results.map(formatProductForAI),
        searchMetadata: {
          searchType,
          query,
          priceConstraints
        }
      };

    } catch (error) {
      console.error('❌ Product search tool error:', error);
      return {
        success: false,
        productsFound: 0,
        products: [],
        error: error instanceof Error ? error.message : 'Failed to search products'
      };
    }
  }
});

/**
 * Get specific product details by product ID
 */
export const getProductDetails = tool({
  description: 'Get detailed information about a specific product by its ID',
  parameters: z.object({
    productId: z.string().describe('The product ID to get details for'),
    storeId: z.string().describe('The store ID')
  }),
  execute: async ({ productId, storeId }) => {
    console.log(`📦 AI Tool: Getting details for product ${productId}`);

    // Implementation would fetch full product details from database
    // For now, this is a placeholder
    return {
      success: true,
      message: 'Product details retrieval not yet implemented'
    };
  }
});

/**
 * Check product availability and stock levels
 */
export const checkProductStock = tool({
  description: 'Check real-time stock availability for specific products',
  parameters: z.object({
    productIds: z.array(z.string()).describe('Array of product IDs to check stock for'),
    storeId: z.string().describe('The store ID')
  }),
  execute: async ({ productIds, storeId }) => {
    console.log(`📊 AI Tool: Checking stock for ${productIds.length} products`);

    // Implementation would check real-time inventory
    // For now, returns data from last sync
    return {
      success: true,
      message: 'Stock check uses last synced data',
      stockLevels: {} // Would contain product ID -> stock level mapping
    };
  }
});

/**
 * Format product data for AI consumption
 */
function formatProductForAI(product: ProductSearchResult) {
  const priceDisplay = product.price_min === product.price_max
    ? `$${product.price_min}`
    : `$${product.price_min} - $${product.price_max}`;

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: priceDisplay,
    priceMin: product.price_min,
    priceMax: product.price_max,
    inStock: product.available_for_sale && (product.total_inventory ?? 0) > 0,
    stockLevel: product.total_inventory,
    imageUrl: product.image_url,
    handle: product.handle,
    tags: product.tags,
    productType: product.product_type,
    vendor: product.vendor
  };
}

/**
 * Extract potential product names from a query
 */
function extractProductNamesFromQuery(query: string): string[] {
  // Simple extraction - look for capitalized words or quoted strings
  const quotedMatches = query.match(/"([^"]+)"/g) || [];
  const capitalizedWords = query.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];

  const productNames = [
    ...quotedMatches.map(m => m.replace(/"/g, '')),
    ...capitalizedWords
  ];

  // Also include model numbers (alphanumeric patterns)
  const modelNumbers = query.match(/[A-Z]{2,}-?[A-Z0-9]+/g) || [];
  productNames.push(...modelNumbers);

  return [...new Set(productNames)]; // Remove duplicates
}

/**
 * Export all product tools as a collection
 */
export const productTools = {
  searchProducts,
  getProductDetails,
  checkProductStock
};