# Implementation Plan: Action Item Tracker (AIT) MVP

**Branch**: `001-ait-mvp` | **Date**: 2026-01-21 | **Spec**: [spec.md](spec.md)  
**Status**: Draft - Ready for task breakdown  

## Summary

The Action Item Tracker is a multi-tenant SaaS platform for capturing, assigning, tracking, and reporting on action items from meetings across teams and projects. The MVP delivers essential capabilities: action item lifecycle management, team-based dashboards, automated notifications and escalations, and compliance audit logging—all with strict multi-company data isolation enforced at the database level.

This plan describes the technical architecture, component responsibilities, data model, API contracts, and implementation strategy to deliver the MVP within scope while meeting enterprise SaaS requirements for security, performance, and reliability.

## Technical Context

**Language/Version**: Node.js 18+ (backend), React 18+ (frontend)  
**Primary Dependencies**: Express (routing), Supabase (Postgres + Auth + RLS), React Router, TanStack Query  
**Storage**: PostgreSQL (Supabase-managed)  
**Testing**: Jest (backend), Vitest (frontend), Supertest (API integration)  
**Target Platform**: Web browsers (desktop + tablet responsive); Node.js backend on managed container service  
**Project Type**: Web application with backend API + React frontend  
**Performance Goals**: Dashboard load <3s, API responses <500ms p95, notification delivery <2min (95%)  
**Constraints**: Support 10,000+ action items/company, 500 concurrent users, 99.5% availability  
**Scale/Scope**: Single company MVP; multi-company ready via database isolation; estimated 2-3 month delivery  

## Constitution Check

✅ **Architecture-First Design**: React frontend, Node.js backend, Supabase (Postgres + Auth), multi-tenancy from day 1  
✅ **Security & Access Control**: RBAC enforced (6 roles), database-level isolation via company_id, audit logging on all changes  
✅ **Performance & Reliability**: Targets 3s dashboard, <500ms API, 99.5% uptime; pagination, indexing, connection pooling planned  
✅ **Quality & Development**: Spec-driven development, API documentation required, test coverage mandatory  
✅ **Product Scope & Non-Goals**: MVP focused on core action items, dashboards, notifications; mobile and calendar integrations deferred  

**Compliance Status**: ✅ Full alignment with Constitution v1.0.0

## High-Level Architecture

### System Components

```
┌──────────────────────────┐     ┌──────────────────────────┐     ┌──────────────────────────┐
│ Frontend (React 18)      │     │ Backend API (Node.js)    │     │ Database (PostgreSQL)    │
│                          │────▶│                          │────▶│                          │
│ - Dashboards             │     │ - /api/action-items      │     │ - action_items           │
│ - Forms                  │     │ - /api/projects          │     │ - projects               │
│ - Notifications          │     │ - /api/teams             │     │ - teams                  │
│ - Reports                │     │ - /api/dashboards        │     │ - meetings               │
└──────────────────────────┘     │ - /api/notifications     │     │ - audit_logs             │
                                 │ - RLS enforcement        │     │ - RLS policies           │
                                 │ - Audit logging          │     │ - Indexes optimized      │
                                 └──────────────────────────┘     └──────────────────────────┘
                                         │
                                 ┌──────┴───────┐
                                 │ Background   │
                                 │ Jobs         │
                                 │ - Escalation │
                                 │ - Email      │
                                 └──────────────┘
```

### Deployment Model

- **Frontend**: Static hosting (Vercel, Netlify)
- **Backend API**: Container (Docker) on managed platform (Cloud Run, Render)
- **Database**: Supabase-managed PostgreSQL
- **Notifications**: SendGrid or AWS SES for email

## Multi-Tenancy & Data Isolation

**Principle**: Every table includes `company_id` foreign key; enforced at database, API, and query levels.

**Enforcement**:
- Database: RLS policies restrict SELECT/INSERT/UPDATE/DELETE to company_id match
- API: Middleware validates user company_id against request data
- Query: All queries filter by company_id (not optional)

