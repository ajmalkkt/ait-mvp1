// backend/src/routes/actionItems.ts
// Action item API endpoints

import express, { Router, Request, Response, NextFunction } from 'express'
import * as actionItemService from '../services/actionItemService.js'
import * as auditService from '../services/auditService.js'
import * as validation from '../utils/actionItemValidation.js'
import { AppError } from '../middleware/error.js'

const router = Router()

// Extend Request type to include user info from auth middleware
interface AuthRequest extends Request {
  user_id?: string
  company_id?: string
  userRole?: string
}

/**
 * POST /api/v1/action-items
 * Create a new action item
 */
router.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { title, description, owner_id, project_id, team_id, meeting_id, priority, due_date } = req.body
    const companyId = req.company_id!
    const userId = req.user_id!

    // Validate input
    const result = validation.validateActionItemCreation({
      title,
      description,
      owner_id,
      project_id,
      team_id,
      meeting_id,
      priority: priority || 'medium',
      due_date
    })

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.errors
      })
    }

    // Create the action item
    const actionItem = await actionItemService.createActionItem(companyId, {
      title,
      description,
      owner_id,
      project_id,
      team_id: team_id || undefined,
      meeting_id: meeting_id || undefined,
      priority: priority || 'medium',
      due_date
    })

    // Log creation to audit trail
    await auditService.logActionItemCreated(companyId, actionItem.id, actionItem, userId)

    res.status(201).json({
      success: true,
      data: actionItem
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/v1/action-items
 * List action items with filters and pagination
 */
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.company_id!
    const {
      page = 1,
      pageSize = 25,
      status,
      owner_id,
      priority,
      project_id,
      team_id,
      due_date_from,
      due_date_to
    } = req.query

    const { items, total } = await actionItemService.listActionItems(companyId, {
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
      status: status as string | undefined,
      owner_id: owner_id as string | undefined,
      priority: priority as string | undefined,
      project_id: project_id as string | undefined,
      team_id: team_id as string | undefined,
      due_date_from: due_date_from as string | undefined,
      due_date_to: due_date_to as string | undefined
    })

    res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        totalPages: Math.ceil(total / parseInt(pageSize as string))
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/v1/action-items/:id
 * Get a specific action item
 */
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const companyId = req.company_id!

    const actionItem = await actionItemService.getActionItem(companyId, id)

    if (!actionItem) {
      throw new AppError(404, 'Action item not found')
    }

    res.json({
      success: true,
      data: actionItem
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/v1/action-items/:id
 * Update action item fields
 */
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { title, description, owner_id, project_id, priority, due_date, version } = req.body
    const companyId = req.company_id!
    const userId = req.user_id!

    if (!version) {
      throw new AppError(400, 'Version field is required for optimistic locking')
    }

    // Validate input
    const result = validation.validateActionItemUpdate({
      title,
      description,
      owner_id,
      project_id,
      priority,
      due_date
    })

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.errors
      })
    }

    // Get current item for logging
    const currentItem = await actionItemService.getActionItem(companyId, id)
    if (!currentItem) {
      throw new AppError(404, 'Action item not found')
    }

    // Update the action item
    const updated = await actionItemService.updateActionItem(
      companyId,
      id,
      {
        title: title !== undefined ? title : currentItem.title,
        description: description !== undefined ? description : currentItem.description,
        owner_id: owner_id !== undefined ? owner_id : currentItem.owner_id,
        project_id: project_id !== undefined ? project_id : currentItem.project_id,
        priority: priority !== undefined ? priority : currentItem.priority,
        due_date: due_date !== undefined ? due_date : currentItem.due_date
      },
      version
    )

    if (!updated) {
      // Version mismatch - concurrent edit
      const latestItem = await actionItemService.getActionItem(companyId, id)
      return res.status(409).json({
        success: false,
        error: 'Conflict: Item has been modified',
        details: {
          message: 'This item has been modified by another user. Please refresh to see the latest changes.',
          currentVersion: latestItem?.version
        },
        data: latestItem
      })
    }

    // Log the change
    await auditService.logChange(
      companyId,
      'action_item',
      id,
      'updated',
      {
        title: currentItem.title,
        description: currentItem.description,
        owner_id: currentItem.owner_id,
        priority: currentItem.priority,
        due_date: currentItem.due_date
      },
      {
        title: updated.title,
        description: updated.description,
        owner_id: updated.owner_id,
        priority: updated.priority,
        due_date: updated.due_date
      },
      userId
    )

    res.json({
      success: true,
      data: updated
    })
  } catch (error) {
    next(error)
  }
})

/**
 * PATCH /api/v1/action-items/:id/status
 * Change action item status
 */
router.patch('/:id/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { status, version } = req.body
    const companyId = req.company_id!
    const userId = req.user_id!

    if (!status || !version) {
      throw new AppError(400, 'Status and version fields are required')
    }

    // Get current item
    const currentItem = await actionItemService.getActionItem(companyId, id)
    if (!currentItem) {
      throw new AppError(404, 'Action item not found')
    }

    // Validate status transition
    const validationResult = validation.validateStatusChange(currentItem.status, status)
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status transition',
        details: validationResult.errors
      })
    }

    // Update status
    const updated = await actionItemService.changeActionItemStatus(companyId, id, status, version)

    if (!updated) {
      // Version mismatch
      const latestItem = await actionItemService.getActionItem(companyId, id)
      return res.status(409).json({
        success: false,
        error: 'Conflict: Item has been modified',
        details: {
          message: 'This item has been modified by another user. Please refresh to see the latest changes.',
          currentVersion: latestItem?.version
        },
        data: latestItem
      })
    }

    // Log the status change
    await auditService.logActionItemStatusChange(
      companyId,
      id,
      currentItem.status,
      status,
      userId
    )

    res.json({
      success: true,
      data: updated
    })
  } catch (error) {
    next(error)
  }
})

/**
 * GET /api/v1/action-items/:id/history
 * Get action item change history
 */
router.get('/:id/history', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const companyId = req.company_id!
    const { page = 1, pageSize = 25 } = req.query

    // Verify item exists
    const actionItem = await actionItemService.getActionItem(companyId, id)
    if (!actionItem) {
      throw new AppError(404, 'Action item not found')
    }

    const history = await actionItemService.getActionItemHistory(companyId, id)

    // Simple pagination
    const pageNum = parseInt(page as string)
    const pageSizeNum = parseInt(pageSize as string)
    const offset = (pageNum - 1) * pageSizeNum
    const paginatedHistory = history.slice(offset, offset + pageSizeNum)

    res.json({
      success: true,
      data: paginatedHistory,
      pagination: {
        total: history.length,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(history.length / pageSizeNum)
      }
    })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/v1/action-items/:id
 * Archive (soft delete) an action item
 */
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const companyId = req.company_id!
    const userId = req.user_id!

    // Verify item exists
    const actionItem = await actionItemService.getActionItem(companyId, id)
    if (!actionItem) {
      throw new AppError(404, 'Action item not found')
    }

    // Archive the item
    const archived = await actionItemService.archiveActionItem(companyId, id)

    // Log the archive
    await auditService.logChange(
      companyId,
      'action_item',
      id,
      'archived',
      { status: actionItem.status },
      { archived: true },
      userId
    )

    res.json({
      success: true,
      message: 'Action item archived successfully'
    })
  } catch (error) {
    next(error)
  }
})

export default router
