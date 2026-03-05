export type AppId =
  | "grammar"
  | "teleprompter"
  | "cast_master";

export interface TrialStatus {
  hasAccess: boolean;
  isTrial: boolean;
  trialStartedAt?: Date;
  trialEndsAt?: Date;
  daysLeft?: number;
  reason?: string;
}

// TEST ONLY - revert to 7 days before production deployment
const trialMs = 10 * 60 * 1000; // 10 minutes (was: 7 * 24 * 60 * 60 * 1000)

function getProductKeyForApp(app: AppId): string {
  switch (app) {
    case "grammar":
      return "grammar-master";
    case "teleprompter":
    case "cast_master":
      return "cast-master";
  }
}

function computeDaysLeft(trialEndsAt: Date, now: Date): number {
  const msLeft = trialEndsAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
}

export async function ensureTrialForApp(params: {
  userId: string;
  app: AppId;
}): Promise<TrialStatus> {
  const { prisma } = await import("@/prisma");

  const now = new Date();
  const productKey = getProductKeyForApp(params.app);

  const user = await prisma.user.findUnique({ where: { id: params.userId } });
  if (!user) {
    return {
      hasAccess: false,
      isTrial: false,
      reason: "USER_NOT_FOUND",
    };
  }

  // Paid overrides trial
  if (user.plan === "PRO") {
    return {
      hasAccess: true,
      isTrial: false,
      reason: "PAID",
    };
  }

  const paidGrant = await prisma.productGrant.findFirst({
    where: {
      userId: params.userId,
      productKey,
      type: "paid",
      status: "active",
    },
  });

  if (paidGrant) {
    return {
      hasAccess: true,
      isTrial: false,
      reason: "PAID",
    };
  }

  const trialGrant = await prisma.productGrant.findFirst({
    where: {
      userId: params.userId,
      productKey,
      type: "trial",
    },
    orderBy: { createdAt: "desc" },
  });

  if (trialGrant?.trialStartsAt && trialGrant?.trialEndsAt) {
    const trialEndsAt = new Date(trialGrant.trialEndsAt);
    const trialStartedAt = new Date(trialGrant.trialStartsAt);

    const isActive =
      trialGrant.status === "active" &&
      trialEndsAt.getTime() > now.getTime();

    if (isActive) {
      return {
        hasAccess: true,
        isTrial: true,
        trialStartedAt,
        trialEndsAt,
        daysLeft: computeDaysLeft(trialEndsAt, now),
      };
    }

    return {
      hasAccess: false,
      isTrial: true,
      trialStartedAt,
      trialEndsAt,
      daysLeft: 0,
      reason: "TRIAL_EXPIRED",
    };
  }

  // First real use -> start trial now
  const trialStartedAt = now;
  const trialEndsAt = new Date(now.getTime() + trialMs);

  await prisma.productGrant.create({
    data: {
      userId: params.userId,
      productKey,
      type: "trial",
      status: "active",
      trialStartsAt: trialStartedAt,
      trialEndsAt,
    },
  });

  return {
    hasAccess: true,
    isTrial: true,
    trialStartedAt,
    trialEndsAt,
    daysLeft: computeDaysLeft(trialEndsAt, now),
  };
}
