// ── app/gov/officers/page.tsx ──
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { OfficerTable } from "@/components/dashboard/gov/OfficerTable";
import { OfficerSlideOver } from "@/components/dashboard/gov/OfficerSlideOver";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import { Users } from "lucide-react";

type Officer = {
  id: string;
  name: string;
  email: string;
  nip: string;
  role: "admin" | "officer";
  region?: string;
  isActive: boolean;
};

// Mock data - replace with API call
const MOCK_OFFICERS: Officer[] = [
  {
    id: "1",
    name: "Agus Permana",
    email: "agus.permana@bandung.go.id",
    nip: "198512341234567890",
    role: "admin",
    region: "Kota Bandung",
    isActive: true,
  },
  {
    id: "2",
    name: "Budi Santosa",
    email: "budi.santosa@bandung.go.id",
    nip: "199012341234567890",
    role: "officer",
    region: "Kec. Coblong",
    isActive: true,
  },
  {
    id: "3",
    name: "Siti Nurhaliza",
    email: "siti.nurhaliza@bandung.go.id",
    nip: "199512341234567890",
    role: "officer",
    region: "Kec. Cicendo",
    isActive: true,
  },
  {
    id: "4",
    name: "Dedi Mulyadi",
    email: "dedi.mulyadi@bandung.go.id",
    nip: "198812341234567890",
    role: "officer",
    region: "Kec. Sumur Bandung",
    isActive: false,
  },
];

export default function GovOfficersPage() {
  const [officers, setOfficers] = useState<Officer[]>(MOCK_OFFICERS);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);

  const handleAddOfficer = () => {
    setSelectedOfficer(null);
    setIsSlideOverOpen(true);
  };

  const handleEditOfficer = (officer: Officer) => {
    setSelectedOfficer(officer);
    setIsSlideOverOpen(true);
  };

  const handleSaveOfficer = async (data: Partial<Officer>) => {
    // TODO: API call to POST /gov/officers or PATCH /gov/officers/:id
    console.log("Saving officer:", data);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (selectedOfficer) {
      // Edit existing
      setOfficers((prev) =>
        prev.map((o) =>
          o.id === selectedOfficer.id ? { ...o, ...data } : o
        )
      );
    } else {
      // Add new
      const newOfficer: Officer = {
        id: Date.now().toString(),
        name: data.name || "",
        email: data.email || "",
        nip: data.nip || "",
        role: data.role || "officer",
        region: data.region,
        isActive: true,
      };
      setOfficers((prev) => [...prev, newOfficer]);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    // TODO: API call to PATCH /gov/officers/:id
    console.log("Toggle active:", id, isActive);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    setOfficers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isActive } : o))
    );
  };

  const handleResetPassword = async (id: string) => {
    // TODO: API call to POST /gov/officers/:id/reset-password
    console.log("Reset password:", id);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    alert("Email reset password telah dikirim");
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy mb-1">
            Manajemen Petugas
          </h1>
          <p className="text-sm text-muted">
            Kelola akun petugas dan admin dinas
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddOfficer}
          className="flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
        >
          <Plus size={16} />
          Tambah Petugas
        </button>
      </div>

      {/* Officer Table */}
      {officers.length > 0 ? (
        <OfficerTable
          officers={officers}
          onEdit={handleEditOfficer}
          onToggleActive={handleToggleActive}
          onResetPassword={handleResetPassword}
        />
      ) : (
        <EmptyState
          icon="👥"
          title="Belum ada petugas terdaftar"
          description="Tambahkan petugas pertama untuk mulai mengelola laporan"
          actionLabel="Tambah Petugas"
          onAction={handleAddOfficer}
        />
      )}

      {/* SlideOver */}
      <OfficerSlideOver
        isOpen={isSlideOverOpen}
        onClose={() => {
          setIsSlideOverOpen(false);
          setSelectedOfficer(null);
        }}
        officer={selectedOfficer}
        onSave={handleSaveOfficer}
      />
    </div>
  );
}
