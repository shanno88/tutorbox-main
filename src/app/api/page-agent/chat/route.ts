import { NextRequest, NextResponse } from "next/server";
import { createDashScopeClient } from "@/lib/dashscope-client";
import { readFile } from "fs/promises";
import { join } from "path";

interface PageAgentChatRequest {
  userMessage: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  environment?: {
    locale: string;
    route: string;
    user?: {
      id?: string;
      email?: string;
      name?: string;
      isLoggedIn: boolean;
    };
    products?: any[];
    billingContext?: any;
  };
}

/**
 * POST /api/page-agent/chat
 */
export async function POST(request: NextRequest) {
  try {
    const body: PageAgentChatRequest = await request.json();
    const { userMessage, conversationHistory = [], environment } = body;

    if (!userMessage) {
      return NextResponse.json(
        { error: "userMessage is required" },
        { status: 400 }
      );
    }

    const systemPrompt = await loadSystemPrompt();
    const enhancedSystemPrompt = buildEnhancedPrompt(
      systemPrompt,
      environment
    );

    const client = createDashScopeClient();

    const messages = conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    const response = await client.chat(
      userMessage,
      enhancedSystemPrompt,
      messages,
      {
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 2048,
      }
    );

    return NextResponse.json({
      success: true,
      response,
      model: process.env.DASHSCOPE_MODEL,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[PageAgent Chat API] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.stack
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

async function loadSystemPrompt(): Promise<string> {
  try {
    const promptPath = join(
      process.cwd(),
      "src/lib/page-agent/system-prompt.md"
    );
    const content = await readFile(promptPath, "utf-8");
    return content;
  } catch (error) {
    console.error("[PageAgent] Failed to load system prompt:", error);
    return `You are the Tutorbox AI assistant. Help users understand our products, trials, pricing, and billing.
    
Available actions:
- check_auth_status()
- go_to_login()
- go_to_account()
- start_trial(productKey)
- get_trial_status(productKey)
- list_my_products()
- open_checkout(productKey or priceId)
- open_billing_portal()
- navigate(path)

Always be helpful, accurate, and grounded in our documentation.`;
  }
}

function buildEnhancedPrompt(
  basePrompt: string,
  environment?: PageAgentChatRequest["environment"]
): string {
  if (!environment) {
    return basePrompt;
  }

  let contextStr = "\n\n## Current Context\n";

  if (environment.locale) {
    contextStr += `- Language: ${
      environment.locale === "zh" ? "Chinese" : "English"
    }\n`;
  }

  if (environment.route) {
    contextStr += `- Current page: ${environment.route}\n`;
  }

  if (environment.user) {
    contextStr += `- User logged in: ${environment.user.isLoggedIn}\n`;
    if (environment.user.email) {
      contextStr += `- User email: ${environment.user.email}\n`;
    }
  }

  if (environment.products && environment.products.length > 0) {
    contextStr += `- User's products/trials:\n`;
    environment.products.forEach((product) => {
      contextStr += `  - ${product.name} (${product.status}`;
      if (product.trialDaysRemaining) {
        contextStr += `, ${product.trialDaysRemaining} days remaining`;
      }
      contextStr += `)\n`;
    });
  }

  if (environment.billingContext) {
    contextStr += `- Billing info:\n`;
    if (environment.billingContext.currentPlan) {
      contextStr += `  - Current plan: ${environment.billingContext.currentPlan}\n`;
    }
    if (environment.billingContext.nextBillingDate) {
      contextStr += `  - Next billing: ${environment.billingContext.nextBillingDate}\n`;
    }
  }

  return basePrompt + contextStr;
}
