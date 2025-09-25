import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { generateProductEmbeddings } from "../lib/services/product-embeddings.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { session, admin } = await authenticate.admin(request);

    // Get store record
    const store = await prisma.stores.findUnique({
      where: { shopify_domain: session.shop },
    });

    if (!store) {
      return json({ error: 'Store not found' }, { status: 404 });
    }

    // Fetch products from Shopify using GraphQL Admin API
    const productsQuery = `
      query getProducts($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          edges {
            node {
              id
              title
              description
              handle
              productType
              vendor
              tags
              status
              priceRangeV2 {
                minVariantPrice {
                  amount
                }
                maxVariantPrice {
                  amount
                }
              }
              featuredImage {
                url
              }
              images(first: 10) {
                edges {
                  node {
                    url
                  }
                }
              }
              totalInventory
              createdAt
              updatedAt
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    let allProducts = [];
    let hasNextPage = true;
    let cursor = null;
    let totalSynced = 0;

    console.log(`Starting product sync for store: ${store.shopify_domain}`);

    while (hasNextPage) {
      const response = await admin.graphql(productsQuery, {
        variables: {
          first: 50, // Batch size
          after: cursor,
        },
      });

      const data = await response.json();

      if (data.errors) {
        console.error('Shopify GraphQL errors:', data.errors);
        return json({
          error: 'Failed to fetch products from Shopify',
          details: data.errors
        }, { status: 500 });
      }

      const products = data.data.products.edges;
      allProducts.push(...products);

      hasNextPage = data.data.products.pageInfo.hasNextPage;
      cursor = data.data.products.pageInfo.endCursor;

      console.log(`Fetched ${products.length} products, total so far: ${allProducts.length}`);
    }

    console.log(`Fetched ${allProducts.length} products from Shopify, now syncing to database...`);

    // Process and sync products to database
    for (const edge of allProducts) {
      const product = edge.node;

      // Extract Shopify product ID (remove gid://shopify/Product/ prefix)
      const shopifyProductId = product.id.replace('gid://shopify/Product/', '');

      // Prepare image URLs
      const imageUrls = product.images.edges.map((img: any) => img.node.url);
      const featuredImageUrl = product.featuredImage?.url || imageUrls[0] || null;


      try {
        await prisma.products.upsert({
          where: {
            store_id_shopify_product_id: {
              store_id: store.id,
              shopify_product_id: shopifyProductId,
            },
          },
          update: {
            title: product.title,
            description: product.description || null,
            handle: product.handle,
            product_type: product.productType,
            vendor: product.vendor,
            tags: product.tags,
            status: product.status.toLowerCase(),
            price_min: parseFloat(product.priceRangeV2.minVariantPrice.amount),
            price_max: parseFloat(product.priceRangeV2.maxVariantPrice.amount),
            image_url: featuredImageUrl,
            image_urls: imageUrls,
            total_inventory: product.totalInventory,
            available_for_sale: product.status === 'ACTIVE' && product.totalInventory > 0,
            last_synced: new Date(),
            sync_version: { increment: 1 },
            updated_at: new Date(),
          },
          create: {
            id: crypto.randomUUID(),
            store_id: store.id,
            shopify_product_id: shopifyProductId,
            title: product.title,
            description: product.description || null,
            handle: product.handle,
            product_type: product.productType,
            vendor: product.vendor,
            tags: product.tags,
            status: product.status.toLowerCase(),
            price_min: parseFloat(product.priceRangeV2.minVariantPrice.amount),
            price_max: parseFloat(product.priceRangeV2.maxVariantPrice.amount),
            image_url: featuredImageUrl,
            image_urls: imageUrls,
            total_inventory: product.totalInventory,
            available_for_sale: product.status === 'ACTIVE' && product.totalInventory > 0,
            embedding: [], // Will be generated later
            last_synced: new Date(),
            sync_version: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        totalSynced++;
      } catch (error) {
        console.error(`Failed to sync product ${product.title}:`, error);
      }
    }

    console.log(`Successfully synced ${totalSynced} products for store: ${store.shopify_domain}`);

    // Fire and forget: Generate embeddings in background
    generateProductEmbeddings(store.id).catch(err =>
      console.error('Background embedding generation failed:', err)
    );

    return json({
      success: true,
      message: `Successfully synced ${totalSynced} products`,
      totalFetched: allProducts.length,
      totalSynced,
    });

  } catch (error) {
    console.error('Product sync error:', error);
    return json({
      error: 'Failed to sync products',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

