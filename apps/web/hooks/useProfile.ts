// ── hooks/useProfile.ts ──
// Fetches current user's profile with statistics

'use client'
import { useState, useEffect, useCallback } from 'react'
import { api, ApiClientError } from '@/lib/api-client'
import type { ApiResponse } from '@/types'

interface UserProfile {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: 'citizen' | 'officer' | 'admin' | 'super_admin'
  isVerified: boolean
  stats: {
    totalReports: number
    totalComments: number
    totalVotes: number
  }
  createdAt: string
}

interface UseProfileReturn {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Fetches the current user's profile with statistics.
 * Returns null while loading, not an empty object.
 */
export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get<ApiResponse<UserProfile>>('/user/profile')
      setProfile(res.data)
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.userMessage
          : 'Gagal memuat profil.'
      )
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return { profile, isLoading, error, refetch: fetchProfile }
}
