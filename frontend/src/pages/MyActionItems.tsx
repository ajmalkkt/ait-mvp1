// frontend/src/pages/MyActionItems.tsx
// "My Action Items" dashboard page

import React, { useState } from 'react'
import { useActionItems, useCreateActionItem, useChangeActionItemStatus, useArchiveActionItem } from '../hooks/useActionItems.js'
import { ActionItemForm } from '../components/ActionItemForm.js'
import { ActionItemList } from '../components/ActionItemList.js'
import { ConflictModal } from '../components/ConflictModal.js'
import '../styles/Pages.css'

export function MyActionItems() {
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({})
  const [conflictModal, setConflictModal] = useState<{
    isOpen: boolean
    currentVersion: number
  }>({
    isOpen: false,
    currentVersion: 0
  })

  const { data: listData, isLoading, error } = useActionItems({
    page,
    pageSize: 25,
    ...filters
  })

  const createMutation = useCreateActionItem()
  const statusMutation = useChangeActionItemStatus()
  const deleteMutation = useArchiveActionItem()

  const handleCreate = async (data: any) => {
    try {
      await createMutation.mutateAsync(data)
      setShowForm(false)
    } catch (error: any) {
      throw error
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    const item = listData?.data?.find((i: any) => i.id === id)
    if (!item) return

    try {
      await statusMutation.mutateAsync({
        id,
        status,
        version: item.version
      })
    } catch (error: any) {
      if (error.response?.status === 409) {
        setConflictModal({
          isOpen: true,
          currentVersion: error.response?.data?.details?.currentVersion || item.version + 1
        })
      } else {
        console.error('Error changing status:', error)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Archive this action item?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Error archiving:', error)
      }
    }
  }

  const handleRefresh = () => {
    setConflictModal({ isOpen: false, currentVersion: 0 })
    window.location.reload()
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">
          Failed to load action items. Please try again later.
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Action Items</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'New Action Item'}
        </button>
      </div>

      {showForm && (
        <div className="form-section">
          <ActionItemForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            isLoading={createMutation.isPending}
          />
        </div>
      )}

      {listData && (
        <>
          <ActionItemList
            items={listData.data || []}
            isLoading={isLoading}
            onStatusChange={handleStatusChange}
            onEdit={(id) => console.log('Edit:', id)} // TODO: Implement edit modal
            onDelete={handleDelete}
          />

          {listData.pagination && listData.pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="page-info">
                Page {page} of {listData.pagination.totalPages}
              </span>
              <button
                disabled={page >= listData.pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <ConflictModal
        isOpen={conflictModal.isOpen}
        currentVersion={conflictModal.currentVersion}
        onRefresh={handleRefresh}
        onCancel={() => setConflictModal({ isOpen: false, currentVersion: 0 })}
      />
    </div>
  )
}
