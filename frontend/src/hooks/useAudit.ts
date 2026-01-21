// frontend/src/hooks/useAudit.ts
// React Query hooks for audit and compliance

import {
  useQuery,
  UseQueryResult,
} from '@tanstack/react-query'
import api from '../services/api'

export interface AuditLog {
  id: string
  company_id: string
  user_id: string
  action: 'create' | 'update' | 'delete' | 'read'
  resource_type: string
  resource_id?: string
  resource_name?: string
  changes?: Record<string, any>
  ip_address?: string
  user_agent?: string
  status: 'success' | 'error'
  error_message?: string
  created_at: string
  metadata?: Record<string, any>
}

export interface AuditFilter {
  action?: string
  resource_type?: string
  user_id?: string
  start_date?: string
  end_date?: string
  page?: number
  pageSize?: number
}

export interface AuditLogsResponse {
  data: AuditLog[]
  pagination: {
    page: number
    pageSize: number
    total: number
    pages: number
  }
}

export interface ActivitySummary {
  total_actions: number
  by_action: Record<string, number>
  by_resource: Record<string, number>
  by_user: Record<string, number>
  errors: number
  date_range: { start: string; end: string }
}

export interface ChangeHistoryEntry {
  id: string
  company_id: string
  resource_type: string
  resource_id: string
  resource_name?: string
  change_type: 'create' | 'update' | 'delete'
  changed_by: string
  changed_at: string
  previous_values?: Record<string, any>
  current_values?: Record<string, any>
  fields_changed?: string[]
  description?: string
}

export interface ComplianceReport {
  report_id: string
  company_id: string
  generated_at: string
  period: { start: string; end: string }
  summary: {
    total_actions: number
    total_users: number
    total_errors: number
    error_rate: number
  }
  by_action: Record<string, number>
  by_resource: Record<string, number>
  by_user: Record<string, { actions: number; last_activity: string }>
  access_patterns: {
    most_active_users: Array<{ user_id: string; action_count: number }>
    most_modified_resources: Array<{ resource_id: string; modification_count: number }>
  }
  data_changes: {
    creates: number
    updates: number
    deletes: number
  }
  risk_indicators: {
    failed_attempts: number
    bulk_operations: number
    unusual_activity: string[]
  }
}

const auditKeys = {
  all: ['audit'] as const,
  logs: () => [...auditKeys.all, 'logs'] as const,
  log: (id: string) => [...auditKeys.logs(), id] as const,
  activity: () => [...auditKeys.all, 'activity'] as const,
  changeHistory: (resourceId: string) => [...auditKeys.all, 'changes', resourceId] as const,
  timeline: (resourceId: string) => [...auditKeys.all, 'timeline', resourceId] as const,
  compliance: () => [...auditKeys.all, 'compliance'] as const,
}

// Get audit logs with filtering
export function useAuditLogs(
  filters?: AuditFilter
): UseQueryResult<AuditLogsResponse> {
  return useQuery({
    queryKey: auditKeys.logs(),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.action) params.append('action', filters.action)
      if (filters?.resource_type) params.append('resource_type', filters.resource_type)
      if (filters?.user_id) params.append('user_id', filters.user_id)
      if (filters?.start_date) params.append('start_date', filters.start_date)
      if (filters?.end_date) params.append('end_date', filters.end_date)
      if (filters?.page) params.append('page', String(filters.page))
      if (filters?.pageSize) params.append('pageSize', String(filters.pageSize))

      const response = await api.get(`/api/v1/audit/logs?${params.toString()}`)
      return response.data.data
    },
    staleTime: 1000 * 60 // 1 minute
  })
}

// Get single audit log
export function useAuditLog(
  logId: string | undefined
): UseQueryResult<AuditLog> {
  return useQuery({
    queryKey: logId ? auditKeys.log(logId) : [],
    queryFn: async () => {
      const response = await api.get(`/api/v1/audit/logs/${logId}`)
      return response.data.data
    },
    enabled: !!logId
  })
}

// Get activity summary
export function useActivitySummary(
  dateRange: { start: string; end: string }
): UseQueryResult<ActivitySummary> {
  return useQuery({
    queryKey: [auditKeys.activity(), dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('start_date', dateRange.start)
      params.append('end_date', dateRange.end)

      const response = await api.get(`/api/v1/audit/activity-summary?${params.toString()}`)
      return response.data.data
    }
  })
}

// Get change history for resource
export function useChangeHistory(
  resourceId: string | undefined,
  resourceType?: string
): UseQueryResult<ChangeHistoryEntry[]> {
  return useQuery({
    queryKey: resourceId ? auditKeys.changeHistory(resourceId) : [],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (resourceType) params.append('resource_type', resourceType)

      const response = await api.get(`/api/v1/audit/change-history/${resourceId}?${params.toString()}`)
      return response.data.data
    },
    enabled: !!resourceId
  })
}

// Get resource timeline
export function useResourceTimeline(
  resourceId: string | undefined,
  resourceType?: string
): UseQueryResult<any[]> {
  return useQuery({
    queryKey: resourceId ? auditKeys.timeline(resourceId) : [],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (resourceType) params.append('resource_type', resourceType)

      const response = await api.get(`/api/v1/audit/change-history/${resourceId}/timeline?${params.toString()}`)
      return response.data.data
    },
    enabled: !!resourceId
  })
}

// Generate compliance report
export function useComplianceReport(
  dateRange: { start: string; end: string }
): UseQueryResult<ComplianceReport> {
  return useQuery({
    queryKey: [auditKeys.compliance(), 'report', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('start_date', dateRange.start)
      params.append('end_date', dateRange.end)

      const response = await api.get(`/api/v1/audit/compliance/report?${params.toString()}`)
      return response.data.data
    }
  })
}

// Generate user activity report
export function useUserActivityReport(
  userId: string | undefined,
  dateRange?: { start: string; end: string }
): UseQueryResult<any> {
  return useQuery({
    queryKey: userId && dateRange ? ['userActivity', userId, dateRange] : [],
    queryFn: async () => {
      if (!dateRange) throw new Error('dateRange required')

      const params = new URLSearchParams()
      params.append('start_date', dateRange.start)
      params.append('end_date', dateRange.end)

      const response = await api.get(
        `/api/v1/audit/compliance/user-activity/${userId}?${params.toString()}`
      )
      return response.data.data
    },
    enabled: !!userId && !!dateRange
  })
}

// Generate access report
export function useAccessReport(
  dateRange: { start: string; end: string }
): UseQueryResult<any> {
  return useQuery({
    queryKey: [auditKeys.compliance(), 'access', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('start_date', dateRange.start)
      params.append('end_date', dateRange.end)

      const response = await api.get(`/api/v1/audit/compliance/access-report?${params.toString()}`)
      return response.data.data
    }
  })
}
