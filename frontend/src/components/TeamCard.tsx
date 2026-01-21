// frontend/src/components/TeamCard.tsx
// Individual team display card

import React from 'react'
import { TeamData } from '../hooks/useTeams'
import '../styles/TeamCard.css'

interface TeamCardProps {
  team: TeamData
  onEdit?: (team: TeamData) => void
  onDelete?: (teamId: string) => void
  onManageMembers?: (teamId: string) => void
}

export default function TeamCard({
  team,
  onEdit,
  onDelete,
  onManageMembers
}: TeamCardProps) {
  return (
    <div className="team-card">
      <div className="team-header">
        <h3>{team.name}</h3>
      </div>

      {team.description && (
        <p className="team-description">{team.description}</p>
      )}

      <div className="team-meta">
        <div className="meta-item">
          <label>Team Lead</label>
          <p>
            {team.lead?.first_name && team.lead?.last_name
              ? `${team.lead.first_name} ${team.lead.last_name}`
              : team.lead?.email || 'Unknown'}
          </p>
        </div>

        <div className="meta-item">
          <label>Project</label>
          <p>{team.project?.name || 'Unknown'}</p>
        </div>
      </div>

      <div className="team-stats">
        <div className="stat">
          <span className="stat-value">{team.member_count || 0}</span>
          <span className="stat-label">Members</span>
        </div>
      </div>

      <div className="team-actions">
        {onManageMembers && (
          <button
            className="btn-members"
            onClick={() => onManageMembers(team.id)}
            title="Manage team members"
          >
            Members
          </button>
        )}
        {onEdit && (
          <button
            className="btn-edit"
            onClick={() => onEdit(team)}
            title="Edit team"
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
                  `Are you sure you want to delete "${team.name}"?`
                )
              ) {
                onDelete(team.id)
              }
            }}
            title="Delete team"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
