// src/components/trial-guard.tsx
import { redirect } from "next/navigation";
import { getSSRSession } from "@/lib/get-server-session";
import { checkUserAccess, type Product } from "@/lib/access";

interface TrialGuardProps {
  product: Product;
  children: React.ReactNode;
}

export async function TrialGuard({ product, children }: TrialGuardProps) {
  const session = await getSSRSession();

  // If not authenticated, redirect to login
  if (!session?.user?.id) {
    redirect("/en/login");
  }

  // Check user access for this product
  const accessResult = await checkUserAccess(session.user.id, product);

  // If access denied, redirect to pricing page
  if (!accessResult.access) {
    redirect("/en/pricing");
  }

  // If trial access, show banner
  if (accessResult.reason === "trial") {
    return (
      <div>
        <TrialBanner daysLeft={accessResult.daysLeft} />
        {children}
      </div>
    );
  }

  // If paid access, just render children
  return <>{children}</>;
}

function TrialBanner({ daysLeft }: { daysLeft: number }) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <p className="text-sm text-amber-900">
          <span className="font-medium">English:</span> You have {daysLeft} day
          {daysLeft !== 1 ? "s" : ""} left in your free trial.
          <br />
          <span className="font-medium">中文：</span>您的免费试用还剩 {daysLeft} 天。
        </p>
      </div>
    </div>
  );
}
