// ── app/gov/officers/page.tsx ──
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { OfficerTable } from "@/components/dashboard/gov/OfficerTable";
import { OfficerSlideOver } from "@/components/dashboard/gov/OfficerSlideOver";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import { Users } from "lucide-react";

import { useOfficers, type Officer } from "@/hooks/useOfficers";
import { api } from "@/lib/api-client";

export default function GovOfficersPage() {
  const { officers, isLoading, refetch } = useOfficers(1, 100);
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
    try {
      if (selectedOfficer) {
        await api.patch(`/gov/officers/${selectedOfficer.id}`, data);
      } else {
        await api.post(`/gov/officers`, { ...data, password: "password123" });
      }
      refetch();
    } catch (err) {
      console.error("Failed to save officer", err);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      if (isActive) {
        await api.patch(`/gov/officers/${id}`, { isActive });
      } else {
        await api.delete(`/gov/officers/${id}`);
      }
      refetch();
    } catch (err) {
      console.error("Failed to toggle active", err);
    }
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
          className="btn-interactive flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
        >
          <Plus size={16} />
          Tambah Petugas
        </button>
      </div>

      {/* Officer Table */}
      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : officers.length > 0 ? (
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
