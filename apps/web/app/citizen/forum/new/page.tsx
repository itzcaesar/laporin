// ── app/citizen/forum/new/page.tsx ──
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Diskusi Umum",
  "Tips & Trik",
  "Apresiasi",
  "Pertanyaan",
  "Keluhan",
];

export default function NewThreadPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    content: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Judul harus diisi";
    } else if (formData.title.length < 10) {
      newErrors.title = "Judul minimal 10 karakter";
    } else if (formData.title.length > 200) {
      newErrors.title = "Judul maksimal 200 karakter";
    }

    if (!formData.category) {
      newErrors.category = "Kategori harus dipilih";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Konten harus diisi";
    } else if (formData.content.length < 50) {
      newErrors.content = "Konten minimal 50 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Redirect to forum list
    router.push("/citizen/forum");
  };

  return (
    <div className="dashboard-page max-w-3xl">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Kembali ke Forum
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-navy mb-2">
          Buat Thread Baru
        </h1>
        <p className="text-sm text-muted">
          Mulai diskusi baru dengan sesama warga
        </p>
      </div>

      {/* Guidelines */}
      <div className="rounded-2xl bg-blue-light border border-blue/20 p-5 mb-6">
        <div className="flex gap-3">
          <AlertCircle size={20} className="text-blue shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-navy mb-2">
              Panduan Membuat Thread
            </h3>
            <ul className="text-xs text-ink space-y-1.5">
              <li>• Gunakan judul yang jelas dan deskriptif</li>
              <li>• Pilih kategori yang sesuai dengan topik diskusi</li>
              <li>• Tulis konten yang informatif dan mudah dipahami</li>
              <li>• Gunakan bahasa yang sopan dan konstruktif</li>
              <li>• Hindari spam, iklan, atau konten yang tidak pantas</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="rounded-2xl bg-white p-5 border border-border">
          <label className="block text-sm font-semibold text-navy mb-2">
            Judul Thread <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              if (errors.title) setErrors({ ...errors, title: "" });
            }}
            placeholder="Contoh: Tips Membuat Laporan yang Efektif"
            className={cn(
              "w-full rounded-xl border bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 transition-all",
              errors.title
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-border focus:border-blue focus:ring-blue/20"
            )}
          />
          {errors.title && (
            <p className="text-xs text-red-500 mt-2">{errors.title}</p>
          )}
          <p className="text-xs text-muted mt-2">
            {formData.title.length}/200 karakter
          </p>
        </div>

        {/* Category */}
        <div className="rounded-2xl bg-white p-5 border border-border">
          <label className="block text-sm font-semibold text-navy mb-2">
            Kategori <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => {
              setFormData({ ...formData, category: e.target.value });
              if (errors.category) setErrors({ ...errors, category: "" });
            }}
            className={cn(
              "w-full rounded-xl border bg-surface px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 transition-all",
              errors.category
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-border focus:border-blue focus:ring-blue/20"
            )}
          >
            <option value="">Pilih kategori...</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-xs text-red-500 mt-2">{errors.category}</p>
          )}
        </div>

        {/* Content */}
        <div className="rounded-2xl bg-white p-5 border border-border">
          <label className="block text-sm font-semibold text-navy mb-2">
            Konten <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => {
              setFormData({ ...formData, content: e.target.value });
              if (errors.content) setErrors({ ...errors, content: "" });
            }}
            placeholder="Jelaskan topik diskusi Anda secara detail..."
            rows={12}
            className={cn(
              "w-full rounded-xl border bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 resize-none transition-all",
              errors.content
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-border focus:border-blue focus:ring-blue/20"
            )}
          />
          {errors.content && (
            <p className="text-xs text-red-500 mt-2">{errors.content}</p>
          )}
          <p className="text-xs text-muted mt-2">
            {formData.content.length} karakter (minimal 50)
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-xl border border-border bg-white px-6 py-3 text-sm font-medium text-ink hover:bg-surface transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-navy px-6 py-3 text-sm font-medium text-white hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            {isSubmitting ? "Memposting..." : "Posting Thread"}
          </button>
        </div>
      </form>
    </div>
  );
}
