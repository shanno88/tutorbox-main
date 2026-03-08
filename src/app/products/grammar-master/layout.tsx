// src/app/products/grammar-master/layout.tsx
import { TrialGuard } from "@/components/trial-guard";

export default function GrammarMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TrialGuard product="grammar">{children}</TrialGuard>;
}
