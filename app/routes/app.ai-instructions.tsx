import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { randomUUID } from "crypto";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import {
  Page,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Layout,
  TextField,
  Banner,
} from "@shopify/polaris";
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

  const instructions = (store.ai_config as any)?.instructions || "";

  return json({
    store,
    instructions,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  const formData = await request.formData();
  const instructions = formData.get("instructions") as string;

  try {
    // Update store with new AI instructions
    await prisma.stores.update({
      where: { shopify_domain: session.shop },
      data: {
        ai_config: {
          instructions: instructions || "",
          updated_at: new Date().toISOString(),
        },
        updated_at: new Date(),
      },
    });

    return json({
      success: true,
      message: "AI instructions saved successfully!"
    });
  } catch (error) {
    console.error("Error saving AI instructions:", error);
    return json({
      success: false,
      message: "Failed to save instructions. Please try again."
    }, { status: 500 });
  }
};

export default function AIInstructions() {
  const { store, instructions } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  const exampleInstructions = `For budget customers (under $200):
- Always recommend our starter pack or entry-level models
- Mention our payment plans for higher-priced items
- Focus on value and reliability

For beginners:
- Start with our most user-friendly products
- Emphasize easy setup and included accessories
- Offer our free setup service for purchases over $500

For professionals:
- Recommend our pro-grade equipment
- Highlight technical specifications and durability
- Mention bulk discount options

Always mention:
- Free shipping over $75
- 30-day return policy
- Our expert customer support team`;

  return (
    <Page
      backAction={{ content: "Dashboard", url: "/app" }}
      title="AI Sales Instructions"
      subtitle="Tell your AI assistant how to help different types of customers"
    >
      <Layout>
        <Layout.Section>
          {actionData && (
            <Banner
              title={actionData.success ? "Success" : "Error"}
              tone={actionData.success ? "success" : "critical"}
            >
              <p>{actionData.message}</p>
            </Banner>
          )}

          <Card>
            <Form method="post">
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Sales Instructions
                  </Text>
                  <Text variant="bodyMd" as="p">
                    Write instructions in plain English. Your AI will use these to recommend products and help customers.
                  </Text>
                </BlockStack>

                <TextField
                  label="Instructions"
                  name="instructions"
                  value={instructions}
                  multiline={8}
                  helpText="Tell your AI how to help different customer types, what products to recommend, and what information to emphasize."
                  placeholder={exampleInstructions}
                  autoComplete="off"
                />

                <InlineStack gap="200">
                  <Button
                    variant="primary"
                    submit
                    loading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Instructions"}
                  </Button>
                  <Button url="/app">Cancel</Button>
                </InlineStack>
              </BlockStack>
            </Form>
          </Card>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                💡 Tips for Great Instructions
              </Text>

              <BlockStack gap="300">
                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="medium" as="p">
                    Be specific about customer types
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    "For beginners" or "For budget customers under $200"
                  </Text>
                </BlockStack>

                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="medium" as="p">
                    Mention specific products
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    "Recommend the AT-LP60X for first-time users"
                  </Text>
                </BlockStack>

                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="medium" as="p">
                    Include your policies
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    "Always mention free shipping over $75"
                  </Text>
                </BlockStack>

                <BlockStack gap="100">
                  <Text variant="bodyMd" fontWeight="medium" as="p">
                    Keep it conversational
                  </Text>
                  <Text variant="bodyMd" tone="subdued" as="p">
                    Write like you're training a sales associate
                  </Text>
                </BlockStack>
              </BlockStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingMd">
                🚀 What happens next?
              </Text>

              <BlockStack gap="200">
                <Text variant="bodyMd" as="p">
                  Once you save instructions, your AI assistant will:
                </Text>

                <BlockStack gap="100">
                  <Text variant="bodyMd" as="p">
                    • Use them to recommend products in chat
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Follow your pricing and customer guidance
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Check product availability automatically
                  </Text>
                  <Text variant="bodyMd" as="p">
                    • Mention your policies and services
                  </Text>
                </BlockStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}