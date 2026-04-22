// ── components/dashboard/gov/PublicResponseEditor.tsx ──
"use client";

import { useState } from "react";
import { Send, X, Paperclip, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicResponseEditorProps {
  reportId: string;
  commentId?: string;
  onSubmit: (content: string, isOfficial: boolean) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
}

export function PublicResponseEditor({
  reportId,
  commentId,
  onSubmit,
  onCancel,
  placeholder = "Tulis tanggapan resmi...",
}: PublicResponseEditorProps) {
  const [content, setContent] = useState("");
  const [isOfficial, setIsOfficial] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content, isOfficial);
      setContent("");
      onCancel();
    } catch (error) {
      console.error("Failed to submit response:", error);
      alert("Gagal mengirim tanggapan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-blue/20 bg-blue-light/10 p-4">
      {/* Official Response Toggle */}
      <div className="mb-3 flex items-center gap-2">
        <input
          type="checkbox"
          id="official-response"
          checked={isOfficial}
          onChange={(e) => setIsOfficial(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue focus:ring-blue"
        />
        <label
          htmlFor="official-response"
          className="text-sm font-medium text-navy cursor-pointer"
        >
          Tandai sebagai Tanggapan Resmi
        </label>
      </div>

      {isOfficial && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-blue-light/30 p-3">
          <AlertCircle size={16} className="text-blue mt-0.5 shrink-0" />
          <p className="text-xs text-blue-900">
            Tanggapan resmi akan ditampilkan dengan badge khusus dan dapat dilihat oleh semua warga.
          </p>
        </div>
      )}

      {/* Text Editor */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 resize-none"
      />

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors"
        >
          <Paperclip size={16} />
          <span>Lampirkan File</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:bg-surface transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isOfficial
                ? "bg-blue hover:bg-blue/90"
                : "bg-navy hover:bg-navy/90"
            )}
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Mengirim...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Kirim Tanggapan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
