<<<<<<< HEAD
// src/app/api/lease/access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/prisma";
import { sign } from "jsonwebtoken";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);

  // Step 1: Check authentication
  if (!session?.user?.email) {
    return NextResponse.json(
      {
        ok: false,
        code: "NOT_AUTHENTICATED",
        message: "Please sign in to use Lease AI Review.",
        redirectUrl: "/en/login?redirect=/products/lease-ai",
      },
      { status: 401 }
    );
  }

  // Step 2: Get user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        code: "USER_NOT_FOUND",
        message: "User not found. Please sign in again.",
      },
      { status: 404 }
    );
  }

  // Step 3: Check if user has purchased Lease AI Review
  const grant = await prisma.productGrant.findFirst({
    where: {
      userId: user.id,
      productKey: "lease-ai",
      type: "paid",
      status: "active",
    },
  });

  if (!grant) {
    return NextResponse.json(
      {
        ok: false,
        code: "NO_PURCHASE",
        message: "You haven't purchased Lease AI Review yet.",
        redirectUrl: "/products/lease-ai/pricing",
      },
      { status: 403 }
    );
  }

  // Step 4: Generate short-lived signed token for app.tutorbox.cc
  const secret = process.env.NEXTAUTH_SECRET || "dev-secret";
  const token = sign(
    {
      userId: user.id,
      email: user.email,
      product: "lease-ai",
      grantId: grant.id,
    },
    secret,
    { expiresIn: "5m" } // Token valid for 5 minutes
  );

  // Step 5: Return success with token
  return NextResponse.json(
    {
      ok: true,
      code: "ACCESS_GRANTED",
      token,
      entryUrl: `https://app.tutorbox.cc/lease?token=${token}`,
    },
    { status: 200 }
  );
}
=======
// src/app/api/lease/access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/prisma";
import { sign } from "jsonwebtoken";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);

  // Step 1: Check authentication
  if (!session?.user?.email) {
    return NextResponse.json(
      {
        ok: false,
        code: "NOT_AUTHENTICATED",
        message: "Please sign in to use Lease AI Review.",
        redirectUrl: "/en/login?redirect=/products/lease-ai",
      },
      { status: 401 }
    );
  }

  // Step 2: Get user from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        code: "USER_NOT_FOUND",
        message: "User not found. Please sign in again.",
      },
      { status: 404 }
    );
  }

  // Step 3: Check if user has purchased Lease AI Review
  const grant = await prisma.productGrant.findFirst({
    where: {
      userId: user.id,
      productKey: "lease-ai",
      type: "paid",
      status: "active",
    },
  });

  if (!grant) {
    return NextResponse.json(
      {
        ok: false,
        code: "NO_PURCHASE",
        message: "You haven't purchased Lease AI Review yet.",
        redirectUrl: "/products/lease-ai/pricing",
      },
      { status: 403 }
    );
  }

  // Step 4: Generate short-lived signed token for app.tutorbox.cc
  const secret = process.env.NEXTAUTH_SECRET || "dev-secret";
  const token = sign(
    {
      userId: user.id,
      email: user.email,
      product: "lease-ai",
      grantId: grant.id,
    },
    secret,
    { expiresIn: "5m" } // Token valid for 5 minutes
  );

  // Step 5: Return success with token
  return NextResponse.json(
    {
      ok: true,
      code: "ACCESS_GRANTED",
      token,
      entryUrl: `https://app.tutorbox.cc/lease?token=${token}`,
    },
    { status: 200 }
  );
}
>>>>>>> origin/main
