"use client";

import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";

interface ImageLightboxProps {
  images: Array<{ id: string; fileUrl: string; mediaType: string }>;
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: ImageLightboxProps) {
  const currentImage = images[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev]);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Previous button */}
      {currentIndex > 0 && (
        <button
          onClick={onPrev}
          className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Next button */}
      {currentIndex < images.length - 1 && (
        <button
          onClick={onNext}
          className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Image */}
      <div className="max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
        <img
          src={currentImage.fileUrl}
          alt={currentImage.mediaType}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Image info */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-full bg-white/10 text-white text-sm">
        {currentImage.mediaType}
      </div>
    </div>
  );
}
