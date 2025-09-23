import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { randomUUID } from "crypto";
import { useLoaderData, useFetcher, useRevalidator } from "@remix-run/react";
import { useState } from "react";
import {
  Page,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Badge,
  Icon,
  Box,
  Banner,
  Spinner,
} from "@shopify/polaris";
import { AppExtensionIcon, ProductIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Get or create store record
  let store = await prisma.stores.findUnique({
    where: { shopify_domain: session.shop },
  });

  if (!store) {
    store = await prisma.stores.create({
      data: {
        id: randomUUID(),
        store_name: session.shop.replace(".myshopify.com", ""),
        shopify_domain: session.shop,
        shopify_access_token: session.accessToken || "",
        is_active: true,
        updated_at: new Date(),
      },
    });
  }

  // Get product sync status
  const productCount = await prisma.products.count({
    where: { store_id: store.id },
  });

  const lastSyncedProduct = await prisma.products.findFirst({
    where: { store_id: store.id },
    orderBy: { last_synced: 'desc' },
    select: { last_synced: true },
  });

  // Use store name for personalized greeting (no special scope needed)
  const userName = store?.store_name || "there";

  return json({
    shop: session.shop,
    store,
    userName,
    productCount,
    lastSync: lastSyncedProduct?.last_synced,
  });
};

