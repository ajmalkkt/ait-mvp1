# Database Schema

**Last Updated**: 2026-01-21

## Overview

The AIT database is designed for multi-tenant SaaS with strict company-level isolation enforced at the database level via PostgreSQL Row Level Security (RLS) policies.

## Tables

### Core Tenant & User Management

#### companies
Root tenant table - each company has completely isolated data.

| Column | Type | Nullable | Key | Notes |
|--------|------|----------|-----|-------|
| id | UUID | No | PK | Generated UUID |
| name | VARCHAR(255) | No | UNIQUE | Company name |
| plan | VARCHAR(50) | No | | Enum: free, pro, enterprise |
| created_at | TIMESTAMP | No | | UTC timestamp |
| updated_at | TIMESTAMP | No | | UTC timestamp |
| archived_at | TIMESTAMP | Yes | | Soft delete marker |

#### users
All users belong to exactly one company. Email is unique per company.

| Column | Type | Nullable | Key | Notes |
|--------|------|----------|-----|-------|
| id | UUID | No | PK | Generated UUID |
| company_id | UUID | No | FK | REFERENCES companies(id) |
| email | CITEXT | No | UK | Case-insensitive, unique per company |
| password_hash | VARCHAR(255) | Yes | | bcrypt hash |
| first_name | VARCHAR(100) | Yes | | User's first name |
| last_name | VARCHAR(100) | Yes | | User's last name |
| role | VARCHAR(50) | No | | Enum: system_admin, project_manager, team_lead, owner, participant, viewer |
| created_at | TIMESTAMP | No | | UTC timestamp |
| updated_at | TIMESTAMP | No | | UTC timestamp |
| archived_at | TIMESTAMP | Yes | | Soft delete marker |

**Indexes**: 
- idx_users_company_id (company_id)
- idx_users_company_email (company_id, email) - for lookups

### Projects, Teams & Meetings

#### projects
Organizational container for action items.

| Column | Type | Nullable | Key | Notes |
|--------|------|----------|-----|-------|
| id | UUID | No | PK | Generated UUID |
| company_id | UUID | No | FK | REFERENCES companies(id) |
| name | VARCHAR(255) | No | UK | Unique per company |
| description | TEXT | Yes | | Project description |
| pm_id | UUID | No | FK | REFERENCES users(id) - Project Manager |
| start_date | DATE | Yes | | Project start |
| end_date | DATE | Yes | | Project end |
| created_at | TIMESTAMP | No | | UTC timestamp |
| updated_at | TIMESTAMP | No | | UTC timestamp |
| archived_at | TIMESTAMP | Yes | | Soft delete marker |

**Indexes**:
- idx_projects_company_id (company_id)
- idx_projects_archived (company_id) WHERE archived_at IS NULL

#### teams
Team manages group of members; can be assigned to multiple projects.

| Column | Type | Nullable | Key | Notes |
|--------|------|----------|-----|-------|
| id | UUID | No | PK | Generated UUID |
| company_id | UUID | No | FK | REFERENCES companies(id) |
| name | VARCHAR(255) | No | UK | Unique per company |
| description | TEXT | Yes | | Team description |
| lead_id | UUID | No | FK | REFERENCES users(id) - Team Lead |
| created_at | TIMESTAMP | No | | UTC timestamp |
| updated_at | TIMESTAMP | No | | UTC timestamp |
| archived_at | TIMESTAMP | Yes | | Soft delete marker |

#### user_team_members
Junction table for team membership (many-to-many).

| Column | Type | Nullable | Key | Notes |
|--------|------|----------|-----|-------|
| team_id | UUID | No | PK | REFERENCES teams(id) |
| user_id | UUID | No | PK | REFERENCES users(id) |
| created_at | TIMESTAMP | No | | When added to team |

#### meetings
Meetings can have multiple action items created during them.

| Column | Type | Nullable | Key | Notes |
|--------|------|----------|-----|-------|
| id | UUID | No | PK | Generated UUID |
| company_id | UUID | No | FK | REFERENCES companies(id) |
| project_id | UUID | No | FK | REFERENCES projects(id) |
| title | VARCHAR(255) | No | | Meeting title |
| description | TEXT | Yes | | Meeting notes |
| meeting_date | TIMESTAMP | No | | When meeting occurred |
| meeting_type | VARCHAR(50) | No | | Enum: in_person, virtual |
| location_or_link | VARCHAR(255) | Yes | | Meeting location or video link |
| created_by_id | UUID | No | FK | REFERENCES users(id) |
| created_at | TIMESTAMP | No | | UTC timestamp |
| updated_at | TIMESTAMP | No | | UTC timestamp |

### Action Items (Core Business Logic)

#### action_items
Central business entity - tracks work items assigned to users.

| Column | Type | Nullable | Key | Notes |
|--------|------|----------|-----|-------|
| id | UUID | No | PK | Generated UUID |
| company_id | UUID | No | FK | REFERENCES companies(id) |
| project_id | UUID | No | FK | REFERENCES projects(id) |
| team_id | UUID | Yes | FK | REFERENCES teams(id) |
| meeting_id | UUID | Yes | FK | REFERENCES meetings(id) |
| owner_id | UUID | No | FK | REFERENCES users(id) |
| title | VARCHAR(255) | No | | Item title |
| description | TEXT | Yes | | Detailed description |
| priority | VARCHAR(50) | No | | Enum: high, medium, low (default: medium) |
| status | VARCHAR(50) | No | | Enum: open, in_progress, completed, closed, on_hold, overdue |
| due_date | DATE | No | | Must be >= CURRENT_DATE |
| completed_date | TIMESTAMP | Yes | | When marked completed |
| version | INT | No | | For optimistic locking |
| created_at | TIMESTAMP | No | | UTC timestamp |
| updated_at | TIMESTAMP | No | | UTC timestamp |
| archived_at | TIMESTAMP | Yes | | Soft delete marker |

