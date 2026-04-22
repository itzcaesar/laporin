// ── lib/validators/auth.validator.ts ──
// Frontend authentication validation schemas

import { z } from "zod";

/**
 * Login validation
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(100, "Password maksimal 100 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Registration validation
 */
export const registerSchema = z.object({
  name: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama maksimal 100 karakter"),
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(100, "Password maksimal 100 karakter")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password harus mengandung huruf besar, huruf kecil, dan angka"
    ),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  nik: z
    .string()
    .regex(/^\d{16}$/, "NIK harus 16 digit angka")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{9,12}$/, "Format nomor telepon tidak valid")
    .optional()
    .or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Change password validation
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Password saat ini wajib diisi"),
  newPassword: z
    .string()
    .min(8, "Password baru minimal 8 karakter")
    .max(100, "Password baru maksimal 100 karakter")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password harus mengandung huruf besar, huruf kecil, dan angka"
    ),
  confirmNewPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Password baru tidak cocok",
  path: ["confirmNewPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "Password baru harus berbeda dari password saat ini",
  path: ["newPassword"],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * OTP verification validation
 */
export const verifyOtpSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
  otp: z
    .string()
    .length(6, "OTP harus 6 digit")
    .regex(/^\d{6}$/, "OTP harus berupa angka"),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

/**
 * Helper function to validate and return errors
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return { success: false, errors };
}
