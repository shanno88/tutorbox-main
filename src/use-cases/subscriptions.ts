import { getSubscription } from "@/data-access/subscriptions";

export async function isUserSubscribed(userId: string) {
  const subscription = await getSubscription(userId);

  if (!subscription) {
    return false;
  }

  if (subscription.currentPeriodEnd < new Date()) {
    return false;
  }

  return true;
}
