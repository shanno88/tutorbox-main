import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

/**
 * GET /api/page-agent/system-prompt
 * 
 * Returns the system prompt for PageAgent.
 * This is served from an API route to allow for dynamic updates
 * and to keep the prompt out of client-side bundles.
 */
export async function GET() {
  try {
    // Read the system prompt from the file
    const promptPath = join(process.cwd(), "src/lib/page-agent/system-prompt.md");
    const promptContent = await readFile(promptPath, "utf-8");

    return NextResponse.json({
      prompt: promptContent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[PageAgent API] Failed to read system prompt:", error);
    return NextResponse.json(
      { error: "Failed to load system prompt" },
      { status: 500 }
    );
  }
}
