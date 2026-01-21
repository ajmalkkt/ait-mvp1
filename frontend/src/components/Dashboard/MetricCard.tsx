// frontend/src/components/Dashboard/MetricCard.tsx
// Card component for displaying KPI metrics

import React from 'react'
import './MetricCard.css'

interface MetricCardProps {
  title: string
  value: number | string
  unit?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendPercent?: number
  color?: 'blue' | 'green' | 'orange' | 'red'
  subtitle?: string
}

export function MetricCard({
  title,
  value,
  unit,
  icon,
  trend,
  trendPercent,
  color = 'blue',
  subtitle,
}: MetricCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M'
      if (val >= 1000) return (val / 1000).toFixed(1) + 'K'
      return val.toFixed(1)
    }
    return val
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↑'
      case 'down':
        return '↓'
      default:
        return '→'
    }
  }

  return (
    <div className={`metric-card metric-${color}`}>
      {icon && <div className="metric-icon">{icon}</div>}

      <div className="metric-content">
        <div className="metric-label">{title}</div>
        <div className="metric-value">{formatValue(value)}</div>

        {unit && <div className="metric-unit">{unit}</div>}

        {subtitle && <div className="metric-subtitle">{subtitle}</div>}
      </div>

      {trend && trendPercent !== undefined && (
        <div className={`metric-trend trend-${trend}`}>
          <span className="trend-icon">{getTrendIcon()}</span>
          <span className="trend-percent">{trendPercent.toFixed(1)}%</span>
        </div>
      )}
    </div>
  )
}

export default MetricCard
