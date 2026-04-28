// ── app/(auth)/register/page.tsx ──
"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Info } from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/useToast";

type PasswordStrength = "weak" | "medium" | "strong";

export default function RegisterPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nik, setNik] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] =
    useState<PasswordStrength>("weak");

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength("weak");
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 1) setPasswordStrength("weak");
    else if (strength <= 2) setPasswordStrength("medium");
    else setPasswordStrength("strong");
  }, [password]);

  function validateField(field: string, value: string): string | null {
    switch (field) {
      case "name":
        return value.trim().length < 3
          ? "Nama minimal 3 karakter"
          : null;
      case "email":
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? "Email tidak valid"
          : null;
      case "password":
        return value.length < 8
          ? "Password minimal 8 karakter"
          : null;
      case "confirmPassword":
        return value !== password
          ? "Password tidak cocok"
          : null;
      case "nik":
        return value && !/^\d{16}$/.test(value)
          ? "NIK harus 16 digit"
          : null;
      default:
        return null;
    }
  }

  function handleBlur(field: string, value: string) {
    const error = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field]: error || "",
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    // Validate all fields
    const validationErrors: Record<string, string> = {};
    const fields = { name, email, password, confirmPassword, nik };

    Object.entries(fields).forEach(([field, value]) => {
      const error = validateField(field, value);
      if (error) validationErrors[field] = error;
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      // Register
      const registerRes = await api.post<{
        data: { accessToken: string; refreshToken: string; user: any };
      }>(
        "/auth/register",
        {
          name: name.trim(),
          email: email.trim(),
          password,
          nik: nik.trim() || undefined,
        },
        { skipAuth: true }
      );

      // Auth cookies are set server-side (HttpOnly) in the response
      
      success("Akun berhasil dibuat! Selamat datang di Laporin.");
      router.push("/citizen");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Pendaftaran gagal. Coba lagi.";
      showError(message);
      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  }

  const strengthColors = {
    weak: "bg-red-500",
    medium: "bg-amber-500",
    strong: "bg-green-500",
  };

  const strengthLabels = {
    weak: "Lemah",
    medium: "Sedang",
    strong: "Kuat",
  };

  return (
    <div className="w-full max-w-md animate-[fadeInUp_0.4s_ease-out]">
      <div className="rounded-2xl bg-white p-8 shadow-xl">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg shadow-md">
              <Image
                src="/icons/icon-192.png"
                alt="Laporin Logo"
                width={40}
                height={40}
                className="scale-[1.15] object-cover"
              />
            </div>
            <span className="text-3xl font-bold font-display text-navy">
              Laporin
            </span>
          </div>
          <h1 className="text-xl font-semibold font-display text-ink">
            Buat Akun Baru
          </h1>
          <p className="mt-1 text-sm text-muted">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-medium text-blue hover:underline"
            >
              Masuk →
            </Link>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium font-body text-ink"
            >
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={(e) => handleBlur("name", e.target.value)}
              required
              disabled={isLoading}
              className={`input-base ${
                errors.name ? "border-red-500 ring-2 ring-red-200" : ""
              }`}
              placeholder="Nama lengkap Anda"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium font-body text-ink"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => handleBlur("email", e.target.value)}
              required
              disabled={isLoading}
              className={`input-base ${
                errors.email ? "border-red-500 ring-2 ring-red-200" : ""
              }`}
              placeholder="nama@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium font-body text-ink"
            >
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={(e) => handleBlur("password", e.target.value)}
                required
                disabled={isLoading}
                data-ms-reveal="false"
                className={`input-base pr-10 ${
                  errors.password ? "border-red-500 ring-2 ring-red-200" : ""
                }`}
                placeholder="Minimal 8 karakter"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}

            {/* Password strength bar */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1">
                  <div
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordStrength === "weak"
                        ? strengthColors.weak
                        : "bg-gray-200"
                    }`}
                  />
                  <div
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordStrength === "medium" ||
                      passwordStrength === "strong"
                        ? strengthColors[passwordStrength]
                        : "bg-gray-200"
                    }`}
                  />
                  <div
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      passwordStrength === "strong"
                        ? strengthColors.strong
                        : "bg-gray-200"
                    }`}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">
                  Kekuatan password: {strengthLabels[passwordStrength]}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium font-body text-ink"
            >
              Konfirmasi Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={(e) => handleBlur("confirmPassword", e.target.value)}
                required
                disabled={isLoading}
                data-ms-reveal="false"
                className={`input-base pr-10 ${
                  errors.confirmPassword
                    ? "border-red-500 ring-2 ring-red-200"
                    : ""
                }`}
                placeholder="Ulangi password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                aria-label={
                  showConfirmPassword
                    ? "Sembunyikan password"
                    : "Tampilkan password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* NIK (optional) */}
          <div>
            <label
              htmlFor="nik"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium font-body text-ink"
            >
              NIK (opsional)
              <div className="group relative">
                <Info size={14} className="text-muted" />
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden w-48 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-xs text-white shadow-lg group-hover:block">
                  NIK tersimpan terenkripsi untuk keamananmu
                </div>
              </div>
            </label>
            <input
              id="nik"
              type="text"
              value={nik}
              onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
              onBlur={(e) => handleBlur("nik", e.target.value)}
              maxLength={16}
              disabled={isLoading}
              className={`input-base ${
                errors.nik ? "border-red-500 ring-2 ring-red-200" : ""
              }`}
              placeholder="16 digit NIK"
            />
            {errors.nik && (
              <p className="mt-1 text-xs text-red-600">{errors.nik}</p>
            )}
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {errors.submit}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="min-h-[44px] w-full rounded-xl bg-navy px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.01] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Memproses...
              </span>
            ) : (
              "Buat Akun"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
