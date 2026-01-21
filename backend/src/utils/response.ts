// backend/src/utils/response.ts
// Consistent API response formatter

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
  meta?: {
    total?: number
    page?: number
    pageSize?: number
  }
}

export function successResponse<T>(data: T, meta?: any): ApiResponse<T> {
  return {
    success: true,
    data,
    meta
  }
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      total,
      page,
      pageSize
    }
  }
}

export function errorResponse(code: string, message: string): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message
    }
  }
}
