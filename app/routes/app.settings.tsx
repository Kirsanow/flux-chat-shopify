import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const store = await prisma.store.findUnique({
    where: { shopifyDomain: session.shop },
  });

  return json({ store });
};

export default function Settings() {
  const { store } = useLoaderData<typeof loader>();

  return (
    <Page>
      <TitleBar title="FluxChat Settings" />
      
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  AI Configuration
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Configure your AI assistant's personality and behavior.
                </Text>
                <Text variant="bodyMd" as="p">
                  Settings page coming soon! This will include:
                </Text>
                <Text variant="bodyMd" as="ul">
                  • AI personality settings (Professional, Friendly, Casual)
                  • Custom instructions and business information
                  • Product sync configuration
                  • Chat widget customization
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}