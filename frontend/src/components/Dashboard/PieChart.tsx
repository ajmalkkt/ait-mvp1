// frontend/src/components/Dashboard/PieChart.tsx
// Simple pie chart for distribution visualization

import React, { useMemo } from 'react'
import './PieChart.css'

interface PieChartDataPoint {
  label: string
  value: number
  color?: string
}

interface PieChartProps {
  title?: string
  data: PieChartDataPoint[]
  size?: 'small' | 'medium' | 'large'
  showLegend?: boolean
  showPercentage?: boolean
}

export function PieChart({
  title,
  data,
  size = 'medium',
  showLegend = true,
  showPercentage = true,
}: PieChartProps) {
  const defaultColors = [
    '#4CAF50', // green - completed
    '#FFC107', // amber - pending
    '#2196F3', // blue - in progress
    '#FF9800', // orange
    '#9C27B0', // purple
    '#F44336', // red
  ]

  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length],
  }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  const slices = useMemo(() => {
    let currentAngle = 0
    return chartData.map((item, index) => {
      const percentage = total > 0 ? item.value / total : 0
      const sliceAngle = percentage * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + sliceAngle

      const startRadians = (startAngle - 90) * (Math.PI / 180)
      const endRadians = (endAngle - 90) * (Math.PI / 180)

      const x1 = 50 + 45 * Math.cos(startRadians)
      const y1 = 50 + 45 * Math.sin(startRadians)
      const x2 = 50 + 45 * Math.cos(endRadians)
      const y2 = 50 + 45 * Math.sin(endRadians)

      const largeArc = sliceAngle > 180 ? 1 : 0

      const pathData = [
        `M 50 50`,
        `L ${x1} ${y1}`,
        `A 45 45 0 ${largeArc} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ')

      currentAngle = endAngle

      return {
        path: pathData,
        color: item.color,
        label: item.label,
        value: item.value,
        percentage,
      }
    })
  }, [chartData, total])

  const sizeMap = {
    small: 200,
    medium: 280,
    large: 350,
  }

  return (
    <div className={`pie-chart pie-${size}`}>
      {title && <div className="chart-title">{title}</div>}

      <div className="chart-container">
        <svg viewBox="0 0 100 100" className="pie-svg">
          {slices.map((slice, index) => (
            <path
              key={index}
              d={slice.path}
              fill={slice.color}
              className="pie-slice"
            />
          ))}
        </svg>
      </div>

      {showLegend && (
        <div className="chart-legend">
          {slices.map((slice, index) => (
            <div key={index} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: slice.color }}
              />
              <span className="legend-label">{slice.label}</span>
              <span className="legend-value">
                {slice.value}
                {showPercentage && ` (${(slice.percentage * 100).toFixed(1)}%)`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PieChart
