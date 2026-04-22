// ── hooks/useApiError.ts ──
// Standardized error handling hook

import { useState, useCallback } from 'react'

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: unknown
}

const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
  UNAUTHORIZED: 'Sesi Anda telah berakhir. Silakan login kembali.',
  FORBIDDEN: 'Anda tidak memiliki akses untuk melakukan tindakan ini.',
  NOT_FOUND: 'Data tidak ditemukan.',
  SERVER_ERROR: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
  VALIDATION_ERROR: 'Data yang Anda masukkan tidak valid.',
  TIMEOUT: 'Permintaan memakan waktu terlalu lama. Silakan coba lagi.',
}

export function useApiError() {
  const [error, setError] = useState<ApiError | null>(null)
  const [isError, setIsError] = useState(false)
  
  const handleError = useCallback((err: unknown) => {
    let apiError: ApiError
    
    if (err instanceof Error) {
      // Parse error message to determine type
      const message = err.message.toLowerCase()
      
      if (message.includes('network') || message.includes('failed to fetch')) {
        apiError = {
          message: ERROR_MESSAGES.NETWORK_ERROR,
          code: 'NETWORK_ERROR',
        }
      } else if (message.includes('401') || message.includes('unauthorized')) {
        apiError = {
          message: ERROR_MESSAGES.UNAUTHORIZED,
          code: 'UNAUTHORIZED',
          status: 401,
        }
      } else if (message.includes('403') || message.includes('forbidden')) {
        apiError = {
          message: ERROR_MESSAGES.FORBIDDEN,
          code: 'FORBIDDEN',
          status: 403,
        }
      } else if (message.includes('404') || message.includes('not found')) {
        apiError = {
          message: ERROR_MESSAGES.NOT_FOUND,
          code: 'NOT_FOUND',
          status: 404,
        }
      } else if (message.includes('500') || message.includes('server error')) {
        apiError = {
          message: ERROR_MESSAGES.SERVER_ERROR,
          code: 'SERVER_ERROR',
          status: 500,
        }
      } else if (message.includes('timeout')) {
        apiError = {
          message: ERROR_MESSAGES.TIMEOUT,
          code: 'TIMEOUT',
        }
      } else {
        apiError = {
          message: err.message,
          code: 'UNKNOWN_ERROR',
        }
      }
    } else {
      apiError = {
        message: String(err),
        code: 'UNKNOWN_ERROR',
      }
    }
    
    setError(apiError)
    setIsError(true)
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', apiError)
    }
    
    // Track error in production (integrate with error tracking service)
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(err, { extra: apiError })
    }
  }, [])
  
  const clearError = useCallback(() => {
    setError(null)
    setIsError(false)
  }, [])
  
  const retry = useCallback((fn: () => Promise<void>) => {
    clearError()
    return fn().catch(handleError)
  }, [clearError, handleError])
  
  return {
    error,
    isError,
    errorMessage: error?.message || null,
    errorCode: error?.code || null,
    handleError,
    clearError,
    retry,
  }
}
