// frontend/src/components/ConflictModal.tsx
// Modal for handling concurrent edit conflicts

import React from 'react'
import '../styles/Modal.css'

interface ConflictModalProps {
  isOpen: boolean
  currentVersion: number
  conflictMessage?: string
  onRefresh: () => void
  onCancel: () => void
}

export function ConflictModal({
  isOpen,
  currentVersion,
  conflictMessage,
  onRefresh,
  onCancel
}: ConflictModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Item Modified</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="alert alert-warning">
            <p>
              <strong>This action item has been modified by another user.</strong>
            </p>
            <p>
              Your changes could not be saved to avoid overwriting their edits.
              Please refresh to see the latest changes and try again.
            </p>
            {conflictMessage && <p className="conflict-message">{conflictMessage}</p>}
          </div>

          <div className="version-info">
            <p>Current version: <code>v{currentVersion}</code></p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onRefresh}>
            Refresh to See Latest
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
