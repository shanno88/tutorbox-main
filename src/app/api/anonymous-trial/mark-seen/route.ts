// API route to mark expired modal as seen
import { NextResponse } from "next/server";
import { updateAnonymousTrialState } from "@/lib/anonymous-trial";

export async function POST() {
  try {
    await updateAnonymousTrialState({
      hasSeenExpiredModal: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[anonymous-trial/mark-seen] Error:", error);
    return NextResponse.json(
      { error: "Failed to update state" },
      { status: 500 }
    );
  }
}
