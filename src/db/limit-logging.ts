// src/db/limit-logging.ts
import { db, limitEvents } from "@/db";

export type LimitEventType = "rate_limited" | "quota_exceeded";

export interface LogLimitEventInput {
  userId: string;
  apiKeyId: number;
  planSlug: string;
  eventType: LimitEventType;
  httpStatus: 429 | 403;
  requestPath?: string;
}

export async function logLimitEvent(input: LogLimitEventInput) {
  const { userId, apiKeyId, planSlug, eventType, httpStatus, requestPath } =
    input;

  try {
    await db.insert(limitEvents).values({
      userId,
      apiKeyId,
      planSlug,
      eventType,
      httpStatus,
      requestPath: requestPath ?? null,
    });
  } catch (err) {
    // 不影响主流程
    console.error("[logLimitEvent] failed", err);
  }
}
