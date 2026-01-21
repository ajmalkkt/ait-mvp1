// frontend/src/pages/CompliancePage.tsx
// Page for compliance reporting and analytics

import React from 'react'
import { format, subDays } from 'date-fns'
import ComplianceReportGenerator from '../components/Audit/ComplianceReportGenerator'
import { useActivitySummary } from '../hooks/useAudit'
import './CompliancePage.css'

export function CompliancePage() {
  const dateRange = {
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  }

  const { data: summary, isLoading } = useActivitySummary(dateRange)

  return (
    <div className="compliance-page">
      <div className="page-header">
        <h1>Compliance & Reports</h1>
        <p>Generate and view compliance reports and analytics</p>
      </div>

      <div className="page-content">
        {!isLoading && summary && (
          <div className="quick-stats">
            <div className="stat-card">
              <div className="stat-number">{summary.total_actions}</div>
              <div className="stat-label">Total Actions (30 days)</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {Object.keys(summary.by_user).length}
              </div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{summary.errors}</div>
              <div className="stat-label">Error Events</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                {(summary.total_actions > 0
                  ? ((summary.errors / summary.total_actions) * 100).toFixed(2)
                  : 0)}%
              </div>
              <div className="stat-label">Error Rate</div>
            </div>
          </div>
        )}

        <ComplianceReportGenerator />
      </div>
    </div>
  )
}

export default CompliancePage
