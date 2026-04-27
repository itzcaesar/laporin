// ── components/sections/ReportForm.tsx ──
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { api, ApiClientError } from "@/lib/api-client";
import { useCategories } from "@/hooks/useCategories";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Camera,
  Send,
  CheckCircle,
  X,
  ImagePlus,
  FileText,
  AlertTriangle,
  Video,
} from "lucide-react";
import imageCompression from "browser-image-compression";

// Dynamic import for LocationPicker (SSR-safe)
const LocationPicker = dynamic(
  () => import("@/components/map/LocationPicker").then((mod) => mod.LocationPicker),
  { ssr: false }
);

const PRIORITY_OPTIONS = [
  { value: "Rendah", label: "Rendah", color: "#10B981", description: "Tidak mendesak, bisa ditangani nanti" },
  { value: "Sedang", label: "Sedang", color: "#F59E0B", description: "Perlu diperbaiki dalam waktu dekat" },
  { value: "Tinggi", label: "Tinggi", color: "#F97316", description: "Mendesak, berpotensi membahayakan" },
  { value: "Kritis", label: "Kritis", color: "#DC2626", description: "Sangat berbahaya, perlu penanganan segera" },
] as const;

const STEPS = [
  { label: "Kategori", icon: FileText },
  { label: "Detail", icon: AlertTriangle },
  { label: "Lokasi", icon: MapPin },
  { label: "Foto", icon: Camera },
] as const;

interface FormData {
  categoryId: number | null;
  categoryName: string;
  title: string;
  description: string;
  priority: string;
  location: string;
  locationLat: number | null;
  locationLng: number | null;
  photos: File[];
  photoURLs: string[];
  reporter: string;
}

