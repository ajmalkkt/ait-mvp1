// backend/src/server.ts
// Server startup and graceful shutdown

import 'dotenv/config'
import app from './app.js'
import { startEmailWorker, stopEmailWorker } from './workers/emailWorker.js'
import { startEscalationJob, stopEscalationJob } from './jobs/escalationJob.js'

const PORT = parseInt(process.env.PORT || '3000', 10)
const NODE_ENV = process.env.NODE_ENV || 'development'

let server: any = null

async function start() {
  try {
    server = app.listen(PORT, () => {
      console.log(`[${NODE_ENV}] Server running on http://localhost:${PORT}`)
    })

    // Start background workers and jobs
    startEmailWorker()
    startEscalationJob()
    console.log('[Workers] Email worker and escalation job started')

    // Graceful shutdown
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason)
      shutdown()
    })

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error)
      shutdown()
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

function shutdown() {
  console.log('\nShutting down gracefully...')
  
  // Stop workers and jobs
  stopEmailWorker()
  stopEscalationJob()
  console.log('[Workers] Email worker and escalation job stopped')
  
  if (server) {
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Forcing shutdown')
      process.exit(1)
    }, 10000)
  }
}

start()
