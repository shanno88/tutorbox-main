// tutorbox/src/app/api/product-grants/en-cards/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { productGrants } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authConfig);
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ hasFullAccess: false }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(productGrants)
    .where(
      and(
        eq(productGrants.userId, user.id),
        eq(productGrants.productKey, "en-cards"),
        eq(productGrants.type, "paid"),
        eq(productGrants.status, "active")
      )
    );

  const hasFullAccess = rows.length > 0;

  return NextResponse.json({ hasFullAccess });
}
