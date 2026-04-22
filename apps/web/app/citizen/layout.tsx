// ── app/citizen/layout.tsx ──
// Citizen portal layout with topbar and bottom navigation

import { CitizenTopbar } from "@/components/dashboard/layout/CitizenTopbar";
import { CitizenBottomNav } from "@/components/dashboard/layout/CitizenBottomNav";

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      {/* Topbar */}
      <CitizenTopbar />

      {/* Main content */}
      <main className="pt-16 pb-20 lg:pb-8">
        {children}
      </main>

      {/* Bottom navigation (mobile + tablet) */}
      <CitizenBottomNav />
    </div>
  );
}
