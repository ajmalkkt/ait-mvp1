// frontend/src/components/Dashboard/DateRangeFilter.tsx
// Date range selector component

import React from 'react'
import { format, subDays } from 'date-fns'
import './DateRangeFilter.css'

interface DateRangeFilterProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeFilterProps) {
  const handleLast7Days = () => {
    const end = format(new Date(), 'yyyy-MM-dd')
    const start = format(subDays(new Date(), 7), 'yyyy-MM-dd')
    onStartDateChange(start)
    onEndDateChange(end)
  }

  const handleLast30Days = () => {
    const end = format(new Date(), 'yyyy-MM-dd')
    const start = format(subDays(new Date(), 30), 'yyyy-MM-dd')
    onStartDateChange(start)
    onEndDateChange(end)
  }

  const handleLast90Days = () => {
    const end = format(new Date(), 'yyyy-MM-dd')
    const start = format(subDays(new Date(), 90), 'yyyy-MM-dd')
    onStartDateChange(start)
    onEndDateChange(end)
  }

  const handleToday = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    onStartDateChange(today)
    onEndDateChange(today)
  }

  return (
    <div className="date-range-filter">
      <div className="date-inputs">
        <div className="date-group">
          <label htmlFor="start-date">Start Date</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </div>

        <div className="date-group">
          <label htmlFor="end-date">End Date</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>
      </div>

      <div className="quick-ranges">
        <button onClick={handleToday} className="quick-btn">
          Today
        </button>
        <button onClick={handleLast7Days} className="quick-btn">
          Last 7 days
        </button>
        <button onClick={handleLast30Days} className="quick-btn">
          Last 30 days
        </button>
        <button onClick={handleLast90Days} className="quick-btn">
          Last 90 days
        </button>
      </div>
    </div>
  )
}

export default DateRangeFilter
