// ── app/gov/officers/page.tsx ──
"use client";

import { useState } from "react";
import { Plus, Copy, CheckCircle, X, AlertTriangle } from "lucide-react";
import { OfficerTable } from "@/components/dashboard/gov/OfficerTable";
import { OfficerSlideOver } from "@/components/dashboard/gov/OfficerSlideOver";
import EmptyState from "@/components/dashboard/shared/EmptyState";
import LoadingSkeleton from "@/components/dashboard/shared/LoadingSkeleton";
import { Users } from "lucide-react";

import { useOfficers, type Officer } from "@/hooks/useOfficers";
import { api, ApiClientError } from "@/lib/api-client";

interface ResetResult {
  officerName: string;
  tempPassword: string;
}

export default function GovOfficersPage() {
  const { officers, isLoading, refetch } = useOfficers(1, 100);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);

  // Reset password state
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  // Step 1: show confirm dialog
  const handleResetPassword = (id: string) => {
    setConfirmResetId(id);
    setResetError(null);
  };

  // Step 2: call API
  const confirmReset = async () => {
    if (!confirmResetId) return;
    setIsResetting(true);
    setResetError(null);
    try {
      const officer = officers.find((o) => o.id === confirmResetId);
      const res = await api.post<{ data: { tempPassword: string; message: string } }>(
        `/gov/officers/${confirmResetId}/reset-password`,
        {}
      );
      setResetResult({
        officerName: officer?.name ?? "Petugas",
        tempPassword: res.data.tempPassword,
      });
      setConfirmResetId(null);
    } catch (err) {
      setResetError(
        err instanceof ApiClientError ? err.userMessage : "Gagal mereset password."
      );
    } finally {
      setIsResetting(false);
    }
  };

  const copyToClipboard = async () => {
    if (!resetResult) return;
    await navigator.clipboard.writeText(resetResult.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      {/* Confirm Reset Dialog */}
      {confirmResetId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !isResetting) setConfirmResetId(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <h2 className="text-base font-bold font-display text-navy">Reset Password</h2>
            </div>
            <p className="text-sm text-ink mb-2">
              Ini akan membuat kata sandi baru dan{" "}
              <strong>mengeluarkan semua sesi aktif</strong> petugas ini.
            </p>
            <p className="text-sm text-muted mb-5">
              Kata sandi sementara yang dihasilkan akan ditampilkan kepada Anda dan harus segera disampaikan kepada petugas.
            </p>
            {resetError && (
              <p className="text-xs text-red-600 mb-3">{resetError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetId(null)}
                disabled={isResetting}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmReset}
                disabled={isResetting}
                className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {isResetting ? "Mereset..." : "Ya, Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temp Password Result Modal */}
      {resetResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <h2 className="text-base font-bold font-display text-navy">Password Direset</h2>
              </div>
              <button
                type="button"
                onClick={() => { setResetResult(null); setCopied(false); }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-muted mb-4">
              Kata sandi sementara untuk <strong>{resetResult.officerName}</strong>:
            </p>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-3 mb-4">
              <span className="flex-1 font-mono text-lg font-bold tracking-widest text-navy">
                {resetResult.tempPassword}
              </span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue hover:bg-blue-light transition-colors"
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                {copied ? "Disalin!" : "Salin"}
              </button>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 mb-4">
              <p className="text-xs text-amber-800">
                ⚠️ Kata sandi ini hanya ditampilkan sekali. Catat dan sampaikan kepada petugas secara aman. Minta petugas segera mengubah kata sandinya setelah login.
              </p>
            </div>

            <button
              type="button"
              onClick={() => { setResetResult(null); setCopied(false); }}
              className="w-full rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 transition-colors"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
