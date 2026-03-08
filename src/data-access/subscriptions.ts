import { db } from "@/db";

// Subscriptions table removed - this function is disabled
// Use checkUserAccess from @/lib/access instead
export async function getSubscription(userId: string) {
  // Always return null - subscriptions table doesn't exist
  return null;

  /* ORIGINAL CODE - DISABLED BECAUSE SUBSCRIPTIONS TABLE DOESN'T EXIST
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: (users, { eq }) => eq(users.userId, userId),
  });

  return subscription;
  */
}
