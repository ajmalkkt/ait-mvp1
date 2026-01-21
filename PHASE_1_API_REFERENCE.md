# Phase 1 Implementation - Quick Reference

## Backend Endpoints (7 endpoints)

### Create Action Item
```
POST /api/v1/action-items
Content-Type: application/json
Authorization: Bearer {jwt}

{
  "title": "Review contract",
  "description": "Review vendor contract",
  "owner_id": "user-456",
  "project_id": "project-123",
  "priority": "high",
  "due_date": "2025-01-31",
  "team_id": "team-123" (optional),
  "meeting_id": "meeting-456" (optional)
}

Response 201:
{
  "success": true,
  "data": {
    "id": "item-123",
    "company_id": "company-123",
    "status": "open",
    "version": 1,
    "created_at": "2025-01-21T10:00:00Z",
    "updated_at": "2025-01-21T10:00:00Z"
  }
}

Error 400: Validation failed
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {"field": "title", "message": "Title is required"},
    {"field": "due_date", "message": "Due date must be in the future"}
  ]
}
```

### List Action Items
```
GET /api/v1/action-items?page=1&pageSize=25&status=open&priority=high&owner_id=user-456&project_id=project-123&team_id=team-123&due_date_from=2025-01-21&due_date_to=2025-02-28
Authorization: Bearer {jwt}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "item-1",
      "title": "Task 1",
      "status": "open",
      "priority": "high",
      "due_date": "2025-01-31",
      "version": 1,
      "created_at": "2025-01-21T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "pageSize": 25,
    "totalPages": 2
  }
}
```

### Get Action Item Detail
```
GET /api/v1/action-items/{id}
Authorization: Bearer {jwt}

Response 200:
{
  "success": true,
  "data": {
    "id": "item-123",
    "title": "Review contract",
    "description": "Review vendor contract",
    "status": "open",
    "priority": "high",
    "owner": {
      "id": "user-456",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "project": {"id": "project-123", "name": "Q1 Planning"},
    "team": {"id": "team-123", "name": "Finance"},
    "due_date": "2025-01-31",
    "version": 1,
    "created_at": "2025-01-21T10:00:00Z",
    "updated_at": "2025-01-21T10:00:00Z"
  }
}

Response 404: Not found
{
  "success": false,
  "error": "Action item not found"
}
```

### Update Action Item
```
PUT /api/v1/action-items/{id}
Content-Type: application/json
Authorization: Bearer {jwt}

{
  "title": "Review contract - Updated",
  "description": "Updated description",
  "owner_id": "user-789",
  "priority": "medium",
  "due_date": "2025-02-15",
  "version": 1
}

Response 200: (version incremented to 2)
{
  "success": true,
  "data": {
    "id": "item-123",
    "title": "Review contract - Updated",
    "status": "open",
    "priority": "medium",
    "due_date": "2025-02-15",
    "version": 2,
    "updated_at": "2025-01-21T10:05:00Z"
  }
}

Response 409: Concurrent edit conflict
{
  "success": false,
  "error": "Conflict: Item has been modified",
  "details": {
    "message": "This item has been modified by another user...",
    "currentVersion": 3
  },
  "data": {
    "id": "item-123",
    "title": "Another change",
    "version": 3
  }
}
```

### Change Action Item Status
```
PATCH /api/v1/action-items/{id}/status
Content-Type: application/json
Authorization: Bearer {jwt}

{
  "status": "in_progress",
  "version": 1
}

Response 200:
{
  "success": true,
  "data": {
    "id": "item-123",
    "status": "in_progress",
    "completed_date": null,
    "version": 2
  }
}

Response 409: Conflict (same as update)
Response 400: Invalid transition
{
  "success": false,
  "error": "Invalid status transition",
  "details": [
    {"field": "status", "message": "Cannot transition from closed to in_progress"}
  ]
}
```

