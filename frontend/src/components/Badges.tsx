// frontend/src/components/Badges.tsx
// Badge components for displaying status and priority

import React from 'react'
import '../styles/Badges.css'

interface StatusBadgeProps {
  status: 'open' | 'in_progress' | 'completed' | 'closed' | 'on_hold' | 'overdue'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const labels: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    completed: 'Completed',
    closed: 'Closed',
    on_hold: 'On Hold',
    overdue: 'Overdue'
  }

  return (
    <span className={`badge badge-status badge-${status}`}>
      {labels[status]}
    </span>
  )
}

interface PriorityBadgeProps {
  priority: 'high' | 'medium' | 'low'
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const labels: Record<string, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  }

  return (
    <span className={`badge badge-priority badge-${priority}`}>
      {labels[priority]}
    </span>
  )
}