Example RLS policy:
```sql
CREATE POLICY action_items_isolation ON action_items
  FOR SELECT
  USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));
```

## Role-Based Access Control (RBAC)

Six roles with permission matrix:

| Role | View | Create | Edit | Delete | Manage Users | Reports |
|------|------|--------|------|--------|--------------|---------|
| System Admin | ✅ All | ✅ | ✅ All | ✅ Archive | ✅ | ✅ |
| Project Manager | ✅ Project | ✅ | ✅ Project | ✅ Project | ❌ | ✅ |
| Team Lead | ✅ Team | ✅ | ✅ Team | ✅ Team | ✅ Team | ✅ |
| Owner | ✅ Own | ✅ Meeting | ✅ Own | ❌ | ❌ | ❌ |
| Participant | ✅ Own | ✅ Meeting | ✅ Own | ❌ | ❌ | ❌ |
| Viewer | ✅ Own | ❌ | ❌ | ❌ | ❌ | ✅ |

**Implementation**: Role + resource checks in API middleware and service layer; UI reflects permissions (non-binding).

## Domain Entities & Database Schema

### Core Entities (9 tables)

1. **companies**: Tenant root (id, name, plan)
2. **users**: Users per company (id, company_id, email, role)
3. **projects**: Projects per company (id, company_id, name, pm_id, dates)
4. **teams**: Teams per company (id, company_id, name, lead_id)
5. **meetings**: Meetings link to projects/teams (id, company_id, project_id, team_id, title, date_time)
6. **action_items**: Core entity (id, company_id, project_id, team_id, meeting_id, owner_id, status, due_date)
7. **audit_logs**: Immutable change log (id, company_id, entity_type, entity_id, action_type, old_value, new_value, timestamp)
8. **notifications**: In-app alerts (id, company_id, user_id, type, message, action_item_id, read)
9. **user_team_members**: Team membership junction (team_id, user_id)

### Key Constraints

- `action_items.due_date` must be > CURRENT_DATE (prevent backdating)
- `action_items.status` in (open, in_progress, completed, closed, on_hold)
- `action_items.status` transitions: open/on_hold → in_progress → completed → closed
- Overdue status set automatically by daily escalation job (users cannot manually set it)
- All tables include company_id for isolation
- Foreign keys enforce referential integrity within company
- Soft deletes used (archived_at field) instead of hard deletes

### Indexes (Performance Critical)

```sql
CREATE INDEX idx_action_items_company_status_due ON action_items(company_id, status, due_date);
CREATE INDEX idx_action_items_owner_due ON action_items(owner_id, due_date);
CREATE INDEX idx_action_items_team_date ON action_items(team_id, due_date);
CREATE INDEX idx_action_items_overdue ON action_items(company_id) WHERE due_date < CURRENT_DATE;
```

## API Boundary & Responsibility

### Frontend Handles

✅ Form validation (required fields, date format)  
✅ UI state (filters, sorting, pagination)  
✅ User interactions and event handling  
✅ Data display and rendering  
✅ Optimistic updates (show immediate feedback)  

### Backend Handles

✅ Authentication (JWT validation)  
✅ Authorization (role checks, company isolation)  
✅ Business logic (workflows, validation)  
✅ Data persistence  
✅ Audit logging  
✅ Notification queueing  
✅ Performance (pagination, indexing)  

### Endpoint Design

**Prefix**: `/api/v1`  
**Auth**: Bearer token (JWT)  
**Format**: JSON with consistent error structure  

**Key Endpoints**:

