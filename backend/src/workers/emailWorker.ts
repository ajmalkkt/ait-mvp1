// backend/src/workers/emailWorker.ts
// Email worker for sending emails from queue

import { exec } from 'child_process'
import { promisify } from 'util'
import emailQueueService from '../services/emailQueueService'
import db from '../db'
import logger from '../utils/logger'

const execAsync = promisify(exec)
const BATCH_SIZE = 10
const DELAY_BETWEEN_BATCHES = 1000 // 1 second

interface EmailConfig {
  from: string
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

let isRunning = false

/**
 * Get email configuration from environment
 */
function getEmailConfig(): EmailConfig | null {
  const {
    MAIL_FROM,
    MAIL_HOST,
    MAIL_PORT,
    MAIL_SECURE,
    MAIL_USER,
    MAIL_PASSWORD
  } = process.env

  if (!MAIL_HOST || !MAIL_USER || !MAIL_PASSWORD) {
    logger.warn('Email configuration incomplete, worker will not send emails')
    return null
  }

  return {
    from: MAIL_FROM || MAIL_USER,
    host: MAIL_HOST,
    port: parseInt(MAIL_PORT || '587'),
    secure: MAIL_SECURE === 'true',
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASSWORD
    }
  }
}

/**
 * Get template HTML with data rendered
 */
function renderTemplate(template: string, data: Record<string, any>): string {
  let html = template
  Object.keys(data).forEach(key => {
    const value = data[key]
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
  })
  return html
}

/**
 * Send single email using sendmail or similar
 */
async function sendEmail(
  to: string,
  subject: string,
  body: string,
  html?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailConfig = getEmailConfig()
    
    if (!emailConfig) {
      logger.info(`[EmailWorker] Simulating email send (no config): ${to}`)
      return { success: true }
    }

    // Use nodemailer if available, otherwise use system mail command
    try {
      const nodemailer = require('nodemailer')
      const transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: emailConfig.auth
      })

      await transporter.sendMail({
        from: emailConfig.from,
        to,
        subject,
        text: body,
        html: html || body
      })

      logger.info(`[EmailWorker] Email sent to ${to} (subject: ${subject})`)
      return { success: true }
    } catch (nodeError) {
      // Fallback to sendmail command
      logger.debug(`[EmailWorker] Nodemailer not available, trying sendmail command`)

      // Create temporary email file
      const emailContent = `To: ${to}\nSubject: ${subject}\n\n${body}`
      
      // Try to send via sendmail (Unix/Linux systems)
      if (process.platform !== 'win32') {
        const { stdout, stderr } = await execAsync(
          `echo "${emailContent.replace(/"/g, '\\"')}" | sendmail ${to}`
        )
        
        if (stderr && stderr.includes('error')) {
          throw new Error(stderr)
        }

        logger.info(`[EmailWorker] Email sent to ${to} via sendmail`)
        return { success: true }
      } else {
        // Windows: log to console
        logger.info(`[EmailWorker] Windows system - simulating email send: ${to}`)
        return { success: true }
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(`[EmailWorker] Failed to send email to ${to}: ${errorMessage}`)
    return { success: false, error: errorMessage }
  }
}

/**
 * Process a batch of pending emails
 */
async function processBatch(): Promise<{ processed: number; failed: number }> {
  try {
    // Get pending emails
    const emailQueue = await emailQueueService.getPendingEmails(BATCH_SIZE)
    
    if (emailQueue.length === 0) {
      return { processed: 0, failed: 0 }
    }

    let processed = 0
    let failed = 0

    for (const email of emailQueue) {
      try {
        // Render template if provided
        let body = email.body
        let html = undefined

        if (email.template && email.template_data) {
          html = renderTemplate(email.template, email.template_data)
        }

        // Send email
        const result = await sendEmail(
          email.recipient_email,
          email.subject,
          body,
          html
        )

        if (result.success) {
          // Mark as sent
          await emailQueueService.markEmailSent(email.id)
          processed++
          logger.debug(`[EmailWorker] Email ${email.id} marked as sent`)
        } else {
          // Mark as failed (will trigger retry logic)
          await emailQueueService.markEmailFailed(email.id, result.error || 'Unknown error')
          failed++
          logger.debug(`[EmailWorker] Email ${email.id} marked as failed: ${result.error}`)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        await emailQueueService.markEmailFailed(email.id, errorMessage)
        failed++
        logger.error(`[EmailWorker] Error processing email ${email.id}: ${errorMessage}`)
      }
    }

    logger.info(`[EmailWorker] Batch processed: ${processed} sent, ${failed} failed`)
    return { processed, failed }
  } catch (error) {
    logger.error(`[EmailWorker] Batch processing error: ${error}`)
    return { processed: 0, failed: 0 }
  }
}

/**
 * Start the email worker
 */
export async function startEmailWorker() {
  if (isRunning) {
    logger.warn('[EmailWorker] Worker already running')
    return
  }

  isRunning = true
  logger.info('[EmailWorker] Started')

  const runLoop = async () => {
    try {
      while (isRunning) {
        const result = await processBatch()
        
        // Log stats periodically
        if (result.processed > 0 || result.failed > 0) {
          logger.debug(`[EmailWorker] Batch: ${result.processed} processed, ${result.failed} failed`)
        }

        // Wait before next batch
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
      }
    } catch (error) {
      logger.error(`[EmailWorker] Loop error: ${error}`)
      
      // Restart loop after delay if still running
      if (isRunning) {
        setTimeout(runLoop, 5000)
      }
    }
  }

  // Start the processing loop
  runLoop()
}

/**
 * Stop the email worker
 */
export function stopEmailWorker() {
  isRunning = false
  logger.info('[EmailWorker] Stopped')
}

/**
 * Get worker status
 */
export function getEmailWorkerStatus() {
  return {
    running: isRunning,
    batchSize: BATCH_SIZE
  }
}

export default {
  startEmailWorker,
  stopEmailWorker,
  getEmailWorkerStatus
}
