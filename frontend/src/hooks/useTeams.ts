// frontend/src/hooks/useTeams.ts
// React Query hooks for teams

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query'
import api from '../services/api'

export interface TeamData {
  id: string
  company_id: string
  project_id: string
  name: string
  description?: string
  lead_id: string
  created_at: string
  updated_at: string
  archived_at?: string
  lead?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
  member_count?: number
  project?: {
    id: string
    name: string
  }
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  joined_at: string
  user?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
}

export interface CreateTeamInput {
  project_id: string
  name: string
  description?: string
  lead_id: string
}

export interface UpdateTeamInput extends Partial<CreateTeamInput> {}

export interface ListTeamsOptions {
  page?: number
  pageSize?: number
  project_id?: string
  search?: string
}

export interface TeamListResponse {
  data: TeamData[]
  pagination: {
    page: number
    pageSize: number
    total: number
    pages: number
  }
}

export interface TeamMembersResponse {
  data: TeamMember[]
  pagination: {
    page: number
    pageSize: number
    total: number
    pages: number
  }
}

// Query key factory
const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  list: (options: ListTeamsOptions) => [...teamKeys.lists(), options] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
  members: () => [...teamKeys.all, 'members'] as const,
  membersList: (teamId: string, page?: number) =>
    [...teamKeys.members(), teamId, page] as const
}

// Get list of teams
export function useTeams(
  options?: ListTeamsOptions
): UseQueryResult<TeamListResponse> {
  return useQuery({
    queryKey: teamKeys.list(options || {}),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (options?.page) params.append('page', String(options.page))
      if (options?.pageSize) params.append('pageSize', String(options.pageSize))
      if (options?.project_id) params.append('project_id', options.project_id)
      if (options?.search) params.append('search', options.search)

      const response = await api.get(`/api/v1/teams?${params.toString()}`)
      return response.data.data
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

// Get single team
export function useTeam(
  teamId: string | undefined
): UseQueryResult<TeamData> {
  return useQuery({
    queryKey: teamId ? teamKeys.detail(teamId) : [],
    queryFn: async () => {
      const response = await api.get(`/api/v1/teams/${teamId}`)
      return response.data.data
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5
  })
}

// Get team members
export function useTeamMembers(
  teamId: string,
  page: number = 1
): UseQueryResult<TeamMembersResponse> {
  return useQuery({
    queryKey: teamKeys.membersList(teamId, page),
    queryFn: async () => {
      const response = await api.get(
        `/api/v1/teams/${teamId}/members?page=${page}`
      )
      return response.data.data
    },
    staleTime: 1000 * 60 * 5
  })
}

// Create team
export function useCreateTeam(): UseMutationResult<
  TeamData,
  Error,
  CreateTeamInput
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTeamInput) => {
      const response = await api.post('/api/v1/teams', data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() })
      // Also invalidate project's team list
      if (data.project_id) {
        queryClient.invalidateQueries({
          queryKey: teamKeys.list({ project_id: data.project_id })
        })
      }
    }
  })
}

// Update team
export function useUpdateTeam(
  teamId: string
): UseMutationResult<TeamData, Error, UpdateTeamInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateTeamInput) => {
      const response = await api.put(`/api/v1/teams/${teamId}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) })
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() })
    }
  })
}

// Archive/Delete team
export function useArchiveTeam(): UseMutationResult<
  { success: boolean },
  Error,
  string
> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (teamId: string) => {
      const response = await api.delete(`/api/v1/teams/${teamId}`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() })
    }
  })
}

// Add team member
export function useAddTeamMember(
  teamId: string
): UseMutationResult<TeamMember, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post(`/api/v1/teams/${teamId}/members`, {
        user_id: userId
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.membersList(teamId)
      })
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) })
    }
  })
}

// Remove team member
export function useRemoveTeamMember(
  teamId: string
): UseMutationResult<{ success: boolean }, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(
        `/api/v1/teams/${teamId}/members/${userId}`
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: teamKeys.membersList(teamId)
      })
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) })
    }
  })
}
