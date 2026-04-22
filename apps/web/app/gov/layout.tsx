// ── app/gov/layout.tsx ──
// Government dashboard layout with sidebar and topbar

"use client";

import { useState } from "react";
import { GovSidebar } from "@/components/dashboard/layout/GovSidebar";
import { GovTopbar } from "@/components/dashboard/layout/GovTopbar";
import { GovMobileDrawer } from "@/components/dashboard/layout/GovMobileDrawer";

export default function GovLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      {/* Desktop Sidebar */}
      <GovSidebar />

      {/* Mobile Drawer */}
      <GovMobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Topbar */}
        <GovTopbar onMenuClick={() => setIsMobileMenuOpen(true)} />

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}
