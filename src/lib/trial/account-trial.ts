<<<<<<< HEAD
// Centralized 3-day account trial logic for Grammar Master
import { prisma } from "@/prisma";

export type AccountTrialProduct = "grammar_master";

export interface AccountTrialResult {
  isTrialActive: boolean;
  trialStart: Date | null;
  trialEnd: Date | null;
  hasUsedTrial: boolean;
  daysRemaining?: number;
}

// Configuration
const ACCOUNT_TRIAL_DAYS = parseInt(process.env.ACCOUNT_TRIAL_DAYS || "3", 10);

/**
 * Ensure and check 3-day account trial for a user
 * 
 * This function:
 * 1. Loads the user
 * 2. If hasUsedTrial is false, starts a new 3-day trial
 * 3. If hasUsedTrial is true, checks if trial is still active
 * 4. Returns trial status
 */
export async function ensureAccountTrialForApp(
  userId: string,
  product: AccountTrialProduct
): Promise<AccountTrialResult> {
  try {
    // Load user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        trialStart: true,
        trialEnd: true,
        hasUsedTrial: true,
      },
    });

    if (!user) {
      return {
        isTrialActive: false,
        trialStart: null,
        trialEnd: null,
        hasUsedTrial: false,
      };
    }

    // If user hasn't used trial yet, start it now
    if (!user.hasUsedTrial) {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + ACCOUNT_TRIAL_DAYS * 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: userId },
        data: {
          trialStart: now,
          trialEnd: trialEnd,
          hasUsedTrial: true,
        },
      });

      return {
        isTrialActive: true,
        trialStart: now,
        trialEnd: trialEnd,
        hasUsedTrial: true,
        daysRemaining: ACCOUNT_TRIAL_DAYS,
      };
    }

    // User has already used trial - check if it's still active
    if (user.trialStart && user.trialEnd) {
      const now = new Date();
      const isActive = now < user.trialEnd;

      const daysRemaining = isActive
        ? Math.ceil((user.trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        isTrialActive: isActive,
        trialStart: user.trialStart,
        trialEnd: user.trialEnd,
        hasUsedTrial: true,
        daysRemaining,
      };
    }

    // Edge case: hasUsedTrial is true but no dates set
    // This shouldn't happen, but handle gracefully
    return {
      isTrialActive: false,
      trialStart: null,
      trialEnd: null,
      hasUsedTrial: true,
    };
  } catch (error) {
    console.error("[account-trial] Error in ensureAccountTrialForApp:", error);
    throw error;
  }
}

/**
 * Check if user has paid access to Grammar Master
 */
export async function checkPaidAccess(
  userId: string,
  product: AccountTrialProduct
): Promise<boolean> {
  try {
    const productKey = product === "grammar_master" ? "grammar-master" : product;

    const paidGrant = await prisma.productGrant.findFirst({
      where: {
        userId,
        productKey,
        type: "paid",
        status: "active",
      },
    });

    return !!paidGrant;
  } catch (error) {
    console.error("[account-trial] Error checking paid access:", error);
    return false;
  }
}

/**
 * Complete access check for Grammar Master
 * Checks both paid access and trial status
 */
export async function checkGrammarMasterAccess(userId: string): Promise<{
  hasAccess: boolean;
  reason: "paid" | "trial" | "expired";
  trialInfo?: AccountTrialResult;
}> {
  try {
    // Check paid access first
    const hasPaid = await checkPaidAccess(userId, "grammar_master");
    
    if (hasPaid) {
      return {
        hasAccess: true,
        reason: "paid",
      };
    }

    // Check trial access
    const trialInfo = await ensureAccountTrialForApp(userId, "grammar_master");

    if (trialInfo.isTrialActive) {
      return {
        hasAccess: true,
        reason: "trial",
        trialInfo,
      };
    }

    // No access
    return {
      hasAccess: false,
      reason: "expired",
      trialInfo,
    };
  } catch (error) {
    console.error("[account-trial] Error in checkGrammarMasterAccess:", error);
    throw error;
  }
}
=======
// Centralized 3-day account trial logic for Grammar Master
import { prisma } from "@/prisma";

