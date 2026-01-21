// frontend/src/components/ActionItemCard.tsx
// Card component for displaying individual action item

import React from 'react'
import { ActionItem } from '../hooks/useActionItems.js'
import { PriorityBadge, StatusBadge } from './Badges.js'
import '../styles/ActionItemCard.css'

interface ActionItemCardProps {
  item: ActionItem
  onStatusChange?: (id: string, status: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ActionItemCard({
  item,
  onStatusChange,
  onEdit,
  onDelete
}: ActionItemCardProps) {
  const daysUntilDue = Math.ceil(
    (new Date(item.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    if (onStatusChange) {
      onStatusChange(item.id, newStatus)
    }
  }

  const isOverdue = daysUntilDue < 0 && !['completed', 'closed'].includes(item.status)

  return (
    <div className={`action-item-card ${isOverdue ? 'overdue' : ''}`}>
      <div className="card-header">
        <h3 className="item-title">{item.title}</h3>
        <div className="card-badges">
          <StatusBadge status={item.status} />
          <PriorityBadge priority={item.priority} />
        </div>
      </div>

      {item.description && <p className="item-description">{item.description}</p>}

      <div className="item-meta">
        <div className="meta-item">
          <span className="label">Due:</span>
          <span className={`value ${isOverdue ? 'overdue' : daysUntilDue <= 3 ? 'warning' : ''}`}>
            {new Date(item.due_date).toLocaleDateString()}
            {daysUntilDue >= 0 && <span className="days"> ({daysUntilDue}d)</span>}
            {isOverdue && <span className="days"> (OVERDUE)</span>}
          </span>
        </div>
      </div>

      <div className="card-actions">
        {['open', 'in_progress', 'on_hold'].includes(item.status) && (
          <select
            value={item.status}
            onChange={handleStatusChange}
            className="status-select"
            title="Change status"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Complete</option>
          </select>
        )}

        <div className="action-buttons">
          {onEdit && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => onEdit(item.id)}
              title="Edit item"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => onDelete(item.id)}
              title="Archive item"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
