/**
 * GET /api/trial/status/[productKey]
 *
 * Proxy endpoint for checking trial status.
 * - Validates user session via next-auth
 * - Generates JWT token with user info
 * - Calls /auth/upsert-user to sync user to FastAPI
 * - Forwards request to FastAPI /trial/status/{product_key}
 * - Returns FastAPI response transparently
 */

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import jwt from "jsonwebtoken";

export async function GET(
  req: Request,
  { params }: { params: { productKey: string } }
) {
  try {
    // 1. Get current user from session
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ detail: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { productKey } = params;

    if (!productKey) {
      return new Response(
        JSON.stringify({ detail: "Missing productKey" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Generate JWT token
    const jwtSecret = process.env.FASTAPI_JWT_SECRET;
    if (!jwtSecret) {
      console.error("[trial/status] FASTAPI_JWT_SECRET not configured");
      return new Response(
        JSON.stringify({ detail: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = jwt.sign(
      {
        sub: String(session.user.id),
        email: session.user.email,
        name: session.user.name,
        exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
      },
      jwtSecret,
      { algorithm: "HS256" }
    );

    // 3. Upsert user to FastAPI
    const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
    const upsertResponse = await fetch(`${fastApiUrl}/auth/upsert-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!upsertResponse.ok) {
      console.error("[trial/status] Upsert user failed:", upsertResponse.status);
      const errorData = await upsertResponse.json();
      return new Response(JSON.stringify(errorData), {
        status: upsertResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Forward to FastAPI
    const response = await fetch(
      `${fastApiUrl}/trial/status/${productKey}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // 5. Return FastAPI response transparently
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[trial/status] Error:", error);
    return new Response(
      JSON.stringify({ detail: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
