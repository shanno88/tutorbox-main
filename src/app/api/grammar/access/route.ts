// src/app/api/grammar/access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/prisma";
import { hasProAccess } from "@/lib/billing/access";

const TRIAL_DAYS = 7;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    return NextResponse.json(
      {
        ok: false,
        code: "NOT_AUTHENTICATED",
        message: "请先登录后再使用语法大师。",
      },
      { status: 401 },
    );
  }

  // 2. 查找用户
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
      { status: 404 },
    );
  }

  // 3. 检查试用 / Pro 权限
  if (!hasProAccess(user, TRIAL_DAYS)) {
    return NextResponse.json(
      {
        ok: false,
        code: "TRIAL_EXPIRED",
        message: "语法大师试用已结束，请升级 Pro 继续使用。",
        upgradeUrl: "/billing",
      },
      { status: 403 },
    );
  }

  // 4. 有权限，返回 OK
  return NextResponse.json({ ok: true, code: "OK" }, { status: 200 });
}
