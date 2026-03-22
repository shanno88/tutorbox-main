// src/lib/dashscope-client.ts

const DASHSCOPE_ENDPOINT =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function createDashScopeClient() {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const model = process.env.DASHSCOPE_MODEL || "qwen-plus-2025-07-28";

  if (!apiKey) {
    throw new Error("DASHSCOPE_API_KEY is not set");
  }

  async function chat(
    userMessage: string,
    systemPrompt: string,
    history: Message[] = [],
    options?: {
      temperature?: number;
      topP?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const messages: Message[] = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: userMessage },
    ];

    const body = {
      model,
      input: {
        messages,
      },
      parameters: {
        result_format: "message",
        temperature: options?.temperature ?? 0.7,
        top_p: options?.topP ?? 0.9,
        max_tokens: options?.maxTokens ?? 2048,
      },
    };

    const res = await fetch(DASHSCOPE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg =
        data?.message ||
        data?.output?.text ||
        JSON.stringify(data, null, 2);
      throw new Error(`DashScope API error: ${errMsg}`);
    }

    const content: string =
      data?.output?.choices?.[0]?.message?.content ??
      data?.output?.text ??
      "";

    return content;
  }

  return { chat };
}
