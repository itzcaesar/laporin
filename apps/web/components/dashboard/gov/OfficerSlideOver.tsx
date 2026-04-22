// ── components/dashboard/gov/OfficerSlideOver.tsx ──
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

type Officer = {
  id: string;
  name: string;
  email: string;
  nip: string;
  role: "admin" | "officer";
  region?: string;
  isActive: boolean;
};

type OfficerSlideOverProps = {
  isOpen: boolean;
  onClose: () => void;
  officer?: Officer | null;
  onSave: (data: Partial<Officer>) => Promise<void>;
};

export function OfficerSlideOver({
  isOpen,
  onClose,
  officer,
  onSave,
}: OfficerSlideOverProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nip: "",
    role: "officer" as "admin" | "officer",
    region: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!officer;

  useEffect(() => {
    if (officer) {
      setFormData({
        name: officer.name,
        email: officer.email,
        nip: officer.nip,
        role: officer.role,
        region: officer.region || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        nip: "",
        role: "officer",
        region: "",
      });
    }
    setErrors({});
  }, [officer, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama wajib diisi";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!formData.nip.trim()) {
      newErrors.nip = "NIP wajib diisi";
    } else if (formData.nip.length < 18 || formData.nip.length > 20) {
      newErrors.nip = "NIP harus 18-20 digit";
    } else if (!/^\d+$/.test(formData.nip)) {
      newErrors.nip = "NIP hanya boleh berisi angka";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save officer:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* SlideOver Panel */}
      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-md bg-white shadow-xl overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white px-6 py-4">
          <h2 className="text-lg font-semibold font-display text-navy">
            {isEditMode ? "Edit Petugas" : "Tambah Petugas Baru"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              placeholder="Nama lengkap petugas"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* NIP */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              NIP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nip}
              onChange={(e) =>
                setFormData({ ...formData, nip: e.target.value })
              }
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 font-mono"
              placeholder="18-20 digit NIP"
              maxLength={20}
            />
            {errors.nip && (
              <p className="mt-1 text-xs text-red-600">{errors.nip}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as "admin" | "officer",
                })
              }
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
            >
              <option value="officer">Officer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Wilayah/Kecamatan
            </label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) =>
                setFormData({ ...formData, region: e.target.value })
              }
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
              placeholder="Contoh: Kec. Coblong"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Menyimpan..."
                : isEditMode
                ? "Simpan"
                : "Simpan & Undang"}
            </button>
          </div>

          {!isEditMode && (
            <p className="text-xs text-muted text-center">
              Email undangan akan dikirim ke petugas setelah disimpan
            </p>
          )}
        </form>
      </div>
    </>
  );
}
