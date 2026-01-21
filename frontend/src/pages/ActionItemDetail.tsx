// frontend/src/pages/ActionItemDetail.tsx
// Action item detail and history page

import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useActionItem, useActionItemHistory, useUpdateActionItem, useChangeActionItemStatus } from '../hooks/useActionItems.js'
import { ActionItemForm } from '../components/ActionItemForm.js'
import { ConflictModal } from '../components/ConflictModal.js'
import '../styles/Pages.css'

export function ActionItemDetail() {
  const { id } = useParams<{ id: string }>()
  const [isEditing, setIsEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const [conflictModal, setConflictModal] = useState<{
    isOpen: boolean
    currentVersion: number
  }>({
    isOpen: false,
    currentVersion: 0
  })

  const { data: item, isLoading: itemLoading } = useActionItem(id)
  const { data: historyData, isLoading: historyLoading } = useActionItemHistory(id)
  const updateMutation = useUpdateActionItem()
  const statusMutation = useChangeActionItemStatus()

  if (itemLoading) {
    return <div className="page-container">Loading...</div>
  }

  if (!item) {
    return <div className="page-container">Action item not found</div>
  }

  const handleUpdate = async (data: any) => {
    try {
      await updateMutation.mutateAsync({
        id: item.id,
        version: item.version,
        ...data
      })
      setIsEditing(false)
    } catch (error: any) {
      if (error.response?.status === 409) {
        setConflictModal({
          isOpen: true,
          currentVersion: error.response?.data?.details?.currentVersion || item.version + 1
        })
      } else {
        throw error
      }
    }
  }

  const handleStatusChange = async (status: string) => {
    try {
      await statusMutation.mutateAsync({
        id: item.id,
        status,
        version: item.version
      })
    } catch (error: any) {
      if (error.response?.status === 409) {
        setConflictModal({
          isOpen: true,
          currentVersion: error.response?.data?.details?.currentVersion || item.version + 1
        })
      }
    }
  }

  const daysUntilDue = Math.ceil(
    (new Date(item.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{item.title}</h1>
        {!isEditing && (
          <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
            Edit
          </button>
        )}
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          {isEditing ? (
            <ActionItemForm
              initialData={item}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              isLoading={updateMutation.isPending}
            />
          ) : (
            <div className="detail-view">
              {item.description && (
                <div className="detail-section">
                  <h3>Description</h3>
                  <p>{item.description}</p>
                </div>
              )}

              <div className="detail-section">
                <h3>Details</h3>
                <dl>
                  <dt>Status</dt>
                  <dd>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                    </select>
                  </dd>

                  <dt>Priority</dt>
                  <dd>
                    <span className={`priority-badge priority-${item.priority}`}>
                      {item.priority}
                    </span>
                  </dd>

                  <dt>Assigned To</dt>
                  <dd>{item.owner?.email || item.owner_id}</dd>

                  <dt>Due Date</dt>
                  <dd className={daysUntilDue < 0 ? 'overdue' : ''}>
                    {new Date(item.due_date).toLocaleDateString()}
                    {daysUntilDue >= 0 && <span> ({daysUntilDue} days)</span>}
                    {daysUntilDue < 0 && <span> (OVERDUE)</span>}
                  </dd>

                  <dt>Project</dt>
                  <dd>{item.project?.name || item.project_id}</dd>

                  {item.team && (
                    <>
                      <dt>Team</dt>
                      <dd>{item.team.name || item.team_id}</dd>
                    </>
                  )}

                  <dt>Created</dt>
                  <dd>{new Date(item.created_at).toLocaleString()}</dd>

                  {item.completed_date && (
                    <>
                      <dt>Completed</dt>
                      <dd>{new Date(item.completed_date).toLocaleString()}</dd>
                    </>
                  )}
                </dl>
              </div>
            </div>
          )}
        </div>

        <div className="detail-sidebar">
          <div className="sidebar-section">
            <h3>Change History</h3>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? 'Hide' : 'Show'} History
            </button>

            {showHistory && (
              <div className="history-list">
                {historyLoading ? (
                  <p>Loading history...</p>
                ) : historyData?.data && historyData.data.length > 0 ? (
                  <ul>
                    {historyData.data.map((entry: any) => (
                      <li key={entry.id} className="history-item">
                        <span className="timestamp">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                        <span className="action">{entry.action_type}</span>
                        {entry.user_id && <span className="user">(by {entry.user_id})</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No changes recorded</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConflictModal
        isOpen={conflictModal.isOpen}
        currentVersion={conflictModal.currentVersion}
        onRefresh={() => window.location.reload()}
        onCancel={() => setConflictModal({ isOpen: false, currentVersion: 0 })}
      />
    </div>
  )
}
