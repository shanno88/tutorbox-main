// API route to increment action count
import { NextRequest, NextResponse } from "next/server";
import { incrementAnonymousTrialAction } from "@/lib/anonymous-trial";
import { ANONYMOUS_TRIAL_CONFIG, type AnonymousTrialProduct } from "@/config/anonymous-trial";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product } = body;

    // Validate product
    if (!ANONYMOUS_TRIAL_CONFIG.supportedProducts.includes(product)) {
      return NextResponse.json(
        { error: "Invalid product" },
        { status: 400 }
      );
    }

    await incrementAnonymousTrialAction(product as AnonymousTrialProduct);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[anonymous-trial/increment] Error:", error);
    return NextResponse.json(
      { error: "Failed to increment action" },
      { status: 500 }
    );
  }
}
