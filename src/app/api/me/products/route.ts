// src/app/api/me/products/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/prisma";
import { products } from "@/config/products";

export type ProductStatus =
  | "not_started"
  | "trial_active"
  | "trial_expired"
  | "paid"
  | "locked";

export interface ProductStatusResponse {
  productKey: string;
  name: string;
  status: ProductStatus;
  canStartTrial: boolean;
  trialEndsAt?: string | null;
}

export async function GET() {
  const session = await getServerSession(authConfig);

  // 未登录：返回空列表
  if (!session?.user?.id) {
    return NextResponse.json([]);
  }

  const userId = session.user.id;

  // 拿该用户所有的 ProductGrant
  const grants = await prisma.productGrant.findMany({
    where: { userId },
  });

  const now = new Date();

  const result: ProductStatusResponse[] = products.map((product) => {
    const productKey = product.key;

    // 找这个产品的 trial grant
    const trialGrant = grants.find(
      (g: any) => g.productKey === productKey && g.type === "trial"
    );

    // 找这个产品的 paid grant
    const paidGrant = grants.find(
      (g: any) => g.productKey === productKey && g.type === "paid" && g.status === "active"
    );

    // paid 优先
    if (paidGrant) {
      return {
        productKey,
        name: product.name,
        status: "paid",
        canStartTrial: false,
      };
    }

    // trial 不可用
    if (!product.trialEnabled) {
      return {
        productKey,
        name: product.name,
        status: "locked",
        canStartTrial: false,
      };
    }

    // 没有 trial grant → 可以开始
    if (!trialGrant) {
      return {
        productKey,
        name: product.name,
        status: "not_started",
        canStartTrial: true,
      };
    }

    // 有 trial grant → 看是否过期
    const isActive =
      trialGrant.status === "active" &&
      trialGrant.trialEndsAt != null &&
      new Date(trialGrant.trialEndsAt) > now;

    return {
      productKey,
      name: product.name,
      status: isActive ? "trial_active" : "trial_expired",
      canStartTrial: false,
      trialEndsAt: trialGrant.trialEndsAt?.toISOString() ?? null,
    };
  });

  return NextResponse.json(result);
}
