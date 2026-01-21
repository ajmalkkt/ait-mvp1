// backend/src/app.ts
// Express app initialization and middleware setup

import express, { Request, Response } from 'express'
import cors from 'cors'
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth.js'
import { companyMiddleware } from './middleware/company.js'
import { errorHandler, notFoundHandler } from './middleware/error.js'
import { auditMiddleware } from './middleware/auditMiddleware.js'
import { healthRouter } from './routes/health.js'

const app = express()

// Trust proxy
app.set('trust proxy', 1)

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req: Request, res: Response, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    })
  })
  next()
})

// Public routes (no auth required)
app.use('/health', healthRouter)
app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Protected routes (auth required)
app.use('/api/v1', authMiddleware)
app.use('/api/v1', companyMiddleware)
app.use('/api/v1', auditMiddleware())

// TODO: Mount API routers here
// app.use('/api/v1/action-items', actionItemsRouter)
// app.use('/api/v1/projects', projectsRouter)
// etc.

// 404 handler
app.use(notFoundHandler)

// Error handler (must be last)
app.use(errorHandler)

export default app
