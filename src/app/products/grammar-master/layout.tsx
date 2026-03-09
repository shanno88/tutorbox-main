// src/app/products/grammar-master/layout.tsx
// Layout removed - using AnonymousTrialGuard directly in page.tsx instead
// This allows anonymous users to access the page without authentication

export default function GrammarMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
