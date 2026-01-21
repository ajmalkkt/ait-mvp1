// frontend/src/components/TeamList.tsx
// Teams list component

import React from 'react'
import { TeamData } from '../hooks/useTeams'
import TeamCard from './TeamCard'
import '../styles/TeamList.css'

interface TeamListProps {
  teams: TeamData[]
  isLoading?: boolean
  isEmpty?: boolean
  onEdit?: (team: TeamData) => void
  onDelete?: (teamId: string) => void
}

export default function TeamList({
  teams,
  isLoading = false,
  isEmpty = false,
  onEdit,
  onDelete
}: TeamListProps) {
  if (isEmpty) {
    return (
      <div className="empty-state">
        <p>No teams yet. Create one to get started!</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="list-loading">
        <p>Loading teams...</p>
      </div>
    )
  }

  return (
    <div className="team-list">
      {teams.map(team => (
        <TeamCard
          key={team.id}
          team={team}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
