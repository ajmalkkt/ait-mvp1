// frontend/src/hooks/useNotifications.ts
// React Query hooks for notifications

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query'
import api from '../services/api'

export type NotificationType = 'info' | 'warning' | 'error' | 'success'

export interface NotificationData {
  id: string
  company_id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  action_item_id?: string
  project_id?: string
  team_id?: string
  metadata?: Record<string, any>
  is_read: boolean
  created_at: string
  read_at?: string
}

export interface ListNotificationsOptions {
  page?: number
  pageSize?: number
  is_read?: boolean
  type?: string
}

export interface NotificationListResponse {
  data: NotificationData[]
  pagination: {
    page: number
    pageSize: number
    total: number
    pages: number
    unread: number
  }
}

const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (options: ListNotificationsOptions) => [...notificationKeys.lists(), options] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
  details: () => [...notificationKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const
}

// Get list of notifications
export function useNotifications(
  options?: ListNotificationsOptions
): UseQueryResult<NotificationListResponse> {
  return useQuery({
    queryKey: notificationKeys.list(options || {}),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options?.page) params.append('page', String(options.page))
      if (options?.pageSize) params.append('pageSize', String(options.pageSize))
      if (options?.is_read !== undefined) params.append('isRead', String(options.is_read))
      if (options?.type) params.append('type', options.type)

      const response = await api.get(`/api/v1/notifications?${params.toString()}`)
      return response.data.data
    },
    staleTime: 1000 * 30 // 30 seconds
  })
}

// Get unread notification count
export function useUnreadNotificationCount(): UseQueryResult<{ unread: number }> {
  return useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: async () => {
      const response = await api.get('/api/v1/notifications?pageSize=1')
      return { unread: response.data.data.pagination.unread }
    },
    staleTime: 1000 * 60 // 1 minute
  })
}

// Get single notification
export function useNotification(
  notificationId: string | undefined
): UseQueryResult<NotificationData> {
  return useQuery({
    queryKey: notificationId ? notificationKeys.detail(notificationId) : [],
    queryFn: async () => {
      const response = await api.get(`/api/v1/notifications/${notificationId}`)
      return response.data.data
    },
    enabled: !!notificationId,
    staleTime: 1000 * 60
  })
}

// Mark notification as read
export function useMarkNotificationAsRead(): UseMutationResult<
  NotificationData,
  Error,
  string
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.patch(`/api/v1/notifications/${notificationId}/read`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
      queryClient.setQueryData(notificationKeys.detail(data.id), data)
    }
  })
}

// Mark all notifications as read
export function useMarkAllNotificationsAsRead(): UseMutationResult<
  { success: boolean; marked_as_read: number },
  Error,
  void
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await api.patch('/api/v1/notifications/read-all')
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all() })
    }
  })
}

// Delete notification
export function useDeleteNotification(): UseMutationResult<
  { success: boolean },
  Error,
  string
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.delete(`/api/v1/notifications/${notificationId}`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread() })
    }
  })
}
