// backend/src/routes/dashboards.ts
// Dashboard aggregation endpoints

import { Router, Request, Response } from 'express'
import { validateAuth, validateCompany } from '../middleware/auth'
import { 
  getMyItemsDashboard, 
  getTeamDashboard, 
  getProjectDashboard 
} from '../services/dashboardService'

const router = Router()

// Middleware
router.use(validateAuth)
router.use(validateCompany)

/**
 * GET /api/v1/dashboards/my-items
 * Get user's personal dashboard with assigned items overview
 */
router.get('/my-items', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    const companyId = req.company?.id

    if (!userId || !companyId) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'User or company not found' 
      })
    }

    const dashboard = await getMyItemsDashboard(userId, companyId)

    res.json({
      success: true,
      data: dashboard,
    })
  } catch (error) {
    console.error('Error getting my-items dashboard:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * GET /api/v1/dashboards/team/:team_id
 * Get team dashboard with team metrics and member breakdown
 * Requires: Team lead or PM role
 */
router.get('/team/:team_id', async (req: Request, res: Response) => {
  try {
    const { team_id } = req.params
    const companyId = req.company?.id

    if (!companyId) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Company not found' 
      })
    }

    if (!team_id) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Team ID is required' 
      })
    }

    // TODO: Verify user has team lead or PM permissions
    // For now, allowing access to all authenticated users

    const dashboard = await getTeamDashboard(team_id, companyId)

    res.json({
      success: true,
      data: dashboard,
    })
  } catch (error) {
    console.error('Error getting team dashboard:', error)
    
    if (error instanceof Error && error.message === 'Team not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Team not found',
      })
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * GET /api/v1/dashboards/project/:project_id
 * Get project dashboard with project metrics and timeline
 * Requires: PM role
 */
router.get('/project/:project_id', async (req: Request, res: Response) => {
  try {
    const { project_id } = req.params
    const companyId = req.company?.id

    if (!companyId) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Company not found' 
      })
    }

    if (!project_id) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Project ID is required' 
      })
    }

    // TODO: Verify user has PM permissions
    // For now, allowing access to all authenticated users

    const dashboard = await getProjectDashboard(project_id, companyId)

    res.json({
      success: true,
      data: dashboard,
    })
  } catch (error) {
    console.error('Error getting project dashboard:', error)
    
    if (error instanceof Error && error.message === 'Project not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Project not found',
      })
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
