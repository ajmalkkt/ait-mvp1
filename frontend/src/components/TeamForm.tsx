// frontend/src/components/TeamForm.tsx
// Team creation/edit form

import React, { useState } from 'react'
import { TeamData } from '../hooks/useTeams'
import '../styles/TeamForm.css'

export interface TeamFormData {
  project_id: string
  name: string
  description: string
  lead_id: string
}

interface TeamFormProps {
  team?: TeamData
  onSubmit: (data: TeamFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  projects?: Array<{ id: string; name: string }>
  teamLeads?: Array<{ id: string; email: string; first_name?: string; last_name?: string }>
}

export default function TeamForm({
  team,
  onSubmit,
  onCancel,
  isLoading = false,
  projects = [],
  teamLeads = []
}: TeamFormProps) {
  const [formData, setFormData] = useState<TeamFormData>({
    project_id: team?.project_id || '',
    name: team?.name || '',
    description: team?.description || '',
    lead_id: team?.lead_id || ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors }

    if (name === 'project_id') {
      if (!value) {
        newErrors.project_id = 'Project is required'
      } else {
        delete newErrors.project_id
      }
    }

    if (name === 'name') {
      if (!value.trim()) {
        newErrors.name = 'Team name is required'
      } else if (value.length < 3) {
        newErrors.name = 'Name must be at least 3 characters'
      } else if (value.length > 100) {
        newErrors.name = 'Name must be less than 100 characters'
      } else {
        delete newErrors.name
      }
    }

    if (name === 'lead_id') {
      if (!value) {
        newErrors.lead_id = 'Team lead is required'
      } else {
        delete newErrors.lead_id
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

    Object.keys(formData).forEach(key => {
      validateField(key, formData[key as keyof TeamFormData])
    })

    const hasErrors = Object.keys(errors).length > 0
    if (hasErrors) return

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form className="team-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="project_id">Project *</label>
        <select
          id="project_id"
          name="project_id"
          value={formData.project_id}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.project_id ? 'input-error' : ''}
          disabled={isLoading || !!team}
        >
          <option value="">Select project</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        {touched.project_id && errors.project_id && (
          <div className="field-error">{errors.project_id}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="name">Team Name *</label>
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter team name"
          className={errors.name ? 'input-error' : ''}
          disabled={isLoading}
        />
        {touched.name && errors.name && (
          <div className="field-error">{errors.name}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="lead_id">Team Lead *</label>
        <select
          id="lead_id"
          name="lead_id"
          value={formData.lead_id}
          onChange={handleChange}
          onBlur={handleBlur}
          className={errors.lead_id ? 'input-error' : ''}
          disabled={isLoading}
        >
          <option value="">Select team lead</option>
          {teamLeads.map(lead => (
            <option key={lead.id} value={lead.id}>
              {lead.first_name && lead.last_name
                ? `${lead.first_name} ${lead.last_name}`
                : lead.email}
            </option>
          ))}
        </select>
        {touched.lead_id && errors.lead_id && (
          <div className="field-error">{errors.lead_id}</div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter team description (optional)"
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
          {isLoading ? 'Saving...' : team ? 'Update Team' : 'Create Team'}
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
