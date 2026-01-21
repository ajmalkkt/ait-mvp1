// backend/src/routes/notifications.ts
// Notifications resource endpoints

import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth.js'
import { ensureCompanyId } from '../middleware/company.js'
import { handleError, sendSuccess, sendError } from '../utils/response.js'
import {
  listNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../services/notificationService.js'

const router = Router()

// GET /api/v1/notifications - List user's notifications
router.get('/', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const userId = req.user?.sub
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 25
    const isRead = req.query.isRead ? req.query.isRead === 'true' : undefined
    const type = req.query.type as string | undefined

    const { items, total, unread } = await listNotifications(companyId, userId, {
      page,
      pageSize,
      is_read: isRead,
      type
    })

    sendSuccess(res, {
      data: items,
      pagination: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize),
        unread
      }
    })
  } catch (error) {
    handleError(res, error)
  }
})

// GET /api/v1/notifications/:id - Get single notification
router.get('/:id', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const notificationId = req.params.id

    const notification = await getNotification(companyId, notificationId)
    if (!notification) {
      return sendError(res, 404, 'Notification not found')
    }

    sendSuccess(res, notification)
  } catch (error) {
    handleError(res, error)
  }
})

// PATCH /api/v1/notifications/:id/read - Mark notification as read
router.patch('/:id/read', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const notificationId = req.params.id

    const notification = await markAsRead(companyId, notificationId)
    if (!notification) {
      return sendError(res, 404, 'Notification not found or already read')
    }

    sendSuccess(res, notification)
  } catch (error) {
    handleError(res, error)
  }
})

// PATCH /api/v1/notifications/read-all - Mark all notifications as read
router.patch('/read-all', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const userId = req.user?.sub

    const count = await markAllAsRead(companyId, userId)

    sendSuccess(res, { success: true, marked_as_read: count })
  } catch (error) {
    handleError(res, error)
  }
})

// DELETE /api/v1/notifications/:id - Delete notification
router.delete('/:id', authenticate, ensureCompanyId, async (req: Request, res: Response) => {
  try {
    const companyId = req.company_id
    const notificationId = req.params.id

    const success = await deleteNotification(companyId, notificationId)
    if (!success) {
      return sendError(res, 404, 'Notification not found')
    }

    sendSuccess(res, { success: true })
  } catch (error) {
    handleError(res, error)
  }
})

export default router
