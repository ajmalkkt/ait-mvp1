// backend/src/routes/projects.ts
// Projects resource endpoints

import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth.js'
import { ensureCompanyId } from '../middleware/company.js'
import { handleError, sendSuccess, sendError } from '../utils/response.js'
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
  archiveProject,
  ProjectInput,
  ListOptions
} from '../services/projectService.js'
import { validateProjectCreation, validateProjectUpdate } from '../utils/projectValidation.js'

const router = Router()

// POST /api/v1/projects - Create a new project
router.post('/', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const userId = req.user?.sub

    // Validate input
    const validation = validateProjectCreation(req.body)
    if (!validation.valid) {
      return sendError(res, 400, 'Validation failed', validation.errors)
    }

    // Create project
    const data: ProjectInput = {
      name: req.body.name,
      description: req.body.description,
      pm_id: req.body.pm_id,
      start_date: req.body.start_date,
      end_date: req.body.end_date
    }

    const project = await createProject(companyId, data)

    sendSuccess(res, project, 201)
  } catch (error) {
    handleError(res, error)
  }
})

// GET /api/v1/projects - List projects
router.get('/', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 25
    const search = req.query.search as string | undefined
    const pm_id = req.query.pm_id as string | undefined

    const options: ListOptions = {
      page,
      pageSize,
      search,
      pm_id
    }

    const { items, total } = await listProjects(companyId, options)

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

// GET /api/v1/projects/:id - Get single project
router.get('/:id', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const projectId = req.params.id

    const project = await getProject(companyId, projectId)
    if (!project) {
      return sendError(res, 404, 'Project not found')
    }

    sendSuccess(res, project)
  } catch (error) {
    handleError(res, error)
  }
})

// PUT /api/v1/projects/:id - Update project
router.put('/:id', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const projectId = req.params.id

    // Validate input
    const validation = validateProjectUpdate(req.body)
    if (!validation.valid) {
      return sendError(res, 400, 'Validation failed', validation.errors)
    }

    const data: Partial<ProjectInput> = {
      name: req.body.name,
      description: req.body.description,
      pm_id: req.body.pm_id,
      start_date: req.body.start_date,
      end_date: req.body.end_date
    }

    const project = await updateProject(companyId, projectId, data)
    if (!project) {
      return sendError(res, 404, 'Project not found')
    }

    sendSuccess(res, project)
  } catch (error) {
    handleError(res, error)
  }
})

// PATCH /api/v1/projects/:id/archive - Archive project
router.patch('/:id/archive', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const projectId = req.params.id

    const project = await archiveProject(companyId, projectId)
    if (!project) {
      return sendError(res, 404, 'Project not found')
    }

    sendSuccess(res, project)
  } catch (error) {
    handleError(res, error)
  }
})

// DELETE /api/v1/projects/:id - Delete project (soft delete)
router.delete('/:id', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const projectId = req.params.id

    const project = await archiveProject(companyId, projectId)
    if (!project) {
      return sendError(res, 404, 'Project not found')
    }

    sendSuccess(res, { success: true })
  } catch (error) {
    handleError(res, error)
  }
})

export default router
