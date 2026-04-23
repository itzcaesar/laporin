'use client'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import type { ApiResponse, PaginationMeta } from '@/types'

export interface SurveyResponse {
  id: string
  reportId: string
  reportTrackingCode: string
  ratings: {
    speed: number
    quality: number
    communication: number
    satisfaction: number
  }
  comment?: string
  submittedAt: string
}

export function useSurveys(page = 1, limit = 20) {
  const [surveys, setSurveys] = useState<SurveyResponse[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSurveys = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get<ApiResponse<SurveyResponse[]>>(
        `/gov/surveys?page=${page}&limit=${limit}`
      )
      setSurveys(res.data)
      setMeta(res.meta ?? null)
    } catch {
      setSurveys([])
    } finally {
      setIsLoading(false)
    }
  }, [page, limit])

  useEffect(() => { fetchSurveys() }, [fetchSurveys])

  return { surveys, meta, isLoading, refetch: fetchSurveys }
}
