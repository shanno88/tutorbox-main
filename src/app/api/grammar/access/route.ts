// src/app/api/grammar/access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/prisma";
import { checkAnonymousAccess, startAnonymousTrialWithCookie } from "@/lib/anonymous-trial";
import { checkGrammarMasterAccess } from "@/lib/trial/account-trial";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    const isAuthenticated = !!session?.user?.email;

    // Check anonymous trial access first (for non-authenticated users)
    const anonymousAccess = await checkAnonymousAccess(isAuthenticated, "grammar-master");

    // If anonymous trial is active, allow access
    if (anonymousAccess.hasAccess && anonymousAccess.reason === "anonymous_trial") {
      return NextResponse.json(
        {
          ok: true,
          code: "ANONYMOUS_TRIAL",
          message: `Anonymous trial active. ${anonymousAccess.minutesRemaining} minutes remaining.`,
          minutesRemaining: anonymousAccess.minutesRemaining,
        },
        { status: 200 }
      );
    }

    // If anonymous trial not started and user is not authenticated, auto-start trial
    if (!isAuthenticated && anonymousAccess.reason === "not_started") {
      const { state, cookie } = await startAnonymousTrialWithCookie();
      
      const minutesRemaining = Math.floor(
        (state.expiryTimestamp - Date.now()) / (1000 * 60)
      );

      return NextResponse.json(
        {
          ok: true,
          code: "ANONYMOUS_TRIAL_STARTED",
          message: `Anonymous trial started. ${minutesRemaining} minutes remaining.`,
          minutesRemaining,
        },
        { 
          status: 200,
          headers: {
            'Set-Cookie': cookie,
          },
        }
      );
    }

    // If anonymous trial expired, prompt to sign up
    if (!isAuthenticated && anonymousAccess.reason === "expired") {
      return NextResponse.json(
        {
          ok: false,
          code: "ANONYMOUS_TRIAL_EXPIRED",
          message: "Your 30-minute trial has ended. Please sign up to continue.",
        },
        { status: 403 }
      );
    }

    // If not authenticated and no trial, require login (shouldn't reach here normally)
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          ok: false,
          code: "NOT_AUTHENTICATED",
          message: "请先登录后再使用语法大师。",
        },
        { status: 401 },
      );
    }

    // User is authenticated - check account trial
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

    // Check Grammar Master access (paid or 3-day trial)
    const accessResult = await checkGrammarMasterAccess(user.id);

    if (accessResult.hasAccess) {
      return NextResponse.json(
        { 
          ok: true, 
          code: "OK",
          accessType: accessResult.reason,
          daysRemaining: accessResult.trialInfo?.daysRemaining,
        }, 
        { status: 200 }
      );
    }

    // Access denied - trial expired
    return NextResponse.json(
      {
        ok: false,
        code: "TRIAL_EXPIRED",
        message: "语法大师试用已结束，请升级 Pro 继续使用。",
        upgradeUrl: "/#pricing",
      },
      { status: 403 },
    );
  } catch (error) {
    console.error("[grammar/access] Error:", error);
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error("[grammar/access] Error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    
    return NextResponse.json(
      { 
        ok: false,
        code: "INTERNAL_ERROR",
        message: "服务器内部错误，请稍后重试。",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