export default function Dashboard() {
  const { store, userName, productCount, lastSync } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const isLoading = fetcher.state === "submitting";

  const handleSync = () => {
    fetcher.submit(
      {},
      {
        method: "POST",
        action: "/api/products/sync",
      }
    );
  };

  // Handle sync completion
  if (fetcher.data && fetcher.state === "idle" && !syncResult) {
    const data = fetcher.data as any; // Type assertion for fetcher data
    if (data.success) {
      setSyncResult(`Successfully synced ${data.totalSynced} products!`);
      // Revalidate loader data to update product count and last sync
      setTimeout(() => {
        revalidator.revalidate();
        setSyncResult(null);
      }, 2000);
    } else {
      setSyncResult(`Sync failed: ${data.error}`);
    }
  }

  return (
    <Page>
      <BlockStack gap="600">
        {/* Welcome Section */}
        <InlineStack align="space-between" wrap>
          <BlockStack gap="100">
            <Text as="h2" variant="headingLg">
              Hi {userName} 👋
            </Text>
            <Text variant="bodyMd" tone="subdued" as="p">
              Welcome to FluxChat
            </Text>
          </BlockStack>
          <InlineStack gap="200">
            <Button variant="tertiary">What's new</Button>
          </InlineStack>
        </InlineStack>

        {/* Sync Result Banner */}
        {syncResult && (
          <Banner
            title={(fetcher.data as any)?.success ? "Sync Completed" : "Sync Failed"}
            tone={(fetcher.data as any)?.success ? "success" : "critical"}
            onDismiss={() => setSyncResult(null)}
          >
            <p>{syncResult}</p>
          </Banner>
        )}

        {/* Product Intelligence Section */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <BlockStack gap="100">
                <Text as="h3" variant="headingMd">
                  Product Intelligence
                </Text>
                <Text variant="bodyMd" tone="subdued" as="p">
                  Sync your products to enable AI recommendations and smart search
                </Text>
              </BlockStack>
            </InlineStack>

            <InlineStack blockAlign="center" gap="400" wrap>
              <InlineStack gap="200" blockAlign="center">
                <Icon source={ProductIcon} />
                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="medium" as="p">
                    {productCount} products synced
                  </Text>
                  {lastSync && (
                    <Text variant="bodyMd" tone="subdued" as="p">
                      Last sync: {new Date(lastSync).toLocaleDateString()}
                    </Text>
                  )}
                  {!lastSync && productCount === 0 && (
                    <Text variant="bodyMd" tone="subdued" as="p">
                      No products synced yet
                    </Text>
                  )}
                </BlockStack>
              </InlineStack>

              <Button
                variant="primary"
                onClick={handleSync}
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? "Syncing..." : productCount > 0 ? "Sync Products" : "Import Products"}
              </Button>
            </InlineStack>

            {productCount === 0 && (
              <Box background="bg-surface-info" padding="400" borderRadius="200">
                <BlockStack gap="200">
                  <Text variant="bodyMd" fontWeight="medium" as="p">
                    🚀 Ready to enable AI product recommendations?
                  </Text>
                  <Text variant="bodyMd" as="p">
                    Import your products to let the AI assistant help customers find exactly what they need with intelligent recommendations and inventory-aware responses.
                  </Text>
                </BlockStack>
              </Box>
            )}
          </BlockStack>
        </Card>

        {/* AI Sales Instructions Section */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between">
              <BlockStack gap="100">
                <Text as="h3" variant="headingMd">
                  AI Sales Instructions
                </Text>
                <Text variant="bodyMd" tone="subdued" as="p">
                  Tell your AI how to help different types of customers
                </Text>
              </BlockStack>
            </InlineStack>

            <InlineStack blockAlign="center" gap="400" wrap>
              <InlineStack gap="200" blockAlign="center">
                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="medium" as="p">
                    {store.ai_config && (store.ai_config as any).instructions
                      ? "Instructions configured"
                      : "No instructions set"}
                  </Text>
                  {store.ai_config && (store.ai_config as any).instructions && (
                    <Text variant="bodyMd" tone="subdued" as="p">
                      {((store.ai_config as any).instructions as string).slice(0, 100)}...
                    </Text>
                  )}
                </BlockStack>
              </InlineStack>

              <Button
                variant="primary"
                url="/app/ai-instructions"
              >
                {store.ai_config && (store.ai_config as any).instructions
                  ? "Edit Instructions"
                  : "Add Instructions"}
              </Button>
            </InlineStack>

            {!store.ai_config || !(store.ai_config as any).instructions && (
              <Box background="bg-surface-info" padding="400" borderRadius="200">
                <BlockStack gap="200">
                  <Text variant="bodyMd" fontWeight="medium" as="p">
                    💬 Teach your AI how to sell
                  </Text>
                  <Text variant="bodyMd" as="p">
                    Write simple instructions like "For beginners, recommend our starter kit" and your AI will follow them when helping customers.
                  </Text>
                </BlockStack>
              </Box>
            )}
          </BlockStack>
        </Card>

        {/* App Embed Status Section */}
        <Card>
          <Box padding="200">
            <InlineStack blockAlign="center" gap="200">
              <Icon source={AppExtensionIcon} />
              <Text variant="bodyMd" as="span">
                Theme store app embed
              </Text>
              <Badge tone="critical">Off</Badge>
              <div style={{ flex: 1 }} />
              <Button
                variant="secondary"
                url={`https://admin.shopify.com/store/${store.shopify_domain.replace('.myshopify.com', '')}/themes/current/editor?context=apps`}
                external
                target="_blank"
              >
                App embed settings
              </Button>
            </InlineStack>
          </Box>
        </Card>

        {/* Quick Setup Steps */}
        <Card>
          <BlockStack gap="400">
            <Text as="h3" variant="headingMd">
              Quick Setup
            </Text>
            <BlockStack gap="300">
              <InlineStack gap="200" align="start">
                <Badge tone="success">1</Badge>
                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="medium" as="p">
                    Install Chat Widget
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Enable the app embed in your theme to show the chat widget
                    on your storefront
                  </Text>
                </BlockStack>
              </InlineStack>

              <InlineStack gap="200" align="start">
                <Badge tone={productCount > 0 ? "success" : undefined}>2</Badge>
                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="medium" as="p">
                    Sync Your Products
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Import your product catalog to enable AI recommendations and smart search
                  </Text>
                  {productCount === 0 && (
                    <Text variant="bodyMd" tone="critical" as="p">
                      ↑ Use the "Import Products" button above
                    </Text>
                  )}
                </BlockStack>
              </InlineStack>

              <InlineStack gap="200" align="start">
                <Badge tone={(store.ai_config && (store.ai_config as any).instructions) ? "success" : undefined}>3</Badge>
                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="medium" as="p">
                    Add AI Sales Instructions
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Tell your AI how to help different types of customers
                  </Text>
                  {(!store.ai_config || !(store.ai_config as any).instructions) && (
                    <Button url="/app/ai-instructions" variant="plain">
                      Add Instructions →
                    </Button>
                  )}
                </BlockStack>
              </InlineStack>

              <InlineStack gap="200" align="start">
                <Badge>4</Badge>
                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="medium" as="p">
                    Configure Chat Appearance
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Customize the look and feel of your chat widget
                  </Text>
                  <Button url="/app/chatbox" variant="plain">
                    Configure →
                  </Button>
                </BlockStack>
              </InlineStack>

              <InlineStack gap="200" align="start">
                <Badge>5</Badge>
                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="medium" as="p">
                    Start Chatting
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Your AI assistant will help customers find products and
                    answer questions
                  </Text>
                </BlockStack>
              </InlineStack>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
