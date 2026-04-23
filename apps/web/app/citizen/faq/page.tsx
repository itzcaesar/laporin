// ── app/citizen/faq/page.tsx ──
"use client";

import { useState } from "react";
import { Search, ChevronDown, ThumbsUp, ThumbsDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import { useFaq, type FAQ } from "@/hooks/useFaq";

const CATEGORIES = ["Semua", "Waktu Penanganan", "Pelacakan Laporan", "Privasi", "Keluhan", "Biaya"];

export default function CitizenFAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [votedFAQs, setVotedFAQs] = useState<Record<string, "up" | "down">>({});

  const { faqs, isLoading } = useFaq();

  const filteredFAQs = faqs.filter((faq) => {
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
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="text-sm text-muted">Memuat FAQ...</div>
        </div>
      ) : filteredFAQs.length === 0 ? (
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
                            <span>{((faq as any).notHelpful || 0) + (userVote === "down" ? 1 : 0)}</span>
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
