// backend/tests/actionItems.test.ts
// Tests for action item API endpoints

import request from 'supertest'
import { app } from '../src/app.js'
import * as actionItemService from '../src/services/actionItemService.js'
import { query } from '../src/db/connection.js'

// Mock dependencies
jest.mock('../src/db/connection.js')
jest.mock('../src/services/actionItemService.js')

const mockAuthToken = 'valid-jwt-token'
const mockCompanyId = 'company-123'
const mockUserId = 'user-123'

// Mock middleware to inject auth info
jest.mock('../src/middleware/auth.ts', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user_id = mockUserId
    req.company_id = mockCompanyId
    req.userRole = 'project_manager'
    next()
  }
}))

describe('Action Items API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/v1/action-items', () => {
    it('should create a new action item', async () => {
      const payload = {
        title: 'Review contract',
        description: 'Review new vendor contract',
        owner_id: 'user-456',
        project_id: 'project-123',
        priority: 'high',
        due_date: '2025-01-31'
      }

      const mockItem = {
        id: 'item-123',
        company_id: mockCompanyId,
        ...payload,
        status: 'open',
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      ;(actionItemService.createActionItem as jest.Mock).mockResolvedValue(mockItem)

      const response = await request(app)
        .post('/api/v1/action-items')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(payload)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe('item-123')
      expect(actionItemService.createActionItem).toHaveBeenCalledWith(mockCompanyId, expect.objectContaining({
        title: payload.title,
        owner_id: payload.owner_id
      }))
    })

    it('should validate required fields', async () => {
      const invalidPayload = {
        // Missing title
        owner_id: 'user-456',
        project_id: 'project-123',
        due_date: '2025-01-31'
      }

      const response = await request(app)
        .post('/api/v1/action-items')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(invalidPayload)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.details).toEqual(expect.arrayContaining([
        expect.objectContaining({ field: 'title' })
      ]))
    })

    it('should reject future due dates in the past', async () => {
      const yesterdayDate = new Date()
      yesterdayDate.setDate(yesterdayDate.getDate() - 1)

      const payload = {
        title: 'Old task',
        owner_id: 'user-456',
        project_id: 'project-123',
        due_date: yesterdayDate.toISOString().split('T')[0]
      }

      const response = await request(app)
        .post('/api/v1/action-items')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send(payload)

      expect(response.status).toBe(400)
      expect(response.body.details).toEqual(expect.arrayContaining([
        expect.objectContaining({ field: 'due_date', message: expect.stringContaining('future') })
      ]))
    })
  })

  describe('GET /api/v1/action-items', () => {
    it('should list action items with pagination', async () => {
      const mockItems = [
        {
          id: 'item-1',
          title: 'Task 1',
          status: 'open',
          priority: 'high',
          due_date: '2025-01-31',
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]

      ;(actionItemService.listActionItems as jest.Mock).mockResolvedValue({
        items: mockItems,
        total: 1
      })

      const response = await request(app)
        .get('/api/v1/action-items?page=1&pageSize=25')
        .set('Authorization', `Bearer ${mockAuthToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.pagination.total).toBe(1)
      expect(response.body.pagination.page).toBe(1)
    })

    it('should filter by status', async () => {
      ;(actionItemService.listActionItems as jest.Mock).mockResolvedValue({
        items: [],
        total: 0
      })

      const response = await request(app)
        .get('/api/v1/action-items?status=in_progress')
        .set('Authorization', `Bearer ${mockAuthToken}`)

      expect(response.status).toBe(200)
      expect(actionItemService.listActionItems).toHaveBeenCalledWith(
        mockCompanyId,
        expect.objectContaining({ status: 'in_progress' })
      )
    })
  })

  describe('GET /api/v1/action-items/:id', () => {
    it('should get a single action item', async () => {
      const mockItem = {
        id: 'item-123',
        title: 'Test Task',
        status: 'open',
        priority: 'high',
        due_date: '2025-01-31',
        owner: { id: 'user-456', email: 'user@example.com' },
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      ;(actionItemService.getActionItem as jest.Mock).mockResolvedValue(mockItem)

      const response = await request(app)
        .get('/api/v1/action-items/item-123')
        .set('Authorization', `Bearer ${mockAuthToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe('item-123')
    })

    it('should return 404 for non-existent item', async () => {
      ;(actionItemService.getActionItem as jest.Mock).mockResolvedValue(null)

      const response = await request(app)
        .get('/api/v1/action-items/invalid-id')
        .set('Authorization', `Bearer ${mockAuthToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })
  })

  describe('PATCH /api/v1/action-items/:id/status', () => {
    it('should change action item status', async () => {
      const mockItem = {
        id: 'item-123',
        title: 'Test Task',
        status: 'in_progress',
        version: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      ;(actionItemService.getActionItem as jest.Mock).mockResolvedValue({
        ...mockItem,
        status: 'open'
      })
      ;(actionItemService.changeActionItemStatus as jest.Mock).mockResolvedValue(mockItem)

      const response = await request(app)
        .patch('/api/v1/action-items/item-123/status')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({ status: 'in_progress', version: 1 })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('in_progress')
    })

    it('should handle concurrent edit conflict with 409', async () => {
      const mockItem = {
        id: 'item-123',
        title: 'Test Task',
        status: 'in_progress',
        version: 2
      }

      ;(actionItemService.getActionItem as jest.Mock).mockResolvedValue(mockItem)
      ;(actionItemService.changeActionItemStatus as jest.Mock).mockResolvedValue(null)

      const response = await request(app)
        .patch('/api/v1/action-items/item-123/status')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({ status: 'completed', version: 1 })

      expect(response.status).toBe(409)
      expect(response.body.error).toContain('Conflict')
      expect(response.body.details.currentVersion).toBe(2)
    })

    it('should not allow manual overdue status', async () => {
      ;(actionItemService.getActionItem as jest.Mock).mockResolvedValue({
        id: 'item-123',
        status: 'open'
      })

      const response = await request(app)
        .patch('/api/v1/action-items/item-123/status')
        .set('Authorization', `Bearer ${mockAuthToken}`)
        .send({ status: 'overdue', version: 1 })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('status is set automatically')
    })
  })

  describe('GET /api/v1/action-items/:id/history', () => {
    it('should get action item change history', async () => {
      const mockHistory = [
        {
          id: 'log-1',
          entity_type: 'action_item',
          action_type: 'status_changed',
          old_value: { status: 'open' },
          new_value: { status: 'in_progress' },
          created_at: new Date().toISOString()
        }
      ]

      ;(actionItemService.getActionItem as jest.Mock).mockResolvedValue({
        id: 'item-123'
      })
      ;(actionItemService.getActionItemHistory as jest.Mock).mockResolvedValue(mockHistory)

      const response = await request(app)
        .get('/api/v1/action-items/item-123/history')
        .set('Authorization', `Bearer ${mockAuthToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].action_type).toBe('status_changed')
    })
  })

  describe('DELETE /api/v1/action-items/:id', () => {
    it('should archive an action item', async () => {
      ;(actionItemService.getActionItem as jest.Mock).mockResolvedValue({
        id: 'item-123',
        status: 'open'
      })
      ;(actionItemService.archiveActionItem as jest.Mock).mockResolvedValue({
        id: 'item-123',
        archived_at: new Date().toISOString()
      })

      const response = await request(app)
        .delete('/api/v1/action-items/item-123')
        .set('Authorization', `Bearer ${mockAuthToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('archived')
    })
  })
})
