// frontend/src/components/NotificationBell.tsx
// Notification bell with unread count

import React from 'react'
import { useUnreadNotificationCount } from '../hooks/useNotifications'
import '../styles/NotificationBell.css'

interface NotificationBellProps {
  onClick: () => void
}

export default function NotificationBell({ onClick }: NotificationBellProps) {
  const { data, isLoading } = useUnreadNotificationCount()
  const unreadCount = data?.unread || 0

  return (
    <button className="notification-bell" onClick={onClick} title="Notifications">
      <span className="bell-icon">🔔</span>
      {unreadCount > 0 && (
        <span className="unread-badge">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
