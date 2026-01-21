// backend/src/routes/health.ts
// Health check endpoint

import { Router, Request, Response } from 'express'

export const healthRouter = Router()

healthRouter.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

healthRouter.get('/ready', (req: Request, res: Response) => {
  // TODO: Add database connection check
  res.json({
    ready: true,
    timestamp: new Date().toISOString()
  })
})
