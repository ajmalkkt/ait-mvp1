// backend/src/routes/audit.ts
// Audit log and compliance endpoints

import { Router, Request, Response } from 'express'
import auditLogService from '../services/auditLogService'
import changeHistoryService from '../services/changeHistoryService'
import complianceService from '../services/complianceService'
import { requireAuth } from '../middleware/auth'
import logger from '../utils/logger'

const router = Router()

/**
 * GET /api/v1/audit-logs
 * List audit logs with filters
 */
router.get('/logs', requireAuth, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id
    const { action, resource_type, user_id, start_date, end_date, page, pageSize } = req.query

    const logs = await auditLogService.getAuditLogs(companyId, {
      action: action as string,
      resource_type: resource_type as string,
      user_id: user_id as string,
      start_date: start_date as string,
      end_date: end_date as string,
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 20
    })

    res.json({
      success: true,
      data: logs
    })
  } catch (error) {
    logger.error('Error fetching audit logs:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs'
    })
  }
})

/**
 * GET /api/v1/audit-logs/:id
 * Get single audit log
 */
router.get('/logs/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id
    const { id } = req.params

    const log = await auditLogService.getAuditLog(companyId, id)

    res.json({
      success: true,
      data: log
    })
  } catch (error) {
    logger.error('Error fetching audit log:', error)
    res.status(404).json({
      success: false,
      error: 'Audit log not found'
    })
  }
})

/**
 * GET /api/v1/audit-logs/activity-summary
 * Get activity summary for date range
 */
router.get('/activity-summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id
    const { start_date, end_date } = req.query

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'start_date and end_date required'
      })
    }

    const summary = await auditLogService.getActivitySummary(companyId, {
      start: start_date as string,
      end: end_date as string
    })

    res.json({
      success: true,
      data: summary
    })
  } catch (error) {
    logger.error('Error fetching activity summary:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity summary'
    })
  }
})

/**
 * GET /api/v1/change-history/:resource_id
 * Get change history for resource
 */
router.get('/change-history/:resource_id', requireAuth, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id
    const { resource_id } = req.params
    const { resource_type } = req.query

    const history = await changeHistoryService.getChangeHistory(
      companyId,
      resource_id,
      resource_type as string
    )

    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    logger.error('Error fetching change history:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch change history'
    })
  }
})

/**
 * GET /api/v1/change-history/:resource_id/timeline
 * Get resource timeline
 */
router.get('/change-history/:resource_id/timeline', requireAuth, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id
    const { resource_id } = req.params
    const { resource_type } = req.query

    const timeline = await changeHistoryService.getResourceTimeline(
      companyId,
      resource_id,
      resource_type as string
    )

    res.json({
      success: true,
      data: timeline
    })
  } catch (error) {
    logger.error('Error fetching timeline:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timeline'
    })
  }
})

/**
 * GET /api/v1/compliance/report
 * Generate compliance report
 */
router.get('/compliance/report', requireAuth, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id
    const { start_date, end_date } = req.query

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'start_date and end_date required'
      })
    }

    const report = await complianceService.generateComplianceReport(companyId, {
      start: start_date as string,
      end: end_date as string
    })

    res.json({
      success: true,
      data: report
    })
  } catch (error) {
    logger.error('Error generating compliance report:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate compliance report'
    })
  }
})

/**
 * GET /api/v1/compliance/user-activity/:user_id
 * Generate user activity report
 */
router.get('/compliance/user-activity/:user_id', requireAuth, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id
    const { user_id } = req.params
    const { start_date, end_date } = req.query

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'start_date and end_date required'
      })
    }

    const report = await complianceService.generateUserActivityReport(
      companyId,
      user_id,
      {
        start: start_date as string,
        end: end_date as string
      }
    )

    res.json({
      success: true,
      data: report
    })
  } catch (error) {
    logger.error('Error generating user activity report:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate user activity report'
    })
  }
})

/**
 * GET /api/v1/compliance/access-report
 * Generate access report
 */
router.get('/compliance/access-report', requireAuth, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.company_id
    const { start_date, end_date } = req.query

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'start_date and end_date required'
      })
    }

    const report = await complianceService.generateAccessReport(companyId, {
      start: start_date as string,
      end: end_date as string
    })

    res.json({
      success: true,
      data: report
    })
  } catch (error) {
    logger.error('Error generating access report:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate access report'
    })
  }
})

export default router
