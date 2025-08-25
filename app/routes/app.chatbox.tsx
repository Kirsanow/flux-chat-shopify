import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Badge,
  Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const store = await prisma.store.findUnique({
    where: { shopifyDomain: session.shop },
  });

  if (!store) {
    throw new Error("Store not found");
  }

  return json({ store });
};

export default function Chatbox() {
  const { store } = useLoaderData<typeof loader>();

  return (
    <Page>
      <TitleBar title="Chatbox Configuration" />
      
      <BlockStack gap="500">
        {/* Status Card */}
        <Card>
          <BlockStack gap="400">
            <Text as="h1" variant="headingLg">
              Chat Widget Status
            </Text>
            <InlineStack gap="300">
              <Badge tone="success">
                AI Ready
              </Badge>
              <Badge tone="attention">
                Widget Not Installed
              </Badge>
            </InlineStack>
            <Text variant="bodyMd" as="p">
              Your AI-powered chat widget helps customers find products and get recommendations directly on your storefront.
            </Text>
          </BlockStack>
        </Card>

        {/* Setup Instructions */}
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Setup Instructions
                </Text>
                <BlockStack gap="300">
                  <Text variant="bodyMd" as="p">
                    <strong>Step 1:</strong> Install chat widget on your storefront
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    ❌ Theme app extension not yet available (coming soon)
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  Quick Actions
                </Text>
                <BlockStack gap="200">
                  <Button fullWidth url="/app/ai-assistant">
                    Configure AI Assistant
                  </Button>
                  <Button fullWidth disabled>
                    Install Widget (Coming Soon)
                  </Button>
                  <Button fullWidth disabled>
                    View Analytics (Coming Soon)
                  </Button>
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  Preview
                </Text>
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#f6f6f7', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Chat widget preview will appear here once configured
                  </Text>
                </div>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}