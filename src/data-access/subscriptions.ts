import { db } from "@/db";

export async function getSubscription(userId: string) {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const subscription = await db.query.subscriptions.findFirst({
    where: (users, { eq }) => eq(users.userId, userId),
  });

  return subscription;
}
