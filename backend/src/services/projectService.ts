// backend/src/services/projectService.ts
// Project business logic and database operations

import { query } from '../db/connection.js'
import { v4 as uuidv4 } from 'uuid'

export interface ProjectInput {
  name: string
  description?: string
  pm_id: string
  start_date: string
  end_date: string
}

export interface Project extends ProjectInput {
  id: string
  company_id: string
  created_at: string
  updated_at: string
  archived_at?: string
}

export interface ProjectDetail extends Project {
  pm?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
  team_count?: number
  action_item_count?: number
}

export async function createProject(
  companyId: string,
  data: ProjectInput
): Promise<Project> {
  const id = uuidv4()
  const now = new Date().toISOString()

  const result = await query(
    `INSERT INTO projects (
      id, company_id, name, description, pm_id, start_date, end_date,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      id,
      companyId,
      data.name,
      data.description || null,
      data.pm_id,
      data.start_date,
      data.end_date,
      now,
      now
    ]
  )

  return result.rows[0]
}

export async function getProject(
  companyId: string,
  projectId: string
): Promise<ProjectDetail | null> {
  const result = await query(
    `SELECT 
      p.*,
      json_build_object(
        'id', u.id,
        'email', u.email,
        'first_name', u.first_name,
        'last_name', u.last_name
      ) as pm,
      (SELECT COUNT(*) FROM teams WHERE project_id = p.id AND archived_at IS NULL) as team_count,
      (SELECT COUNT(*) FROM action_items WHERE project_id = p.id AND archived_at IS NULL) as action_item_count
    FROM projects p
    LEFT JOIN users u ON p.pm_id = u.id
    WHERE p.id = $1 AND p.company_id = $2 AND p.archived_at IS NULL`,
    [projectId, companyId]
  )

  return result.rows[0] || null
}

export interface ListOptions {
  page?: number
  pageSize?: number
  search?: string
  pm_id?: string
}

export async function listProjects(
  companyId: string,
  options: ListOptions = {}
): Promise<{ items: Project[]; total: number }> {
  const page = options.page || 1
  const pageSize = Math.min(options.pageSize || 25, 100)
  const offset = (page - 1) * pageSize

  let sql = `SELECT p.* FROM projects p WHERE p.company_id = $1 AND p.archived_at IS NULL`
  const params: any[] = [companyId]
  let paramIndex = 2

  // Search by name or description
  if (options.search) {
    sql += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`
    params.push(`%${options.search}%`)
    paramIndex++
  }

  // Filter by project manager
  if (options.pm_id) {
    sql += ` AND p.pm_id = $${paramIndex++}`
    params.push(options.pm_id)
  }

  // Count total
  const countResult = await query(
    `SELECT COUNT(*) as count FROM projects p WHERE p.company_id = $1 AND p.archived_at IS NULL`,
    [companyId]
  )
  const total = parseInt(countResult.rows[0].count, 10)

  // Get paginated results
  const orderAndLimit = ` ORDER BY p.start_date ASC, p.name ASC LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`
  params.push(pageSize, offset)

  const result = await query(sql + orderAndLimit, params)
  return { items: result.rows, total }
}

export async function updateProject(
  companyId: string,
  projectId: string,
  data: Partial<ProjectInput>
): Promise<Project | null> {
  const now = new Date().toISOString()
  const updates: string[] = []
  const values: any[] = [companyId, projectId]
  let paramIndex = 3

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`)
    values.push(data.name)
  }
  if (data.description !== undefined) {
    updates.push(`description = $${paramIndex++}`)
    values.push(data.description)
  }
  if (data.pm_id !== undefined) {
    updates.push(`pm_id = $${paramIndex++}`)
    values.push(data.pm_id)
  }
  if (data.start_date !== undefined) {
    updates.push(`start_date = $${paramIndex++}`)
    values.push(data.start_date)
  }
  if (data.end_date !== undefined) {
    updates.push(`end_date = $${paramIndex++}`)
    values.push(data.end_date)
  }

  if (updates.length === 0) {
    return getProject(companyId, projectId)
  }

  updates.push(`updated_at = $${paramIndex++}`)
  values.push(now)

  const result = await query(
    `UPDATE projects 
    SET ${updates.join(', ')}
    WHERE id = $2 AND company_id = $1 AND archived_at IS NULL
    RETURNING *`,
    values
  )

  return result.rows[0] || null
}

export async function archiveProject(
  companyId: string,
  projectId: string
): Promise<Project | null> {
  const now = new Date().toISOString()

  const result = await query(
    `UPDATE projects 
    SET archived_at = $1
    WHERE id = $2 AND company_id = $3 AND archived_at IS NULL
    RETURNING *`,
    [now, projectId, companyId]
  )

  return result.rows[0] || null
}

export async function unarchiveProject(
  companyId: string,
  projectId: string
): Promise<Project | null> {
  const result = await query(
    `UPDATE projects 
    SET archived_at = NULL
    WHERE id = $1 AND company_id = $2
    RETURNING *`,
    [projectId, companyId]
  )

  return result.rows[0] || null
}
