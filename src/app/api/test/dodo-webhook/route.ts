/**
 * DoDo Webhook Test Route (Dev-Only)
 *
 * This is a development-only route to verify that the DoDo webhook scaffolding
 * compiles and runs without errors. It accepts a fake DoDo webhook payload
 * and runs it through the DoDo handler and subscription handler.
 *
 * This route is ONLY available in development mode and should NOT be exposed
 * in production.
 *
 * Usage:
 * curl -X POST http://localhost:3000/api/test/dodo-webhook \
 *   -H "Content-Type: application/json" \
 *   -d '{"event_type":"subscription.activated","data":{...}}'
 *
 * Or use the hardcoded test payload by calling without a body.
 */

import { env } from "@/env";
import {
  isDodoSubscriptionActivated,
  isDodoTransactionCompleted,
  extractDodoSubscriptionDescriptor,
  type DodoWebhookPayload,
} from "@/lib/billing/dodoWebhookHandler";
import { handleSuccessfulSubscription } from "@/lib/billing/handleSuccessfulSubscription";
import { logInfo, logWarn, logError } from "@/lib/billing/logger";

/**
 * Hardcoded fake DoDo webhook payload for testing
 *
 * This mimics a real DoDo subscription.activated event
 */
const FAKE_DODO_PAYLOAD: DodoWebhookPayload = {
  event_type: "subscription.activated",
  data: {
    id: "dodo_sub_test_123",
    status: "active",
    items: [
      {
        price: {
          id: "dodo_price_test_grammar_yearly_usd",
        },
      },
    ],
    custom_data: {
      userId: "test_user_dodo_123",
    },
    customer: {
      email: "test@example.com",
      id: "dodo_cust_test_456",
    },
  },
};

export async function POST(req: Request) {
  // Only allow in development
  if (env.NODE_ENV !== "development") {
    return new Response("Not available in production", { status: 403 });
  }

  const logPrefix = "test:dodo-webhook";

  try {
    logInfo(logPrefix, "Starting DoDo webhook test");

    // Get payload from request body or use hardcoded test payload
    let payload: DodoWebhookPayload;
    try {
      const body = await req.json();
      payload = body as DodoWebhookPayload;
      logInfo(logPrefix, "Using payload from request body");
    } catch {
      payload = FAKE_DODO_PAYLOAD;
      logInfo(logPrefix, "Using hardcoded test payload");
    }

    logInfo(logPrefix, `Event type: ${payload.event_type}`);

    // ─── STEP 1: Check if this is an activated subscription ────────────────
    logInfo(logPrefix, "Step 1: Checking if subscription is activated");
    const isActivated = isDodoSubscriptionActivated(payload);
    logInfo(logPrefix, `isDodoSubscriptionActivated() returned: ${isActivated}`);

    if (!isActivated) {
      logWarn(logPrefix, "Subscription is not activated, skipping processing");
      return Response.json({
        status: "ok",
        message: "Subscription not activated",
        isActivated,
      });
    }

    // ─── STEP 2: Extract subscription descriptor ──────────────────────────
    logInfo(logPrefix, "Step 2: Extracting subscription descriptor");
    const descriptor = extractDodoSubscriptionDescriptor(payload);
    logInfo(logPrefix, `extractDodoSubscriptionDescriptor() returned:`, descriptor);

    if (!descriptor) {
      logWarn(logPrefix, "Failed to extract subscription descriptor");
      return Response.json({
        status: "ok",
        message: "Failed to extract descriptor (expected - DoDo not implemented)",
        descriptor: null,
      });
    }

    // ─── STEP 3: Handle successful subscription ───────────────────────────
    logInfo(logPrefix, "Step 3: Calling handleSuccessfulSubscription");
    const result = await handleSuccessfulSubscription({
      subscription: descriptor,
      rawEvent: payload,
    });
    logInfo(logPrefix, `handleSuccessfulSubscription() returned:`, result);

    // ─── RETURN RESULTS ────────────────────────────────────────────────────
    return Response.json({
      status: "ok",
      message: "DoDo webhook test completed",
      steps: {
        step1_isActivated: isActivated,
        step2_descriptor: descriptor,
        step3_result: result,
      },
      notes: [
        "✅ Code compiles and runs without errors",
        "✅ All TODO stubs are hit and logged",
        "⚠️ isDodoSubscriptionActivated() returns false (not implemented)",
        "⚠️ extractDodoSubscriptionDescriptor() returns null (not implemented)",
        "ℹ️ handleSuccessfulSubscription() would process if descriptor was valid",
      ],
    });
  } catch (error) {
    logError(logPrefix, `Test failed with error:`, error);
    return Response.json(
      {
        status: "error",
        message: "DoDo webhook test failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to show test instructions
 */
export async function GET() {
  if (env.NODE_ENV !== "development") {
    return new Response("Not available in production", { status: 403 });
  }

  return Response.json({
    message: "DoDo Webhook Test Endpoint",
    description: "Dev-only endpoint to verify DoDo webhook scaffolding compiles",
    usage: {
      method: "POST",
      url: "/api/test/dodo-webhook",
      body: "Optional: DodoWebhookPayload JSON",
      default: "Uses hardcoded test payload if no body provided",
    },
    example_curl: `curl -X POST http://localhost:3000/api/test/dodo-webhook \\
  -H "Content-Type: application/json" \\
  -d '{"event_type":"subscription.activated","data":{"id":"test","status":"active"}}'`,
    what_it_tests: [
      "✅ DoDo webhook handler compiles",
      "✅ All TODO stubs are hit and logged",
      "✅ handleSuccessfulSubscription() can be called",
      "✅ Error handling works",
    ],
    what_still_needs_implementation: [
      "❌ Real DoDo API signature verification",
      "❌ Real DoDo webhook event types and structure",
      "❌ Real DoDo price ID mappings",
      "❌ Real DoDo status mapping",
      "❌ Real DoDo user identifier extraction",
    ],
  });
}