```
Action Items:
  POST   /api/v1/action-items              Create
  GET    /api/v1/action-items              List (filters: status, team, due_date, priority)
  GET    /api/v1/action-items/:id          Detail
  PUT    /api/v1/action-items/:id          Update
  PATCH  /api/v1/action-items/:id/status   Change status
  GET    /api/v1/action-items/:id/history  Audit trail

Projects:
  POST   /api/v1/projects                  Create
  GET    /api/v1/projects                  List
  PUT    /api/v1/projects/:id              Update
  PATCH  /api/v1/projects/:id/archive      Archive

Teams:
  POST   /api/v1/teams                     Create
  GET    /api/v1/teams                     List
  POST   /api/v1/teams/:id/members         Add member
  DELETE /api/v1/teams/:id/members/:uid    Remove member

Dashboards:
  GET    /api/v1/dashboards/my-items       User's items
  GET    /api/v1/dashboards/team           Team dashboard
  GET    /api/v1/dashboards/project        Project dashboard

Notifications:
  GET    /api/v1/notifications             List
  PATCH  /api/v1/notifications/:id         Mark read

Reports:
  GET    /api/v1/reports/completion        Completion rate
  POST   /api/v1/reports/export            Excel/PDF export

Audit:
  GET    /api/v1/audit-logs                List (System Admin only)
```

## Dashboards & Reporting

### Dashboards (Real-time Aggregation)

**My Action Items**: User's assigned items, filtered by status/priority/due date, paginated 25/page

**Team Dashboard** (Team Lead): Team members' items with metrics
- Total items, completion %, items by status
- Items per team member
- Overdue count

**Project Dashboard** (Project Manager): Project-wide metrics across teams
- Completion rate, status breakdown
- Items due next 7 days, overdue items
- Team productivity

### Reports (On-Demand)

**Completion Report**: Total items, completed, completion %, average days-to-completion

**Team Productivity**: Items per member, completion rate by member, avg turnaround

**Overdue Analysis**: Items past due, days overdue, owner, priority

**Export**: Excel or PDF with columns (project, team, title, owner, status, due date, completion date) and charts

## Notifications & Escalations

### Types & Triggers

| Type | Trigger | Recipient | Channel |
|------|---------|-----------|---------|
| **Assignment** | Item assigned | Owner | In-app immediate, Email (if enabled) |
| **Due Reminder** | 2 days before due | Owner | In-app + Email (if enabled) |
| **Overdue Escalation** | Daily job, past due | PM | Email always, In-app |
| **Status Change** | Item status updated | PM | Email (if enabled), In-app |

### Implementation

**In-App**: Create notification record in database; frontend polls /api/v1/notifications endpoint

**Email**: Queue in notifications_queue table; background job processes (every 5 min), respects user preferences, retries 3x with backoff (clarification Q1)

**Escalation Job**: Runs daily 8 AM company timezone; idempotent (checks if already escalated today); marks overdue items, queues PM notifications, logs audit entry

## Audit Logging & Compliance

**Immutable Log**: All changes recorded with user attribution and timestamp
- Entity type (action_item, project, team, user)
- Action type (created, updated, status_changed, owner_changed)
- Old and new values (JSON)
- Timestamp (UTC)
- User ID

**Events Logged**: User changes, project/team changes, action item creation/update/status/owner/due_date/completion, comments, permission changes, exports

**Access**: System Admin only; not deletable; retention 7+ years

**Compliance**: GDPR-ready (user data export/delete within company constraints), SOC 2 ready (audit trail maintained)

## Performance & Scalability

### Database Optimization

- **Indexes**: Composite indexes on company_id + status + due_date for fast filtering
- **Pagination**: Mandatory 25-item limit; no full-table queries
- **Connection Pooling**: Supabase connection pool (min 5, max 20 per instance)
- **Query Optimization**: Filter at database level, not in application

### Caching

- **Database**: Indexes and RLS policies (Layer 1)
- **API Cache**: Dashboard queries cached 2 min in Redis (Layer 2)
- **HTTP Cache**: Static assets with ETag, API responses with Cache-Control headers (Layer 3)

### Load Testing Targets

