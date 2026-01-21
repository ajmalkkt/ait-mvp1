// frontend/src/components/ProjectForm.tsx
// Project creation/edit form

import React, { useState } from 'react'
import { Project } from '../hooks/useProjects'
import '../styles/ProjectForm.css'

export interface ProjectFormData {
  name: string
  description: string
  pm_id: string
  start_date: string
  end_date: string
}

interface ProjectFormProps {
  project?: Project
  onSubmit: (data: ProjectFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  projectManagers?: Array<{ id: string; email: string; first_name?: string; last_name?: string }>
}

export default function ProjectForm({
  project,
  onSubmit,
  onCancel,
  isLoading = false,
  projectManagers = []
}: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: project?.name || '',
    description: project?.description || '',
    pm_id: project?.pm_id || '',
    start_date: project?.start_date || '',
    end_date: project?.end_date || ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }

    if (name === 'name') {
      if (!value.trim()) {
        newErrors.name = 'Project name is required'
      } else if (value.length < 3) {
        newErrors.name = 'Name must be at least 3 characters'
      } else if (value.length > 100) {
        newErrors.name = 'Name must be less than 100 characters'
      } else {
        delete newErrors.name
      }
    }

    if (name === 'pm_id') {
      if (!value) {
        newErrors.pm_id = 'Project manager is required'
      } else {
        delete newErrors.pm_id
      }
    }

    if (name === 'start_date') {
      if (!value) {
        newErrors.start_date = 'Start date is required'
      } else if (isNaN(new Date(value).getTime())) {
        newErrors.start_date = 'Invalid date format'
      } else {
        delete newErrors.start_date
      }
    }

    if (name === 'end_date') {
      if (!value) {
        newErrors.end_date = 'End date is required'
      } else if (isNaN(new Date(value).getTime())) {
        newErrors.end_date = 'Invalid date format'
      } else if (formData.start_date && new Date(value) < new Date(formData.start_date)) {
        newErrors.end_date = 'End date must be after start date'
      } else {
        delete newErrors.end_date
      }
    }

    if (name === 'description' && value.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters'
    } else if (name === 'description') {
      delete newErrors.description
    }

    setErrors(newErrors)
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear touched error for this field
    if (touched[name]) {
      validateField(name, value)
    }
  }

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    validateField(name, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    Object.keys(formData).forEach(key => {
      validateField(key, formData[key as keyof ProjectFormData])
    })

    // Check if there are any errors
    const hasErrors = Object.keys(errors).length > 0
    if (hasErrors) return

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Project Name *</label>
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter project name"
          className={errors.name ? 'input-error' : ''}
          disabled={isLoading}
        />
        {touched.name && errors.name && (
          <div className="field-error">{errors.name}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="pm_id">Project Manager *</label>
        <select
          id="pm_id"
          name="pm_id"
          value={formData.pm_id}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.pm_id ? 'input-error' : ''}
          disabled={isLoading}
        >
          <option value="">Select project manager</option>
          {projectManagers.map(pm => (
            <option key={pm.id} value={pm.id}>
              {pm.first_name && pm.last_name
                ? `${pm.first_name} ${pm.last_name}`
                : pm.email}
            </option>
          ))}
        </select>
        {touched.pm_id && errors.pm_id && (
          <div className="field-error">{errors.pm_id}</div>
        )}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="start_date">Start Date *</label>
          <input
            id="start_date"
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.start_date ? 'input-error' : ''}
            disabled={isLoading}
          />
          {touched.start_date && errors.start_date && (
            <div className="field-error">{errors.start_date}</div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="end_date">End Date *</label>
          <input
            id="end_date"
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            onBlur={handleBlur}
            className={errors.end_date ? 'input-error' : ''}
            disabled={isLoading}
          />
          {touched.end_date && errors.end_date && (
            <div className="field-error">{errors.end_date}</div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter project description (optional)"
          rows={4}
          className={errors.description ? 'input-error' : ''}
          disabled={isLoading}
        />
        <div className="char-count">
          {formData.description.length} / 1000
        </div>
        {touched.description && errors.description && (
          <div className="field-error">{errors.description}</div>
        )}
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
