// ── hooks/useGovReport.ts ──
// Government single report detail and actions

import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

type ReportStatus =
  | 'new'
  | 'verified'
  | 'in_progress'
  | 'completed'
  | 'verified_complete'
  | 'rejected'
  | 'disputed'
  | 'closed'

type Priority = 'low' | 'medium' | 'high' | 'urgent'

type VerificationResult = 'valid' | 'hoax' | 'duplicate' | 'out_of_jurisdiction'

type GovReportDetail = {
  id: string
  trackingCode: string
  title: string
  description: string
  locationAddress: string
  locationLat: number
  locationLng: number
  status: ReportStatus
  priority: Priority
  dangerLevel: number
  priorityScore: number
  upvoteCount: number
  commentCount: number
  viewCount: number
  categoryId: number
  isAnonymous: boolean
  agencyId: string | null
  assignedOfficerId: string | null
  picNip: string | null
  estimatedStart: string | null
  estimatedEnd: string | null
  actualEnd: string | null
  completedAt: string | null
  verifiedAt: string | null
  budgetIdr: number | null
  isDuplicateOf: string | null
  category: {
    id: number
    name: string
    emoji: string
    leadAgency: string
  }
  reporter: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
    createdAt: string
  } | null
  assignedOfficer: {
    id: string
    name: string | null
    nip: string | null
    email: string | null
    phone: string | null
  } | null
  agency: {
    id: string
    name: string
    shortName: string
    email: string | null
    phone: string | null
  } | null
  media: Array<{
    id: string
    mediaType: string
    fileUrl: string
    sortOrder: number
    createdAt: string
  }>
  statusHistory: Array<{
    id: string
    oldStatus: ReportStatus
    newStatus: ReportStatus
    note: string
    officerNip: string | null
    changedBy: {
      name: string | null
      role: string
    } | null
    createdAt: string
  }>
  comments: Array<{
    id: string
    content: string
    isGovernment: boolean
    author: {
      name: string | null
      role: string
    } | null
    createdAt: string
    replies: Array<{
      id: string
      content: string
      isGovernment: boolean
      author: {
        name: string | null
        role: string
      } | null
      createdAt: string
    }>
  }>
  rating: {
    id: string
    rating: number
    review: string | null
    createdAt: string
  } | null
  aiAnalysis: {
    suggestedCategory: number | null
    dangerLevel: number | null
    priorityScore: number | null
    isDuplicate: boolean
    duplicateOfId: string | null
    isHoax: boolean
    hoaxConfidence: number | null
    impactSummary: string | null
    budgetEstimate: number | null
    analysedAt: string
  } | null
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────

/**
 * Fetch single report detail
 */
export function useGovReport(id: string) {
  const [data, setData] = useState<GovReportDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.get<{ success: true; data: GovReportDetail }>(
        `/gov/reports/${id}`
      )
      setData(response.data)
    } catch (err: any) {
      setError(err.message || 'Gagal memuat detail laporan')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  return { data, isLoading, error, refetch: fetchData }
}

/**
 * Report action handlers
 */
export function useGovReportActions(reportId: string, onSuccess?: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verify = async (data: {
    result: VerificationResult
    note: string
    officerNip: string
    duplicateOfId?: string
  }) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await api.patch(`/gov/reports/${reportId}/verify`, data)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi laporan')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const assign = async (data: {
    officerId: string
    picNip: string
    estimatedStart?: string
    estimatedEnd?: string
    budgetIdr?: number
  }) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await api.patch(`/gov/reports/${reportId}/assign`, data)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Gagal menugaskan laporan')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateStatus = async (data: {
    newStatus: ReportStatus
    note: string
    officerNip: string
  }) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await api.patch(`/gov/reports/${reportId}/status`, data)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah status')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateTimeline = async (data: {
    estimatedStart?: string
    estimatedEnd?: string
    actualEnd?: string
    budgetIdr?: number
    officerNip: string
  }) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await api.patch(`/gov/reports/${reportId}/timeline`, data)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah timeline')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  const updatePriority = async (data: {
    priority: Priority
    note: string
    officerNip: string
  }) => {
    try {
      setIsSubmitting(true)
      setError(null)
      await api.patch(`/gov/reports/${reportId}/priority`, data)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah prioritas')
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    verify,
    assign,
    updateStatus,
    updateTimeline,
    updatePriority,
    isSubmitting,
    error,
  }
}
