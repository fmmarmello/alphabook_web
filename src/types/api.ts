/**
 * API response types and utilities
 */

export interface ApiErrorDetails {
  message: string
  details?: {
    formErrors?: string[]
    fieldErrors?: Record<string, string[]>
  }
}

export interface ApiResponse<T> {
  data: T | null
  error: ApiErrorDetails | null
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    pageSize: number
    pageCount: number
    total: number
  }
}

export interface ApiError {
  error: ApiErrorDetails
}

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as any).error === 'object'
  )
}

/**
 * Extract error message from API response
 */
export function getApiErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    const details = error.error.details
    const formErrors = details?.formErrors || []
    const fieldErrors = details?.fieldErrors || {}
    const fieldMessages = Object.values(fieldErrors).flat()
    const allErrors = [...formErrors, ...fieldMessages].filter(Boolean)
    
    if (allErrors.length > 0) {
      return `${error.error.message}: ${allErrors.join(', ')}`
    }
    
    return error.error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'Erro desconhecido'
}
