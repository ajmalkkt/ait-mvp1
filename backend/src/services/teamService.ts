// backend/src/services/teamService.ts
// Team business logic and database operations

import { query } from '../db/connection.js'
import { v4 as uuidv4 } from 'uuid'

export interface TeamInput {
  project_id: string
  name: string
  description?: string
  lead_id: string
}

export interface Team extends TeamInput {
  id: string
  company_id: string
  created_at: string
  updated_at: string
  archived_at?: string
}

export interface TeamDetail extends Team {
  lead?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
  member_count?: number
  project?: {
    id: string
    name: string
  }
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  joined_at: string
  user?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
}

export async function createTeam(
  companyId: string,
  data: TeamInput
): Promise<Team> {
  const id = uuidv4()
  const now = new Date().toISOString()

  const result = await query(
    `INSERT INTO teams (
      id, company_id, project_id, name, description, lead_id,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      id,
      companyId,
      data.project_id,
      data.name,
      data.description || null,
      data.lead_id,
      now,
      now
    ]
  )

  return result.rows[0]
}

export async function getTeam(
  companyId: string,
  teamId: string
): Promise<TeamDetail | null> {
  const result = await query(
    `SELECT 
      t.*,
      json_build_object(
        'id', u.id,
        'email', u.email,
        'first_name', u.first_name,
        'last_name', u.last_name
      ) as lead,
      json_build_object(
        'id', p.id,
        'name', p.name
      ) as project,
      (SELECT COUNT(*) FROM user_team_members WHERE team_id = t.id) as member_count
    FROM teams t
    LEFT JOIN users u ON t.lead_id = u.id
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = $1 AND t.company_id = $2 AND t.archived_at IS NULL`,
    [teamId, companyId]
  )

  return result.rows[0] || null
}

export interface ListOptions {
  page?: number
  pageSize?: number
  project_id?: string
  search?: string
}

export async function listTeams(
  companyId: string,
  options: ListOptions = {}
): Promise<{ items: Team[]; total: number }> {
  const page = options.page || 1
  const pageSize = Math.min(options.pageSize || 25, 100)
  const offset = (page - 1) * pageSize

  let sql = `SELECT t.* FROM teams t WHERE t.company_id = $1 AND t.archived_at IS NULL`
  const params: any[] = [companyId]
  let paramIndex = 2

  // Filter by project
  if (options.project_id) {
    sql += ` AND t.project_id = $${paramIndex++}`
    params.push(options.project_id)
  }

  // Search by name
  if (options.search) {
    sql += ` AND t.name ILIKE $${paramIndex++}`
    params.push(`%${options.search}%`)
  }

  // Count total
  let countSql = `SELECT COUNT(*) as count FROM teams t WHERE t.company_id = $1 AND t.archived_at IS NULL`
  const countParams: any[] = [companyId]
  if (options.project_id) {
    countSql += ` AND t.project_id = $2`
    countParams.push(options.project_id)
  }

  const countResult = await query(countSql, countParams)
  const total = parseInt(countResult.rows[0].count, 10)

  // Get paginated results
  const orderAndLimit = ` ORDER BY t.name ASC LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`
  params.push(pageSize, offset)

  const result = await query(sql + orderAndLimit, params)
  return { items: result.rows, total }
}

export async function updateTeam(
  companyId: string,
  teamId: string,
  data: Partial<TeamInput>
): Promise<Team | null> {
  const now = new Date().toISOString()
  const updates: string[] = []
  const values: any[] = [companyId, teamId]
  let paramIndex = 3

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`)
    values.push(data.name)
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`)
    values.push(data.description)
  }
  if (data.lead_id !== undefined) {
    updates.push(`lead_id = $${paramIndex++}`)
    values.push(data.lead_id)
  }

  if (updates.length === 0) {
    return getTeam(companyId, teamId)
  }

  updates.push(`updated_at = $${paramIndex++}`)
  values.push(now)

  const result = await query(
    `UPDATE teams 
    SET ${updates.join(', ')}
    WHERE id = $2 AND company_id = $1 AND archived_at IS NULL
    RETURNING *`,
    values
  )

  return result.rows[0] || null
}

export async function archiveTeam(
  companyId: string,
  teamId: string
): Promise<Team | null> {
  const now = new Date().toISOString()

  const result = await query(
    `UPDATE teams 
    SET archived_at = $1
    WHERE id = $2 AND company_id = $3 AND archived_at IS NULL
    RETURNING *`,
    [now, teamId, companyId]
  )

  return result.rows[0] || null
}

export async function addTeamMember(
  companyId: string,
  teamId: string,
  userId: string
): Promise<TeamMember> {
  const id = uuidv4()
  const now = new Date().toISOString()

  const result = await query(
    `INSERT INTO user_team_members (id, team_id, user_id, joined_at)
    VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [id, teamId, userId, now]
  )

  return result.rows[0]
}

export async function removeTeamMember(
  companyId: string,
  teamId: string,
  userId: string
): Promise<boolean> {
  const result = await query(
    `DELETE FROM user_team_members 
    WHERE team_id = $1 AND user_id = $2
    RETURNING id`,
    [teamId, userId]
  )

  return result.rows.length > 0
}

export async function listTeamMembers(
  companyId: string,
  teamId: string,
  options: { page?: number; pageSize?: number } = {}
): Promise<{ members: TeamMember[]; total: number }> {
  const page = options.page || 1
  const pageSize = Math.min(options.pageSize || 50, 100)
  const offset = (page - 1) * pageSize

  // Count total
  const countResult = await query(
    `SELECT COUNT(*) as count FROM user_team_members WHERE team_id = $1`,
    [teamId]
  )
  const total = parseInt(countResult.rows[0].count, 10)

  // Get paginated members with user details
  const result = await query(
    `SELECT 
      utm.id, utm.team_id, utm.user_id, utm.joined_at,
      json_build_object(
        'id', u.id,
        'email', u.email,
        'first_name', u.first_name,
        'last_name', u.last_name
      ) as user
    FROM user_team_members utm
    LEFT JOIN users u ON utm.user_id = u.id
    WHERE utm.team_id = $1
    ORDER BY utm.joined_at DESC
    LIMIT $2 OFFSET $3`,
    [teamId, pageSize, offset]
  )

  return { members: result.rows, total }
}
