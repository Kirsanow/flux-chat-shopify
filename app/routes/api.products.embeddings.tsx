import { ActionFunctionArgs, json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { generateProductEmbeddings, regenerateAllEmbeddings } from "../lib/services/product-embeddings.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { session } = await authenticate.admin(request);

    // Get store record
    const store = await prisma.stores.findUnique({
      where: { shopify_domain: session.shop },
    });

    if (!store) {
      return json({ error: 'Store not found' }, { status: 404 });
    }

    // Parse request body for options
    const formData = await request.formData();
    const action = formData.get('action') as string;

    console.log(`Starting embedding generation for store: ${store.shopify_domain}`);

    if (action === 'regenerate') {
      // Full regeneration of all embeddings
      const result = await regenerateAllEmbeddings(store.id);
      return json({
        success: true,
        message: `Successfully regenerated embeddings for ${result.totalEmbedded} products`,
        totalEmbedded: result.totalEmbedded,
        action: 'regenerate'
      });
    } else {
      // Generate embeddings for products that don't have them
      const result = await generateProductEmbeddings(store.id, 50);
      return json({
        success: true,
        message: `Successfully generated embeddings: ${result.embedded} embedded, ${result.skipped} skipped`,
        embedded: result.embedded,
        skipped: result.skipped,
        action: 'generate'
      });
    }

  } catch (error) {
    console.error('Embedding generation error:', error);
    return json({
      error: 'Failed to generate embeddings',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}