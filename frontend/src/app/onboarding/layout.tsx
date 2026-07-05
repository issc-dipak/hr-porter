import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding Setup | HR Core",
  description: "Complete your employee onboarding setup",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-slate-950 z-[9999]">
      {children}
    </div>
  );
}
