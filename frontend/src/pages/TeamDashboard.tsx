// frontend/src/pages/TeamDashboard.tsx
// Team dashboard page showing team metrics and member breakdown

import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { format, subDays } from 'date-fns'
import { useTeamDashboard } from '../hooks/useDashboard'
import MetricCard from '../components/Dashboard/MetricCard'
import BarChart from '../components/Dashboard/BarChart'
import PieChart from '../components/Dashboard/PieChart'
import DateRangeFilter from '../components/Dashboard/DateRangeFilter'
import './TeamDashboard.css'

export function TeamDashboard() {
  const { teamId } = useParams<{ teamId: string }>()
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  })

  const { data: dashboard, isLoading, error } = useTeamDashboard(teamId)

  if (error) {
    return (
      <div className="team-dashboard error">
        <p>Error loading dashboard: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="team-dashboard loading">
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className="team-dashboard empty">
        <p>Dashboard not available</p>
      </div>
    )
  }

  const completionRate = (dashboard.completion_rate * 100).toFixed(1)
  const statusData = [
    { label: 'Pending', value: dashboard.items_by_status.pending, color: '#FFC107' },
    { label: 'In Progress', value: dashboard.items_by_status.in_progress, color: '#2196F3' },
    { label: 'Completed', value: dashboard.items_by_status.completed, color: '#4CAF50' },
  ]

  const memberData = dashboard.members.map((member) => ({
    label: member.name,
    value: member.item_count,
  }))

  const velocityData = dashboard.team_velocity
    .reverse()
    .slice(0, 8)
    .map((week) => ({
      label: new Date(week.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: week.completed_items,
    }))

  return (
    <div className="team-dashboard">
      <div className="page-header">
        <h1>{dashboard.team_name} Dashboard</h1>
        <p>Team metrics and performance overview</p>
      </div>

      <DateRangeFilter
        startDate={dateRange.start}
        endDate={dateRange.end}
        onStartDateChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
        onEndDateChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
      />

      <div className="metrics-grid">
        <MetricCard
          title="Total Items"
          value={dashboard.total_items}
          color="blue"
          icon="📊"
        />
        <MetricCard
          title="Completion Rate"
          value={completionRate}
          unit="%"
          color="green"
          icon="✓"
        />
        <MetricCard
          title="Active Members"
          value={dashboard.active_members}
          color="orange"
          icon="👥"
        />
        <MetricCard
          title="Overdue Items"
          value={dashboard.overdue_items}
          color="red"
          icon="⚠️"
        />
        <MetricCard
          title="At Risk Items"
          value={dashboard.at_risk_items}
          color="red"
          icon="🚨"
        />
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <PieChart
            title="Items by Status"
            data={statusData}
            showPercentage
          />
        </div>

        <div className="chart-card">
          <BarChart
            title="Items per Member"
            data={memberData}
            orientation="horizontal"
          />
        </div>
      </div>

      {velocityData.length > 0 && (
        <div className="chart-card">
          <BarChart
            title="Team Velocity (Items Completed per Week)"
            data={velocityData}
            orientation="vertical"
          />
        </div>
      )}

      <div className="members-table">
        <h3>Team Members</h3>
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Assigned Items</th>
              <th>Completed</th>
              <th>Completion Rate</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.members.map((member) => (
              <tr key={member.member_id}>
                <td>{member.name}</td>
                <td>{member.item_count}</td>
                <td>{member.completed_count}</td>
                <td>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(member.completion_rate * 100).toFixed(1)}%`,
                      }}
                    />
                  </div>
                  {(member.completion_rate * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TeamDashboard
