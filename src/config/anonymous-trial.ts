<<<<<<< HEAD
// Anonymous trial configuration
export const ANONYMOUS_TRIAL_CONFIG = {
  // Duration in minutes (configurable via env var)
  durationMinutes: parseInt(process.env.NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES || "30", 10),
  
  // Cookie name for storing trial state
  cookieName: "tutorbox_anon_trial",
  
  // Products that support anonymous trial
  supportedProducts: ["grammar-master", "cast-master"] as const,
  
  // Maximum number of actions during trial (optional, for future use)
  maxActions: {
    "grammar-master": 10, // Max 10 grammar checks
    "cast-master": 5,     // Max 5 broadcasts
  },
  
  // Cookie options
  cookie: {
    maxAge: 30 * 24 * 60 * 60, // 30 days (longer than trial to track "seen" state)
    httpOnly: false, // Need client-side access
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
} as const;

export type AnonymousTrialProduct = typeof ANONYMOUS_TRIAL_CONFIG.supportedProducts[number];

export interface AnonymousTrialState {
  type: "anonymous_30min";
  startTimestamp: number; // Unix timestamp in milliseconds
  expiryTimestamp: number; // Unix timestamp in milliseconds
  hasSeenExpiredModal: boolean;
  actionsUsed: Partial<Record<AnonymousTrialProduct, number>>;
}

export function isAnonymousTrialExpired(state: AnonymousTrialState): boolean {
  return Date.now() >= state.expiryTimestamp;
}

export function getTrialTimeRemaining(state: AnonymousTrialState): number {
  const remaining = state.expiryTimestamp - Date.now();
  return Math.max(0, remaining);
}

export function getTrialMinutesRemaining(state: AnonymousTrialState): number {
  return Math.floor(getTrialTimeRemaining(state) / (1000 * 60));
}
=======
// Anonymous trial configuration
export const ANONYMOUS_TRIAL_CONFIG = {
  // Duration in minutes (configurable via env var)
  durationMinutes: parseInt(process.env.NEXT_PUBLIC_ANONYMOUS_TRIAL_MINUTES || "30", 10),
  
  // Cookie name for storing trial state
  cookieName: "tutorbox_anon_trial",
  
  // Products that support anonymous trial
  supportedProducts: ["grammar-master", "cast-master"] as const,
  
  // Maximum number of actions during trial (optional, for future use)
  maxActions: {
    "grammar-master": 10, // Max 10 grammar checks
    "cast-master": 5,     // Max 5 broadcasts
  },
  
  // Cookie options
  cookie: {
    maxAge: 30 * 24 * 60 * 60, // 30 days (longer than trial to track "seen" state)
    httpOnly: false, // Need client-side access
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  },
} as const;

export type AnonymousTrialProduct = typeof ANONYMOUS_TRIAL_CONFIG.supportedProducts[number];

export interface AnonymousTrialState {
  type: "anonymous_30min";
  startTimestamp: number; // Unix timestamp in milliseconds
  expiryTimestamp: number; // Unix timestamp in milliseconds
  hasSeenExpiredModal: boolean;
  actionsUsed: Partial<Record<AnonymousTrialProduct, number>>;
}

export function isAnonymousTrialExpired(state: AnonymousTrialState): boolean {
  return Date.now() >= state.expiryTimestamp;
}

export function getTrialTimeRemaining(state: AnonymousTrialState): number {
  const remaining = state.expiryTimestamp - Date.now();
  return Math.max(0, remaining);
}

export function getTrialMinutesRemaining(state: AnonymousTrialState): number {
  return Math.floor(getTrialTimeRemaining(state) / (1000 * 60));
}
>>>>>>> origin/main
