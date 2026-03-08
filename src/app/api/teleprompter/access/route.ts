// src/app/api/teleprompter/access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/prisma";
import { ensureTrialForApp } from "@/lib/access/ensureTrialForApp";
import { env } from "@/env";
import { and, eq, gt, inArray } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    return NextResponse.json(
      {
        ok: false,
        code: "NOT_AUTHENTICATED",
        message: "请先登录后再使用播感大师。",
      },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        code: "USER_NOT_FOUND",
        message: "用户信息不存在，请重新登录。",
      },
      { status: 404 }
    );
  }

  if (process.env.NODE_ENV === "production") {
    const { db, productGrants } = await import("@/db");

    const now = new Date();

    const activeGrant = await db
      .select({ id: productGrants.id })
      .from(productGrants)
      .where(
        and(
          eq(productGrants.userId, user.id),
          eq(productGrants.productKey, "ai-prompter"),
          eq(productGrants.type, "paid"),
          eq(productGrants.status, "active")
        )
      )
      .limit(1);

    // Subscriptions table removed - using productGrants only
    // const activeSubscription = await db
    //   .select({ userId: subscriptions.userId, paddlePriceId: subscriptions.paddlePriceId })
    //   .from(subscriptions)
    //   .where(
    //     and(
    //       eq(subscriptions.userId, user.id),
    //       prompterPriceIds.length
    //         ? inArray(subscriptions.paddlePriceId, prompterPriceIds)
    //         : gt(subscriptions.currentPeriodEnd, new Date(0)),
    //       gt(subscriptions.currentPeriodEnd, now)
    //     )
    //   )
    //   .limit(1);

    // Check only productGrants (no subscriptions table)
    if (activeGrant.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          code: "NO_ACCESS",
          message: "播感大师订阅未生效或已到期，请升级后继续使用。",
          upgradeUrl: "/billing",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { ok: true, code: "OK", entryUrl: "https://tl.tutorbox.cc/" },
      { status: 200 }
    );
  }

  const trialStatus = await ensureTrialForApp({ userId: user.id, app: "teleprompter" });
  if (!trialStatus.hasAccess) {
    return NextResponse.json(
      {
        ok: false,
        code: "TRIAL_EXPIRED",
        message: "播感大师试用已结束，请升级 Pro 继续使用。",
        upgradeUrl: "/billing",
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { ok: true, code: "OK", entryUrl: "https://tl.tutorbox.cc/" },
    { status: 200 }
  );
}
