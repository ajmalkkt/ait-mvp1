// frontend/src/components/ActionItemForm.tsx
// Form component for creating/editing action items

import React, { useState } from 'react'
import { ActionItem } from '../hooks/useActionItems.js'
import '../styles/ActionItemForm.css'

interface ValidationError {
  field: string
  message: string
}

interface ActionItemFormProps {
  projectId?: string
  teamId?: string
  meetingId?: string
  initialData?: Partial<ActionItem>
  onSubmit: (data: any) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function ActionItemForm({
  projectId,
  teamId,
  meetingId,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: ActionItemFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    owner_id: initialData?.owner_id || '',
    project_id: projectId || initialData?.project_id || '',
    team_id: teamId || initialData?.team_id || '',
    meeting_id: meetingId || initialData?.meeting_id || '',
    priority: initialData?.priority || 'medium',
    due_date: initialData?.due_date || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    try {
      await onSubmit(formData)
    } catch (error: any) {
      if (error.response?.data?.details) {
        // API returned field-level validation errors
        const fieldErrors: Record<string, string> = {}
        error.response.data.details.forEach((err: ValidationError) => {
          fieldErrors[err.field] = err.message
        })
        setErrors(fieldErrors)
      } else {
        setSubmitError(error.message || 'Failed to save action item')
      }
    }
  }

  return (
    <form className="action-item-form" onSubmit={handleSubmit}>
      {submitError && <div className="form-error">{submitError}</div>}

      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={errors.title ? 'input-error' : ''}
          placeholder="Action item title"
          maxLength={255}
          required
        />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className={errors.description ? 'input-error' : ''}
          placeholder="Detailed description (optional)"
          rows={4}
          maxLength={5000}
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
        <span className="char-count">{formData.description.length}/5000</span>
      </div>

      <div className="form-row">
        <div className="form-group flex-1">
          <label htmlFor="owner_id">Assigned To *</label>
          <select
            id="owner_id"
            name="owner_id"
            value={formData.owner_id}
            onChange={handleChange}
            className={errors.owner_id ? 'input-error' : ''}
            required
          >
            <option value="">Select team member</option>
            {/* TODO: Populate from team members API */}
          </select>
          {errors.owner_id && <span className="field-error">{errors.owner_id}</span>}
        </div>

        <div className="form-group flex-1">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className={errors.priority ? 'input-error' : ''}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {errors.priority && <span className="field-error">{errors.priority}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group flex-1">
          <label htmlFor="due_date">Due Date *</label>
          <input
            type="date"
            id="due_date"
            name="due_date"
            value={formData.due_date}
            onChange={handleChange}
            className={errors.due_date ? 'input-error' : ''}
            required
          />
          {errors.due_date && <span className="field-error">{errors.due_date}</span>}
        </div>

        <div className="form-group flex-1">
          <label htmlFor="project_id">Project *</label>
          <select
            id="project_id"
            name="project_id"
            value={formData.project_id}
            onChange={handleChange}
            className={errors.project_id ? 'input-error' : ''}
            disabled={!!projectId}
            required
          >
            <option value="">Select project</option>
            {/* TODO: Populate from projects API */}
          </select>
          {errors.project_id && <span className="field-error">{errors.project_id}</span>}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Action Item'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
