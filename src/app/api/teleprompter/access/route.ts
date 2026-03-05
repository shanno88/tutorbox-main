// src/app/api/teleprompter/access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/prisma";
import { ensureTrialForApp } from "@/lib/access/ensureTrialForApp";

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
