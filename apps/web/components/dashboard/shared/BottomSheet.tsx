// ── components/dashboard/shared/BottomSheet.tsx ──
"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[]; // Percentage heights: [33, 66, 90]
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints = [33, 90],
  className,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const snapHeight = snapPoints[currentSnap];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = currentY - startY;
    const threshold = 50;

    if (deltaY > threshold) {
      // Swipe down
      if (currentSnap > 0) {
        setCurrentSnap(currentSnap - 1);
      } else {
        onClose();
      }
    } else if (deltaY < -threshold) {
      // Swipe up
      if (currentSnap < snapPoints.length - 1) {
        setCurrentSnap(currentSnap + 1);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "rounded-t-2xl bg-white shadow-2xl",
          "transition-all duration-300 ease-out",
          className
        )}
        style={{
          height: `${snapHeight}vh`,
          transform: isDragging
            ? `translateY(${Math.max(0, currentY - startY)}px)`
            : "translateY(0)",
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex cursor-grab items-center justify-center py-3 active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="h-1 w-12 rounded-full bg-gray-300" />
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "absolute right-4 top-4 z-10",
            "flex h-8 w-8 items-center justify-center",
            "rounded-full bg-gray-100 text-muted",
            "transition-colors hover:bg-gray-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          )}
          aria-label="Tutup"
        >
          <X size={16} />
        </button>

        {/* Content */}
        <div className="h-full overflow-y-auto px-4 pb-6">
          {children}
        </div>
      </div>
    </>
  );
}
