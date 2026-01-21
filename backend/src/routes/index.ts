// backend/src/routes/index.ts
// Main API router

import { Router } from 'express'
import healthRoutes from './health.js'
import actionItemsRoutes from './actionItems.js'
import projectsRoutes from './projects.js'
import teamsRoutes from './teams.js'
import notificationsRoutes from './notifications.js'
import auditRoutes from './audit.js'
import dashboardRoutes from './dashboards.js'
import reportRoutes from './reports.js'

const router = Router()

// Health checks (no auth required)
router.use('/health', healthRoutes)

// Protected routes (require auth middleware)
router.use('/action-items', actionItemsRoutes)
router.use('/projects', projectsRoutes)
router.use('/teams', teamsRoutes)
router.use('/notifications', notificationsRoutes)
router.use('/audit', auditRoutes)
router.use('/dashboards', dashboardRoutes)
router.use('/reports', reportRoutes)

// TODO: Add remaining routes:
// router.use('/meetings', meetingsRoutes)
// router.use('/audit-logs', auditLogsRoutes)
// router.use('/reports', reportsRoutes)

export default router
