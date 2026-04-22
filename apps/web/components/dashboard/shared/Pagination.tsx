// ── components/dashboard/shared/Pagination.tsx ──
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: PaginationProps) {
  // Generate page numbers to show (max 5 with ellipsis)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show with ellipsis
      if (currentPage <= 3) {
        // Near start
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        // Middle
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm border border-border">
      {/* Info Text */}
      <p className="text-sm text-muted">
        Halaman {currentPage} dari {totalPages} ({totalItems} laporan total)
      </p>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors min-h-[44px]",
            currentPage === 1
              ? "cursor-not-allowed text-muted opacity-50"
              : "text-ink hover:bg-surface"
          )}
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page Numbers (Desktop) */}
        <div className="hidden md:flex items-center gap-1">
          {pageNumbers.map((page, index) =>
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 text-muted">
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page as number)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                  currentPage === page
                    ? "bg-navy text-white"
                    : "text-ink hover:bg-surface"
                )}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Page Indicator (Mobile) */}
        <div className="md:hidden flex items-center gap-2 px-3">
          <span className="text-sm font-medium text-ink">
            {currentPage} / {totalPages}
          </span>
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors min-h-[44px]",
            currentPage === totalPages
              ? "cursor-not-allowed text-muted opacity-50"
              : "text-ink hover:bg-surface"
          )}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