export type AccountTrialProduct = "grammar_master";

export interface AccountTrialResult {
  isTrialActive: boolean;
  trialStart: Date | null;
  trialEnd: Date | null;
  hasUsedTrial: boolean;
  daysRemaining?: number;
}

// Configuration
const ACCOUNT_TRIAL_DAYS = parseInt(process.env.ACCOUNT_TRIAL_DAYS || "3", 10);

/**
 * Ensure and check 3-day account trial for a user
 * 
 * This function:
 * 1. Loads the user
 * 2. If hasUsedTrial is false, starts a new 3-day trial
 * 3. If hasUsedTrial is true, checks if trial is still active
 * 4. Returns trial status
 */
export async function ensureAccountTrialForApp(
  userId: string,
  product: AccountTrialProduct
): Promise<AccountTrialResult> {
  try {
    // Load user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        trialStart: true,
        trialEnd: true,
        hasUsedTrial: true,
      },
    });

    if (!user) {
      return {
        isTrialActive: false,
        trialStart: null,
        trialEnd: null,
        hasUsedTrial: false,
      };
    }

    // If user hasn't used trial yet, start it now
    if (!user.hasUsedTrial) {
      const now = new Date();
      const trialEnd = new Date(now.getTime() + ACCOUNT_TRIAL_DAYS * 24 * 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: userId },
        data: {
          trialStart: now,
          trialEnd: trialEnd,
          hasUsedTrial: true,
        },
      });

      return {
        isTrialActive: true,
        trialStart: now,
        trialEnd: trialEnd,
        hasUsedTrial: true,
        daysRemaining: ACCOUNT_TRIAL_DAYS,
      };
    }

    // User has already used trial - check if it's still active
    if (user.trialStart && user.trialEnd) {
      const now = new Date();
      const isActive = now < user.trialEnd;

      const daysRemaining = isActive
        ? Math.ceil((user.trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        isTrialActive: isActive,
        trialStart: user.trialStart,
        trialEnd: user.trialEnd,
        hasUsedTrial: true,
        daysRemaining,
      };
    }

    // Edge case: hasUsedTrial is true but no dates set
    // This shouldn't happen, but handle gracefully
    return {
      isTrialActive: false,
      trialStart: null,
      trialEnd: null,
      hasUsedTrial: true,
    };
  } catch (error) {
    console.error("[account-trial] Error in ensureAccountTrialForApp:", error);
    throw error;
  }
}

/**
 * Check if user has paid access to Grammar Master
 */
export async function checkPaidAccess(
  userId: string,
  product: AccountTrialProduct
): Promise<boolean> {
  try {
    const productKey = product === "grammar_master" ? "grammar-master" : product;

    const paidGrant = await prisma.productGrant.findFirst({
      where: {
        userId,
        productKey,
        type: "paid",
        status: "active",
      },
    });

    return !!paidGrant;
  } catch (error) {
    console.error("[account-trial] Error checking paid access:", error);
    return false;
  }
}

/**
 * Complete access check for Grammar Master
 * Checks both paid access and trial status
 */
export async function checkGrammarMasterAccess(userId: string): Promise<{
  hasAccess: boolean;
  reason: "paid" | "trial" | "expired";
  trialInfo?: AccountTrialResult;
}> {
  try {
    // Check paid access first
    const hasPaid = await checkPaidAccess(userId, "grammar_master");
    
    if (hasPaid) {
      return {
        hasAccess: true,
        reason: "paid",
      };
    }

    // Check trial access
    const trialInfo = await ensureAccountTrialForApp(userId, "grammar_master");

    if (trialInfo.isTrialActive) {
      return {
        hasAccess: true,
        reason: "trial",
        trialInfo,
      };
    }

    // No access
    return {
      hasAccess: false,
      reason: "expired",
      trialInfo,
    };
  } catch (error) {
    console.error("[account-trial] Error in checkGrammarMasterAccess:", error);
    throw error;
  }
}
>>>>>>> origin/main
