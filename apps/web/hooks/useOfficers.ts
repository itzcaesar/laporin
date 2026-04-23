'use client'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import type { ApiResponse, PaginationMeta } from '@/types'

export interface Officer {
  id: string
  name: string
  email: string
  nip: string
  role: 'admin' | 'officer'
  region?: string
  isActive: boolean
}

export function useOfficers(page = 1, limit = 20) {
  const [officers, setOfficers] = useState<Officer[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchOfficers = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get<ApiResponse<Officer[]>>(
        `/gov/officers?page=${page}&limit=${limit}`
      )
      setOfficers(res.data)
      setMeta(res.meta ?? null)
    } catch {
      setOfficers([])
    } finally {
      setIsLoading(false)
    }
  }, [page, limit])

  useEffect(() => { fetchOfficers() }, [fetchOfficers])

  return { officers, meta, isLoading, refetch: fetchOfficers }
}
