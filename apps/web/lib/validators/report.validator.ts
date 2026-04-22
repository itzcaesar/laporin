// ── lib/validators/report.validator.ts ──
// Frontend validation schemas matching backend

import { z } from "zod";

/**
 * Report creation validation
 */
export const createReportSchema = z.object({
  title: z
    .string()
    .min(10, "Judul minimal 10 karakter")
    .max(200, "Judul maksimal 200 karakter"),
  description: z
    .string()
    .min(20, "Deskripsi minimal 20 karakter")
    .max(2000, "Deskripsi maksimal 2000 karakter"),
  categoryId: z
    .number()
    .int("Kategori harus berupa angka")
    .positive("Pilih kategori yang valid"),
  locationAddress: z
    .string()
    .min(10, "Alamat minimal 10 karakter")
    .max(500, "Alamat maksimal 500 karakter"),
  locationLat: z
    .number()
    .min(-90, "Latitude tidak valid")
    .max(90, "Latitude tidak valid"),
  locationLng: z
    .number()
    .min(-180, "Longitude tidak valid")
    .max(180, "Longitude tidak valid"),
  isAnonymous: z.boolean().optional().default(false),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

/**
 * Comment creation validation
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(3, "Komentar minimal 3 karakter")
    .max(1000, "Komentar maksimal 1000 karakter"),
  parentId: z.string().uuid("ID parent tidak valid").optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

/**
 * Rating creation validation
 */
export const createRatingSchema = z.object({
  rating: z
    .number()
    .int("Rating harus berupa angka")
    .min(1, "Rating minimal 1")
    .max(5, "Rating maksimal 5"),
  review: z
    .string()
    .min(10, "Ulasan minimal 10 karakter")
    .max(500, "Ulasan maksimal 500 karakter")
    .optional(),
});

export type CreateRatingInput = z.infer<typeof createRatingSchema>;

/**
 * Report verification validation (government)
 */
export const verifyReportSchema = z.object({
  result: z.enum(["valid", "hoax", "duplicate", "out_of_jurisdiction"], {
    errorMap: () => ({ message: "Pilih hasil verifikasi yang valid" }),
  }),
  note: z
    .string()
    .min(10, "Catatan minimal 10 karakter")
    .max(500, "Catatan maksimal 500 karakter"),
  duplicateOfId: z.string().uuid("ID duplikat tidak valid").optional(),
});

export type VerifyReportInput = z.infer<typeof verifyReportSchema>;

/**
 * Report assignment validation (government)
 */
export const assignReportSchema = z.object({
  assignedOfficerId: z.string().uuid("ID petugas tidak valid"),
  note: z
    .string()
    .min(10, "Catatan minimal 10 karakter")
    .max(500, "Catatan maksimal 500 karakter"),
});

export type AssignReportInput = z.infer<typeof assignReportSchema>;

/**
 * Status update validation (government)
 */
export const updateStatusSchema = z.object({
  status: z.enum(
    [
      "new",
      "verified",
      "in_progress",
      "completed",
      "verified_complete",
      "rejected",
      "disputed",
      "closed",
    ],
    {
      errorMap: () => ({ message: "Pilih status yang valid" }),
    }
  ),
  note: z
    .string()
    .min(10, "Catatan minimal 10 karakter")
    .max(500, "Catatan maksimal 500 karakter"),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

/**
 * Timeline update validation (government)
 */
export const updateTimelineSchema = z.object({
  estimatedStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)")
    .optional(),
  estimatedEnd: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid (YYYY-MM-DD)")
    .optional(),
  budgetIdr: z
    .number()
    .int("Anggaran harus berupa angka")
    .positive("Anggaran harus positif")
    .optional(),
});

export type UpdateTimelineInput = z.infer<typeof updateTimelineSchema>;

/**
 * Priority update validation (government)
 */
export const updatePrioritySchema = z.object({
  priority: z.enum(["low", "medium", "high", "urgent"], {
    errorMap: () => ({ message: "Pilih prioritas yang valid" }),
  }),
  note: z
    .string()
    .min(10, "Catatan minimal 10 karakter")
    .max(500, "Catatan maksimal 500 karakter")
    .optional(),
});

export type UpdatePriorityInput = z.infer<typeof updatePrioritySchema>;

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
