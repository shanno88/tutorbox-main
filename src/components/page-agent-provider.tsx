"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";


interface PageAgentEnvironment {
  locale: string;
  route: string;
  user: {
    id?: string;
    email?: string;
    name?: string;
    isLoggedIn: boolean;
  };
  products?: Array<{
    key: string;
    name: string;
    status: "owned" | "trial" | "available";
    trialDaysRemaining?: number;
  }>;
  billingContext?: {
    currentPlan?: string;
    nextBillingDate?: string;
    paymentPending?: boolean;
  };
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * PageAgent Provider Component with DashScope Integration
 * 
 * Initializes Alibaba's PageAgent with Tutorbox-specific context and actions.
 * Uses DashScope (Qwen) for LLM-powered conversations.
 * The agent appears as a floating button on key pages and can help users
 * understand products, trials, pricing, and billing.
 */
export function PageAgentProvider() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const locale = pathname?.split("/")?.[1] || "en";
  const initRef = useRef(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);

  useEffect(() => {
    // Prevent multiple initializations
    if (initRef.current) return;

    // Only initialize on client side
    if (typeof window === "undefined") return;

    // Initialize PageAgent
    initializePageAgent();
    initRef.current = true;
  }, []);

  // Update environment when context changes
  useEffect(() => {
    if (initRef.current) {
      updatePageAgentEnvironment();
    }
  }, [pathname, session, status, locale]);

  const initializePageAgent = async () => {
    try {
      // Create a simple chat interface for PageAgent
      // This will be called when user sends a message
      (window as any).pageAgentChat = async (userMessage: string) => {
        return await handlePageAgentChat(userMessage);
      };

      // Initialize the UI
      initializePageAgentUI();

      console.log("[PageAgent] Initialized successfully with DashScope");
    } catch (error) {
      console.error("[PageAgent] Initialization failed:", error);
    }
  };

