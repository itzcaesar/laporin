// ── components/dashboard/gov/ActionPanel.tsx ──
"use client";

import { useState } from "react";
import { Check, X, Copy, Equal, ArrowUpRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { useGovReportActions } from "@/hooks/useGovReport";

type ReportStatus = "new" | "verified" | "in_progress" | "completed" | "closed";

type ActionPanelProps = {
  reportId: string;
  status: ReportStatus;
  hasPic: boolean;
  hoaxConfidence?: number;
  slaStatus: {
    targetDate: string;
    daysRemaining: number;
    isBreached: boolean;
  };
  recentAuditActions: Array<{
    time: string;
    officer: string;
    action: string;
  }>;
  actions?: ReturnType<typeof useGovReportActions>;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
};

export function ActionPanel({
  reportId,
  status,
  hasPic,
  hoaxConfidence = 0,
  slaStatus,
  recentAuditActions,
  actions,
  onSuccess,
  onError,
}: ActionPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [nip, setNip] = useState("");
  const [note, setNote] = useState("");
  const [budget, setBudget] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [estimatedStart, setEstimatedStart] = useState("");
  const [estimatedEnd, setEstimatedEnd] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Mock officers - replace with API call
  const officers = [
    { id: "1", name: "Budi Santosa", nip: "198512341234567890" },
    { id: "2", name: "Agus Permana", nip: "199012341234567890" },
  ];

  const handleOfficerChange = (officerId: string) => {
    setSelectedOfficer(officerId);
    const officer = officers.find((o) => o.id === officerId);
    if (officer) {
      setNip(officer.nip);
    }
  };

  const handleVerify = async (result: 'valid' | 'hoax' | 'duplicate' | 'out_of_jurisdiction') => {
    if (!actions || !nip) return;
    
    setIsSubmitting(true);
    try {
      await actions.verify({
        result,
        note: note || `Laporan ${result === 'valid' ? 'valid' : result === 'hoax' ? 'hoaks' : result === 'duplicate' ? 'duplikat' : 'bukan kewenangan'}`,
        officerNip: nip,
      });
      onSuccess?.(`Laporan berhasil diverifikasi sebagai ${result === 'valid' ? 'valid' : result === 'hoax' ? 'hoaks' : result === 'duplicate' ? 'duplikat' : 'bukan kewenangan'}`);
      setNote("");
      setNip("");
    } catch (err: any) {
      onError?.(err.message || "Gagal memverifikasi laporan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssign = async () => {
    if (!actions || !selectedOfficer || !nip) return;
    
    setIsSubmitting(true);
    try {
      await actions.assign({
        officerId: selectedOfficer,
        picNip: nip,
        estimatedStart: estimatedStart || undefined,
        estimatedEnd: estimatedEnd || undefined,
        budgetIdr: budget ? parseInt(budget.replace(/\D/g, '')) : undefined,
      });
      onSuccess?.("PIC berhasil ditugaskan");
      setSelectedOfficer("");
      setNip("");
      setEstimatedStart("");
      setEstimatedEnd("");
      setBudget("");
    } catch (err: any) {
      onError?.(err.message || "Gagal menugaskan PIC");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!actions || !newStatus || !nip || note.length < 10) return;
    
    setIsSubmitting(true);
    try {
      const statusMap: Record<string, string> = {
        'Mulai Proses': 'in_progress',
        'Selesai': 'completed',
        'Tutup': 'closed',
        'Tolak': 'rejected',
      };
      
      await actions.updateStatus({
        newStatus: statusMap[newStatus] as any,
        note,
        officerNip: nip,
      });
      onSuccess?.(`Status berhasil diubah menjadi ${newStatus}`);
      setNewStatus("");
      setNote("");
      setNip("");
    } catch (err: any) {
      onError?.(err.message || "Gagal mengubah status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTimeline = async () => {
    if (!actions || !nip) return;
    
    setIsSubmitting(true);
    try {
      await actions.updateTimeline({
        estimatedStart: estimatedStart || undefined,
        estimatedEnd: estimatedEnd || undefined,
        budgetIdr: budget ? parseInt(budget.replace(/\D/g, '')) : undefined,
        officerNip: nip,
      });
      onSuccess?.("Timeline dan anggaran berhasil diperbarui");
      setEstimatedStart("");
      setEstimatedEnd("");
      setBudget("");
      setNip("");
    } catch (err: any) {
      onError?.(err.message || "Gagal mengubah timeline");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* SECTION 1 — VERIFIKASI */}
      {status === "new" && (
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
          <h3 className="text-sm font-semibold font-display text-navy mb-3">
            Verifikasi Laporan
          </h3>
          <div className="space-y-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                NIP Konfirmasi
              </label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="18 digit NIP"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Catatan (opsional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tambahkan catatan..."
                rows={2}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 resize-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleVerify('valid')}
              disabled={!nip || isSubmitting}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-all",
                "hover:bg-green-50 border-green-200 text-green-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <Check size={20} />
              Valid
            </button>
            <button
              type="button"
              onClick={() => handleVerify('hoax')}
              disabled={!nip || isSubmitting}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition-all",
                "hover:bg-red-50 border-red-200 text-red-700",
                hoaxConfidence > 60 && "ring-2 ring-red-500",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <X size={20} />
              Hoaks
            </button>
            <button
              type="button"
              onClick={() => handleVerify('duplicate')}
              disabled={!nip || isSubmitting}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-amber-200 p-3 text-sm font-medium text-amber-700 hover:bg-amber-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Equal size={20} />
              Duplikat
            </button>
            <button
              type="button"
              onClick={() => handleVerify('out_of_jurisdiction')}
              disabled={!nip || isSubmitting}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-gray-200 p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpRight size={20} />
              Bukan Kewenangan
            </button>
          </div>
          {hoaxConfidence > 60 && (
            <p className="mt-2 text-xs text-amber-700">
              ⚠ AI: {hoaxConfidence}% kemungkinan hoaks
            </p>
          )}
        </div>
      )}

      {/* SECTION 2 — PENUGASAN PIC */}
      {status === "verified" && !hasPic && (
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
          <h3 className="text-sm font-semibold font-display text-navy mb-3">
            Penugasan PIC
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Pilih Petugas
              </label>
              <select
                value={selectedOfficer}
                onChange={(e) => handleOfficerChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              >
                <option value="">-- Pilih Petugas --</option>
                {officers.map((officer) => (
                  <option key={officer.id} value={officer.id}>
                    {officer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                NIP Konfirmasi
              </label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="18 digit NIP"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Tanggal Mulai (opsional)
              </label>
              <input
                type="date"
                value={estimatedStart}
                onChange={(e) => setEstimatedStart(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Tanggal Selesai (opsional)
              </label>
              <input
                type="date"
                value={estimatedEnd}
                onChange={(e) => setEstimatedEnd(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <button
              type="button"
              onClick={handleAssign}
              disabled={!selectedOfficer || !nip || isSubmitting}
              className="w-full rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Menugaskan..." : "Tugaskan PIC"}
            </button>
          </div>
        </div>
      )}

      {/* SECTION 3 — UPDATE STATUS */}
      {status !== "closed" && (
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
          <button
            type="button"
            onClick={() => toggleSection("status")}
            className="flex w-full items-center justify-between text-sm font-semibold font-display text-navy mb-3 lg:cursor-default"
          >
            Update Status
            <ChevronDown
              size={16}
              className={cn(
                "lg:hidden transition-transform",
                expandedSection === "status" && "rotate-180"
              )}
            />
          </button>
          <div
            className={cn(
              "space-y-3",
              expandedSection !== "status" && "hidden lg:block"
            )}
          >
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Status Baru
              </label>
              <select 
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              >
                <option value="">-- Pilih Status --</option>
                {status === "verified" && <option value="Mulai Proses">Mulai Proses</option>}
                {status === "in_progress" && <option value="Selesai">Selesai</option>}
                {status === "completed" && <option value="Tutup">Tutup</option>}
                <option value="Tolak">Tolak</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Catatan (wajib)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Catatan wajib diisi (min 10 karakter)..."
                rows={3}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                NIP Konfirmasi
              </label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="18 digit NIP"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={note.length < 10 || !nip || !newStatus || isSubmitting}
              className="w-full rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Mengubah..." : "Update Status"}
            </button>
          </div>
        </div>
      )}

      {/* SECTION 4 — TIMELINE & ANGGARAN */}
      {hasPic && (
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
          <button
            type="button"
            onClick={() => toggleSection("timeline")}
            className="flex w-full items-center justify-between text-sm font-semibold font-display text-navy mb-3 lg:cursor-default"
          >
            Timeline & Anggaran
            <ChevronDown
              size={16}
              className={cn(
                "lg:hidden transition-transform",
                expandedSection === "timeline" && "rotate-180"
              )}
            />
          </button>
          <div
            className={cn(
              "space-y-3",
              expandedSection !== "timeline" && "hidden lg:block"
            )}
          >
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={estimatedStart}
                onChange={(e) => setEstimatedStart(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={estimatedEnd}
                onChange={(e) => setEstimatedEnd(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                Anggaran
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                  Rp
                </span>
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-border bg-white pl-10 pr-3 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">
                NIP Konfirmasi
              </label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="18 digit NIP"
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              />
            </div>
            <button
              type="button"
              onClick={handleUpdateTimeline}
              disabled={!nip || isSubmitting}
              className="w-full rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}

      {/* SECTION 5 — UPLOAD FOTO */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
        <button
          type="button"
          onClick={() => toggleSection("upload")}
          className="flex w-full items-center justify-between text-sm font-semibold font-display text-navy mb-3 lg:cursor-default"
        >
          Upload Foto
          <ChevronDown
            size={16}
            className={cn(
              "lg:hidden transition-transform",
              expandedSection === "upload" && "rotate-180"
            )}
          />
        </button>
        <div
          className={cn(
            "space-y-3",
            expandedSection !== "upload" && "hidden lg:block"
          )}
        >
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" name="photoType" value="progress" />
              Foto Progress
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" name="photoType" value="completion" />
              Foto Penyelesaian
            </label>
          </div>
          <div className="rounded-lg border-2 border-dashed border-border bg-surface p-6 text-center">
            <p className="text-sm text-muted mb-2">
              Klik atau drag & drop foto
            </p>
            <p className="text-xs text-muted">Max 5MB, JPG/PNG</p>
          </div>
          <button
            type="button"
            className="w-full rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
          >
            Upload Foto
          </button>
        </div>
      </div>

      {/* SECTION 6 — SLA STATUS */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
        <h3 className="text-sm font-semibold font-display text-navy mb-3">
          SLA Status
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Target:</span>
            <span className="text-ink font-medium">{slaStatus.targetDate}</span>
          </div>
          <div
            className={cn(
              "rounded-lg p-3 text-sm font-semibold",
              slaStatus.isBreached
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            )}
          >
            {slaStatus.isBreached ? (
              <>🔴 TERLAMPAUI ({Math.abs(slaStatus.daysRemaining)} hari)</>
            ) : (
              <>🟢 {slaStatus.daysRemaining} hari tersisa</>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 7 — AUDIT TRAIL RINGKAS */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-border">
        <h3 className="text-sm font-semibold font-display text-navy mb-3">
          Audit Trail Ringkas
        </h3>
        <div className="space-y-2 mb-3">
          {recentAuditActions.map((action, index) => (
            <div key={index} className="text-xs text-muted">
              <span className="font-medium text-ink">{action.time}</span> ·{" "}
              {action.officer} → {action.action}
            </div>
          ))}
        </div>
        <a
          href={`/gov/audit?reportId=${reportId}`}
          className="text-sm font-medium text-blue hover:text-blue/80 transition-colors"
        >
          Lihat Log Lengkap →
        </a>
      </div>
    </div>
  );
}
