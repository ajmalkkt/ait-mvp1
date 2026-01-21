// backend/src/routes/reports.ts
// Report generation and export endpoints

import { Router, Request, Response } from 'express'
import { validateAuth, validateCompany } from '../middleware/auth'
import {
  generateCompletionReport,
  generateProductivityReport,
  generateOverdueReport,
} from '../services/reportService'

const router = Router()

// Middleware
router.use(validateAuth)
router.use(validateCompany)

/**
 * GET /api/v1/reports/completion
 * Generate completion report with overall metrics
 * Query params: start_date, end_date (optional)
 */
router.get('/completion', async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.id
    const { start_date, end_date } = req.query

    if (!companyId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Company not found',
      })
    }

    const report = await generateCompletionReport(companyId, {
      start_date: start_date as string | undefined,
      end_date: end_date as string | undefined,
    })

    res.json({
      success: true,
      data: report,
    })
  } catch (error) {
    console.error('Error generating completion report:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * GET /api/v1/reports/productivity
 * Generate productivity report with per-member metrics
 * Query params: start_date, end_date, team_id (optional)
 */
router.get('/productivity', async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.id
    const { start_date, end_date, team_id } = req.query

    if (!companyId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Company not found',
      })
    }

    const report = await generateProductivityReport(companyId, {
      start_date: start_date as string | undefined,
      end_date: end_date as string | undefined,
      team_id: team_id as string | undefined,
    })

    res.json({
      success: true,
      data: report,
    })
  } catch (error) {
    console.error('Error generating productivity report:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * GET /api/v1/reports/overdue
 * Generate overdue report with risk analysis
 * Query params: start_date, end_date (optional)
 */
router.get('/overdue', async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.id
    const { start_date, end_date } = req.query

    if (!companyId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Company not found',
      })
    }

    const report = await generateOverdueReport(companyId, {
      start_date: start_date as string | undefined,
      end_date: end_date as string | undefined,
    })

    res.json({
      success: true,
      data: report,
    })
  } catch (error) {
    console.error('Error generating overdue report:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * POST /api/v1/reports/export
 * Export report to Excel or PDF format
 * Body: { report_type, format, filters }
 */
router.post('/export', async (req: Request, res: Response) => {
  try {
    const companyId = req.company?.id
    const { report_type, format: exportFormat, filters } = req.body

    if (!companyId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Company not found',
      })
    }

    if (!report_type || !exportFormat) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'report_type and format are required',
      })
    }

    if (!['completion', 'productivity', 'overdue'].includes(report_type)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid report_type. Must be: completion, productivity, or overdue',
      })
    }

    if (!['excel', 'pdf'].includes(exportFormat)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid format. Must be: excel or pdf',
      })
    }

    // Generate the report
    let report
    switch (report_type) {
      case 'completion':
        report = await generateCompletionReport(companyId, filters || {})
        break
      case 'productivity':
        report = await generateProductivityReport(companyId, filters || {})
        break
      case 'overdue':
        report = await generateOverdueReport(companyId, filters || {})
        break
      default:
        throw new Error('Invalid report type')
    }

    // TODO: Implement actual Excel and PDF export
    // For now, return JSON response with download URL placeholder
    const filename = `${report_type}_report_${new Date().toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'xlsx' : 'pdf'}`

    res.json({
      success: true,
      data: {
        filename,
        format: exportFormat,
        report_type,
        // TODO: Generate actual file and return signed download URL
        download_url: `/api/v1/reports/download/${report.report_id}`,
        message: 'Export functionality coming soon - returning raw report data',
        report,
      },
    })
  } catch (error) {
    console.error('Error exporting report:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
