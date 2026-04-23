// ── hooks/useAuth.tsx ──
// Authentication state management hook

'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  api,
  setAuthCookies,
  clearAuthCookies,
  getRefreshToken,
  refreshAccessToken,
  ApiClientError,
} from '@/lib/api-client'
import type { ApiResponse, Role } from '@/types'

interface User {
  id: string
  name: string | null
  email: string
  role: Role
  isVerified: boolean
  agencyName?: string | null
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refetch: () => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  password: string
  phone?: string
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchUser = async () => {
    const hasAccessToken =
      typeof document !== 'undefined' && document.cookie.includes('laporin_token=')
    const hasRefreshToken = !!getRefreshToken()

    if (!hasAccessToken && !hasRefreshToken) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      if (!hasAccessToken && hasRefreshToken) {
        const refreshed = await refreshAccessToken()
        if (!refreshed) {
          setUser(null)
          clearAuthCookies()
          setIsLoading(false)
          return
        }
      }

      const res = await api.get<ApiResponse<User>>('/auth/me')
      setUser(res.data)
    } catch {
      setUser(null)
      clearAuthCookies()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>>(
        '/auth/login',
        { email, password },
        { skipAuth: true }
      )
      setAuthCookies(res.data.accessToken, res.data.user.role, res.data.refreshToken)
      setUser(res.data.user)
      
      // Redirect based on role
      if (res.data.user.role === 'citizen') {
        router.push('/citizen')
      } else {
        router.push('/gov')
      }
    } catch (err) {
      throw err instanceof ApiClientError ? err : new Error('Login gagal')
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const res = await api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: User }>>(
        '/auth/register',
        data,
        { skipAuth: true }
      )
      setAuthCookies(res.data.accessToken, res.data.user.role, res.data.refreshToken)
      setUser(res.data.user)
      router.push('/citizen')
    } catch (err) {
      throw err instanceof ApiClientError ? err : new Error('Registrasi gagal')
    }
  }

  const logout = async () => {
    const refreshToken = getRefreshToken()

    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken }, { skipAuth: true })
      }
    } catch {
      // Ignore errors, clear local state anyway
    } finally {
      clearAuthCookies()
      setUser(null)
      router.push('/login')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refetch: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
