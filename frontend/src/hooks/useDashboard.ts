// frontend/src/hooks/useDashboard.ts
// React Query hooks for dashboard operations

import {
  useQuery,
  UseQueryResult,
  useMutation,
  UseMutationResult,
} from '@tanstack/react-query'
import api from '../services/api'

// Types matching backend
export interface MyItemsDashboard {
  total_items: number
  items_by_status: {
    pending: number
    in_progress: number
    completed: number
  }
  overdue_items: number
  due_today: number
  completion_rate: number
  recent_items: Array<{
    id: string
    title: string
    status: string
    due_date: string | null
    priority: string
  }>
}

export interface TeamMember {
  member_id: string
  name: string
  item_count: number
  completed_count: number
  completion_rate: number
}

export interface TeamDashboard {
  team_id: string
  team_name: string
  total_items: number
  completion_rate: number
  items_by_status: {
    pending: number
    in_progress: number
    completed: number
  }
  active_members: number
  members: TeamMember[]
  team_velocity: Array<{
    week_start: string
    completed_items: number
  }>
  overdue_items: number
  at_risk_items: number
}

export interface ProjectDashboard {
  project_id: string
  project_name: string
  total_items: number
  completion_rate: number
  items_by_status: {
    pending: number
    in_progress: number
    completed: number
  }
  items_by_priority: {
    critical: number
    high: number
    medium: number
    low: number
  }
  due_this_week: number
  due_this_month: number
  overdue_items: number
  at_risk_items: number
  timeline: Array<{
    date: string
    due_count: number
  }>
}

const dashboardKeys = {
  all: ['dashboards'] as const,
  myItems: () => [...dashboardKeys.all, 'myItems'] as const,
  team: (teamId: string) => [...dashboardKeys.all, 'team', teamId] as const,
  project: (projectId: string) => [...dashboardKeys.all, 'project', projectId] as const,
}

/**
 * Get user's personal dashboard with assigned items overview
 */
export function useMyItemsDashboard(): UseQueryResult<MyItemsDashboard> {
  return useQuery({
    queryKey: dashboardKeys.myItems(),
    queryFn: async () => {
      const response = await api.get('/api/v1/dashboards/my-items')
      return response.data.data
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

/**
 * Get team dashboard with metrics and member breakdown
 */
export function useTeamDashboard(
  teamId: string | undefined
): UseQueryResult<TeamDashboard> {
  return useQuery({
    queryKey: teamId ? dashboardKeys.team(teamId) : [],
    queryFn: async () => {
      const response = await api.get(`/api/v1/dashboards/team/${teamId}`)
      return response.data.data
    },
    enabled: !!teamId,
    staleTime: 1000 * 60, // 1 minute
  })
}

/**
 * Get project dashboard with status and timeline
 */
export function useProjectDashboard(
  projectId: string | undefined
): UseQueryResult<ProjectDashboard> {
  return useQuery({
    queryKey: projectId ? dashboardKeys.project(projectId) : [],
    queryFn: async () => {
      const response = await api.get(`/api/v1/dashboards/project/${projectId}`)
      return response.data.data
    },
    enabled: !!projectId,
    staleTime: 1000 * 60, // 1 minute
  })
}

// Report types
export interface CompletionReport {
  report_id: string
  company_id: string
  report_type: 'completion'
  generated_at: string
  period: { start: string; end: string }
  summary: {
    total_items: number
    completed_items: number
    closed_items: number
    completion_rate: number
    average_days_to_completion: number
  }
  by_status: Array<{
    status: string
    count: number
    percentage: number
  }>
  by_team: Array<{
    team_id: string
    team_name: string
    total: number
    completed: number
    completion_rate: number
  }>
  by_priority: Array<{
    priority: string
    total: number
    completed: number
  }>
}

export interface ProductivityReport {
  report_id: string
  company_id: string
  report_type: 'productivity'
  generated_at: string
  period: { start: string; end: string }
  summary: {
    total_items_created: number
    total_items_completed: number
    average_turnaround_time_days: number
  }
  members: Array<{
    member_id: string
    member_name: string
    items_created: number
    items_completed: number
    completion_rate: number
    average_days_to_completion: number
  }>
  top_performers: Array<{
    member_id: string
    member_name: string
    items_completed: number
    rank: number
  }>
}

export interface OverdueReport {
  report_id: string
  company_id: string
  report_type: 'overdue'
  generated_at: string
  period: { start: string; end: string }
  summary: {
    total_overdue: number
    critical_overdue: number
    high_overdue: number
    oldest_overdue_days: number
  }
  by_owner: Array<{
    owner_id: string
    owner_name: string
    overdue_count: number
    oldest_due_days: number
  }>
  by_priority: Array<{
    priority: string
    overdue_count: number
  }>
  by_team: Array<{
    team_id: string
    team_name: string
    overdue_count: number
  }>
  items: Array<{
    id: string
    title: string
    due_date: string
    days_overdue: number
    priority: string
    owner_name: string
  }>
}

const reportKeys = {
  all: ['reports'] as const,
  completion: (filters?: any) => [...reportKeys.all, 'completion', filters] as const,
  productivity: (filters?: any) => [...reportKeys.all, 'productivity', filters] as const,
  overdue: (filters?: any) => [...reportKeys.all, 'overdue', filters] as const,
}

/**
 * Generate completion report
 */
export function useCompletionReport(
  filters?: { start_date?: string; end_date?: string }
): UseQueryResult<CompletionReport> {
  return useQuery({
    queryKey: reportKeys.completion(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)

      const response = await api.get(`/api/v1/reports/completion?${params.toString()}`)
      return response.data.data
    },
  })
}

/**
 * Generate productivity report
 */
export function useProductivityReport(
  filters?: {
    start_date?: string
    end_date?: string
    team_id?: string
  }
): UseQueryResult<ProductivityReport> {
  return useQuery({
    queryKey: reportKeys.productivity(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.team_id) params.append('team_id', filters.team_id)

      const response = await api.get(`/api/v1/reports/productivity?${params.toString()}`)
      return response.data.data
    },
  })
}

/**
 * Generate overdue report
 */
export function useOverdueReport(
  filters?: { start_date?: string; end_date?: string }
): UseQueryResult<OverdueReport> {
  return useQuery({
    queryKey: reportKeys.overdue(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)

      const response = await api.get(`/api/v1/reports/overdue?${params.toString()}`)
      return response.data.data
    },
  })
}

/**
 * Export report to Excel or PDF
 */
export function useExportReport(): UseMutationResult<
  { filename: string; download_url: string },
  Error,
  {
    report_type: 'completion' | 'productivity' | 'overdue'
    format: 'excel' | 'pdf'
    filters?: any
  }
> {
  return useMutation({
    mutationFn: async (options) => {
      const response = await api.post('/api/v1/reports/export', {
        report_type: options.report_type,
        format: options.format,
        filters: options.filters,
      })
      return response.data.data
    },
  })
}
