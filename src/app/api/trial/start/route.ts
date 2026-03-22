/**
 * POST /api/trial/start
 *
 * Proxy endpoint for starting a trial.
 * - Validates user session via next-auth
 * - Generates JWT token with user info
 * - Calls /auth/upsert-user to sync user to FastAPI
 * - Forwards request to FastAPI /trial/start
 * - Returns FastAPI response transparently
 */

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    // 1. Get current user from session
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ detail: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { product_key } = body;

    if (!product_key) {
      return new Response(
        JSON.stringify({ detail: "Missing product_key" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Generate JWT token
    const jwtSecret = process.env.FASTAPI_JWT_SECRET;
    if (!jwtSecret) {
      console.error("[trial/start] FASTAPI_JWT_SECRET not configured");
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

    // 4. Upsert user to FastAPI
    const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";
    const upsertResponse = await fetch(`${fastApiUrl}/auth/upsert-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!upsertResponse.ok) {
      console.error("[trial/start] Upsert user failed:", upsertResponse.status);
      const errorData = await upsertResponse.json();
      return new Response(JSON.stringify(errorData), {
        status: upsertResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Forward to FastAPI /trial/start
    const response = await fetch(`${fastApiUrl}/trial/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_key }),
    });

    // 6. Return FastAPI response transparently
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[trial/start] Error:", error);
    return new Response(
      JSON.stringify({ detail: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
