// backend/src/jobs/escalationJob.ts
// Cron job for running daily escalations

import { CronJob } from 'cron'
import { runDailyEscalations } from '../services/escalationService.js'
import { query } from '../db/connection.js'

let escalationJobInstance: CronJob | null = null

export function startEscalationJob() {
  // Run at 9 AM UTC daily
  escalationJobInstance = new CronJob(
    '0 9 * * *',
    async () => {
      try {
        console.log('Starting daily escalation job...')

        // Get all companies
        const companiesResult = await query('SELECT id FROM companies', [])
        const companies = companiesResult.rows

        let totalEscalations = 0

        // Run escalations for each company
        for (const company of companies) {
          try {
            const result = await runDailyEscalations(company.id)
            totalEscalations += result.total
            console.log(
              `[${company.id}] Escalations: ${result.overdue_escalations} overdue, ${result.due_escalations} due`
            )
          } catch (error) {
            console.error(`Error running escalations for company ${company.id}:`, error)
          }
        }

        console.log(`Escalation job complete. Total escalations: ${totalEscalations}`)
      } catch (error) {
        console.error('Escalation job error:', error)
      }
    },
    null,
    true,
    'UTC'
  )

  console.log('Escalation job started - runs daily at 9 AM UTC')
}

export function stopEscalationJob() {
  if (escalationJobInstance) {
    escalationJobInstance.stop()
    escalationJobInstance = null
    console.log('Escalation job stopped')
  }
}

export function getEscalationJobStatus() {
  return {
    running: escalationJobInstance?.running || false,
    nextDate: escalationJobInstance?.nextDate() || null
  }
}
