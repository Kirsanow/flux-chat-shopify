import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link as RemixLink } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  List,
  Link,
  InlineStack,
  Badge,
  Icon,
} from "@shopify/polaris";
import { ChatIcon, ProductIcon, SettingsIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Get or create store record
  let store = await prisma.store.findUnique({
    where: { shopifyDomain: session.shop },
    include: {
      products: {
        take: 5,
        orderBy: { updatedAt: "desc" }
      },
      conversations: {
        take: 5,
        orderBy: { updatedAt: "desc" },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" }
          }
        }
      }
    }
  });

  if (!store) {
    store = await prisma.store.create({
      data: {
        storeName: session.shop.replace('.myshopify.com', ''),
        shopifyDomain: session.shop,
        shopifyAccessToken: session.accessToken,
        isActive: true,
      },
      include: {
        products: true,
        conversations: true
      }
    });
  }

  return json({
    shop: session.shop,
    store,
    stats: {
      totalProducts: await prisma.product.count({ where: { storeId: store.id } }),
      totalConversations: await prisma.conversation.count({ where: { storeId: store.id } }),
      activeConversations: await prisma.conversation.count({ 
        where: { storeId: store.id, status: 'active' } 
      }),
      productsWithEmbeddings: await prisma.product.count({ 
        where: { storeId: store.id, embeddingModel: { not: null } } 
      }),
    }
  });
};

export default function Dashboard() {
  const { store, stats } = useLoaderData<typeof loader>();

  return (
    <Page>
      <TitleBar title="FluxChat Dashboard">
        <RemixLink to="/app/settings">
          <Button variant="primary">Settings</Button>
        </RemixLink>
      </TitleBar>
      
      <BlockStack gap="500">
        {/* Welcome Section */}
        <Card>
          <BlockStack gap="400">
            <Text as="h1" variant="headingLg">
              Welcome to FluxChat! 🤖
            </Text>
            <Text variant="bodyMd" as="p">
              Your AI-powered shopping assistant is ready to help customers find products, get recommendations, and make purchases directly through chat.
            </Text>
          </BlockStack>
        </Card>

        {/* Stats Cards */}
        <Layout>
          <Layout.Section variant="oneHalf">
            <BlockStack gap="400">
              <Card>
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <Icon source={ProductIcon} />
                    <Badge tone="info">{stats.totalProducts.toString()}</Badge>
                  </InlineStack>
                  <Text as="h3" variant="headingMd">Products Synced</Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    {stats.productsWithEmbeddings} with AI embeddings ready
                  </Text>
                </BlockStack>
              </Card>

              <Card>
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <Icon source={ChatIcon} />
                    <Badge tone="success">{stats.activeConversations.toString()}</Badge>
                  </InlineStack>
                  <Text as="h3" variant="headingMd">Active Conversations</Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    {stats.totalConversations} total conversations
                  </Text>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Quick Actions</Text>
                <BlockStack gap="300">
                  <RemixLink to="/app/products">
                    <Button fullWidth>Sync Products</Button>
                  </RemixLink>
                  
                  <RemixLink to="/app/conversations">
                    <Button fullWidth>View Conversations</Button>
                  </RemixLink>
                  
                  <RemixLink to="/app/settings">
                    <Button fullWidth>Configure AI</Button>
                  </RemixLink>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Setup Status */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Setup Status</Text>
            <List>
              <List.Item>
                {store?.isActive ? (
                  <InlineStack gap="200">
                    <Badge tone="success">✓</Badge>
                    <Text as="span">Store connected and active</Text>
                  </InlineStack>
                ) : (
                  <InlineStack gap="200">
                    <Badge tone="critical">×</Badge>
                    <Text as="span">Store needs activation</Text>
                  </InlineStack>
                )}
              </List.Item>
              
              <List.Item>
                {stats.totalProducts > 0 ? (
                  <InlineStack gap="200">
                    <Badge tone="success">✓</Badge>
                    <Text as="span">Products synced ({stats.totalProducts} products)</Text>
                  </InlineStack>
                ) : (
                  <InlineStack gap="200">
                    <Badge tone="attention">!</Badge>
                    <Text as="span">No products synced yet - <RemixLink to="/app/products">Sync now</RemixLink></Text>
                  </InlineStack>
                )}
              </List.Item>
              
              <List.Item>
                {store?.aiConfig ? (
                  <InlineStack gap="200">
                    <Badge tone="success">✓</Badge>
                    <Text as="span">AI assistant configured</Text>
                  </InlineStack>
                ) : (
                  <InlineStack gap="200">
                    <Badge tone="attention">!</Badge>
                    <Text as="span">AI needs configuration - <RemixLink to="/app/settings">Configure now</RemixLink></Text>
                  </InlineStack>
                )}
              </List.Item>
            </List>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
