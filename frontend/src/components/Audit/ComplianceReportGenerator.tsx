// frontend/src/components/Audit/ComplianceReportGenerator.tsx
// Component for generating compliance reports

import React, { useState } from 'react'
import { format, subDays } from 'date-fns'
import { useComplianceReport, ComplianceReport } from '../../hooks/useAudit'
import './ComplianceReportGenerator.css'

export function ComplianceReportGenerator() {
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  })

  const [isOpen, setIsOpen] = useState(false)
  const { data: report, isLoading, error } = useComplianceReport(dateRange)

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({
      ...prev,
      start: e.target.value,
    }))
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({
      ...prev,
      end: e.target.value,
    }))
  }

  const downloadReport = (format: 'json' | 'csv') => {
    if (!report) return

    if (format === 'json') {
      const dataStr = JSON.stringify(report, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
      const exportFileDefaultName = `compliance-report-${new Date().toISOString().split('T')[0]}.json`
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    } else if (format === 'csv') {
      // Simple CSV conversion
      const lines = [
        'Compliance Report',
        `Generated: ${new Date().toISOString()}`,
        `Period: ${dateRange.start} to ${dateRange.end}`,
        '',
        'Summary',
        `Total Actions,${report.summary.total_actions}`,
        `Total Users,${report.summary.total_users}`,
        `Total Errors,${report.summary.total_errors}`,
        `Error Rate,${(report.summary.error_rate * 100).toFixed(2)}%`,
        '',
        'By Action',
        ...Object.entries(report.by_action).map(([action, count]) => `${action},${count}`),
        '',
        'By Resource',
        ...Object.entries(report.by_resource).map(([resource, count]) => `${resource},${count}`),
      ]

      const csv = lines.join('\n')
      const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
      const exportFileDefaultName = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`
      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()
    }
  }

  if (error) {
    return (
      <div className="compliance-error">
        <p>Error generating report: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }

  return (
    <div className="compliance-report-generator">
      <div className="generator-header">
        <button
          className="toggle-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? '▼' : '▶'} Compliance Report Generator
        </button>
      </div>

      {isOpen && (
        <>
          <div className="date-selector">
            <div className="date-group">
              <label htmlFor="start-date-input">Start Date</label>
              <input
                id="start-date-input"
                type="date"
                value={dateRange.start}
                onChange={handleStartDateChange}
              />
            </div>

            <div className="date-group">
              <label htmlFor="end-date-input">End Date</label>
              <input
                id="end-date-input"
                type="date"
                value={dateRange.end}
                onChange={handleEndDateChange}
              />
            </div>

            <div className="quick-ranges">
              <button onClick={() => setDateRange({
                start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                end: format(new Date(), 'yyyy-MM-dd'),
              })}>
                Last 7 days
              </button>
              <button onClick={() => setDateRange({
                start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                end: format(new Date(), 'yyyy-MM-dd'),
              })}>
                Last 30 days
              </button>
              <button onClick={() => setDateRange({
                start: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
                end: format(new Date(), 'yyyy-MM-dd'),
              })}>
                Last 90 days
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="report-loading">Generating report...</div>
          ) : report ? (
            <>
              <div className="report-summary">
                <h3>Summary</h3>
                <div className="summary-grid">
                  <div className="summary-card">
                    <div className="summary-value">{report.summary.total_actions}</div>
                    <div className="summary-label">Total Actions</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-value">{report.summary.total_users}</div>
                    <div className="summary-label">Total Users</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-value">{report.summary.total_errors}</div>
                    <div className="summary-label">Total Errors</div>
                  </div>
                  <div className="summary-card">
                    <div className="summary-value">{(report.summary.error_rate * 100).toFixed(2)}%</div>
                    <div className="summary-label">Error Rate</div>
                  </div>
                </div>
              </div>

              <div className="report-section">
                <h4>Top Actions</h4>
                <ul className="action-list">
                  {Object.entries(report.by_action)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([action, count]) => (
                      <li key={action}>
                        <span className="action-name">{action}</span>
                        <span className="action-count">{count}</span>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="report-section">
                <h4>Top Modified Resources</h4>
                <ul className="resource-list">
                  {report.access_patterns.most_modified_resources
                    .slice(0, 5)
                    .map((resource) => (
                      <li key={resource.resource_id}>
                        <span className="resource-id">{resource.resource_id}</span>
                        <span className="modification-count">{resource.modification_count} changes</span>
                      </li>
                    ))}
                </ul>
              </div>

              <div className="report-section">
                <h4>Risk Indicators</h4>
                <ul className="risk-list">
                  <li>
                    <span className="risk-label">Failed Attempts:</span>
                    <span className="risk-value">{report.risk_indicators.failed_attempts}</span>
                  </li>
                  <li>
                    <span className="risk-label">Bulk Operations:</span>
                    <span className="risk-value">{report.risk_indicators.bulk_operations}</span>
                  </li>
                  {report.risk_indicators.unusual_activity.length > 0 && (
                    <li className="warning">
                      <span className="risk-label">Unusual Activity:</span>
                      <div className="unusual-activity">
                        {report.risk_indicators.unusual_activity.map((activity, idx) => (
                          <div key={idx}>{activity}</div>
                        ))}
                      </div>
                    </li>
                  )}
                </ul>
              </div>

              <div className="report-actions">
                <button
                  className="export-button export-json"
                  onClick={() => downloadReport('json')}
                >
                  Export as JSON
                </button>
                <button
                  className="export-button export-csv"
                  onClick={() => downloadReport('csv')}
                >
                  Export as CSV
                </button>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}

export default ComplianceReportGenerator
