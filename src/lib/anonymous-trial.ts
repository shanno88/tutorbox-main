// Server-side anonymous trial utilities
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import {
  ANONYMOUS_TRIAL_CONFIG,
  type AnonymousTrialState,
  type AnonymousTrialProduct,
} from "@/config/anonymous-trial";

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "dev-secret-key-change-in-production"
);

/**
 * Create a new anonymous trial state
 */
export function createAnonymousTrialState(): AnonymousTrialState {
  const now = Date.now();
  const durationMs = ANONYMOUS_TRIAL_CONFIG.durationMinutes * 60 * 1000;

  return {
    type: "anonymous_30min",
    startTimestamp: now,
    expiryTimestamp: now + durationMs,
    hasSeenExpiredModal: false,
    actionsUsed: {},
  };
}

/**
 * Sign trial state into a JWT token
 */
export async function signTrialState(state: AnonymousTrialState): Promise<string> {
  // Calculate expiration time in seconds from now
  const now = Date.now();
  const expiresInMs = state.expiryTimestamp - now + (24 * 60 * 60 * 1000); // Add 24h buffer
  const expiresInSeconds = Math.floor(expiresInMs / 1000);

  const token = await new SignJWT({ ...state })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`) // Format: "1800s" for 30 minutes
    .sign(SECRET_KEY);

  return token;
}

/**
 * Verify and decode trial state from JWT token
 */
export async function verifyTrialState(token: string): Promise<AnonymousTrialState | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    
    // Validate payload structure
    if (
      typeof payload.type === "string" &&
      typeof payload.startTimestamp === "number" &&
      typeof payload.expiryTimestamp === "number" &&
      typeof payload.hasSeenExpiredModal === "boolean"
    ) {
      return payload as AnonymousTrialState;
    }
    
    return null;
  } catch (error) {
    console.error("[anonymous-trial] Token verification failed:", error);
    return null;
  }
}

/**
 * Get current anonymous trial state from cookies (server-side)
 */
export async function getAnonymousTrialState(): Promise<AnonymousTrialState | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ANONYMOUS_TRIAL_CONFIG.cookieName)?.value;

    if (!token) {
      return null;
    }

    return await verifyTrialState(token);
  } catch (error) {
    console.error("[anonymous-trial] Error getting trial state:", error);
    return null;
  }
}

/**
 * Get trial state from request cookies (for API routes)
 */
export async function getAnonymousTrialStateFromRequest(cookieHeader: string | null): Promise<AnonymousTrialState | null> {
  try {
    if (!cookieHeader) {
      return null;
    }

    // Parse cookie header
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const token = cookies[ANONYMOUS_TRIAL_CONFIG.cookieName];

    if (!token) {
      return null;
    }

    return await verifyTrialState(token);
  } catch (error) {
    console.error("[anonymous-trial] Error getting trial state from request:", error);
    return null;
  }
}

/**
 * Create cookie string for setting in response
 */
export async function createTrialCookie(state: AnonymousTrialState): Promise<string> {
  const token = await signTrialState(state);
  const options = ANONYMOUS_TRIAL_CONFIG.cookie;
  
  const cookieParts = [
    `${ANONYMOUS_TRIAL_CONFIG.cookieName}=${token}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    `SameSite=${options.sameSite}`,
  ];

  if (options.secure) {
    cookieParts.push('Secure');
  }

  if (options.httpOnly) {
    cookieParts.push('HttpOnly');
  }

  return cookieParts.join('; ');
}

/**
 * Set anonymous trial state in cookies (server-side) - DEPRECATED
 * Use createTrialCookie() and set via NextResponse instead
 */
export async function setAnonymousTrialState(state: AnonymousTrialState): Promise<void> {
  try {
    const token = await signTrialState(state);
    const cookieStore = await cookies();

    cookieStore.set(
      ANONYMOUS_TRIAL_CONFIG.cookieName,
      token,
      ANONYMOUS_TRIAL_CONFIG.cookie
    );
  } catch (error) {
    console.error("[anonymous-trial] Error setting trial state:", error);
    throw error;
  }
}

/**
 * Update anonymous trial state (e.g., mark modal as seen, increment actions)
 */
export async function updateAnonymousTrialState(
  updates: Partial<AnonymousTrialState>
): Promise<void> {
  const currentState = await getAnonymousTrialState();
  
  if (!currentState) {
    return;
  }

  const updatedState: AnonymousTrialState = {
    ...currentState,
    ...updates,
  };

  await setAnonymousTrialState(updatedState);
}

/**
 * Increment action count for a product
 */
export async function incrementAnonymousTrialAction(
  product: AnonymousTrialProduct
): Promise<void> {
  const state = await getAnonymousTrialState();
  
  if (!state) {
    return;
  }

  const currentCount = state.actionsUsed[product] || 0;
  
  await updateAnonymousTrialState({
    actionsUsed: {
      ...state.actionsUsed,
      [product]: currentCount + 1,
    },
  });
}

/**
 * Check if user has access (either anonymous trial or authenticated)
 */
export interface AnonymousAccessResult {
  hasAccess: boolean;
  reason: "anonymous_trial" | "authenticated" | "expired" | "not_started";
  trialState?: AnonymousTrialState;
  minutesRemaining?: number;
}

export async function checkAnonymousAccess(
  isAuthenticated: boolean,
  product: AnonymousTrialProduct
): Promise<AnonymousAccessResult> {
  // If authenticated, bypass anonymous trial
  if (isAuthenticated) {
    return {
      hasAccess: true,
      reason: "authenticated",
    };
  }

  // Check anonymous trial state
  const trialState = await getAnonymousTrialState();

  if (!trialState) {
    return {
      hasAccess: false,
      reason: "not_started",
    };
  }

  // Check if trial is expired
  const now = Date.now();
  if (now >= trialState.expiryTimestamp) {
    return {
      hasAccess: false,
      reason: "expired",
      trialState,
    };
  }

  // Trial is active
  const minutesRemaining = Math.floor(
    (trialState.expiryTimestamp - now) / (1000 * 60)
  );

  return {
    hasAccess: true,
    reason: "anonymous_trial",
    trialState,
    minutesRemaining,
  };
}

/**
 * Start anonymous trial (create state, return cookie string)
 * Use this in API routes with NextResponse.json(..., { headers: { 'Set-Cookie': cookie } })
 */
export async function startAnonymousTrialWithCookie(): Promise<{
  state: AnonymousTrialState;
  cookie: string;
}> {
  const state = createAnonymousTrialState();
  const cookie = await createTrialCookie(state);
  return { state, cookie };
}

/**
 * Start anonymous trial (legacy - uses cookies() API)
 */
export async function startAnonymousTrial(): Promise<AnonymousTrialState> {
  const state = createAnonymousTrialState();
  await setAnonymousTrialState(state);
  return state;
}
