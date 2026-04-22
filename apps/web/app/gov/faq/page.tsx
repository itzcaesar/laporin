// ── app/gov/faq/page.tsx ──
"use client";

import { useState } from "react";
import { Plus, Search, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
  isPublished: boolean;
  views: number;
  helpful: number;
  createdAt: string;
  updatedAt: string;
};

const MOCK_FAQS: FAQ[] = [
  {
    id: "1",
    question: "Berapa lama waktu yang dibutuhkan untuk menindaklanjuti laporan?",
    answer: "Waktu penanganan bervariasi tergantung tingkat prioritas. Laporan darurat ditangani dalam 24 jam, prioritas tinggi 3-5 hari, sedang 7-14 hari, dan rendah 14-30 hari.",
    category: "Waktu Penanganan",
    isPublished: true,
    views: 1247,
    helpful: 892,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-04-20T14:30:00Z",
  },
  {
    id: "2",
    question: "Bagaimana cara melacak status laporan saya?",
    answer: "Anda dapat melacak status laporan melalui halaman 'Laporan Saya' atau dengan memasukkan kode tracking laporan di halaman beranda. Anda juga akan menerima notifikasi setiap ada pembaruan status.",
    category: "Pelacakan Laporan",
    isPublished: true,
    views: 856,
    helpful: 743,
    createdAt: "2026-01-20T09:00:00Z",
    updatedAt: "2026-04-18T11:20:00Z",
  },
  {
    id: "3",
    question: "Apakah saya bisa melaporkan secara anonim?",
    answer: "Ya, Anda dapat membuat laporan tanpa mencantumkan nama. Namun, kami menyarankan untuk memberikan kontak yang bisa dihubungi agar kami dapat meminta informasi tambahan jika diperlukan.",
    category: "Privasi",
    isPublished: true,
    views: 634,
    helpful: 521,
    createdAt: "2026-02-01T13:00:00Z",
    updatedAt: "2026-04-15T16:45:00Z",
  },
  {
    id: "4",
    question: "Apa yang harus saya lakukan jika laporan saya ditolak?",
    answer: "Jika laporan ditolak, Anda akan menerima penjelasan alasan penolakan. Anda dapat mengajukan banding atau membuat laporan baru dengan informasi yang lebih lengkap.",
    category: "Penolakan Laporan",
    isPublished: false,
    views: 0,
    helpful: 0,
    createdAt: "2026-04-22T08:00:00Z",
    updatedAt: "2026-04-22T08:00:00Z",
  },
];

const CATEGORIES = [
  "Semua",
  "Waktu Penanganan",
  "Pelacakan Laporan",
  "Privasi",
  "Penolakan Laporan",
  "Pembayaran",
  "Teknis",
];

export default function GovFAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>(MOCK_FAQS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Semua" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const togglePublish = (id: string) => {
    setFaqs((prev) =>
      prev.map((faq) =>
        faq.id === id ? { ...faq, isPublished: !faq.isPublished } : faq
      )
    );
  };

  const deleteFAQ = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus FAQ ini?")) {
      setFaqs((prev) => prev.filter((faq) => faq.id !== id));
    }
  };

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
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-white hover:bg-navy/90 transition-colors"
        >
          <Plus size={16} />
          Tambah FAQ
        </button>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            placeholder="Cari pertanyaan atau jawaban..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
          />
        </div>

        {/* Category Filter */}
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
        {filteredFAQs.length === 0 ? (
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
                  <h3 className="text-base font-semibold text-navy mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-ink leading-relaxed mb-3">
                    {faq.answer}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span>{faq.views.toLocaleString()} views</span>
                    <span>•</span>
                    <span>{faq.helpful.toLocaleString()} helpful</span>
                    <span>•</span>
                    <span>
                      Diperbarui{" "}
                      {new Date(faq.updatedAt).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => togglePublish(faq.id)}
                    className="flex items-center justify-center h-9 w-9 rounded-lg text-muted hover:bg-surface hover:text-ink transition-colors"
                    title={faq.isPublished ? "Unpublish" : "Publish"}
                  >
                    {faq.isPublished ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button
                    type="button"
                    className="flex items-center justify-center h-9 w-9 rounded-lg text-muted hover:bg-surface hover:text-blue transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFAQ(faq.id)}
                    className="flex items-center justify-center h-9 w-9 rounded-lg text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
