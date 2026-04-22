// ── packages/types/src/index.ts ──
// Shared TypeScript types for the Laporin monorepo

// ── Variant & Enum Types ──

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "outline-white";
export type ButtonSize = "sm" | "md" | "lg";
export type Alignment = "left" | "center";
export type ReportStatus =
  | "new"
  | "verified"
  | "in_progress"
  | "completed"
  | "verified_complete"
  | "rejected"
  | "disputed"
  | "closed";

export type ReportStatusMap = "baru" | "diverifikasi" | "diproses" | "selesai" | "terverifikasi";

// ── Data Interfaces ──

export interface Feature {
  icon: string;
  title: string;
  description: string;
  accent?: string;
}

export interface Step {
  number: number;
  icon: string;
  title: string;
  description: string;
}

export interface Category {
  id: string;
  emoji: string;
  name: string;
  agency: string;
}

export interface Stat {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  decimals?: number;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  location: string;
  rating: number;
  isGovernment?: boolean;
  initials: string;
}

export interface StatusStage {
  status: ReportStatus;
  label: string;
  description: string;
  color: string;
  textColor: string;
  emoji: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  heading: string;
  links: Array<{ label: string; href: string }>;
}

export interface EmergencyNumber {
  emoji: string;
  service: string;
  number: string;
}

export interface MockReport {
  id: string;
  title: string;
  category: string;
  categoryEmoji: string;
  description: string;
  location: string;
  lat: number;
  lng: number;
  status: ReportStatusMap;
  statusLabel: string;
  reporter: string;
  reportedAt: string;
  pic?: string;
  upvotes: number;
  comments: number;
  downvotes: number;
  priority: "Rendah" | "Sedang" | "Tinggi" | "Kritis";
  mockComments: { author: string; text: string; time: string }[];
  photoPlaceholder: string;
}

export interface StatusConfig {
  color: string;
  bg: string;
  border: string;
  markerColor: string;
  label: string;
}

// ── Component Props ──

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

export interface SectionHeaderProps {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  alignment?: Alignment;
  className?: string;
}

export interface StatCounterProps {
  stat: Stat;
  className?: string;
}

export interface CategoryChipProps {
  category: Category;
  className?: string;
}

export interface StepCardProps {
  step: Step;
  isLast?: boolean;
  className?: string;
}

export interface FeatureCardProps {
  feature: Feature;
  className?: string;
}

export interface TestimonialCardProps {
  testimonial: Testimonial;
  className?: string;
}

export interface StatusBadgeProps {
  stage: StatusStage;
  className?: string;
}

export interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  className?: string;
}

// ── Dashboard Types ─────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string | null;
  email: string;
  role: "citizen" | "officer" | "admin" | "super_admin";
  agencyId: string | null;
  agencyName?: string | null;
  nip: string | null;
}

export interface Report {
  id: string;
  trackingCode: string;
  title: string;
  description?: string; // Optional description for feed display
  locationAddress: string;
  status: ReportStatus;
  priority: "low" | "medium" | "high" | "urgent";
  dangerLevel: number;
  upvoteCount: number;
  commentCount: number;
  categoryId: number;
  categoryName: string;
  categoryEmoji: string;
  picName: string | null;
  picNip: string | null;
  estimatedEnd: string | null;
  budgetIdr: number | null;
  isAnonymous: boolean;
  reporterId: string | null;
  agencyId: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDetail extends Report {
  description: string;
  aiSummary: string | null;
  locationLat: number;
  locationLng: number;
  estimatedStart: string | null;
  completedAt: string | null;
  media: MediaItem[];
  statusHistory: StatusHistoryItem[];
  comments: Comment[];
  aiAnalysis: AiAnalysis | null;
  hasVoted: boolean;
  hasBookmarked: boolean;
}

export interface MediaItem {
  id: string;
  mediaType: "photo" | "video" | "progress_photo" | "completion_photo";
  fileUrl: string;
  createdAt: string;
}

export interface StatusHistoryItem {
  id: string;
  oldStatus: ReportStatus;
  newStatus: ReportStatus;
  note: string;
  officerNip: string | null;
  changedBy: string | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  authorName: string | null;
  isGovernment: boolean;
  upvoteCount: number;
  replies: Comment[];
  createdAt: string;
}

export interface AiAnalysis {
  suggestedCategory: number | null;
  dangerLevel: number | null;
  isHoax: boolean;
  hoaxConfidence: number | null;
  impactSummary: string | null;
  budgetEstimate: number | null;
}

export interface ListReportsMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  reportId: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalReports: number;
  newToday: number;
  slaBreached: number;
  avgResolutionDays: number;
  satisfactionAvg: number;
  recentReports: Array<{
    id: string;
    trackingCode: string;
    status: string;
    categoryName: string;
    locationAddress: string;
    createdAt: string;
  }>;
  aiInsight: string;
}
