import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
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
} from "@shopify/polaris";
import { AppExtensionIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  // Get or create store record
  let store = await prisma.store.findUnique({
    where: { shopifyDomain: session.shop },
  });

  if (!store) {
    store = await prisma.store.create({
      data: {
        storeName: session.shop.replace(".myshopify.com", ""),
        shopifyDomain: session.shop,
        shopifyAccessToken: session.accessToken || "",
        isActive: true,
      },
    });
  }

  // Use store name for personalized greeting (no special scope needed)
  const userName = store?.storeName || "there";

  return json({
    shop: session.shop,
    store,
    userName,
  });
};

export default function Dashboard() {
  const { store, userName } = useLoaderData<typeof loader>();

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
                url={`https://${store.shopifyDomain}/admin/themes/current/editor?context=apps&template=index`}
                external
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
                <Badge>2</Badge>
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
                <Badge>3</Badge>
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
