// ── components/dashboard/gov/OfficerTable.tsx ──
"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type Officer = {
  id: string;
  name: string;
  email: string;
  nip: string;
  role: "admin" | "officer";
  region?: string;
  isActive: boolean;
};

type OfficerTableProps = {
  officers: Officer[];
  onEdit: (officer: Officer) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onResetPassword: (id: string) => void;
};

const maskNip = (nip: string) => {
  if (nip.length < 5) return nip;
  return `${nip.substring(0, 3)}...${nip.substring(nip.length - 2)}`;
};

export function OfficerTable({
  officers,
  onEdit,
  onToggleActive,
  onResetPassword,
}: OfficerTableProps) {
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);

  const handleToggleActive = (officer: Officer) => {
    if (officer.isActive) {
      // Show confirmation for deactivation
      setConfirmDeactivate(officer.id);
    } else {
      // Activate immediately
      onToggleActive(officer.id, true);
      setContextMenuId(null);
    }
  };

  const confirmDeactivation = (id: string) => {
    onToggleActive(id, false);
    setConfirmDeactivate(null);
    setContextMenuId(null);
  };

  return (
    <>
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm border border-border">
        <table className="w-full">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Nama Petugas
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                NIP
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Wilayah
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {officers.map((officer) => (
              <tr
                key={officer.id}
                className="hover:bg-surface transition-colors"
              >
                {/* Name */}
                <td className="px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-ink">
                      {officer.name}
                    </div>
                    <div className="text-xs text-muted">{officer.email}</div>
                  </div>
                </td>

                {/* NIP (masked) */}
                <td className="px-4 py-3">
                  <span className="font-mono text-sm text-ink">
                    {maskNip(officer.nip)}
                  </span>
                </td>

                {/* Role */}
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-xs font-semibold",
                      officer.role === "admin"
                        ? "bg-navy text-white"
                        : "bg-blue-light text-blue"
                    )}
                  >
                    {officer.role === "admin" ? "Admin" : "Officer"}
                  </span>
                </td>

                {/* Region */}
                <td className="px-4 py-3">
                  <span className="text-sm text-ink">
                    {officer.region || "—"}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-semibold",
                      officer.isActive ? "text-green-700" : "text-red-700"
                    )}
                  >
                    {officer.isActive ? "✅ Aktif" : "⛔ Nonaktif"}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3 relative">
                  <button
                    type="button"
                    onClick={() =>
                      setContextMenuId(
                        contextMenuId === officer.id ? null : officer.id
                      )
                    }
                    className="text-muted hover:text-ink transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {contextMenuId === officer.id && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setContextMenuId(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border bg-white shadow-lg z-30 py-1">
                        <button
                          onClick={() => {
                            onEdit(officer);
                            setContextMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(officer)}
                          className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface transition-colors"
                        >
                          {officer.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button
                          onClick={() => {
                            onResetPassword(officer.id);
                            setContextMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-surface transition-colors"
                        >
                          Reset Password
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Deactivation Confirmation Dialog */}
      {confirmDeactivate && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setConfirmDeactivate(null)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold font-display text-navy mb-2">
              Konfirmasi Nonaktifkan Petugas
            </h3>
            <p className="text-sm text-muted mb-6">
              Apakah Anda yakin ingin menonaktifkan petugas ini? Petugas tidak
              akan bisa login sampai diaktifkan kembali.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeactivate(null)}
                className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => confirmDeactivation(confirmDeactivate)}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Nonaktifkan
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
