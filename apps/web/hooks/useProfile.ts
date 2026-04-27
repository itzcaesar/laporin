// ── hooks/useProfile.ts ──
// Fetches current user's profile with statistics

'use client'
import { useState, useEffect, useCallback } from 'react'
import { api, ApiClientError } from '@/lib/api-client'
import type { ApiResponse } from '@laporin/types'

interface Agency {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
}

interface UserProfile {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: 'citizen' | 'officer' | 'admin' | 'super_admin'
  nip: string | null
  isVerified: boolean
  agency: Agency | null
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
  isUpdating: boolean
  error: string | null
  updateProfile: (data: { name?: string; phone?: string }) => Promise<void>
  refetch: () => void
}

/**
 * Fetches the current user's profile with statistics.
 * Returns null while loading, not an empty object.
 */
export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
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

  const updateProfile = async (data: { name?: string; phone?: string }) => {
    setIsUpdating(true)
    setError(null)
    try {
      await api.patch('/user/profile', data)
      await fetchProfile()
    } catch (err) {
      throw err instanceof ApiClientError
        ? err
        : new Error('Gagal memperbarui profil.')
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return { 
    profile, 
    isLoading, 
    isUpdating, 
    error, 
    updateProfile, 
    refetch: fetchProfile 
  }
}
