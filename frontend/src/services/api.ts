// frontend/src/services/api.ts
// API client factory

import axios, { AxiosInstance, AxiosError } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add token to request headers
apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  return config
})

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      authToken = null
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