- Dashboard: <3s load for 10,000 items (p95)
- API: <500ms response (p95)
- Concurrent: 500 users per company
- Notifications: 1,000 emails/min
- Availability: 99.5% uptime

### Horizontal Scaling

- Stateless API: Run multiple instances behind load balancer
- Read replicas: For analytics and reporting queries
- Background workers: Separate process for notifications/escalation jobs
- Message queue: Future (v1.1) for real-time subscriptions

## Project Structure

```
ait-mvp/
├── specs/001-ait-mvp/
│   ├── spec.md              (Feature specification)
│   ├── plan.md              (This file)
│   ├── tasks.md             (Implementation tasks by phase)
│   ├── checklists/
│   └── contracts/
├── backend/
│   ├── src/
│   │   ├── auth/            (JWT validation, Supabase integration)
│   │   ├── middleware/      (Company isolation, auth, error handling)
│   │   ├── routes/          (API endpoints)
│   │   ├── services/        (Business logic)
│   │   ├── models/          (Database queries)
│   │   ├── jobs/            (Background: escalation, notifications)
│   │   └── utils/           (Helpers, validation)
│   ├── tests/               (Unit, integration, e2e)
│   ├── migrations/          (SQL schema)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      (Dashboards, forms, notifications)
│   │   ├── hooks/           (useAuth, useFetch, useCompany)
│   │   ├── services/        (API client)
│   │   ├── context/         (Auth, company context)
│   │   └── utils/           (Formatters, validators)
│   ├── tests/               (Unit, e2e)
│   └── package.json
└── docs/
    ├── architecture.md
    ├── database-schema.md
    ├── api-contract.md
    └── deployment.md
```

## Implementation Phases (10 Weeks)

### Phase 0: Foundation (Weeks 1-2)
- Database schema, RLS policies
- Supabase project, Auth setup
- Express API scaffolding
- React + Vite setup
- JWT validation middleware
- Company isolation middleware

### Phase 1: Core Action Items (Weeks 3-4)
- Action item CRUD
- Status workflow
- Pagination, filtering
- Validation error handling (field-level)
- Audit log integration
- Create/edit UI, filters, list view

### Phase 2: Projects & Teams (Week 5)
- Project CRUD, archiving
- Team CRUD, member management
- Project-team mapping
- UI for management

### Phase 3: Notifications (Week 6)
- In-app notifications
- Email queue with retry logic
- Due-date reminder job
- Overdue escalation job (idempotent)
- Notification preferences
- Notification center UI

### Phase 4: Audit & History (Week 7)
- Audit log queries
- History view on items
- Audit viewer (Admin)

### Phase 5: Dashboards & Reports (Week 8)
- Dashboard query endpoints
- Aggregation queries
- Excel/PDF export
- Dashboard UI components
- Charts (pie, bar)

### Phase 6: Testing & Optimization (Week 9)
- Unit tests (80%+ coverage)
- Integration tests
- Load testing
- Performance tuning
- Database optimization

### Phase 7: Deployment & Launch (Week 10)
- Database backups
- CI/CD pipeline
- Monitoring/alerting
- Documentation
- Production launch

## Success Criteria

From specification:

✅ Action Item Creation: 99.9% success rate  
✅ Dashboard Load: 95% < 3s  
✅ Notification Delivery: 95% < 2 min  
✅ Data Isolation: Zero cross-company leakage  
✅ Availability: 99.5% uptime  
✅ Overdue Escalation: 100% flagged within 24 hours  
✅ Audit Trail: 100% accurate  
✅ Concurrent Users: 500+  

## Next Steps

1. **Review & Approval**: Stakeholder sign-off
2. **Task Breakdown**: Run `/speckit.tasks` to create phase-by-phase implementation tasks
3. **Phase 0**: Begin database and infrastructure setup
4. **Phase 1**: Start action item core development

---

**Status**: Draft - Ready for task breakdown  
**Last Updated**: 2026-01-21
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
