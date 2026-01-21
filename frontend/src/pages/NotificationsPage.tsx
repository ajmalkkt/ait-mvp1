// frontend/src/pages/NotificationsPage.tsx
// Full notifications management page

import React, { useState } from 'react'
import NotificationCenter from '../components/NotificationCenter'
import '../styles/NotificationsPage.css'

export default function NotificationsPage() {
  return (
    <div className="notifications-page">
      <NotificationCenter />
    </div>
  )
}
