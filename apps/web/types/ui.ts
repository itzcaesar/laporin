// UI Component Types (React-dependent)
// These types are specific to the web app and use React types

import type { ReactNode } from 'react';

// ── Variant Types ──

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "outline-white";
export type ButtonSize = "sm" | "md" | "lg";
export type Alignment = "left" | "center";

// ── Data Interfaces for UI Components ──

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
  status: string;
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
