// frontend/src/pages/AuditPage.tsx
// Page for viewing audit logs

import React from 'react'
import AuditLogViewer from '../components/Audit/AuditLogViewer'
import './AuditPage.css'

export function AuditPage() {
  return (
    <div className="audit-page">
      <div className="page-header">
        <h1>Audit Logs</h1>
        <p>View all system activities and changes</p>
      </div>

      <div className="page-content">
        <AuditLogViewer />
      </div>
    </div>
  )
}

export default AuditPage
