// ── hooks/useNotifications.ts ──
// Fetches user notifications with pagination

'use client'
import { useState, useEffect, useCallback } from 'react'
import { api, ApiClientError } from '@/lib/api-client'
import type { Notification, ApiResponse, PaginationMeta } from '@/types'

export function useNotifications(page = 1) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [meta,          setMeta]          = useState<PaginationMeta | null>(null)
  const [isLoading,     setIsLoading]     = useState(true)
  const [unreadCount,   setUnreadCount]   = useState(0)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get<ApiResponse<Notification[]>>(
        `/user/notifications?page=${page}&limit=20`
      )
      setNotifications(res.data)
      setMeta(res.meta ?? null)
      setUnreadCount(res.data.filter(n => !n.isRead).length)
    } catch {
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markAllRead = async () => {
    await api.patch('/user/notifications/read-all', {})
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  return { notifications, meta, isLoading, unreadCount, markAllRead, refetch: fetchNotifications }
}
