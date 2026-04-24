// ── app/gov/faq/page.tsx ──
"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiClientError } from "@/lib/api-client";
import type { FAQ } from "@/hooks/useFaq";

const CATEGORIES = [
  "Semua",
  "Waktu Penanganan",
  "Pelacakan Laporan",
  "Privasi",
  "Penolakan Laporan",
  "Pembayaran",
  "Teknis",
];

const FAQ_CATEGORIES = CATEGORIES.slice(1); // without "Semua"

type ModalMode = "add" | "edit";

interface ModalState {
  mode: ModalMode;
  faq?: FAQ;
}

export default function GovFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [modal, setModal] = useState<ModalState | null>(null);

  // Form state
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formCategory, setFormCategory] = useState(FAQ_CATEGORIES[0]);
  const [formPublished, setFormPublished] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchFaqs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ data: FAQ[] }>("/faq", { skipAuth: true });
      setFaqs(res.data);
    } catch {
      setFaqs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchFaqs(); }, []);

  const openAdd = () => {
    setFormQuestion("");
    setFormAnswer("");
    setFormCategory(FAQ_CATEGORIES[0]);
    setFormPublished(false);
    setFormError(null);
    setModal({ mode: "add" });
  };

  const openEdit = (faq: FAQ) => {
    setFormQuestion(faq.question);
    setFormAnswer(faq.answer);
    setFormCategory(faq.category);
    setFormPublished(faq.isPublished);
    setFormError(null);
    setModal({ mode: "edit", faq });
  };

  const closeModal = () => setModal(null);

  const handleSave = async () => {
    if (!formQuestion.trim() || !formAnswer.trim()) {
      setFormError("Pertanyaan dan jawaban wajib diisi.");
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      if (modal?.mode === "add") {
        const res = await api.post<{ data: FAQ }>("/faq", {
          question: formQuestion.trim(),
          answer: formAnswer.trim(),
          category: formCategory,
          isPublished: formPublished,
        });
        setFaqs((prev) => [res.data, ...prev]);
      } else if (modal?.faq) {
        const res = await api.patch<{ data: FAQ }>(`/faq/${modal.faq.id}`, {
          question: formQuestion.trim(),
          answer: formAnswer.trim(),
          category: formCategory,
          isPublished: formPublished,
        });
        setFaqs((prev) => prev.map((f) => (f.id === modal.faq!.id ? res.data : f)));
      }
      closeModal();
    } catch (err) {
      setFormError(
        err instanceof ApiClientError ? err.userMessage : "Gagal menyimpan FAQ."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublish = async (faq: FAQ) => {
    // Optimistic
    setFaqs((prev) =>
      prev.map((f) => (f.id === faq.id ? { ...f, isPublished: !f.isPublished } : f))
    );
    try {
      await api.patch(`/faq/${faq.id}`, { isPublished: !faq.isPublished });
    } catch {
      // Roll back
      setFaqs((prev) =>
        prev.map((f) => (f.id === faq.id ? { ...f, isPublished: faq.isPublished } : f))
      );
    }
  };

  const deleteFAQ = async (faq: FAQ) => {
    if (!confirm("Apakah Anda yakin ingin menghapus FAQ ini?")) return;
    // Optimistic
    setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
    try {
      await api.delete(`/faq/${faq.id}`);
    } catch {
      // Roll back
      setFaqs((prev) => [...prev, faq]);
    }
  };

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Semua" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy mb-2">
            Kelola FAQ
          </h1>
          <p className="text-sm text-muted">
            Kelola pertanyaan yang sering diajukan oleh warga
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
        >
          <Plus size={16} />
          Tambah FAQ
        </button>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Cari pertanyaan atau jawaban..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                selectedCategory === category
                  ? "bg-navy text-white"
                  : "bg-white border border-border text-ink hover:bg-surface"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-white p-4 border border-border">
          <p className="text-sm text-muted mb-1">Total FAQ</p>
          <p className="text-2xl font-bold font-display text-navy">{faqs.length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 border border-border">
          <p className="text-sm text-muted mb-1">Dipublikasi</p>
          <p className="text-2xl font-bold font-display text-green-600">
            {faqs.filter((f) => f.isPublished).length}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 border border-border">
          <p className="text-sm text-muted mb-1">Total Views</p>
          <p className="text-2xl font-bold font-display text-blue">
            {faqs.reduce((sum, f) => sum + f.views, 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-white p-4 border border-border">
          <p className="text-sm text-muted mb-1">Helpful Votes</p>
          <p className="text-2xl font-bold font-display text-amber-600">
            {faqs.reduce((sum, f) => sum + f.helpful, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="text-sm text-muted">Memuat FAQ...</div>
          </div>
        ) : filteredFAQs.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center border border-border">
            <p className="text-muted">Tidak ada FAQ yang ditemukan</p>
          </div>
        ) : (
          filteredFAQs.map((faq) => (
            <div
              key={faq.id}
              className="rounded-xl bg-white p-5 border border-border hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-blue bg-blue-light px-2 py-1 rounded">
                      {faq.category}
                    </span>
                    {faq.isPublished ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <Eye size={12} />
                        Dipublikasi
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-muted">
                        <EyeOff size={12} />
                        Draft
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-navy mb-2">{faq.question}</h3>
                  <p className="text-sm text-ink leading-relaxed mb-3">{faq.answer}</p>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span>{faq.views.toLocaleString()} views</span>
                    <span>•</span>
                    <span>{faq.helpful.toLocaleString()} helpful</span>
                    <span>•</span>
                    <span>Diperbarui {new Date(faq.updatedAt).toLocaleDateString("id-ID")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => togglePublish(faq)}
                    className="flex items-center justify-center h-9 w-9 rounded-lg text-muted hover:bg-surface hover:text-ink transition-colors"
                    title={faq.isPublished ? "Unpublish" : "Publish"}
                  >
                    {faq.isPublished ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(faq)}
                    className="flex items-center justify-center h-9 w-9 rounded-lg text-muted hover:bg-surface hover:text-blue transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFAQ(faq)}
                    className="flex items-center justify-center h-9 w-9 rounded-lg text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold font-display text-navy">
                {modal.mode === "add" ? "Tambah FAQ Baru" : "Edit FAQ"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="text-xs font-medium text-muted mb-1.5 block">Kategori</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                >
                  {FAQ_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Question */}
              <div>
                <label className="text-xs font-medium text-muted mb-1.5 block">
                  Pertanyaan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  rows={2}
                  placeholder="Tulis pertanyaan..."
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 resize-none"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="text-xs font-medium text-muted mb-1.5 block">
                  Jawaban <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  rows={4}
                  placeholder="Tulis jawaban..."
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 resize-none"
                />
              </div>

              {/* Publish toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setFormPublished((p) => !p)}
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors",
                    formPublished ? "bg-blue" : "bg-gray-200"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                      formPublished ? "translate-x-4" : "translate-x-0.5"
                    )}
                  />
                </div>
                <span className="text-sm text-ink">Publikasikan segera</span>
              </label>

              {formError && (
                <p className="text-xs text-red-600">{formError}</p>
              )}
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-surface transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90 disabled:opacity-50 transition-colors"
              >
                <Save size={14} />
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
