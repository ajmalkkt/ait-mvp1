// frontend/src/components/NotificationItem.tsx
// Individual notification display

import React from 'react'
import { NotificationData } from '../hooks/useNotifications'
import '../styles/NotificationItem.css'

interface NotificationItemProps {
  notification: NotificationData
  onRead?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function NotificationItem({
  notification,
  onRead,
  onDelete
}: NotificationItemProps) {
  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }
    return icons[type] || 'ℹ️'
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className={`notification-item ${notification.is_read ? 'read' : 'unread'} ${notification.type}`}>
      <div className="notification-header">
        <span className="notification-icon">{getTypeIcon(notification.type)}</span>
        <h4 className="notification-title">{notification.title}</h4>
        <span className="notification-time">{formatTime(notification.created_at)}</span>
      </div>

      <p className="notification-message">{notification.message}</p>

      <div className="notification-actions">
        {!notification.is_read && onRead && (
          <button
            className="btn-read"
            onClick={() => onRead(notification.id)}
            title="Mark as read"
          >
            Mark Read
          </button>
        )}
        {onDelete && (
          <button
            className="btn-delete"
            onClick={() => onDelete(notification.id)}
            title="Delete notification"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
