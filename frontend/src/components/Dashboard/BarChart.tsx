// frontend/src/components/Dashboard/BarChart.tsx
// Simple bar chart for comparative data visualization

import React, { useMemo } from 'react'
import './BarChart.css'

interface BarChartDataPoint {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  title?: string
  data: BarChartDataPoint[]
  orientation?: 'vertical' | 'horizontal'
  showValue?: boolean
  maxValue?: number
}

export function BarChart({
  title,
  data,
  orientation = 'vertical',
  showValue = true,
  maxValue: customMaxValue,
}: BarChartProps) {
  const defaultColor = '#2196F3'

  const chartData = data.map((item) => ({
    ...item,
    color: item.color || defaultColor,
  }))

  const maxValue = customMaxValue || Math.max(...chartData.map((item) => item.value), 1)

  const bars = useMemo(() => {
    return chartData.map((item) => ({
      ...item,
      percentage: (item.value / maxValue) * 100,
    }))
  }, [chartData, maxValue])

  const isVertical = orientation === 'vertical'

  return (
    <div className={`bar-chart bar-${orientation}`}>
      {title && <div className="chart-title">{title}</div>}

      <div className="chart-content">
        {isVertical ? (
          <div className="bars-container vertical">
            {bars.map((bar, index) => (
              <div key={index} className="bar-item vertical">
                <div
                  className="bar"
                  style={{
                    backgroundColor: bar.color,
                    height: `${bar.percentage}%`,
                  }}
                  title={`${bar.label}: ${bar.value}`}
                >
                  {showValue && bar.percentage > 20 && (
                    <span className="bar-value">{bar.value}</span>
                  )}
                </div>
                <div className="bar-label">{bar.label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bars-container horizontal">
            {bars.map((bar, index) => (
              <div key={index} className="bar-item horizontal">
                <div className="bar-label">{bar.label}</div>
                <div className="bar-wrapper">
                  <div
                    className="bar"
                    style={{
                      backgroundColor: bar.color,
                      width: `${bar.percentage}%`,
                    }}
                    title={`${bar.label}: ${bar.value}`}
                  >
                    {showValue && bar.percentage > 15 && (
                      <span className="bar-value">{bar.value}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BarChart
