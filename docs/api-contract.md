# API Contract Specification

**Status**: Draft  
**Version**: 0.1.0  
**Created**: 2026-01-21  

## Base Information

- **Base URL**: `https://api.ait.example.com/api/v1` (development: `http://localhost:3000/api/v1`)
- **Content-Type**: `application/json`
- **Authentication**: Bearer token (JWT) in `Authorization` header

## Authentication

All endpoints except `/health` require Bearer token authentication:

```
Authorization: Bearer <jwt_token>
```

Token claims must include:
- `sub`: User ID (UUID)
- `company_id`: Company ID (UUID)
- `role`: User role (string)
- `email`: User email

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "page": 1,
    "pageSize": 25,
    "total": 100
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field validation failed",
    "statusCode": 400
  }
}
```

## Endpoints (Stub)

### Health Check

#### GET /health

**Public endpoint** - no authentication required

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-21T10:00:00Z",
  "uptime": 3600
}
```

---

### Action Items

#### POST /action-items

Create a new action item.

**Request Body**:
```json
{
  "project_id": "uuid",
  "team_id": "uuid",
  "meeting_id": "uuid",
  "title": "string",
  "description": "string",
  "owner_id": "uuid",
  "priority": "high|medium|low",
  "due_date": "YYYY-MM-DD"
}
```

**Validation**:
- title: required, max 255 chars
- owner_id: required, must be user in same company
- due_date: required, must be >= today
- priority: optional, defaults to "medium"

**Error Codes**:
- `VALIDATION_ERROR` (400) - Field validation failed
- `OWNER_NOT_FOUND` (404) - Owner doesn't exist
- `UNAUTHORIZED` (401) - Not authenticated

**Response**: 201 Created
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "company_id": "uuid",
    "project_id": "uuid",
    "team_id": "uuid",
    "meeting_id": "uuid",
    "title": "string",
    "description": "string",
    "owner_id": "uuid",
    "priority": "high|medium|low",
    "status": "open",
    "due_date": "YYYY-MM-DD",
    "version": 1,
    "created_at": "2026-01-21T10:00:00Z",
    "updated_at": "2026-01-21T10:00:00Z"
  }
}
```

---

#### GET /action-items

List action items with filtering and pagination.

**Query Parameters**:
- `page`: number (default: 1)
- `pageSize`: number (default: 25, max: 100)
- `status`: string (optional) - filter by status
- `owner_id`: uuid (optional) - filter by owner
- `priority`: string (optional) - filter by priority
- `due_date_from`: YYYY-MM-DD (optional)
- `due_date_to`: YYYY-MM-DD (optional)
- `project_id`: uuid (optional)
- `team_id`: uuid (optional)

**Response**: 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "status": "open",
      "due_date": "YYYY-MM-DD",
      "owner_id": "uuid",
      "priority": "high|medium|low",
      "project_id": "uuid"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 25
  }
}
```

---

#### GET /action-items/:id

Get action item details with history.

**Response**: 200 OK
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "status": "open",
    "due_date": "YYYY-MM-DD",
    "completed_date": null,
    "owner": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John"
    },
    "project": {
      "id": "uuid",
      "name": "Q1 Planning"
    },
    "team": {
      "id": "uuid",
      "name": "Engineering"
    },
    "history": [
      {
        "action": "created",
        "user": "john@example.com",
        "timestamp": "2026-01-21T10:00:00Z",
        "old_value": null,
        "new_value": { "title": "..." }
      }
    ]
  }
}
```

---

#### PUT /action-items/:id

Update action item (with optimistic locking).

**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "owner_id": "uuid",
  "priority": "high|medium|low",
  "due_date": "YYYY-MM-DD",
  "version": 1
}
```

**Error Codes**:
- `CONFLICT` (409) - Version mismatch (concurrent edit)

**Response**: 200 OK (same as GET)

---

#### PATCH /action-items/:id/status

Change action item status.

**Request Body**:
```json
{
  "status": "open|in_progress|completed|closed|on_hold",
  "version": 1
}
```

**Workflow Rules**:
- open → in_progress, on_hold
- in_progress → completed, on_hold, open
- completed → closed
- on_hold → open, in_progress
- Cannot set "overdue" manually (automated only)

**Response**: 200 OK (same as GET)

---

### Projects

#### POST /projects

Create project. Requires: project_manager or system_admin role.

#### GET /projects

List projects. Returns company's projects.

#### GET /projects/:id

Get project details with teams and item counts.

#### PUT /projects/:id

Update project.

#### PATCH /projects/:id/archive

Archive/unarchive project.

---

### Teams

#### POST /teams

Create team. Requires: team_lead or system_admin role.

#### GET /teams

List teams with member counts.

#### POST /teams/:id/members

Add member to team.

#### DELETE /teams/:id/members/:uid

Remove member from team.

---

### Dashboards

#### GET /dashboards/my-items

User's assigned action items with counts.

#### GET /dashboards/team

Team dashboard. Requires: team_lead or project_manager.

#### GET /dashboards/project

Project dashboard. Requires: project_manager.

---

### Notifications

#### GET /notifications

List unread notifications.

#### PATCH /notifications/:id

Mark notification as read.

---

### Reports

#### GET /reports/completion

Completion report query.

#### GET /reports/productivity

Team productivity report.

#### GET /reports/overdue

Overdue items report.

#### POST /reports/export

Export to Excel/PDF.

---

### Audit Logs

#### GET /audit-logs

List audit logs. Requires: system_admin.

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| VALIDATION_ERROR | 400 | Request validation failed |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Concurrent edit (version mismatch) |
| INTERNAL_ERROR | 500 | Server error |
| SERVICE_UNAVAILABLE | 503 | Database unavailable |

---

**Next Steps**: 
1. Generate OpenAPI 3.0 schema from this spec
2. Implement endpoints following specification
3. Create Postman collection for testing
