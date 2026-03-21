// src/app/api/me/products/start-trial/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/prisma";
import { products } from "@/config/products";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productKey } = await req.json();
  const userId = session.user.id;

  // 找产品配置
  const product = products.find((p) => p.key === productKey);
  if (!product || !product.trialEnabled) {
    return NextResponse.json({ error: "Trial not available" }, { status: 400 });
  }

  // 检查是否已经有 trial（single trial model：只能试用一次）
  const existing = await prisma.productGrant.findFirst({
    where: {
      userId,
      productKey,
      type: "trial",
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Trial already used" }, { status: 400 });
  }

  // 创建 trial grant
  const now = new Date();
  const trialDays = "trialDays" in product ? product.trialDays : 7;
  const trialEndsAt = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  await prisma.productGrant.create({
    data: {
      userId,
      productKey,
      type: "trial",
      status: "active",
      trialStartsAt: now,
      trialEndsAt,
    },
  });

  return NextResponse.json({ success: true, trialEndsAt: trialEndsAt.toISOString() });
}
