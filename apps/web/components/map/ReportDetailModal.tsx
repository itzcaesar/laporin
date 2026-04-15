// ── components/map/ReportDetailModal.tsx ──
"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { STATUS_CONFIG } from "@/data/mock-reports";
import type { MockReport } from "@/types/report";
import {
  X,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  MapPin,
  Clock,
  User,
  Building2,
  Shield,
  Send,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";

// ── Department mapping based on category ──
const DEPARTMENT_MAP: Record<string, string> = {
  "Jalan Rusak": "Dinas Pekerjaan Umum & Penataan Ruang",
  "Lampu Lalu Lintas & Jalan": "Dinas Perhubungan",
  "Drainase & Saluran Air": "Dinas Pekerjaan Umum & Penataan Ruang",
  "Trotoar & Fasilitas Disabilitas": "Dinas Pekerjaan Umum & Penataan Ruang",
  "Pembuangan Sampah Liar": "Dinas Lingkungan Hidup & Kebersihan",
  "Jaringan Kabel Semrawut": "PLN / Dinas Komunikasi & Informatika",
  "Halte Bus Rusak": "Dinas Perhubungan",
  "Jembatan Rusak": "Dinas Pekerjaan Umum & Penataan Ruang",
  "Taman Kota Rusak": "Dinas Perumahan & Kawasan Permukiman",
  "Rambu Lalu Lintas": "Dinas Perhubungan",
  "Fasilitas Taman": "Dinas Perumahan & Kawasan Permukiman",
  "Air Bersih": "PDAM / Dinas Pekerjaan Umum",
};

// ── Priority color mapping ──
const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Rendah: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
  Sedang: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Tinggi: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  Kritis: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

interface ReportDetailModalProps {
  report: MockReport;
  onClose: () => void;
}

export function ReportDetailModal({ report, onClose }: ReportDetailModalProps) {
  const statusCfg = STATUS_CONFIG[report.status];
  const department = DEPARTMENT_MAP[report.category] || "Dinas Terkait";
  const priorityStyle = PRIORITY_STYLES[report.priority] || PRIORITY_STYLES.Sedang;

  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [upvoteCount, setUpvoteCount] = useState(report.upvotes);
  const [downvoteCount, setDownvoteCount] = useState(report.downvotes);
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState(report.mockComments);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleUpvote = () => {
    if (userVote === "up") {
      setUserVote(null);
      setUpvoteCount((c) => c - 1);
    } else {
      if (userVote === "down") setDownvoteCount((c) => c - 1);
      setUserVote("up");
      setUpvoteCount((c) => c + 1);
    }
  };

  const handleDownvote = () => {
    if (userVote === "down") {
      setUserVote(null);
      setDownvoteCount((c) => c - 1);
    } else {
      if (userVote === "up") setUpvoteCount((c) => c - 1);
      setUserVote("down");
      setDownvoteCount((c) => c + 1);
    }
  };

  const handleSubmitComment = () => {
    if (!commentText.trim()) return;
    setLocalComments((prev) => [
      ...prev,
      { author: "Kamu", text: commentText.trim(), time: "Baru saja" },
    ]);
    setCommentText("");
  };

  const netVotes = upvoteCount - downvoteCount;

  if (!mounted) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
        <div
          className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh] sm:max-h-[85vh] mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ═══ Header ═══ */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-sm text-white">
                {report.reporter.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-navy">
                  {report.reporter}
                </span>
                <span className="text-[10px] text-muted">
                  {report.reportedAt} • {report.location.split(",")[0]}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-gray-100 hover:text-navy"
            >
              <X size={18} />
            </button>
          </div>

          {/* ═══ Scrollable Content ═══ */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {/* ── Photo Area ── */}
            <div className="relative aspect-square w-full bg-gradient-to-br from-slate-100 to-slate-200">
              {/* Placeholder image with large emoji */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span className="text-[6rem] drop-shadow-lg">
                  {report.photoPlaceholder}
                </span>
                <span className="rounded-full bg-black/10 px-3 py-1 text-xs font-medium text-slate-600 backdrop-blur-sm">
                  Foto Laporan
                </span>
              </div>

              {/* Status badge overlay */}
              <div className="absolute right-3 top-3">
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold shadow-lg"
                  style={{
                    backgroundColor: statusCfg.bg,
                    color: statusCfg.color,
                    border: `1.5px solid ${statusCfg.border}`,
                  }}
                >
                  {statusCfg.label}
                </span>
              </div>

              {/* Priority badge overlay */}
              <div className="absolute left-3 top-3">
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold shadow-lg",
                    priorityStyle.bg,
                    priorityStyle.text,
                    priorityStyle.border
                  )}
                >
                  <AlertTriangle size={10} />
                  {report.priority}
                </span>
              </div>
            </div>

            {/* ── Vote Bar ── */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
              <div className="flex items-center gap-4">
                {/* Upvote */}
                <button
                  type="button"
                  onClick={handleUpvote}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-all duration-200",
                    userVote === "up"
                      ? "bg-blue-light text-blue"
                      : "text-muted hover:bg-gray-50"
                  )}
                >
                  <ThumbsUp
                    size={16}
                    className={cn(
                      userVote === "up" && "fill-blue"
                    )}
                  />
                  {upvoteCount}
                </button>

                {/* Downvote */}
                <button
                  type="button"
                  onClick={handleDownvote}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-all duration-200",
                    userVote === "down"
                      ? "bg-red-50 text-red-500"
                      : "text-muted hover:bg-gray-50"
                  )}
                >
                  <ThumbsDown
                    size={16}
                    className={cn(
                      userVote === "down" && "fill-red-500"
                    )}
                  />
                  {downvoteCount}
                </button>

                {/* Comment count */}
                <div className="flex items-center gap-1.5 text-sm text-muted">
                  <MessageCircle size={16} />
                  {localComments.length}
                </div>
              </div>

              {/* Net score pill */}
              <div
                className={cn(
                  "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
                  netVotes > 0
                    ? "bg-emerald-50 text-emerald-600"
                    : netVotes < 0
                      ? "bg-red-50 text-red-500"
                      : "bg-gray-50 text-muted"
                )}
              >
                {netVotes > 0 ? (
                  <ChevronUp size={12} className="stroke-[3]" />
                ) : netVotes < 0 ? (
                  <ChevronDown size={12} className="stroke-[3]" />
                ) : null}
                Skor: {netVotes > 0 ? "+" : ""}{netVotes}
              </div>
            </div>

            {/* ── Title & Description ── */}
            <div className="border-b border-gray-100 px-4 py-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">{report.categoryEmoji}</span>
                <h2 className="font-display text-lg font-bold text-navy">
                  {report.title}
                </h2>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-ink">
                {report.description}
              </p>

              {/* Metadata tags */}
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-muted">
                  <MapPin size={11} />
                  {report.location}
                </span>
                <span className="flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-muted">
                  <Clock size={11} />
                  {report.reportedAt}
                </span>
                <span className="flex items-center gap-1 rounded-lg bg-blue-light px-2.5 py-1 text-[11px] font-medium text-blue">
                  {report.categoryEmoji} {report.category}
                </span>
              </div>
            </div>

            {/* ── PIC & Department Info ── */}
            <div className="border-b border-gray-100 px-4 py-4">
              <p className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-muted">
                Penanggung Jawab
              </p>
              <div className="space-y-3">
                {/* Department */}
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy/10">
                    <Building2 size={16} className="text-navy" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-navy">Instansi</p>
                    <p className="text-xs text-muted">{department}</p>
                  </div>
                </div>

                {/* PIC */}
                {report.pic ? (
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal/10">
                      <User size={16} className="text-teal" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-navy">PIC</p>
                      <p className="text-xs text-muted">{report.pic}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                      <Shield size={16} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-navy">PIC</p>
                      <p className="text-xs text-amber-600">Belum ditugaskan</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Comments Section ── */}
            <div className="px-4 py-4">
              <p className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-muted">
                Komentar ({localComments.length})
              </p>
              <div className="space-y-3">
                {localComments.map((comment, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-muted">
                      {comment.author.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-semibold text-navy">
                          {comment.author}
                        </span>
                        <span className="text-[10px] text-muted">
                          {comment.time}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ Comment Input (fixed at bottom) ═══ */}
          <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-light text-xs font-bold text-blue">
                K
              </div>
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                placeholder="Tulis komentar..."
                className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-blue focus:bg-white"
              />
              <button
                type="button"
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                  commentText.trim()
                    ? "bg-blue text-white hover:bg-blue/90"
                    : "bg-gray-100 text-muted"
                )}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
