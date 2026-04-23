'use client'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import type { ApiResponse, PaginationMeta } from '@/types'

export interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  actorId: string
  actorName: string
  actorRole: string
  details: string | null
  createdAt: string
}

export function useAudit(page = 1, limit = 20) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get<ApiResponse<AuditLog[]>>(
        `/gov/audit?page=${page}&limit=${limit}`
      )
      setLogs(res.data)
      setMeta(res.meta ?? null)
    } catch {
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }, [page, limit])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return { logs, meta, isLoading, refetch: fetchLogs }
}
