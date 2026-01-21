// frontend/src/components/NotificationCenter.tsx
// Notification center with list and management

import React, { useState } from 'react'
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification
} from '../hooks/useNotifications'
import NotificationItem from './NotificationItem'
import '../styles/NotificationCenter.css'

interface NotificationCenterProps {
  onClose?: () => void
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const [page, setPage] = useState(1)
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all')

  const { data, isLoading } = useNotifications({
    page,
    pageSize: 10,
    is_read: filterRead === 'all' ? undefined : filterRead === 'unread' ? false : true
  })

  const markAsReadMutation = useMarkNotificationAsRead()
  const markAllAsReadMutation = useMarkAllNotificationsAsRead()
  const deleteNotificationMutation = useDeleteNotification()

  const notifications = data?.data || []
  const pagination = data?.pagination
  const totalPages = pagination?.pages || 1
  const unreadCount = pagination?.unread || 0

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id)
  }

  const handleDelete = (id: string) => {
    deleteNotificationMutation.mutate(id)
  }

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate()
    }
  }

  return (
    <div className="notification-center">
      <div className="notification-center-header">
        <h2>Notifications</h2>
        {unreadCount > 0 && (
          <button
            className="btn-mark-all-read"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending}
          >
            Mark all as read ({unreadCount})
          </button>
        )}
        {onClose && (
          <button className="btn-close" onClick={onClose} title="Close">
            ✕
          </button>
        )}
      </div>

      <div className="notification-filters">
        <button
          className={`filter-btn ${filterRead === 'all' ? 'active' : ''}`}
          onClick={() => {
            setFilterRead('all')
            setPage(1)
          }}
        >
          All
        </button>
        <button
          className={`filter-btn ${filterRead === 'unread' ? 'active' : ''}`}
          onClick={() => {
            setFilterRead('unread')
            setPage(1)
          }}
        >
          Unread ({unreadCount})
        </button>
        <button
          className={`filter-btn ${filterRead === 'read' ? 'active' : ''}`}
          onClick={() => {
            setFilterRead('read')
            setPage(1)
          }}
        >
          Read
        </button>
      </div>

      <div className="notification-list">
        {isLoading && <p>Loading notifications...</p>}
        {!isLoading && notifications.length === 0 && (
          <p className="empty-message">No notifications</p>
        )}
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="notification-pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
