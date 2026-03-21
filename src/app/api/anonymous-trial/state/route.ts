<<<<<<< HEAD
// API route to get anonymous trial state
import { NextResponse } from "next/server";
import { getAnonymousTrialState } from "@/lib/anonymous-trial";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getAnonymousTrialState();

    return NextResponse.json({
      state,
      hasState: !!state,
    });
  } catch (error) {
    console.error("[anonymous-trial/state] Error:", error);
    return NextResponse.json(
      { error: "Failed to get trial state" },
      { status: 500 }
    );
  }
}
=======
// API route to get anonymous trial state
import { NextResponse } from "next/server";
import { getAnonymousTrialState } from "@/lib/anonymous-trial";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getAnonymousTrialState();

    return NextResponse.json({
      state,
      hasState: !!state,
    });
  } catch (error) {
    console.error("[anonymous-trial/state] Error:", error);
    return NextResponse.json(
      { error: "Failed to get trial state" },
      { status: 500 }
    );
  }
}
>>>>>>> origin/main