### Get Action Item History
```
GET /api/v1/action-items/{id}/history?page=1&pageSize=25
Authorization: Bearer {jwt}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "log-1",
      "entity_type": "action_item",
      "action_type": "status_changed",
      "old_value": {"status": "open"},
      "new_value": {"status": "in_progress"},
      "user_id": "user-456",
      "created_at": "2025-01-21T10:05:00Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "pageSize": 25,
    "totalPages": 1
  }
}
```

### Archive Action Item
```
DELETE /api/v1/action-items/{id}
Authorization: Bearer {jwt}

Response 200:
{
  "success": true,
  "message": "Action item archived successfully"
}

Response 404: Not found
{
  "success": false,
  "error": "Action item not found"
}
```

---

## Frontend React Components

### ActionItemForm
```typescript
import { ActionItemForm } from '@/components/ActionItemForm'

<ActionItemForm
  projectId="project-123" // optional - locks project
  teamId="team-123" // optional
  meetingId="meeting-456" // optional
  initialData={actionItem} // for edit mode
  onSubmit={async (data) => { /* call API */ }}
  onCancel={() => { /* close form */ }}
  isLoading={false}
/>
```

**Fields**:
- Title (required, 3-255 chars)
- Description (optional, <5000 chars)
- Assigned To (required, dropdown of team members)
- Priority (high/medium/low)
- Due Date (required, must be future)
- Project (required, dropdown)
- Team (optional, filtered by project)

**Features**:
- Inline field validation errors
- Character counter for description
- Form submission loading state
- Cancel button

### ActionItemList
```typescript
import { ActionItemList } from '@/components/ActionItemList'
import { useActionItems } from '@/hooks/useActionItems'

const { data, isLoading } = useActionItems({ page: 1, pageSize: 25 })

<ActionItemList
  items={data.data}
  isLoading={isLoading}
  onStatusChange={(id, status) => { /* call API */ }}
  onEdit={(id) => { /* open edit modal */ }}
  onDelete={(id) => { /* archive item */ }}
/>
```

**Features**:
- Filter dropdown (status, priority)
- Card grid layout
- Empty state messaging
- Loading skeleton

### ActionItemCard
```typescript
<ActionItemCard
  item={actionItem}
  onStatusChange={(id, status) => {}}
  onEdit={(id) => {}}
  onDelete={(id) => {}}
/>
```

**Displays**:
- Title and description (truncated to 2 lines)
- Status and priority badges (color-coded)
- Due date with "X days" calculation
- Owner assignment
- Action buttons (Edit, Delete)
- Overdue highlighting (red border, pulsing animation)

### Badges
```typescript
import { StatusBadge, PriorityBadge } from '@/components/Badges'

<StatusBadge status="in_progress" /> // Yellow
<PriorityBadge priority="high" /> // Red
```

**Status Colors**:
- Open: Blue
- In Progress: Yellow
- Completed: Green
- Closed: Gray
- On Hold: Orange
- Overdue: Red (pulsing)

**Priority Colors**:
- High: Red
- Medium: Orange
- Low: Purple

### ConflictModal
```typescript
<ConflictModal
  isOpen={true}
  currentVersion={3}
  conflictMessage="Updated by Jane at 10:05 AM"
  onRefresh={() => window.location.reload()}
  onCancel={() => setShowModal(false)}
/>
```

### MyActionItems Page
```typescript
<MyActionItems /> // Route: /action-items
```

**Features**:
- Create button (toggles form)
- Action item list with filters
- Status change from card
- Delete/archive with confirmation
- Pagination (Previous/Next)

### ActionItemDetail Page
```typescript
<ActionItemDetail /> // Route: /action-items/:id
```

**Features**:
- Read-only display of all fields
- Edit button (switches to form mode)
- Status dropdown in view mode
- Collapsible change history
- Conflict modal on concurrent edit

---

## React Hooks (TanStack Query)

