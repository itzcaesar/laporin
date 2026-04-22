// ── app/(auth)/login/page.tsx ──
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

type Role = "citizen" | "government";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { error: showError } = useToast();

  const [role, setRole] = useState<Role>("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      
      // Get role from cookie
      const roleFromCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("laporin_role="))
        ?.split("=")[1];
      
      console.log("Role from cookie:", roleFromCookie);
      
      // Use window.location for hard redirect to ensure page loads fresh
      const dest = roleFromCookie === "citizen" ? "/citizen" : "/gov";
      console.log("Redirecting to:", dest);
      window.location.href = dest;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Login gagal. Coba lagi.";
      setError(message);
      showError(message);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setLoading(false);
    }
  }

  // Remove the useEffect that was causing issues

  return (
    <div
      className={`w-full max-w-md animate-[fadeInUp_0.4s_ease-out] ${
        shake ? "animate-[shake_0.5s_ease-in-out]" : ""
      }`}
    >
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
            Masuk ke Akunmu
          </h1>
          <p className="mt-1 text-sm text-muted">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-medium text-blue hover:underline"
            >
              Daftar →
            </Link>
          </p>
        </div>

        {/* Role tabs */}
        <div className="mb-6 flex gap-2 rounded-xl bg-surface p-1">
          <button
            type="button"
            onClick={() => setRole("citizen")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
              role === "citizen"
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            👤 Warga
          </button>
          <button
            type="button"
            onClick={() => setRole("government")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
              role === "government"
                ? "bg-navy text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            🏛 Pemerintah
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
              disabled={isLoading}
              className="input-base"
              placeholder="nama@email.com"
            />
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
                required
                disabled={isLoading}
                data-ms-reveal="false"
                className="input-base pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot password */}
          <div className="text-right">
            <button
              type="button"
              className="text-sm font-medium text-blue hover:underline"
            >
              Lupa kata sandi?
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
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
              "Masuk"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
