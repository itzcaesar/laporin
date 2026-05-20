"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Eye, EyeOff, Lock } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token reset tidak ditemukan.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(
        "/auth/password/reset",
        { token, password },
        { skipAuth: true }
      );
      setIsDone(true);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.userMessage
          : "Gagal mereset password. Coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isDone) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="text-emerald-600" size={34} />
        </div>
        <h1 className="mb-2 font-display text-2xl font-bold text-navy">
          Password Berhasil Direset
        </h1>
        <p className="mb-6 text-sm text-muted">
          Silakan masuk kembali memakai password baru Anda.
        </p>
        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-xl bg-navy px-4 py-3 font-semibold text-white transition-colors hover:bg-navy/90"
        >
          Masuk
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-light text-blue">
          <Lock size={28} />
        </div>
        <h1 className="font-display text-2xl font-bold text-navy">
          Reset Kata Sandi
        </h1>
        <p className="mt-2 text-sm text-muted">
          Masukkan password baru untuk akun Laporin Anda.
        </p>
      </div>

      {!token && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Token reset tidak ditemukan atau tautan tidak valid.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <label className="mb-4 block">
        <span className="mb-2 block text-sm font-medium text-ink">Password Baru</span>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border px-4 py-3 pr-12 text-sm outline-none transition-colors focus:border-blue"
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>

      <label className="mb-6 block">
        <span className="mb-2 block text-sm font-medium text-ink">Konfirmasi Password</span>
        <input
          type={showPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-blue"
          placeholder="Ulangi password baru"
          autoComplete="new-password"
          required
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting || !token}
        className="w-full rounded-xl bg-navy px-4 py-3 font-semibold text-white transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Mereset..." : "Reset Password"}
      </button>

      <Link
        href="/login"
        className="mt-5 block text-center text-sm font-medium text-blue hover:underline"
      >
        Kembali ke login
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">Memuat...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
