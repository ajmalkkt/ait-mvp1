// frontend/src/components/ActionItemList.tsx
// List component for action items with filters

import React, { useState } from 'react'
import { ActionItem } from '../hooks/useActionItems.js'
import { ActionItemCard } from './ActionItemCard.js'
import '../styles/ActionItemList.css'

interface ActionItemListProps {
  items: ActionItem[]
  isLoading?: boolean
  onStatusChange?: (id: string, status: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ActionItemList({
  items,
  isLoading = false,
  onStatusChange,
  onEdit,
  onDelete
}: ActionItemListProps) {
  const [filter, setFilter] = useState<{
    status?: string
    priority?: string
  }>({})

  const filteredItems = items.filter(item => {
    if (filter.status && item.status !== filter.status) return false
    if (filter.priority && item.priority !== filter.priority) return false
    return true
  })

  if (isLoading) {
    return <div className="loading">Loading action items...</div>
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p>No action items yet</p>
        <p className="text-muted">Create your first action item to get started</p>
      </div>
    )
  }

  return (
    <div className="action-item-list">
      <div className="list-filters">
        <select
          value={filter.status || ''}
          onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value || undefined }))}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="closed">Closed</option>
          <option value="on_hold">On Hold</option>
          <option value="overdue">Overdue</option>
        </select>

        <select
          value={filter.priority || ''}
          onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value || undefined }))}
          className="filter-select"
        >
          <option value="">All Priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="items-grid">
        {filteredItems.map(item => (
          <ActionItemCard
            key={item.id}
            item={item}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="empty-state">
          <p>No items match the selected filters</p>
        </div>
      )}
    </div>
  )
}