**Indexes (Performance Critical)**:
- idx_action_items_company_status_due (company_id, status, due_date) - **Most frequently queried**
- idx_action_items_company_owner_due (company_id, owner_id, due_date)
- idx_action_items_company_team_due (company_id, team_id, due_date)
- idx_action_items_company_project_due (company_id, project_id, due_date)
- idx_action_items_overdue (company_id, due_date) WHERE due_date < TODAY AND status != 'completed' AND status != 'closed'

### Compliance & Audit

#### audit_logs
Immutable log of all changes - MUST NOT be deleted.

| Column | Type | Nullable | Key | Notes |
|--------|------|----------|-----|-------|
| id | UUID | No | PK | Generated UUID |
| company_id | UUID | No | FK | REFERENCES companies(id) |
| entity_type | VARCHAR(100) | No | | E.g., 'action_item', 'project', 'team' |
| entity_id | UUID | No | | ID of changed entity |
| action_type | VARCHAR(50) | No | | Enum: created, updated, deleted, status_changed, owner_changed, completed |
| old_value | JSONB | Yes | | Previous state (nullable on create) |
| new_value | JSONB | Yes | | New state |
| user_id | UUID | Yes | FK | REFERENCES users(id) - who made change |
| created_at | TIMESTAMP | No | | When change occurred |

**Indexes**:
- idx_audit_logs_entity (entity_type, entity_id)
- idx_audit_logs_created_at (created_at)

### Notifications & Messaging

#### notifications
In-app notifications - delivered immediately.

| Column | Type | Nullable | Key | Notes |
|--------|------|----------|-----|-------|
| id | UUID | No | PK | Generated UUID |
| company_id | UUID | No | FK | REFERENCES companies(id) |
| user_id | UUID | No | FK | REFERENCES users(id) |
| type | VARCHAR(50) | No | | Enum: assignment, due_reminder, overdue_escalation, status_change, comment |
| message | TEXT | No | | Notification message |
| action_item_id | UUID | Yes | FK | REFERENCES action_items(id) |
| read | BOOLEAN | No | | Read status (default: false) |
| read_at | TIMESTAMP | Yes | | When marked read |
| created_at | TIMESTAMP | No | | UTC timestamp |
| updated_at | TIMESTAMP | No | | UTC timestamp |

**Indexes**:
- idx_notifications_user_read_date (user_id, read, created_at DESC)

#### notifications_queue
Email delivery queue with retry logic - processed by background job.

| Column | Type | Nullable | Key | Notes |
|--------|------|----------|-----|-------|
| id | UUID | No | PK | Generated UUID |
| company_id | UUID | No | FK | REFERENCES companies(id) |
| user_id | UUID | No | FK | REFERENCES users(id) |
| recipient_email | VARCHAR(255) | No | | Email address |
| subject | VARCHAR(255) | No | | Email subject |
| body | TEXT | No | | Email HTML body |
| action_item_id | UUID | Yes | FK | REFERENCES action_items(id) |
| status | VARCHAR(50) | No | | Enum: pending, sent, failed, retried |
| retry_count | INT | No | | Retry attempts (default: 0) |
| last_retry_at | TIMESTAMP | Yes | | Last retry timestamp |
| error_message | TEXT | Yes | | Last error message |
| created_at | TIMESTAMP | No | | UTC timestamp |
| updated_at | TIMESTAMP | No | | UTC timestamp |
| sent_at | TIMESTAMP | Yes | | When successfully sent |

**Indexes**:
- idx_notifications_queue_pending (status, created_at) WHERE status IN ('pending', 'retried')

#### notification_preferences
User's email notification preferences.

| Column | Type | Nullable | Key | Notes |
|--------|------|----------|-----|-------|
| id | UUID | No | PK | Generated UUID |
| company_id | UUID | No | FK | REFERENCES companies(id) |
| user_id | UUID | No | FK | REFERENCES users(id) |
| email_on_assignment | BOOLEAN | No | | Notify on assignment (default: true) |
| email_on_due_reminder | BOOLEAN | No | | Notify 2 days before due (default: true) |
| email_on_overdue | BOOLEAN | No | | Notify on overdue escalation (default: true) |
| email_on_status_change | BOOLEAN | No | | Notify on status change (default: false) |
| created_at | TIMESTAMP | No | | UTC timestamp |
| updated_at | TIMESTAMP | No | | UTC timestamp |

## Row Level Security (RLS)

All tables have RLS enabled. Key isolation strategy:

- **Helper Function**: `get_user_company_id()` returns current user's company_id from auth.uid()
- **Policy Pattern**: ALL policies check `company_id = get_user_company_id()`
- **Effect**: Users can only see/modify data from their company, enforced at database level

Example policy:
```sql
CREATE POLICY action_items_select ON action_items
  FOR SELECT
  USING (company_id = get_user_company_id());
```

## Constraints

- `action_items.due_date >= CURRENT_DATE` - prevent backdating
- `users.email` unique per (company_id, email) - prevent duplicates within company
- `projects.name` unique per company
- `teams.name` unique per company
- Foreign key cascading delete on company deletion (all data cleaned up)
- Foreign key restrict on user deletion (prevent orphaned items)

## Performance Optimization

**Connection Pooling**: Configured for 5-20 concurrent connections  
**Indexes**: Composite indexes on company_id + filtering columns  
**Soft Deletes**: archived_at field prevents data loss while allowing logical deletion  
**Pagination**: Mandatory 25-item limit enforced in application  

---

**Compliance Status**: ✅ GDPR-ready, SOC 2-ready with immutable audit trail
