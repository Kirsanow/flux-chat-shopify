import { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getConversationHistory } from "../lib/conversation.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);

  // Get session parameters
  const frontendSessionId = url.searchParams.get("sessionId");
  const shopDomain = url.searchParams.get("shop");

  if (!shopDomain) {
    return new Response(JSON.stringify({ error: "Missing shop parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Determine real session ID using same logic as chat endpoint
  let realSessionId: string;

  if (session) {
    // Store owner in admin/theme editor
    realSessionId = `admin-${session.shop}`;
  } else {
    // Check for logged-in customer
    const customerId = url.searchParams.get("logged_in_customer_id");

    if (customerId) {
      realSessionId = `customer-${customerId}`;
    } else {
      // Anonymous visitor - use frontend UUID
      if (!frontendSessionId) {
        return new Response(JSON.stringify({ messages: [] }), {
          headers: { "Content-Type": "application/json" },
        }); // No session, no history
      }
      realSessionId = frontendSessionId;
    }
  }

  try {
    const messages = await getConversationHistory(realSessionId, shopDomain);

    return new Response(
      JSON.stringify({
        messages: messages || [],
        sessionId: realSessionId,
        sessionType: session
          ? "admin"
          : url.searchParams.get("logged_in_customer_id")
            ? "customer"
            : "anonymous",
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error loading conversation history:", error);
    return new Response(
      JSON.stringify({ error: "Failed to load conversation history" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
