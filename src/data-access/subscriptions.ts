import { db } from "@/db";

export async function getSubscription(userId: string) {
  const subscription = await db.query.subscriptions.findFirst({
    where: (users, { eq }) => eq(users.userId, userId),
  });

  return subscription;
}
