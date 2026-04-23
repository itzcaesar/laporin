// ── hooks/useGamification.ts ──
// Gamification data hooks

import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

type LevelInfo = {
  name: string
  minPoints: number
  maxPoints: number
}

type NextLevel = {
  name: string
  minPoints: number
  pointsNeeded: number
}

type Badge = {
  id: string
  code: string
  name: string
  description: string
  icon: string
  color: string
  target: number | null
  progress: number
  unlocked: boolean
  unlockedAt: string | null
}

type GamificationStats = {
  totalPoints: number
  currentLevel: string
  levelInfo: LevelInfo
  nextLevel: NextLevel | null
  currentStreak: number
  longestStreak: number
  impactScore: number
  stats: {
    totalReports: number
    verifiedReports: number
    completedReports: number
    totalUpvotes: number
    totalComments: number
  }
  badges: Badge[]
}

type LeaderboardEntry = {
  rank: number
  userId: string
  name: string
  level: string
  points: number
  reports: number
  isCurrentUser: boolean
}

type LeaderboardResponse = {
  data: LeaderboardEntry[]
  meta: {
    total: number
    page: number
    limit: number
    pages: number
  }
  currentUserRank: number
}

type PointHistoryEntry = {
  id: string
  points: number
  action: string
  description: string
  metadata: any
  createdAt: string
}

// ─────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────

/**
 * Get current user's gamification stats
 */
export function useGamification() {
  const [data, setData] = useState<GamificationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.get<{ success: true; data: GamificationStats }>(
        '/gamification/me'
      )
      setData(response.data)
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data gamifikasi')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { data, isLoading, error, refetch: fetchData }
}

/**
 * Get all badges with user progress
 */
export function useBadges() {
  const [data, setData] = useState<Badge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.get<{ success: true; data: Badge[] }>(
        '/gamification/badges'
      )
      setData(response.data)
    } catch (err: any) {
      setError(err.message || 'Gagal memuat badge')
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { data, isLoading, error, refetch: fetchData }
}

/**
 * Get leaderboard
 */
export function useLeaderboard(page = 1, limit = 20) {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.get<{ success: true } & LeaderboardResponse>(
        `/gamification/leaderboard?page=${page}&limit=${limit}`
      )
      setData(response.data)
      setMeta(response.meta)
      setCurrentUserRank(response.currentUserRank)
    } catch (err: any) {
      setError(err.message || 'Gagal memuat leaderboard')
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, limit])

  return { data, meta, currentUserRank, isLoading, error, refetch: fetchData }
}

/**
 * Get point history
 */
export function usePointHistory(page = 1, limit = 20) {
  const [data, setData] = useState<PointHistoryEntry[]>([])
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.get<{
        success: true
        data: PointHistoryEntry[]
        meta: typeof meta
      }>(`/gamification/points/history?page=${page}&limit=${limit}`)
      setData(response.data)
      setMeta(response.meta)
    } catch (err: any) {
      setError(err.message || 'Gagal memuat riwayat poin')
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, limit])

  return { data, meta, isLoading, error, refetch: fetchData }
}