export function ReportForm() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [compressionProgress, setCompressionProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<any>(null);

  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const ffmpeg = new FFmpeg();

    // Load ffmpeg-core from CDN
    await ffmpeg.load({
      coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
      wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm",
    });
    ffmpegRef.current = ffmpeg;
    return ffmpeg;
  };

  // Fetch real categories from backend
  const { categories, isLoading: categoriesLoading } = useCategories();

  const [formData, setFormData] = useState<FormData>({
    categoryId: null,
    categoryName: "",
    title: "",
    description: "",
    priority: "Sedang",
    location: "",
    locationLat: null,
    locationLng: null,
    photos: [],
    photoURLs: [],
    reporter: "",
  });

  // Cleanup photo URLs on unmount
  useEffect(() => {
    return () => {
      formData.photoURLs.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const goToStep = useCallback(
    (target: number) => {
      if (isAnimating) return;
      setDirection(target > step ? "next" : "prev");
      setIsAnimating(true);
      setTimeout(() => {
        setStep(target);
        setTimeout(() => setIsAnimating(false), 50);
      }, 200);
    },
    [step, isAnimating]
  );

  const canProceed = useCallback(() => {
    switch (step) {
      case 0:
        return formData.categoryId !== null;
      case 1:
        return formData.title.trim().length >= 5 && formData.description.trim().length >= 10;
      case 2:
        return formData.location.trim().length >= 5;
      case 3:
        return true; // photos optional
      default:
        return false;
    }
  }, [step, formData]);

  const handlePhotoAdd = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newFilesArray = Array.from(files);
      const videoFiles = formData.photos.filter((f) => f.type.startsWith("video/"));
      let newVideoCount = videoFiles.length;

      const validFiles: File[] = [];
      for (const file of newFilesArray) {
        if (file.type.startsWith("video/")) {
          if (newVideoCount >= 1) {
            alert("Maksimal 1 video yang diperbolehkan per laporan.");
            continue;
          }
          newVideoCount++;
        }
        validFiles.push(file);
      }

      const newFiles = validFiles.slice(0, 5 - formData.photos.length);
      const newURLs = newFiles.map((f) => URL.createObjectURL(f));
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newFiles],
        photoURLs: [...prev.photoURLs, ...newURLs],
      }));
    },
    [formData.photos]
  );

  const removePhoto = useCallback((index: number) => {
    setFormData((prev) => {
      URL.revokeObjectURL(prev.photoURLs[index]);
      return {
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index),
        photoURLs: prev.photoURLs.filter((_, i) => i !== index),
      };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Derive region code from coords (default to Jakarta region)
      const regionCode = "3171";
      const regionName = "Kota Jakarta Pusat";

      // 1. Create the report
      const res = await api.post<{ data: { id: string; trackingCode: string } }>(
        "/reports",
        {
          title: formData.title,
          description: formData.description,
          categoryId: formData.categoryId,
          locationLat: formData.locationLat ?? -6.2,
          locationLng: formData.locationLng ?? 106.816,
          locationAddress: formData.location,
          regionCode,
          regionName,
          isAnonymous: !formData.reporter.trim(),
        }
      );

      const reportId = res.data.id;
      const code = res.data.trackingCode;

      // 2. Upload photos/videos via pre-signed URLs
      if (formData.photos.length > 0) {
        setCompressionProgress("Mempersiapkan unggahan...");
        await Promise.allSettled(
          formData.photos.map(async (photo) => {
            try {
              let finalFile = photo;
              const isVideo = photo.type.startsWith("video/");

              if (isVideo) {
                setCompressionProgress(`Mengompresi video: ${photo.name} (proses ini butuh waktu)...`);
                const ffmpeg = await loadFFmpeg();
                const { fetchFile } = await import("@ffmpeg/util");

                await ffmpeg.writeFile(photo.name, await fetchFile(photo));
                // Scale to max 720p to reduce size
                await ffmpeg.exec([
                  "-i", photo.name,
                  "-vf", "scale=-2:720",
                  "-vcodec", "libx264",
                  "-crf", "28",
                  "-preset", "veryfast",
                  "output.mp4"
                ]);
                const data = await ffmpeg.readFile("output.mp4");
                finalFile = new File([data as unknown as BlobPart], "output.mp4", { type: "video/mp4" });
              } else if (photo.type.startsWith("image/")) {
                setCompressionProgress(`Mengompresi gambar: ${photo.name}...`);
                const options = {
                  maxSizeMB: 1,
                  maxWidthOrHeight: 1920,
                  useWebWorker: true,
                };
                finalFile = await imageCompression(photo, options);
              }

              setCompressionProgress(`Mengunggah file...`);

              // Get pre-signed upload URL
              const urlRes = await api.post<{
                data: { uploadUrl: string; fileKey: string };
              }>(`/reports/${reportId}/media/upload-url`, {
                mediaType: isVideo ? "video" : "photo",
                mimeType: finalFile.type || (isVideo ? "video/mp4" : "image/jpeg"),
                fileSizeBytes: finalFile.size,
              });

              const { uploadUrl, fileKey } = urlRes.data;

              // PUT file directly to storage
              await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": finalFile.type || (isVideo ? "video/mp4" : "image/jpeg") },
                body: finalFile,
              });

              // Confirm upload to backend
              await api.post(`/reports/${reportId}/media`, {
                fileKey,
                mediaType: isVideo ? "video" : "photo",
              });
            } catch (photoErr) {
              console.error("Media upload failed (continuing):", photoErr);
            }
          })
        );
        setCompressionProgress(null);
      }

      setTrackingCode(code);
      setIsAnimating(true);
      setTimeout(() => {
        setSubmitted(true);
        setIsAnimating(false);
      }, 300);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.userMessage
          : "Gagal mengirim laporan. Periksa koneksi internet Anda dan coba lagi.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, formData]);

  // ── Success State ──
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-navy via-navy to-blue px-4">
        <div className="dot-grid absolute inset-0 opacity-40" />
        <div className="relative z-10 mx-auto max-w-lg text-center animate-fade-in">
          {/* Success glow */}
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-400/30 sm:h-28 sm:w-28">
            <CheckCircle size={48} className="text-emerald-400" strokeWidth={1.5} />
          </div>
          <h1 className="mb-3 font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">
            Laporan Berhasil Dikirim! 🎉
          </h1>
          <p className="mb-2 text-sm text-white/70 sm:text-base">
            Nomor laporan Anda:
          </p>
          <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-display text-lg font-bold text-white backdrop-blur-sm sm:text-xl">
            {trackingCode ?? "—"}
          </div>
          <p className="mb-8 text-sm leading-relaxed text-white/60 sm:text-base">
            Laporan Anda akan segera ditinjau oleh tim kami. Anda akan menerima notifikasi saat ada pembaruan status.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/citizen/my-reports"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-display font-semibold text-navy shadow-lg transition-all hover:bg-white/90 sm:w-auto"
            >
              <ArrowLeft size={18} />
              Lihat Laporan Saya
            </Link>
            <Link
              href="/citizen/map"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-6 py-3 font-display font-semibold text-white transition-all hover:bg-white/10 sm:w-auto"
            >
              <MapPin size={18} />
              Lihat Peta Laporan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-16 bottom-0 md:bottom-0 flex flex-col bg-surface overflow-hidden">
      {/* Page Title */}
      <div className="shrink-0 bg-white border-b border-gray-100 px-4 py-3 sm:px-6 lg:px-8">
        <h1 className="font-display text-lg font-bold text-navy sm:text-xl">
          📝 Buat Laporan Baru
        </h1>
        <p className="text-xs text-muted mt-0.5 sm:text-sm">
          Laporkan kerusakan infrastruktur di area kamu
        </p>
      </div>

      {/* ── Progress bar ── */}
      <div className="shrink-0 border-b border-gray-100 bg-white">
        <div className="px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isCompleted = i < step;
              return (
                <button
                  key={s.label}
                  onClick={() => i < step && goToStep(i)}
                  disabled={i > step}
                  className="group flex flex-1 flex-col items-center gap-1.5 transition-all"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-9 sm:w-9 ${isCompleted
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : isActive
                          ? "border-blue bg-blue/10 text-blue shadow-[0_0_0_4px_rgba(37,99,235,0.1)]"
                          : "border-gray-200 bg-gray-50 text-gray-400"
                      }`}
                  >
                    {isCompleted ? (
                      <CheckCircle size={18} />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold transition-colors sm:text-xs ${isActive ? "text-blue" : isCompleted ? "text-emerald-600" : "text-gray-400"
                      }`}
                  >
                    {s.label}
                  </span>
                  {/* progress line */}
                  {i < STEPS.length - 1 && (
                    <div className="absolute" />
                  )}
                </button>
              );
            })}
          </div>
          {/* Progress bar line */}
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue to-teal transition-all duration-500 ease-out"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Form Content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div
          className={`transition-all duration-200 ${isAnimating
              ? direction === "next"
                ? "translate-x-8 opacity-0"
                : "-translate-x-8 opacity-0"
              : "translate-x-0 opacity-100"
            }`}
        >
          {/* ── Step 0: Category Selection ── */}
          {step === 0 && (
            <div>
              <div className="mb-6">
                <h2 className="mb-1 font-display text-xl font-bold text-navy sm:text-2xl">
                  Pilih Kategori Laporan
                </h2>
                <p className="text-sm text-muted">
                  Pilih jenis kerusakan infrastruktur yang ingin Anda laporkan
                </p>
              </div>
              {categoriesLoading ? (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse h-24 rounded-2xl bg-gray-100" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {categories.map((cat) => {
                    const isSelected = formData.categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          updateField("categoryId", cat.id);
                          updateField("categoryName", cat.name);
                        }}
                        className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all duration-200 sm:gap-2.5 sm:p-5 ${isSelected
                            ? "border-blue bg-blue/5 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]"
                            : "border-gray-100 bg-white hover:border-blue/30 hover:bg-blue/[0.02] hover:shadow-sm"
                          }`}
                      >
                        {/* Selected checkmark */}
                        {isSelected && (
                          <div className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue text-white shadow-md">
                            <CheckCircle size={14} />
                          </div>
                        )}
                        <span className="text-2xl transition-transform duration-200 group-hover:scale-110 sm:text-3xl">
                          {cat.emoji}
                        </span>
                        <span className="font-display text-xs font-semibold leading-tight text-navy sm:text-sm">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-muted sm:text-xs">{cat.leadAgency}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Step 1: Details ── */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <h2 className="mb-1 font-display text-xl font-bold text-navy sm:text-2xl">
                  Detail Laporan
                </h2>
                <p className="text-sm text-muted">
                  Berikan informasi lengkap mengenai kerusakan yang Anda temui
                </p>
              </div>

              <div className="space-y-5">
                {/* Title */}
                <div className="group">
                  <label
                    htmlFor="report-title"
                    className="mb-1.5 block text-sm font-semibold text-navy"
                  >
                    Judul Laporan <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="report-title"
                    type="text"
                    placeholder="Contoh: Jalan Berlubang Besar di Depan Sekolah"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    maxLength={100}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-navy outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue focus:bg-blue/[0.02] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.1)] sm:text-base"
                  />
                  <div className="mt-1 flex justify-between">
                    <span className="text-xs text-muted">Minimum 5 karakter</span>
                    <span className={`text-xs ${formData.title.length >= 5 ? "text-emerald-500" : "text-muted"}`}>
                      {formData.title.length}/100
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="report-description"
                    className="mb-1.5 block text-sm font-semibold text-navy"
                  >
                    Deskripsi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="report-description"
                    placeholder="Jelaskan detail kerusakan, ukuran, dampak terhadap warga, dan informasi lain yang relevan..."
                    rows={5}
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    maxLength={500}
                    className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-navy outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue focus:bg-blue/[0.02] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.1)] sm:text-base"
                  />
                  <div className="mt-1 flex justify-between">
                    <span className="text-xs text-muted">Minimum 10 karakter</span>
                    <span
                      className={`text-xs ${formData.description.length >= 10 ? "text-emerald-500" : "text-muted"}`}
                    >
                      {formData.description.length}/500
                    </span>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-navy">
                    Tingkat Prioritas
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {PRIORITY_OPTIONS.map((p) => {
                      const isSelected = formData.priority === p.value;
                      return (
                        <button
                          key={p.value}
                          onClick={() => updateField("priority", p.value)}
                          className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 transition-all duration-200 ${isSelected
                              ? "shadow-sm"
                              : "border-gray-100 bg-white hover:border-gray-200"
                            }`}
                          style={{
                            borderColor: isSelected ? p.color : undefined,
                            backgroundColor: isSelected ? `${p.color}08` : undefined,
                          }}
                        >
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="text-sm font-semibold text-navy">{p.label}</span>
                          <span className="text-[10px] leading-tight text-muted">
                            {p.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reporter name */}
                <div>
                  <label
                    htmlFor="reporter-name"
                    className="mb-1.5 block text-sm font-semibold text-navy"
                  >
                    Nama Pelapor{" "}
                    <span className="text-xs font-normal text-muted">(opsional)</span>
                  </label>
                  <input
                    id="reporter-name"
                    type="text"
                    placeholder="Nama Anda atau anonim"
                    value={formData.reporter}
                    onChange={(e) => updateField("reporter", e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-navy outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue focus:bg-blue/[0.02] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.1)] sm:text-base"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Location ── */}
          {step === 2 && (
            <div>
              <div className="mb-6">
                <h2 className="mb-1 font-display text-xl font-bold text-navy sm:text-2xl">
                  Lokasi Kerusakan
                </h2>
                <p className="text-sm text-muted">
                  Tandai lokasi infrastruktur yang rusak agar petugas mudah menemukan
                </p>
              </div>

              <div className="space-y-5">
                {/* Address */}
                <div>
                  <label
                    htmlFor="report-location"
                    className="mb-1.5 block text-sm font-semibold text-navy"
                  >
                    Alamat Lengkap <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      id="report-location"
                      type="text"
                      placeholder="Klik pada peta atau ketik alamat manual"
                      value={formData.location}
                      onChange={(e) => updateField("location", e.target.value)}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-navy outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue focus:bg-blue/[0.02] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.1)] sm:text-base"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {formData.locationLat && formData.locationLng
                      ? `Koordinat: ${formData.locationLat.toFixed(6)}, ${formData.locationLng.toFixed(6)}`
                      : "Minimum 5 karakter"}
                  </p>
                </div>

                {/* Interactive Map */}
                <LocationPicker
                  onLocationSelect={(lat, lng, address) => {
                    setFormData((prev) => ({
                      ...prev,
                      location: address,
                      locationLat: lat,
                      locationLng: lng,
                    }));
                  }}
                  initialLat={formData.locationLat || undefined}
                  initialLng={formData.locationLng || undefined}
                />

                {/* Tips */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-500" />
                    <div>
                      <p className="mb-1 text-sm font-semibold text-amber-800">
                        Tips Penulisan Lokasi
                      </p>
                      <ul className="space-y-1 text-xs leading-relaxed text-amber-700">
                        <li>• Gunakan peta interaktif untuk akurasi maksimal</li>
                        <li>• Klik tombol "Lokasi Saat Ini" untuk deteksi otomatis</li>
                        <li>• Atau klik langsung pada peta untuk menandai lokasi</li>
                        <li>• Anda juga bisa mengetik alamat manual jika diperlukan</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Photos ── */}
          {step === 3 && (
            <div>
              <div className="mb-6">
                <h2 className="mb-1 font-display text-xl font-bold text-navy sm:text-2xl">
                  Unggah Foto/Video Bukti
                </h2>
                <p className="text-sm text-muted">
                  Tambahkan foto atau video kerusakan untuk mempercepat proses verifikasi{" "}
                  <span className="text-xs">(opsional, maks 5 file, 1 video)</span>
                </p>
              </div>

              {/* Photo grid */}
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {formData.photoURLs.map((url, i) => (
                  <div
                    key={url}
                    className="group relative aspect-square overflow-hidden rounded-2xl border-2 border-gray-100 bg-gray-50"
                  >
                    {formData.photos[i]?.type.startsWith("video/") ? (
                      <div className="relative h-full w-full bg-black flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                        <Video size={32} className="text-white/50" />
                        <span className="absolute bottom-1 right-1 text-[8px] bg-black/60 text-white px-1 rounded">VIDEO</span>
                      </div>
                    ) : (
                      <img
                        src={url}
                        alt={`Media ${i + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-red-500"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      {i + 1}/{formData.photos.length}
                    </div>
                  </div>
                ))}

                {/* Add photo button */}
                {formData.photos.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 bg-white transition-all duration-200 hover:border-blue hover:bg-blue/[0.02]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-blue/10">
                      <ImagePlus
                        size={22}
                        className="text-gray-400 transition-colors group-hover:text-blue"
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 group-hover:text-blue">
                      Tambah Media
                    </span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handlePhotoAdd}
                className="hidden"
              />

              {/* Photo tips */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex gap-3">
                  <Camera size={18} className="mt-0.5 shrink-0 text-blue" />
                  <div>
                    <p className="mb-1 text-sm font-semibold text-blue-800">
                      Tips Media yang Baik
                    </p>
                    <ul className="space-y-1 text-xs leading-relaxed text-blue-700">
                      <li>• Ambil foto dari dekat dan dari kejauhan untuk konteks</li>
                      <li>• Pastikan pencahayaan cukup dan foto tidak buram</li>
                      <li>• Jika mengunggah video, usahakan tidak bergoyang dan fokus</li>
                      <li>• Sertakan objek pembanding ukuran (misalnya sepatu) jika perlu</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-display text-sm font-bold text-navy">
                  📋 Ringkasan Laporan
                </h3>
                <div className="space-y-3">
                  <SummaryRow
                    label="Kategori"
                    value={formData.categoryName || "-"}
                  />
                  <SummaryRow label="Judul" value={formData.title || "-"} />
                  <SummaryRow
                    label="Prioritas"
                    value={formData.priority}
                    color={PRIORITY_OPTIONS.find((p) => p.value === formData.priority)?.color}
                  />
                  <SummaryRow label="Lokasi" value={formData.location || "-"} />
                  <SummaryRow
                    label="Media"
                    value={`${formData.photos.length} file terlampir`}
                  />
                  <SummaryRow
                    label="Pelapor"
                    value={formData.reporter || "Anonim"}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Navigation ── */}
      <div className="shrink-0 border-t border-gray-100 bg-white pb-20 md:pb-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {step > 0 ? (
            <button
              onClick={() => goToStep(step - 1)}
              className="flex items-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-2.5 text-sm font-semibold text-navy transition-all hover:border-navy hover:bg-navy/5 sm:px-5 sm:py-3"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Kembali</span>
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => canProceed() && goToStep(step + 1)}
              disabled={!canProceed()}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all sm:px-7 sm:py-3 ${canProceed()
                  ? "bg-blue text-white shadow-md shadow-blue/30 hover:bg-blue/90 hover:shadow-lg"
                  : "cursor-not-allowed bg-gray-100 text-gray-400"
                }`}
            >
              Lanjut
              <ArrowRight size={16} />
            </button>
          ) : (
            <div className="flex flex-col items-end gap-2">
              {submitError && (
                <p className="text-xs text-red-500 text-right max-w-xs">{submitError}</p>
              )}
              {compressionProgress && (
                <p className="text-xs text-blue-500 font-semibold animate-pulse">{compressionProgress}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue to-teal px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue/30 transition-all hover:shadow-lg hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed sm:px-8 sm:py-3"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Kirim Laporan
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Summary Row Sub-Component ──
function SummaryRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-xs text-muted">{label}</span>
      <span
        className="text-right text-xs font-semibold text-navy"
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
