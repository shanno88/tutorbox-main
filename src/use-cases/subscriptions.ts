// Subscriptions table removed - using productGrants + trial system instead
// Use checkUserAccess from @/lib/access for access control

export async function isUserSubscribed(_userId: string): Promise<boolean> {
  // Always return false - subscriptions table no longer exists
  return false;
}

export async function hasActiveSubscription(_userId: string): Promise<boolean> {
  // Always return false - subscriptions table no longer exists
  return false;
}
