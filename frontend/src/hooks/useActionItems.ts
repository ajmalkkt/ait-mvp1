// frontend/src/hooks/useActionItems.ts
// React hooks for action item API operations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../services/api.js'

export interface ActionItem {
  id: string
  company_id: string
  project_id: string
  team_id?: string
  meeting_id?: string
  title: string
  description?: string
  owner_id: string
  priority: 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'completed' | 'closed' | 'on_hold' | 'overdue'
  due_date: string
  completed_date?: string
  version: number
  created_at: string
  updated_at: string
  archived_at?: string
}

export interface ListOptions {
  page?: number
  pageSize?: number
  status?: string
  owner_id?: string
  priority?: string
  project_id?: string
  team_id?: string
  due_date_from?: string
  due_date_to?: string
}

const QUERY_KEY = ['action-items']

/**
 * Hook to list action items with filters and pagination
 */
export function useActionItems(options: ListOptions = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, options],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options.page) params.append('page', String(options.page))
      if (options.pageSize) params.append('pageSize', String(options.pageSize))
      if (options.status) params.append('status', options.status)
      if (options.owner_id) params.append('owner_id', options.owner_id)
      if (options.priority) params.append('priority', options.priority)
      if (options.project_id) params.append('project_id', options.project_id)
      if (options.team_id) params.append('team_id', options.team_id)
      if (options.due_date_from) params.append('due_date_from', options.due_date_from)
      if (options.due_date_to) params.append('due_date_to', options.due_date_to)

      const response = await apiClient.get(`/action-items?${params.toString()}`)
      return response.data
    }
  })
}

/**
 * Hook to get a single action item
 */
export function useActionItem(itemId: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, itemId],
    queryFn: async () => {
      if (!itemId) throw new Error('Item ID is required')
      const response = await apiClient.get(`/action-items/${itemId}`)
      return response.data.data
    },
    enabled: !!itemId
  })
}

/**
 * Hook to get action item change history
 */
export function useActionItemHistory(itemId: string | undefined, page = 1) {
  return useQuery({
    queryKey: [QUERY_KEY, itemId, 'history', page],
    queryFn: async () => {
      if (!itemId) throw new Error('Item ID is required')
      const response = await apiClient.get(`/action-items/${itemId}/history?page=${page}`)
      return response.data
    },
    enabled: !!itemId
  })
}

/**
 * Hook to create a new action item
 */
export function useCreateActionItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<ActionItem, 'id' | 'company_id' | 'status' | 'version' | 'created_at' | 'updated_at' | 'archived_at'>) => {
      const response = await apiClient.post('/action-items', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })
}

/**
 * Hook to update action item details
 */
export function useUpdateActionItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, version, ...data }: { id: string; version: number } & Partial<ActionItem>) => {
      const response = await apiClient.put(`/action-items/${id}`, { ...data, version })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.id] })
      }
    }
  })
}

/**
 * Hook to change action item status
 */
export function useChangeActionItemStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status, version }: { id: string; status: string; version: number }) => {
      const response = await apiClient.patch(`/action-items/${id}/status`, { status, version })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, data.id] })
      }
    }
  })
}

/**
 * Hook to archive an action item
 */
export function useArchiveActionItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/action-items/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    }
  })
}