  const handlePageAgentChat = async (userMessage: string): Promise<string> => {
    try {
      const environment = buildEnvironment();

      const response = await fetch("/api/page-agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          conversationHistory,
          environment,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[PageAgent] Chat error:", error);
        return `Sorry, I encountered an error: ${error.error}`;
      }

      const data = await response.json();
      const assistantMessage = data.response;

      // Update conversation history
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: userMessage },
        { role: "assistant", content: assistantMessage },
      ]);

      return assistantMessage;
    } catch (error) {
      console.error("[PageAgent] Chat failed:", error);
      return "Sorry, I encountered an error. Please try again.";
    }
  };

  const updatePageAgentEnvironment = async () => {
    try {
      // Update environment in the UI
      const environment = buildEnvironment();
      if ((window as any).pageAgentUpdateEnvironment) {
        (window as any).pageAgentUpdateEnvironment(environment);
      }
    } catch (error) {
      console.error("[PageAgent] Failed to update environment:", error);
    }
  };

  const buildEnvironment = (): PageAgentEnvironment => {
    return {
      locale,
      route: pathname,
      user: {
        id: session?.user?.id || undefined,
        email: session?.user?.email || undefined,
        name: (session?.user as any)?.name || undefined,
        isLoggedIn: status === "authenticated",
      },
      // Products and billing context will be fetched on-demand by actions
    };
  };

  const buildActions = () => {
    return {
      // Auth actions
      check_auth_status: async () => {
        return {
          isLoggedIn: status === "authenticated",
          user: session?.user || null,
        };
      },

      go_to_login: async () => {
        window.location.href = `/${locale}/login?redirect=${encodeURIComponent(pathname)}`;
        return { success: true };
      },

      go_to_account: async () => {
        window.location.href = `/${locale}/dashboard`;
        return { success: true };
      },

      // Trial actions
      start_trial: async (args: { productKey: string }) => {
        try {
          const response = await fetch("/api/trial/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product_key: args.productKey }),
          });

          if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.detail };
          }

          const data = await response.json();
          return {
            success: true,
            trial: data,
            message: `Trial started! You have ${data.days_remaining} days.`,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to start trial",
          };
        }
      },

      get_trial_status: async (args: { productKey: string }) => {
        try {
          const response = await fetch(`/api/trial/status/${args.productKey}`);

          if (response.status === 404) {
            return { success: true, trial: null, message: "No active trial" };
          }

          if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.detail };
          }

          const data = await response.json();
          return {
            success: true,
            trial: data,
            message: `Active trial with ${data.days_remaining} days remaining`,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get trial status",
          };
        }
      },

      list_my_products: async () => {
        try {
          const response = await fetch("/api/me/products");

          if (!response.ok) {
            return { success: false, error: "Failed to fetch products" };
          }

          const data = await response.json();
          return {
            success: true,
            products: data,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to list products",
          };
        }
      },

      // Billing actions
      open_checkout: async (args: { productKey?: string; priceId?: string }) => {
        try {
          const checkoutUrl = `/checkout?${
            args.productKey ? `product=${args.productKey}` : `priceId=${args.priceId}`
          }`;
          window.location.href = checkoutUrl;
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to open checkout",
          };
        }
      },

      open_billing_portal: async () => {
        try {
          window.location.href = `/${locale}/dashboard/billing`;
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to open billing portal",
          };
        }
      },

      // Navigation action
      navigate: async (args: { path: string }) => {
        try {
          window.location.href = args.path;
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Navigation failed",
          };
        }
      },
    };
  };

  const shouldShowPageAgent = (): string[] => {
    // Show on homepage and key product/billing pages
    const showOnPatterns = [
      "/",
      "/zh",
      "/en",
      "/zh/grammar-master",
      "/en/grammar-master",
      "/zh/lease-review",
      "/en/lease-review",
      "/zh/cast-master",
      "/en/cast-master",
      "/billing",
      "/checkout",
      "/dashboard/billing",
      "/pricing",
    ];

    return showOnPatterns;
  };

  const initializePageAgentUI = () => {
    // Create a simple floating button UI for PageAgent
    if (typeof document === "undefined") return;

    // Check if already initialized
    if (document.getElementById("page-agent-widget")) return;

    // Create widget container
    const widget = document.createElement("div");
    widget.id = "page-agent-widget";
    widget.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create button
    const button = document.createElement("button");
    button.id = "page-agent-button";
    button.innerHTML = "💬";
    button.style.cssText = `
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      cursor: pointer;
      font-size: 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    button.onmouseover = () => {
      button.style.transform = "scale(1.1)";
      button.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
    };

    button.onmouseout = () => {
      button.style.transform = "scale(1)";
      button.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    };

    button.onclick = () => {
      togglePageAgentChat();
    };

    widget.appendChild(button);
    document.body.appendChild(widget);

    // Create chat window (hidden by default)
    const chatWindow = document.createElement("div");
    chatWindow.id = "page-agent-chat";
    chatWindow.style.cssText = `
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 400px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
      display: none;
      flex-direction: column;
      z-index: 9998;
    `;

    // Chat header
    const header = document.createElement("div");
    header.style.cssText = `
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px 12px 0 0;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <span>Tutorbox Assistant</span>
      <button id="page-agent-close" style="background: none; border: none; color: white; cursor: pointer; font-size: 20px;">×</button>
    `;

    // Chat messages
    const messages = document.createElement("div");
    messages.id = "page-agent-messages";
    messages.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    // Chat input
    const inputContainer = document.createElement("div");
    inputContainer.style.cssText = `
      padding: 12px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    `;

    const input = document.createElement("input");
    input.id = "page-agent-input";
    input.type = "text";
    input.placeholder = "Ask me anything...";
    input.style.cssText = `
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
    `;

    const sendButton = document.createElement("button");
    sendButton.innerHTML = "Send";
    sendButton.style.cssText = `
      padding: 8px 16px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;

    sendButton.onclick = () => {
      const message = input.value.trim();
      if (message) {
        addMessageToChat("user", message);
        input.value = "";
        sendButton.disabled = true;
        sendButton.textContent = "Sending...";

        (window as any).pageAgentChat(message).then((response: string) => {
          addMessageToChat("assistant", response);
          sendButton.disabled = false;
          sendButton.textContent = "Send";
        });
      }
    };

    inputContainer.appendChild(input);
    inputContainer.appendChild(sendButton);

    chatWindow.appendChild(header);
    chatWindow.appendChild(messages);
    chatWindow.appendChild(inputContainer);
    document.body.appendChild(chatWindow);

    // Close button handler
    document.getElementById("page-agent-close")?.addEventListener("click", () => {
      togglePageAgentChat();
    });

    // Add initial greeting
    addMessageToChat(
      "assistant",
      "Hi! I'm the Tutorbox assistant. How can I help you today?"
    );
  };

  return null;
}

function togglePageAgentChat() {
  const chatWindow = document.getElementById("page-agent-chat");
  if (chatWindow) {
    chatWindow.style.display =
      chatWindow.style.display === "none" ? "flex" : "none";
  }
}

function addMessageToChat(role: "user" | "assistant", content: string) {
  const messagesContainer = document.getElementById("page-agent-messages");
  if (!messagesContainer) return;

  const messageDiv = document.createElement("div");
  messageDiv.style.cssText = `
    padding: 8px 12px;
    border-radius: 8px;
    max-width: 80%;
    word-wrap: break-word;
    ${
      role === "user"
        ? "background: #667eea; color: white; align-self: flex-end;"
        : "background: #f3f4f6; color: #1f2937; align-self: flex-start;"
    }
  `;
  messageDiv.textContent = content;
  messagesContainer.appendChild(messageDiv);

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
