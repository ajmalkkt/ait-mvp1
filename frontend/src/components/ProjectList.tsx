// frontend/src/components/ProjectList.tsx
// Projects list component

import React from 'react'
import { ProjectData } from '../hooks/useProjects'
import ProjectCard from './ProjectCard'
import '../styles/ProjectList.css'

interface ProjectListProps {
  projects: ProjectData[]
  isLoading?: boolean
  isEmpty?: boolean
  onEdit?: (project: ProjectData) => void
  onDelete?: (projectId: string) => void
}

export default function ProjectList({
  projects,
  isLoading = false,
  isEmpty = false,
  onEdit,
  onDelete
}: ProjectListProps) {
  if (isEmpty) {
    return (
      <div className="empty-state">
        <p>No projects yet. Create one to get started!</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="list-loading">
        <p>Loading projects...</p>
      </div>
    )
  }

  return (
    <div className="project-list">
      {projects.map(project => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
