import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkAdminAuth } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    // 检查 admin 鉴权
    if (!checkAdminAuth()) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { keyId, newStatus } = body;

    if (!keyId || !newStatus) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["active", "revoked"].includes(newStatus)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // 更新 API Key 状态
    await db
      .update(apiKeys)
      .set({ status: newStatus })
      .where(eq(apiKeys.id, keyId));

    return NextResponse.json({
      ok: true,
      message: `API key status updated to ${newStatus}`,
    });
  } catch (error) {
    console.error("Error updating API key status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
