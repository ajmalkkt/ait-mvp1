// frontend/src/components/Audit/AuditLogViewer.tsx
// Component for displaying and filtering audit logs

import React, { useState } from 'react'
import { format } from 'date-fns'
import { useAuditLogs, AuditFilter } from '../../hooks/useAudit'
import './AuditLogViewer.css'

export function AuditLogViewer() {
  const [filters, setFilters] = useState<AuditFilter>({
    page: 1,
    pageSize: 25,
  })

  const { data, isLoading, error } = useAuditLogs(filters)

  const handleActionFilter = (action: string) => {
    setFilters(prev => ({
      ...prev,
      action: action || undefined,
      page: 1,
    }))
  }

  const handleResourceTypeFilter = (resourceType: string) => {
    setFilters(prev => ({
      ...prev,
      resource_type: resourceType || undefined,
      page: 1,
    }))
  }

  const handleDateRangeFilter = (startDate: string, endDate: string) => {
    setFilters(prev => ({
      ...prev,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      page: 1,
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }))
  }

  if (error) {
    return (
      <div className="audit-viewer-error">
        <p>Error loading audit logs: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }

  return (
    <div className="audit-log-viewer">
      <div className="audit-filters">
        <div className="filter-group">
          <label htmlFor="action-filter">Action</label>
          <select
            id="action-filter"
            value={filters.action || ''}
            onChange={(e) => handleActionFilter(e.target.value)}
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="read">Read</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="resource-filter">Resource Type</label>
          <select
            id="resource-filter"
            value={filters.resource_type || ''}
            onChange={(e) => handleResourceTypeFilter(e.target.value)}
          >
            <option value="">All Resources</option>
            <option value="action_item">Action Item</option>
            <option value="project">Project</option>
            <option value="team">Team</option>
            <option value="user">User</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="start-date">Start Date</label>
          <input
            id="start-date"
            type="date"
            value={filters.start_date || ''}
            onChange={(e) => handleDateRangeFilter(e.target.value, filters.end_date || '')}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="end-date">End Date</label>
          <input
            id="end-date"
            type="date"
            value={filters.end_date || ''}
            onChange={(e) => handleDateRangeFilter(filters.start_date || '', e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="audit-loading">Loading audit logs...</div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className="audit-logs-table">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((log) => (
                  <tr key={log.id} className={`status-${log.status}`}>
                    <td>{format(new Date(log.created_at), 'PPpp')}</td>
                    <td>{log.user_id}</td>
                    <td>
                      <span className={`action-badge action-${log.action}`}>
                        {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="resource-info">
                        <div className="resource-type">{log.resource_type}</div>
                        {log.resource_name && (
                          <div className="resource-name">{log.resource_name}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge status-${log.status}`}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {log.error_message && (
                        <span className="error-message" title={log.error_message}>
                          {log.error_message.substring(0, 50)}...
                        </span>
                      )}
                      {log.ip_address && (
                        <span className="ip-address" title={log.ip_address}>
                          {log.ip_address}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="audit-pagination">
            <button
              onClick={() => handlePageChange(data.pagination.page - 1)}
              disabled={data.pagination.page === 1}
            >
              Previous
            </button>
            <span>
              Page {data.pagination.page} of {data.pagination.pages}
            </span>
            <button
              onClick={() => handlePageChange(data.pagination.page + 1)}
              disabled={data.pagination.page === data.pagination.pages}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="audit-empty">No audit logs found</div>
      )}
    </div>
  )
}

export default AuditLogViewer