### useActionItems()
```typescript
const { data, isLoading, error } = useActionItems({
  page: 1,
  pageSize: 25,
  status: 'open',
  owner_id: 'user-456',
  priority: 'high',
  project_id: 'project-123',
  team_id: 'team-123',
  due_date_from: '2025-01-21',
  due_date_to: '2025-02-28'
})

// data.data = ActionItem[]
// data.pagination = { total, page, pageSize, totalPages }
```

### useCreateActionItem()
```typescript
const mutation = useCreateActionItem()

await mutation.mutateAsync({
  title: 'New task',
  owner_id: 'user-456',
  project_id: 'project-123',
  due_date: '2025-01-31'
})
```

### useChangeActionItemStatus()
```typescript
const mutation = useChangeActionItemStatus()

await mutation.mutateAsync({
  id: 'item-123',
  status: 'in_progress',
  version: 1
})

// Throws if 409 conflict
```

### useUpdateActionItem()
```typescript
const mutation = useUpdateActionItem()

await mutation.mutateAsync({
  id: 'item-123',
  version: 1,
  title: 'Updated title',
  priority: 'low'
})
```

### useActionItem()
```typescript
const { data: item } = useActionItem('item-123')
```

### useActionItemHistory()
```typescript
const { data: history } = useActionItemHistory('item-123', page)

// history.data = AuditLogEntry[]
// history.pagination = { total, page, pageSize, totalPages }
```

### useArchiveActionItem()
```typescript
const mutation = useArchiveActionItem()

await mutation.mutateAsync('item-123')
```

---

## Validation Rules

### Create/Update
- **Title**: Required, 3-255 chars
- **Description**: Optional, <5000 chars
- **Owner**: Required, must be valid user_id
- **Project**: Required, must be valid project_id
- **Team**: Optional, must be valid team_id
- **Priority**: high | medium | low (default: medium)
- **Due Date**: Required, YYYY-MM-DD format, must be future date

### Status Transitions
- **Open** → In Progress, On Hold
- **In Progress** → Completed, On Hold, Open
- **On Hold** → Open, In Progress
- **Completed** → Closed
- **Closed** → (none)
- **Overdue** → (system only, not manual)

---

## Database Schema (Relevant Tables)

```sql
action_items (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  project_id UUID NOT NULL,
  team_id UUID,
  meeting_id UUID,
  owner_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority ENUM('high', 'medium', 'low'),
  status ENUM('open', 'in_progress', 'completed', 'closed', 'on_hold', 'overdue'),
  due_date DATE NOT NULL,
  completed_date TIMESTAMP,
  version INT DEFAULT 1,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  archived_at TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (owner_id) REFERENCES users(id),
  INDEX (company_id, status, due_date)
)

audit_logs (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  action_type VARCHAR(50),
  old_value JSONB,
  new_value JSONB,
  user_id UUID,
  created_at TIMESTAMP,
  INDEX (company_id, entity_type, entity_id, created_at DESC)
)
```

---

## Error Handling

### 400 Bad Request
- Missing required fields
- Invalid field values (bad date format, title too long)
- Invalid enum values (status, priority)
- Failed validation

### 404 Not Found
- Item doesn't exist
- User doesn't have access (via RLS)

### 409 Conflict
- Version mismatch (optimistic locking)
- Another user modified the item
- Frontend should show conflict modal with refresh option

### 500 Server Error
- Unexpected database error
- Check server logs

---

## Performance Notes

- List queries use composite index (company_id, status, due_date)
- Pagination limits to 25 items/page (avoid large transfers)
- Frontend caches with React Query (stale-while-revalidate)
- Audit logs paginated (don't load all history at once)
- Status change is separate endpoint (no n+1 updates)

---

## Testing

Run backend tests:
```bash
cd backend
npm test -- tests/actionItems.test.ts
```

Run frontend tests:
```bash
cd frontend
npm test -- tests/actionItems.test.tsx
```

Expected coverage: >80%
