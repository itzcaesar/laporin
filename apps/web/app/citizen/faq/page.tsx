// ── app/citizen/faq/page.tsx ──
"use client";

import { useState } from "react";
import { Search, ChevronDown, ThumbsUp, ThumbsDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
  views: number;
  helpful: number;
  notHelpful: number;
};

const MOCK_FAQS: FAQ[] = [
  {
    id: "1",
    question: "Berapa lama waktu yang dibutuhkan untuk menindaklanjuti laporan?",
    answer: "Waktu penanganan bervariasi tergantung tingkat prioritas. Laporan darurat ditangani dalam 24 jam, prioritas tinggi 3-5 hari, sedang 7-14 hari, dan rendah 14-30 hari.",
    category: "Waktu Penanganan",
    views: 1247,
    helpful: 892,
    notHelpful: 45,
  },
  {
    id: "2",
    question: "Bagaimana cara melacak status laporan saya?",
    answer: "Anda dapat melacak status laporan melalui halaman 'Laporan Saya' atau dengan memasukkan kode tracking laporan di halaman beranda. Anda juga akan menerima notifikasi setiap ada pembaruan status.",
    category: "Pelacakan Laporan",
    views: 856,
    helpful: 743,
    notHelpful: 23,
  },
  {
    id: "3",
    question: "Apakah saya bisa melaporkan secara anonim?",
    answer: "Ya, Anda dapat membuat laporan tanpa mencantumkan nama. Namun, kami menyarankan untuk memberikan kontak yang bisa dihubungi agar kami dapat meminta informasi tambahan jika diperlukan.",
    category: "Privasi",
    views: 634,
    helpful: 521,
    notHelpful: 18,
  },
  {
    id: "4",
    question: "Bagaimana jika laporan saya tidak ditanggapi?",
    answer: "Jika laporan Anda tidak mendapat tanggapan dalam waktu yang wajar, Anda dapat menghubungi hotline kami atau menggunakan fitur 'Eskalasi' yang tersedia di halaman detail laporan.",
    category: "Keluhan",
    views: 423,
    helpful: 387,
    notHelpful: 12,
  },
  {
    id: "5",
    question: "Apakah ada biaya untuk membuat laporan?",
    answer: "Tidak, semua layanan Laporin sepenuhnya gratis untuk warga. Kami berkomitmen untuk memberikan akses yang mudah dan terjangkau bagi semua masyarakat.",
    category: "Biaya",
    views: 789,
    helpful: 756,
    notHelpful: 8,
  },
];

const CATEGORIES = ["Semua", "Waktu Penanganan", "Pelacakan Laporan", "Privasi", "Keluhan", "Biaya"];

export default function CitizenFAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [votedFAQs, setVotedFAQs] = useState<Record<string, "up" | "down">>({});

  const filteredFAQs = MOCK_FAQS.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Semua" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleVote = (id: string, vote: "up" | "down") => {
    setVotedFAQs((prev) => {
      const newVotes = { ...prev };
      if (newVotes[id] === vote) {
        delete newVotes[id];
      } else {
        newVotes[id] = vote;
      }
      return newVotes;
    });
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-navy mb-2">
          Pertanyaan yang Sering Diajukan
        </h1>
        <p className="text-sm text-muted">
          Temukan jawaban untuk pertanyaan umum tentang Laporin
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            placeholder="Cari pertanyaan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-3 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
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

      {/* FAQ List */}
      {filteredFAQs.length === 0 ? (
        <div className="rounded-2xl bg-white p-12 text-center border border-border">
          <HelpCircle size={48} className="mx-auto text-muted mb-4" />
          <p className="text-muted">Tidak ada FAQ yang ditemukan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFAQs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            const userVote = votedFAQs[faq.id];

            return (
              <div
                key={faq.id}
                className="rounded-2xl bg-white border border-border overflow-hidden transition-shadow hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(faq.id)}
                  className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-surface/50 transition-colors"
                >
                  <div className="flex-1">
                    <span className="text-xs font-medium text-blue bg-blue-light px-2 py-1 rounded mb-2 inline-block">
                      {faq.category}
                    </span>
                    <h3 className="text-base font-semibold text-navy">
                      {faq.question}
                    </h3>
                  </div>
                  <ChevronDown
                    size={20}
                    className={cn(
                      "text-muted transition-transform shrink-0 mt-1",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 animate-slide-down">
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm text-ink leading-relaxed mb-4">
                        {faq.answer}
                      </p>

                      {/* Helpful Section */}
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="text-xs text-muted">
                          Apakah ini membantu?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleVote(faq.id, "up")}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                              userVote === "up"
                                ? "bg-green-100 text-green-700"
                                : "bg-surface text-muted hover:bg-green-50 hover:text-green-600"
                            )}
                          >
                            <ThumbsUp size={14} />
                            <span>{faq.helpful + (userVote === "up" ? 1 : 0)}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVote(faq.id, "down")}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                              userVote === "down"
                                ? "bg-red-100 text-red-700"
                                : "bg-surface text-muted hover:bg-red-50 hover:text-red-600"
                            )}
                          >
                            <ThumbsDown size={14} />
                            <span>{faq.notHelpful + (userVote === "down" ? 1 : 0)}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Contact Support */}
      <div className="mt-8 rounded-2xl bg-gradient-to-r from-blue to-teal p-6 text-white">
        <h3 className="text-lg font-bold font-display mb-2">
          Tidak menemukan jawaban?
        </h3>
        <p className="text-sm text-white/80 mb-4">
          Hubungi tim support kami untuk bantuan lebih lanjut
        </p>
        <button
          type="button"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-white/90 transition-colors"
        >
          Hubungi Support
        </button>
      </div>
    </div>
  );
}
