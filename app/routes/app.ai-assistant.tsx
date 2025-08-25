import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Badge,
  EmptyState,
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

export default function AIAssistant() {
  // Store data available but not needed for placeholder
  useLoaderData<typeof loader>();

  return (
    <Page>
      <TitleBar title="AI Assistant" />
      
      <Layout>
        <Layout.Section>
          <Card>
            <EmptyState
              heading="AI Configuration Coming Soon"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <Text variant="bodyMd" as="p">
                We're building smart AI configuration options for your chat assistant.
                For now, we use intelligent defaults that work great out of the box.
              </Text>
              
              <BlockStack gap="300">
                <Text variant="bodyMd" as="p">
                  <strong>What's coming:</strong>
                </Text>
                <Text variant="bodyMd" as="p">
                  • Custom personality settings
                </Text>
                <Text variant="bodyMd" as="p">
                  • Business-specific instructions
                </Text>
                <Text variant="bodyMd" as="p">
                  • Advanced feature toggles
                </Text>
              </BlockStack>
              
              <Button url="/app/chatbox" variant="primary">
                Setup Chat Widget
              </Button>
            </EmptyState>
          </Card>
        </Layout.Section>
        
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingMd">
                Current Status
              </Text>
              <Badge tone="success">Using Smart Defaults</Badge>
              <Text variant="bodyMd" as="p">
                Your AI assistant is ready to help customers with:
              </Text>
              <Text variant="bodyMd" as="p">
                • Product recommendations
              </Text>
              <Text variant="bodyMd" as="p">
                • Answering questions
              </Text>
              <Text variant="bodyMd" as="p">
                • Helping with purchases
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}