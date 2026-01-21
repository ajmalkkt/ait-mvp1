// frontend/src/pages/ProjectsPage.tsx
// Projects management page

import React, { useState } from 'react'
import { useProjects, useCreateProject, useUpdateProject, useArchiveProject, ProjectData } from '../hooks/useProjects'
import ProjectForm, { ProjectFormData } from '../components/ProjectForm'
import ProjectList from '../components/ProjectList'
import '../styles/ProjectsPage.css'

export default function ProjectsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectData | undefined>()

  const { data: projectsData, isLoading } = useProjects({
    page,
    pageSize: 12,
    search
  })

  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject(editingProject?.id || '')
  const deleteMutation = useArchiveProject()

  const handleCreateProject = async (formData: ProjectFormData) => {
    try {
      await createMutation.mutateAsync(formData)
      setShowForm(false)
      setPage(1)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const handleUpdateProject = async (formData: ProjectFormData) => {
    try {
      await updateMutation.mutateAsync(formData)
      setEditingProject(undefined)
      setShowForm(false)
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteMutation.mutateAsync(projectId)
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleEdit = (project: ProjectData) => {
    setEditingProject(project)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingProject(undefined)
  }

  const projects = projectsData?.data || []
  const pagination = projectsData?.pagination
  const totalPages = pagination?.pages || 1

  return (
    <div className="projects-page">
      <div className="page-header">
        <h1>Projects</h1>
        <button
          className="btn-new-project"
          onClick={() => {
            setEditingProject(undefined)
            setShowForm(true)
          }}
        >
          New Project
        </button>
      </div>

      {showForm && (
        <div className="form-section">
          <ProjectForm
            project={editingProject}
            onSubmit={
              editingProject
                ? handleUpdateProject
                : handleCreateProject
            }
            onCancel={handleCloseForm}
            isLoading={
              createMutation.isPending || updateMutation.isPending
            }
          />
        </div>
      )}

      <div className="filters-section">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="search-input"
        />
      </div>

      <ProjectList
        projects={projects}
        isLoading={isLoading}
        isEmpty={!isLoading && projects.length === 0}
        onEdit={handleEdit}
        onDelete={handleDeleteProject}
      />

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="page-indicator">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
