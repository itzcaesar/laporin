// ── hooks/useCategories.ts ──
// Fetches category list for filters and dropdowns

'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import type { ApiResponse } from '@laporin/types'

export interface Category {
  id: number
  name: string
  emoji: string
  leadAgency: string
  defaultPriority: string
}

interface UseCategoriesReturn {
  categories: Category[]
  isLoading: boolean
  error: string | null
}

/**
 * Fetches all active categories. API caches for 1 hour.
 * Returns empty array while loading — components can safely map.
 */
export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<ApiResponse<Category[]>>('/categories', { skipAuth: true })
      .then((res) => setCategories(res.data))
      .catch(() => {
        setError('Gagal memuat kategori')
        setCategories([])
      })
      .finally(() => setIsLoading(false))
  }, [])

  return { categories, isLoading, error }
}
