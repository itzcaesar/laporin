// ── app/citizen/survey/[reportId]/page.tsx ──
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, Send, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiClientError } from "@/lib/api-client";

const RATING_LABELS = [
  "Sangat Tidak Puas",
  "Tidak Puas",
  "Cukup",
  "Puas",
  "Sangat Puas",
];

const SURVEY_QUESTIONS = [
  {
    id: "speed",
    question: "Seberapa cepat laporan Anda ditangani?",
    type: "rating" as const,
  },
  {
    id: "quality",
    question: "Bagaimana kualitas perbaikan yang dilakukan?",
    type: "rating" as const,
  },
  {
    id: "communication",
    question: "Bagaimana komunikasi dari petugas?",
    type: "rating" as const,
  },
  {
    id: "satisfaction",
    question: "Secara keseluruhan, seberapa puas Anda dengan layanan kami?",
    type: "rating" as const,
  },
];

export default function SurveyPage() {
  const params = useParams();
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const reportId = params.reportId as string;

  // Check eligibility on mount
  useEffect(() => {
    if (!reportId) return;
    api
      .get<{ data: { eligible: boolean; reason?: string } }>(
        `/survey/report/${reportId}/eligibility`
      )
      .then((res) => {
        if (!res.data.eligible) {
          setEligibilityError(
            res.data.reason ?? "Anda tidak memenuhi syarat untuk mengisi survei ini."
          );
        }
      })
      .catch(() => {
        // Non-blocking: if check fails, let user try anyway
      });
  }, [reportId]);

  const handleRating = (questionId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [questionId]: rating }));
  };

  const handleSubmit = async () => {
    // Validate all questions answered
    const allAnswered = SURVEY_QUESTIONS.every((q) => ratings[q.id] > 0);
    if (!allAnswered) {
      alert("Mohon jawab semua pertanyaan");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Calculate overall rating as average of all question ratings
      const avgRating = Math.round(
        Object.values(ratings).reduce((a, b) => a + b, 0) /
          Object.values(ratings).length
      );

      await api.post("/survey", {
        reportId,
        rating: avgRating,
        comment: comment.trim() || undefined,
        wouldRecommend: avgRating >= 4,
      });

      setIsSubmitted(true);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.userMessage
          : "Gagal mengirim survei. Coba lagi.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-blue flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20 ring-4 ring-green-400/30">
              <CheckCircle size={40} className="text-green-400" />
            </div>
          </div>
          <h1 className="text-2xl font-bold font-display text-white mb-3">
            Terima Kasih! 🎉
          </h1>
          <p className="text-white/80 mb-6">
            Masukan Anda sangat berharga untuk meningkatkan kualitas layanan kami.
          </p>
          <button
            type="button"
            onClick={() => router.push("/citizen")}
            className="rounded-xl bg-white px-6 py-3 font-semibold text-navy hover:bg-white/90 transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold font-display text-navy mb-2">
            Survei Kepuasan
          </h1>
          <p className="text-sm text-muted">
            Bantu kami meningkatkan layanan dengan memberikan penilaian Anda
          </p>
          <p className="text-xs text-muted mt-1">
            Laporan: <span className="font-mono font-semibold">{reportId}</span>
          </p>
        </div>

        {/* Eligibility warning banner */}
        {eligibilityError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">{eligibilityError}</p>
          </div>
        )}

        {/* Survey Questions */}
        <div className="space-y-6 mb-8">
          {SURVEY_QUESTIONS.map((question, index) => (
            <div
              key={question.id}
              className="rounded-2xl bg-white p-6 border border-border"
            >
              <div className="mb-4">
                <span className="text-xs font-semibold text-blue bg-blue-light px-2 py-1 rounded">
                  Pertanyaan {index + 1}
                </span>
              </div>
              <h3 className="text-base font-semibold text-navy mb-4">
                {question.question}
              </h3>

              {/* Star Rating */}
              <div className="flex items-center justify-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRating(question.id, star)}
                    className="group transition-transform hover:scale-110"
                  >
                    <Star
                      size={40}
                      className={cn(
                        "transition-colors",
                        ratings[question.id] >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300 group-hover:text-amber-200"
                      )}
                    />
                  </button>
                ))}
              </div>

              {/* Rating Label */}
              {ratings[question.id] > 0 && (
                <p className="text-center text-sm font-medium text-navy">
                  {RATING_LABELS[ratings[question.id] - 1]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Additional Comment */}
        <div className="rounded-2xl bg-white p-6 border border-border mb-6">
          <h3 className="text-base font-semibold text-navy mb-3">
            Komentar Tambahan (Opsional)
          </h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Bagikan pengalaman atau saran Anda..."
            rows={4}
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 resize-none"
          />
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 mb-4">
            <AlertCircle size={16} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            !SURVEY_QUESTIONS.every((q) => ratings[q.id] > 0)
          }
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-navy px-6 py-4 text-base font-semibold text-white hover:bg-navy/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Mengirim...</span>
            </>
          ) : (
            <>
              <Send size={20} />
              <span>Kirim Survei</span>
            </>
          )}
        </button>

        <p className="text-center text-xs text-muted mt-4">
          Survei ini bersifat anonim dan akan membantu kami meningkatkan layanan
        </p>
      </div>
    </div>
  );
}
