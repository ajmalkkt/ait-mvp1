// frontend/src/pages/TeamsPage.tsx
// Teams management page

import React, { useState } from 'react'
import { useTeams, useCreateTeam, useUpdateTeam, useArchiveTeam, TeamData } from '../hooks/useTeams'
import { useProjects } from '../hooks/useProjects'
import TeamForm, { TeamFormData } from '../components/TeamForm'
import TeamList from '../components/TeamList'
import '../styles/TeamsPage.css'

export default function TeamsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingTeam, setEditingTeam] = useState<TeamData | undefined>()

  const { data: teamsData, isLoading: teamsLoading } = useTeams({
    page,
    pageSize: 12,
    search,
    project_id: projectFilter
  })

  const { data: projectsData, isLoading: projectsLoading } = useProjects({
    pageSize: 100
  })

  const createMutation = useCreateTeam()
  const updateMutation = useUpdateTeam(editingTeam?.id || '')
  const deleteMutation = useArchiveTeam()

  const handleCreateTeam = async (formData: TeamFormData) => {
    try {
      await createMutation.mutateAsync(formData)
      setShowForm(false)
      setPage(1)
    } catch (error) {
      console.error('Failed to create team:', error)
    }
  }

  const handleUpdateTeam = async (formData: TeamFormData) => {
    try {
      await updateMutation.mutateAsync(formData)
      setEditingTeam(undefined)
      setShowForm(false)
    } catch (error) {
      console.error('Failed to update team:', error)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await deleteMutation.mutateAsync(teamId)
    } catch (error) {
      console.error('Failed to delete team:', error)
    }
  }

  const handleEdit = (team: TeamData) => {
    setEditingTeam(team)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingTeam(undefined)
  }

  const teams = teamsData?.data || []
  const pagination = teamsData?.pagination
  const totalPages = pagination?.pages || 1
  const projects = projectsData?.data || []

  return (
    <div className="teams-page">
      <div className="page-header">
        <h1>Teams</h1>
        <button
          className="btn-new-team"
          onClick={() => {
            setEditingTeam(undefined)
            setShowForm(true)
          }}
        >
          New Team
        </button>
      </div>

      {showForm && (
        <div className="form-section">
          <TeamForm
            team={editingTeam}
            onSubmit={
              editingTeam
                ? handleUpdateTeam
                : handleCreateTeam
            }
            onCancel={handleCloseForm}
            isLoading={
              createMutation.isPending || updateMutation.isPending
            }
            projects={projects}
            teamLeads={projects.map(p => ({
              id: p.pm_id,
              email: p.pm?.email || '',
              first_name: p.pm?.first_name,
              last_name: p.pm?.last_name
            }))}
          />
        </div>
      )}

      <div className="filters-section">
        <input
          type="text"
          placeholder="Search teams..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="search-input"
        />
        <select
          value={projectFilter}
          onChange={(e) => {
            setProjectFilter(e.target.value)
            setPage(1)
          }}
          className="filter-select"
        >
          <option value="">All Projects</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <TeamList
        teams={teams}
        isLoading={teamsLoading || projectsLoading}
        isEmpty={!teamsLoading && teams.length === 0}
        onEdit={handleEdit}
        onDelete={handleDeleteTeam}
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
