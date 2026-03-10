// API route to start anonymous trial
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import {
  getAnonymousTrialState,
  startAnonymousTrialWithCookie,
} from "@/lib/anonymous-trial";
import { ANONYMOUS_TRIAL_CONFIG } from "@/config/anonymous-trial";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);

    // Don't start anonymous trial if user is authenticated
    if (session?.user) {
      return NextResponse.json(
        {
          error: "User is authenticated",
          message: "Authenticated users don't need anonymous trial",
        },
        { status: 400 }
      );
    }

    // Parse body safely
    let body;
    try {
      body = await req.json();
    } catch (e) {
      // If no body or invalid JSON, use default
      body = {};
    }

    const { product } = body;

    // Validate product if provided
    if (product && !ANONYMOUS_TRIAL_CONFIG.supportedProducts.includes(product)) {
      return NextResponse.json(
        { error: "Invalid product" },
        { status: 400 }
      );
    }

    // Check if trial already exists
    const existingState = await getAnonymousTrialState();
    
    if (existingState) {
      // Return existing trial state
      return NextResponse.json({
        state: existingState,
        isNew: false,
      });
    }

    // Create new trial
    const { state, cookie } = await startAnonymousTrialWithCookie();

    return NextResponse.json(
      {
        state,
        isNew: true,
        message: `Anonymous trial started for ${ANONYMOUS_TRIAL_CONFIG.durationMinutes} minutes`,
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': cookie,
        },
      }
    );
  } catch (error) {
    console.error("[anonymous-trial/start] Error:", error);
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error("[anonymous-trial/start] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    
    return NextResponse.json(
      { 
        error: "Failed to start trial",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
