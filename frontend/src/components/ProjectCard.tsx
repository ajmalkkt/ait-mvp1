// frontend/src/components/ProjectCard.tsx
// Individual project display card

import React from 'react'
import { ProjectData } from '../hooks/useProjects'
import '../styles/ProjectCard.css'

interface ProjectCardProps {
  project: ProjectData
  onEdit?: (project: ProjectData) => void
  onDelete?: (projectId: string) => void
}

export default function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const startDate = new Date(project.start_date)
  const endDate = new Date(project.end_date)
  const today = new Date()

  const isActive = startDate <= today && endDate >= today
  const isUpcoming = startDate > today
  const isCompleted = endDate < today

  const getStatus = () => {
    if (isCompleted) return 'Completed'
    if (isActive) return 'Active'
    if (isUpcoming) return 'Upcoming'
    return 'Unknown'
  }

  const getStatusClass = () => {
    if (isCompleted) return 'status-completed'
    if (isActive) return 'status-active'
    if (isUpcoming) return 'status-upcoming'
    return ''
  }

  const daysRemaining = Math.ceil(
    (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className={`project-card ${getStatusClass()}`}>
      <div className="project-header">
        <h3>{project.name}</h3>
        <span className="project-status">{getStatus()}</span>
      </div>

      {project.description && (
        <p className="project-description">{project.description}</p>
      )}

      <div className="project-meta">
        <div className="meta-item">
          <label>Project Manager</label>
          <p>
            {project.pm?.first_name && project.pm?.last_name
              ? `${project.pm.first_name} ${project.pm.last_name}`
              : project.pm?.email || 'Unknown'}
          </p>
        </div>

        <div className="meta-item">
          <label>Duration</label>
          <p>
            {formatDate(startDate)} - {formatDate(endDate)}
          </p>
        </div>

        {isActive && daysRemaining > 0 && (
          <div className="meta-item">
            <label>Days Remaining</label>
            <p className={daysRemaining <= 7 ? 'warning' : ''}>
              {daysRemaining} days
            </p>
          </div>
        )}
      </div>

      <div className="project-stats">
        <div className="stat">
          <span className="stat-value">{project.team_count || 0}</span>
          <span className="stat-label">Teams</span>
        </div>
        <div className="stat">
          <span className="stat-value">{project.action_item_count || 0}</span>
          <span className="stat-label">Action Items</span>
        </div>
      </div>

      <div className="project-actions">
        {onEdit && (
          <button
            className="btn-edit"
            onClick={() => onEdit(project)}
            title="Edit project"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            className="btn-delete"
            onClick={() => {
              if (
                window.confirm(
                  `Are you sure you want to delete "${project.name}"?`
                )
              ) {
                onDelete(project.id)
              }
            }}
            title="Delete project"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
