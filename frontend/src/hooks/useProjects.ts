// frontend/src/hooks/useProjects.ts
// React Query hooks for projects

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query'
import api from '../services/api'

export interface ProjectData {
  id: string
  company_id: string
  name: string
  description?: string
  pm_id: string
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
  archived_at?: string
  pm?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
  team_count?: number
  action_item_count?: number
}

export interface CreateProjectInput {
  name: string
  description?: string
  pm_id: string
  start_date: string
  end_date: string
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {}

export interface ListProjectsOptions {
  page?: number
  pageSize?: number
  search?: string
  pm_id?: string
}

export interface ProjectListResponse {
  data: ProjectData[]
  pagination: {
    page: number
    pageSize: number
    total: number
    pages: number
  }
}

// Query key factory
const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (options: ListProjectsOptions) => [...projectKeys.lists(), options] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const
}

// Get list of projects
export function useProjects(
  options?: ListProjectsOptions
): UseQueryResult<ProjectListResponse> {
  return useQuery({
    queryKey: projectKeys.list(options || {}),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options?.page) params.append('page', String(options.page))
      if (options?.pageSize) params.append('pageSize', String(options.pageSize))
      if (options?.search) params.append('search', options.search)
      if (options?.pm_id) params.append('pm_id', options.pm_id)

      const response = await api.get(`/api/v1/projects?${params.toString()}`)
      return response.data.data
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

// Get single project
export function useProject(
  projectId: string | undefined
): UseQueryResult<ProjectData> {
  return useQuery({
    queryKey: projectId ? projectKeys.detail(projectId) : [],
    queryFn: async () => {
      const response = await api.get(`/api/v1/projects/${projectId}`)
      return response.data.data
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5
  })
}

// Create project
export function useCreateProject(): UseMutationResult<
  ProjectData,
  Error,
  CreateProjectInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const response = await api.post('/api/v1/projects', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    }
  })
}

// Update project
export function useUpdateProject(
  projectId: string
): UseMutationResult<ProjectData, Error, UpdateProjectInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateProjectInput) => {
      const response = await api.put(`/api/v1/projects/${projectId}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    }
  })
}

// Archive/Delete project
export function useArchiveProject(): UseMutationResult<
  { success: boolean },
  Error,
  string
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await api.delete(`/api/v1/projects/${projectId}`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    }
  })
}
