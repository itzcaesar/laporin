import type { ReactNode } from 'react';

// ── Shared Types ─────────────────────────────────────────────────────────────
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


// ── Component Props ──

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}

export interface CardProps {
  children: ReactNode;
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
  children: ReactNode;
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
  locationLat?: number;
  locationLng?: number;
  status: ReportStatus;
  priority: "low" | "medium" | "high" | "urgent";
  dangerLevel: number;
  priorityScore: number;
  upvoteCount: number;
  commentCount: number;
  topComments?: Array<{
    id: string;
    authorName: string;
    content: string;
  }>;
  categoryId: number;
  categoryName?: string;
  categoryEmoji?: string;
  picName: string | null;
  picNip: string | null;
  estimatedEnd: string | null;
  budgetIdr: number | null;
  isAnonymous: boolean;
  reporterName: string | null;
  reporterId?: string | null;
  agencyId: string | null;
  agencyName: string | null;
  thumbnailUrl: string | null;
  hasVoted: boolean;
  hasBookmarked: boolean;
  aiSummary: string | null;
  aiAnalysis?: AiAnalysis | null;
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
  sortOrder: number;
  createdAt: string;
}

export interface StatusHistoryItem {
  id: string;
  oldStatus: ReportStatus;
  newStatus: ReportStatus;
  note: string;
  officerNip: string | null;
  changedByName: string | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  authorName: string | null;
  isGovernment: boolean;
  upvoteCount: number;
  parentId?: string | null;
  replies: Comment[];
  createdAt: string;
}

export interface AiAnalysis {
  suggestedCategoryId: number | null;
  dangerLevel: number | null;
  priorityScore: number | null;
  isHoax: boolean;
  hoaxConfidence: number | null;
  impactSummary: string | null;
  aiSummary: string | null;
  budgetMinIdr: number | null;
  budgetMaxIdr: number | null;
  budgetBasis: string | null;
  beforeAfterVerified: boolean | null;
  beforeAfterConfidence: number | null;
  beforeAfterDescription: string | null;
  analysedAt: string | null;
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
  trackingCode: string | null;
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

// ── API Response Envelope Types ─────────────────────────────────────────

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// ── Additional Core Types ───────────────────────────────────────────────

export type Priority = "low" | "medium" | "high" | "urgent";
export type Role = "citizen" | "officer" | "admin" | "super_admin";
export type MediaType = "photo" | "video" | "progress_photo" | "completion_photo";

export interface MapPin {
  id: string;
  trackingCode: string;
  lat: number;
  lng: number;
  status: ReportStatus;
  categoryId: number;
  dangerLevel: number;
}

export interface GovDashboardStats {
  totalReports: number;
  newToday: number;
  slaBreachedCount: number;
  satisfactionAvg: number | null;
  slaCompliance: number;
  urgentReports: Array<{
    id: string;
    title: string;
    locationAddress: string;
    trackingCode: string;
  }>;
  recentReports: Array<{
    id: string;
    trackingCode: string;
    status: ReportStatus;
    categoryId: number;
    categoryName?: string;
    categoryEmoji?: string;
    locationAddress: string;
    picName: string | null;
    createdAt: string;
  }>;
  trendData: Array<{
    date: string;
    count: number;
  }>;
  categoryDistribution: Array<{
    name: string;
    emoji: string;
    count: number;
  }>;
  aiInsight: string | null;
}

// ── Analytics Types ─────────────────────────────────────────────────────

export type AnalyticsPeriod = '30' | '90' | '365';

export interface TrendDataPoint {
  date: string; // YYYY-MM-DD format
  count: number;
}

export interface AnalyticsOverview {
  totalReports: number;
  completedReports: number;
  avgResolutionDays: number;
  slaCompliancePercent: number;
  cachedAt: string;
}

export interface CategoryDistribution {
  categoryId: number;
  categoryName: string;
  emoji: string;
  count: number;
}

export interface SlaMetrics {
  onTime: number;
  breached: number;
}

export interface SatisfactionMetrics {
  averageRating: number | null;
  totalRatings: number;
  completedReportsCount: number;
  responseRate: number;
}

export interface Anomaly {
  id: string;
  regionName: string;
  categoryName: string;
  spikePercent: number;
  hoursAgo: number;
  reportCount: number;
}

export interface CategoryTrend {
  categoryId: number;
  categoryName: string;
  emoji: string;
  currentCount: number;
  changePercent: number;
}

export interface OfficerPerformance {
  officerId: string;
  officerName: string;
  assignedCount: number;
  completedCount: number;
  avgResolutionDays: number;
  avgRating: number | null;
}

export interface AiInsights {
  insights: string[];
  generatedAt: string | null;
}

export interface Officer {
  id: string;
  name: string | null;
  email: string;
  nip: string | null;
  role: "officer" | "admin";
  isActive: boolean;
  agencyId: string;
  agencyName: string;
  createdAt: string;
}
