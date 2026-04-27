'use client'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
import type { ApiResponse, PaginationMeta } from '@laporin/types'

export interface ForumAuthor {
  id?: string
  name: string
  reputation?: number
}

export interface ForumThread {
  id: string
  title: string
  content: string
  category: string
  author: ForumAuthor
  replies: number
  views: number
  upvotes: number
  isPinned: boolean
  isLocked: boolean
  userVote?: 'up' | 'down' | null
  isBookmarked?: boolean
  lastActivity: string
  createdAt: string
  updatedAt?: string
}

export interface ForumReply {
  id: string
  content: string
  author: ForumAuthor
  upvotes: number
  createdAt: string
}

export interface ForumThreadDetail extends ForumThread {
  repliesList: ForumReply[]
}

export function useForumList(page = 1, limit = 10, category = 'Semua', sortBy = 'recent') {
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchThreads = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await api.get<ApiResponse<ForumThread[]>>(
        `/forum?page=${page}&limit=${limit}&category=${category}&sortBy=${sortBy}`,
        { skipAuth: true }
      )
      setThreads(res.data)
      setMeta(res.meta ?? null)
    } catch {
      setThreads([])
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, category, sortBy])

  useEffect(() => { fetchThreads() }, [fetchThreads])

  return { threads, meta, isLoading, refetch: fetchThreads }
}

export function useForumActions() {
  const [isProcessing, setIsProcessing] = useState(false)

  const togglePin = async (id: string) => {
    setIsProcessing(true)
    try {
      await api.patch(`/forum/${id}/pin`, {})
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleLock = async (id: string) => {
    setIsProcessing(true)
    try {
      await api.patch(`/forum/${id}/lock`, {})
    } finally {
      setIsProcessing(false)
    }
  }

  const deleteThread = async (id: string) => {
    setIsProcessing(true)
    try {
      await api.delete(`/forum/${id}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const voteThread = async (id: string, isUpvote: boolean) => {
    try {
      if (isUpvote) {
        await api.post(`/forum/${id}/vote`, {})
      } else {
        await api.delete(`/forum/${id}/vote`)
      }
    } catch (err) {
      console.error('Vote error:', err)
    }
  }

  return { togglePin, toggleLock, deleteThread, voteThread, isProcessing }
}

export function useForumThread(id: string) {
  const [thread, setThread] = useState<ForumThreadDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchThread = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const res = await api.get<ApiResponse<any>>(`/forum/${id}`, { skipAuth: true })
      setThread({
        ...res.data,
        repliesList: res.data.replies || []
      })
    } catch {
      setThread(null)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { fetchThread() }, [fetchThread])

  return { thread, isLoading, refetch: fetchThread }
}
