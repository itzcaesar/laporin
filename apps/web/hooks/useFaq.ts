'use client'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import type { ApiResponse } from '@laporin/types'

export interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  isPublished: boolean
  views: number
  helpful: number
  updatedAt: string
}

export function useFaq() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchFaqs = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get<ApiResponse<FAQ[]>>('/faq', { skipAuth: true })
      setFaqs(res.data)
    } catch {
      setFaqs([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchFaqs() }, [fetchFaqs])

  return { faqs, isLoading, refetch: fetchFaqs }
}
