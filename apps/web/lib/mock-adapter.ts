// ── lib/mock-adapter.ts ──
// Adapter to convert MockReport to Report format for components

import type { MockReport, Report, ReportDetail, ReportStatus, ReportStatusMap } from "@/types";

// Map Indonesian status to English status
const STATUS_MAP: Record<ReportStatusMap, ReportStatus> = {
  baru: "new",
  diverifikasi: "verified",
  diproses: "in_progress",
  selesai: "completed",
  terverifikasi: "verified_complete",
};

// Map Indonesian priority to English priority
const PRIORITY_MAP: Record<string, "low" | "medium" | "high" | "urgent"> = {
  Rendah: "low",
  Sedang: "medium",
  Tinggi: "high",
  Kritis: "urgent",
};

/**
 * Convert MockReport to Report format
 */
export function mockToReport(mock: MockReport): Report {
  return {
    id: mock.id,
    trackingCode: mock.id, // Use ID as tracking code for now
    title: mock.title,
    locationAddress: mock.location,
    status: STATUS_MAP[mock.status],
    priority: PRIORITY_MAP[mock.priority],
    dangerLevel: 3, // Default danger level
    upvoteCount: mock.upvotes,
    commentCount: mock.comments,
    categoryId: 1, // Default category ID
    categoryName: mock.category,
    categoryEmoji: mock.categoryEmoji,
    picName: mock.pic || null,
    picNip: null,
    estimatedEnd: null, // Could calculate from reportedAt + SLA
    budgetIdr: null,
    isAnonymous: false,
    reporterId: null,
    agencyId: null,
    thumbnailUrl: null,
    createdAt: convertRelativeTime(mock.reportedAt),
    updatedAt: convertRelativeTime(mock.reportedAt),
  };
}

/**
 * Convert MockReport to ReportDetail format (includes description and more)
 */
export function mockToReportDetail(mock: MockReport): ReportDetail {
  return {
    ...mockToReport(mock),
    description: mock.description,
    aiSummary: null,
    locationLat: mock.lat,
    locationLng: mock.lng,
    estimatedStart: null,
    completedAt: mock.status === "selesai" || mock.status === "terverifikasi" 
      ? convertRelativeTime(mock.reportedAt) 
      : null,
    media: [],
    statusHistory: [],
    comments: [],
    aiAnalysis: null,
    hasVoted: false,
    hasBookmarked: false,
  };
}

/**
 * Convert relative time string to ISO date string
 * This is a simple approximation for mock data
 */
function convertRelativeTime(relativeTime: string): string {
  const now = new Date();
  
  if (relativeTime.includes("jam lalu")) {
    const hours = parseInt(relativeTime);
    now.setHours(now.getHours() - hours);
  } else if (relativeTime.includes("menit lalu")) {
    const minutes = parseInt(relativeTime);
    now.setMinutes(now.getMinutes() - minutes);
  } else if (relativeTime.includes("hari lalu")) {
    const days = parseInt(relativeTime);
    now.setDate(now.getDate() - days);
  } else if (relativeTime.includes("minggu lalu")) {
    const weeks = parseInt(relativeTime);
    now.setDate(now.getDate() - (weeks * 7));
  }
  
  return now.toISOString();
}
