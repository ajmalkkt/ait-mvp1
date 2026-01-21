// backend/src/routes/teams.ts
// Teams resource endpoints

import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth.js'
import { ensureCompanyId } from '../middleware/company.js'
import { handleError, sendSuccess, sendError } from '../utils/response.js'
import {
  createTeam,
  getTeam,
  listTeams,
  updateTeam,
  archiveTeam,
  addTeamMember,
  removeTeamMember,
  listTeamMembers,
  TeamInput,
  ListOptions
} from '../services/teamService.js'
import { validateTeamCreation, validateTeamUpdate, validateTeamMemberAdd } from '../utils/teamValidation.js'

const router = Router()

// POST /api/v1/teams - Create a new team
router.post('/', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id

    // Validate input
    const validation = validateTeamCreation(req.body)
    if (!validation.valid) {
      return sendError(res, 400, 'Validation failed', validation.errors)
    }

    // Create team
    const data: TeamInput = {
      project_id: req.body.project_id,
      name: req.body.name,
      description: req.body.description,
      lead_id: req.body.lead_id
    }

    const team = await createTeam(companyId, data)

    sendSuccess(res, team, 201)
  } catch (error) {
    handleError(res, error)
  }
})

// GET /api/v1/teams - List teams
router.get('/', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 25
    const project_id = req.query.project_id as string | undefined
    const search = req.query.search as string | undefined

    const options: ListOptions = {
      page,
      pageSize,
      project_id,
      search
    }

    const { items, total } = await listTeams(companyId, options)

    sendSuccess(res, {
      data: items,
      pagination: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    handleError(res, error)
  }
})

// GET /api/v1/teams/:id - Get single team
router.get('/:id', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const teamId = req.params.id

    const team = await getTeam(companyId, teamId)
    if (!team) {
      return sendError(res, 404, 'Team not found')
    }

    sendSuccess(res, team)
  } catch (error) {
    handleError(res, error)
  }
})

// PUT /api/v1/teams/:id - Update team
router.put('/:id', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const teamId = req.params.id

    // Validate input
    const validation = validateTeamUpdate(req.body)
    if (!validation.valid) {
      return sendError(res, 400, 'Validation failed', validation.errors)
    }

    const data: Partial<TeamInput> = {
      name: req.body.name,
      description: req.body.description,
      lead_id: req.body.lead_id,
      project_id: req.body.project_id
    }

    const team = await updateTeam(companyId, teamId, data)
    if (!team) {
      return sendError(res, 404, 'Team not found')
    }

    sendSuccess(res, team)
  } catch (error) {
    handleError(res, error)
  }
})

// PATCH /api/v1/teams/:id/archive - Archive team
router.patch('/:id/archive', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const teamId = req.params.id

    const team = await archiveTeam(companyId, teamId)
    if (!team) {
      return sendError(res, 404, 'Team not found')
    }

    sendSuccess(res, team)
  } catch (error) {
    handleError(res, error)
  }
})

// DELETE /api/v1/teams/:id - Delete team (soft delete)
router.delete('/:id', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const teamId = req.params.id

    const team = await archiveTeam(companyId, teamId)
    if (!team) {
      return sendError(res, 404, 'Team not found')
    }

    sendSuccess(res, { success: true })
  } catch (error) {
    handleError(res, error)
  }
})

// POST /api/v1/teams/:id/members - Add team member
router.post('/:id/members', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const teamId = req.params.id

    // Validate input
    const validation = validateTeamMemberAdd(req.body.user_id)
    if (!validation.valid) {
      return sendError(res, 400, 'Validation failed', validation.errors)
    }

    const member = await addTeamMember(companyId, teamId, req.body.user_id)

    sendSuccess(res, member, 201)
  } catch (error) {
    handleError(res, error)
  }
})

// GET /api/v1/teams/:id/members - List team members
router.get('/:id/members', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const teamId = req.params.id
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 50

    const { members, total } = await listTeamMembers(companyId, teamId, {
      page,
      pageSize
    })

    sendSuccess(res, {
      data: members,
      pagination: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    handleError(res, error)
  }
})

// DELETE /api/v1/teams/:id/members/:userId - Remove team member
router.delete('/:id/members/:userId', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const teamId = req.params.id
    const userId = req.params.userId

    const success = await removeTeamMember(companyId, teamId, userId)
    if (!success) {
      return sendError(res, 404, 'Team member not found')
    }

    sendSuccess(res, { success: true })
  } catch (error) {
    handleError(res, error)
  }
})

export default router
