# Implementation Tasks: Action Item Tracker (AIT) MVP

**Feature**: Action Item Tracker (AIT) MVP  
**Branch**: `001-ait-mvp` | **Date**: 2026-01-21  
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)  
**Status**: Ready for execution

---

## Task Organization Overview

Tasks are organized into **7 phases** following the technical implementation plan:
- **Phase 0**: Foundation (Database, auth, scaffolding) - Weeks 1-2
- **Phase 1**: Core Action Items (CRUD, status workflow) - Weeks 3-4  
- **Phase 2**: Projects & Teams (Organizational structure) - Week 5
- **Phase 3**: Notifications & Escalations (Background jobs) - Week 6
- **Phase 4**: Audit & History (Compliance) - Week 7
- **Phase 5**: Dashboards & Reports (Analytics) - Week 8
- **Phase 6**: Testing & Optimization (Quality assurance) - Week 9
- **Phase 7**: Deployment & Launch (Production readiness) - Week 10

Each phase groups related user stories. Tasks follow **checklist format**:
```
- [ ] [TaskID] [P] [StoryID] Description with file path
```

Format rules:
- **Checkbox**: ALWAYS `- [ ]`
- **ID**: T001, T002, etc. (sequential, execution order)
- **[P]**: Parallelizable (independent, no blocking dependencies)
- **[Story]**: [US1], [US2], etc. (user story this task delivers)
- **Description**: Clear action with exact file path

---

## Phase 0: Foundation (Weeks 1-2)

**Goal**: Establish project infrastructure, database schema, authentication, and API scaffolding. All subsequent phases depend on Phase 0 completion.

**Independent Test Criteria**:
- Database schema created and migrations run successfully
- Supabase project initialized with RLS policies
- Express API server starts and responds to health check
- React app builds and renders authentication flow
- Middleware validates JWT and company_id
- No cross-company data leakage in test queries

### Setup Tasks

- [ ] T001 Create backend project structure with Express, TypeScript, and dependency scaffolding in `backend/`
- [ ] T002 Create frontend project structure with React + Vite, TypeScript, and routing setup in `frontend/`
- [ ] T003 [P] Create PostgreSQL database migrations directory structure in `backend/migrations/`
- [ ] T004 [P] Create `.env.example` template with required environment variables (DB_URL, SUPABASE_KEY, JWT_SECRET, etc.) in `backend/`
- [ ] T005 [P] Create `.env.example` template for frontend (API_BASE_URL, VITE_SUPABASE_URL) in `frontend/`
- [ ] T006 Initialize package.json scripts for build, test, dev, migrate in `backend/package.json`
- [ ] T007 [P] Initialize package.json scripts for build, test, dev in `frontend/package.json`
- [ ] T008 Create GitHub Actions workflow for CI/CD in `.github/workflows/ci.yml`

### Database & Multi-Tenancy Foundation

- [ ] T009 Create SQL migration: `001_init_schema.sql` with base tables (companies, users) in `backend/migrations/`
- [ ] T010 [P] Create SQL migration: `002_action_items_schema.sql` with action_items, projects, teams, meetings tables in `backend/migrations/`
- [ ] T011 [P] Create SQL migration: `003_audit_logs_schema.sql` with immutable audit_logs and notifications_queue tables in `backend/migrations/`
- [ ] T012 [P] Create SQL migration: `004_indexes.sql` with performance indexes (company_id + status + due_date, etc.) in `backend/migrations/`
- [ ] T013 Create RLS (Row Level Security) policies in `005_rls_policies.sql` enforcing company_id isolation in `backend/migrations/`
- [ ] T014 [P] Create RLS policies for action_items, projects, teams, meetings, audit_logs, notifications in `backend/migrations/005_rls_policies.sql`
- [ ] T015 [P] Create Supabase project setup script (enable RLS, create policies, seed test company) in `backend/scripts/init-supabase.sh`
- [ ] T016 Run migrations in Supabase and verify schema with RLS policies enabled

### Authentication & Authorization

- [ ] T017 Create JWT validation middleware in `backend/src/middleware/auth.ts` supporting Supabase auth
- [ ] T018 [P] Create company isolation middleware in `backend/src/middleware/company.ts` to extract and validate company_id from JWT
- [ ] T019 [P] Create RBAC permission check middleware in `backend/src/middleware/rbac.ts` with role-to-permission mapping
- [ ] T020 [P] Create error handling middleware in `backend/src/middleware/error.ts` with consistent error response format
- [ ] T021 Create Supabase client factory in `backend/src/auth/supabase.ts` for JWT verification
- [ ] T022 [P] Create test suite for auth middleware in `backend/tests/auth.test.ts` (JWT validation, company isolation, RBAC)

### Express API Scaffolding

- [ ] T023 Create Express app initialization with middleware chain in `backend/src/app.ts`
- [ ] T024 [P] Create server startup file in `backend/src/server.ts` with graceful shutdown
- [ ] T025 [P] Create health check endpoint GET `/health` in `backend/src/routes/health.ts`
- [ ] T026 [P] Create API router structure in `backend/src/routes/index.ts` with route mounting
- [ ] T027 Create database connection factory in `backend/src/db/connection.ts` with connection pooling
- [ ] T028 [P] Create validation utility functions in `backend/src/utils/validation.ts` (future field validators)
- [ ] T029 [P] Create response formatter utility in `backend/src/utils/response.ts` for consistent API responses
- [ ] T030 Create test suite for Express initialization in `backend/tests/setup.test.ts` (app boots, health check works)

### React Frontend Scaffolding

- [ ] T031 Create React app entry point with Vite config in `frontend/src/main.tsx`
- [ ] T032 [P] Create App router setup with React Router in `frontend/src/App.tsx`
- [ ] T033 [P] Create Supabase client initialization in `frontend/src/services/supabase.ts`
- [ ] T034 [P] Create API client factory with axios/fetch in `frontend/src/services/api.ts`
- [ ] T035 [P] Create auth context and provider in `frontend/src/context/AuthContext.tsx` (login, logout, user state)
- [ ] T036 [P] Create company context and provider in `frontend/src/context/CompanyContext.tsx` (company_id, isolation)
- [ ] T037 [P] Create authentication layout in `frontend/src/layouts/AuthLayout.tsx` (login page structure)
- [ ] T038 Create test suite for React initialization in `frontend/tests/setup.test.ts` (app renders, context works)

### Documentation

- [ ] T039 [P] Create database schema diagram and document in `docs/database-schema.md`
- [ ] T040 [P] Create API contract documentation (OpenAPI 3.0) in `docs/api-contract.md` (stub for all endpoints)
- [ ] T041 Create local development setup guide in `docs/DEVELOPMENT.md` (env setup, migrations, running locally)
- [ ] T042 [P] Create architecture decision document in `docs/architecture.md` (why Supabase, RLS, multi-tenancy approach)

---

## Phase 1: Core Action Items (Weeks 3-4)

**Goal**: Implement action item creation, viewing, filtering, and status workflow. This is the MVP core feature that drives user value. All subsequent features depend on action items existing.

**User Stories Delivered**: 
- US1: Create Action Items from Meetings
- US2: View and Filter Action Items

**Independent Test Criteria**:
- Create action item with all required fields (title, description, owner, due date, priority)
- Validation errors display inline at field level (not modal)
- Owner assignment triggers notification
- Filter by status, due date, priority, project, team
- Status workflow (Open → In Progress → Completed → Closed)
- Pagination works (25 items/page)
- Concurrent edit conflicts show refresh modal
- Audit log records all changes
- Dashboard loads in <3 seconds with 1000+ items
- Can be fully tested independent of notifications, dashboards, or reports

### Backend API - Action Items CRUD

- [ ] T043 [US1] Create action item service in `backend/src/services/actionItemService.ts` with create/read/update/list methods
- [ ] T044 [P] [US1] Create action item validation in `backend/src/utils/actionItemValidation.ts` (required fields, future due date, owner exists)
- [ ] T045 [P] [US1] Create action items route handler in `backend/src/routes/actionItems.ts` with POST, GET, PUT endpoints
- [ ] T046 [P] [US1] Implement POST /api/v1/action-items (create) with company isolation, validation, audit logging in `backend/src/routes/actionItems.ts`
- [ ] T047 [P] [US1] Implement GET /api/v1/action-items (list) with filters (status, priority, owner, project, team, due_date) and pagination in `backend/src/routes/actionItems.ts`
- [ ] T048 [P] [US1] Implement GET /api/v1/action-items/:id (detail) with full item data and audit trail in `backend/src/routes/actionItems.ts`
- [ ] T049 [P] [US2] Implement PUT /api/v1/action-items/:id (update) with optimistic locking for concurrent edits in `backend/src/routes/actionItems.ts`
- [ ] T050 [P] [US2] Implement PATCH /api/v1/action-items/:id/status (status change) with workflow validation in `backend/src/routes/actionItems.ts`
- [ ] T051 Create audit logging service in `backend/src/services/auditService.ts` to record all action item changes
- [ ] T052 [P] Create notification service (stub) in `backend/src/services/notificationService.ts` for future integration (T111)
- [ ] T053 [P] Create test suite for action items API in `backend/tests/actionItems.api.test.ts` covering all endpoints, validation, permissions
- [ ] T054 [P] Create test suite for concurrent edit conflicts in `backend/tests/actionItems.concurrent.test.ts`

### Frontend - Action Items UI

- [ ] T055 [US1] Create action item form component in `frontend/src/components/ActionItemForm.tsx` with fields (title, description, owner, priority, due date, project, team)
- [ ] T056 [P] [US1] Create action item validation with inline field errors in `frontend/src/utils/actionItemValidation.ts` (error messages below each field)
- [ ] T057 [P] [US1] Create action item API client methods in `frontend/src/services/actionItemClient.ts` (create, list, detail, update, changeStatus)
- [ ] T058 [P] [US1] Implement create action item flow in ActionItemForm: validate → display inline errors → submit → show success
- [ ] T059 [P] [US1] Create concurrent edit conflict modal in `frontend/src/components/ConflictModal.tsx` with "Refresh to see latest" button
- [ ] T060 [P] [US2] Create action items list component in `frontend/src/components/ActionItemList.tsx` with table display (title, owner, status, due_date, priority)
- [ ] T061 [P] [US2] Create action items filter component in `frontend/src/components/ActionItemFilters.tsx` (status, priority, owner, project, team, due_date dropdowns)
- [ ] T062 [P] [US2] Implement pagination in ActionItemList (25/page, prev/next buttons, page indicator)
- [ ] T063 [US2] Create "My Action Items" dashboard page in `frontend/src/pages/MyActionItems.tsx` (list + filters + pagination)
- [ ] T064 [P] [US2] Create action item detail page in `frontend/src/pages/ActionItemDetail.tsx` (read-only display with edit button, history section)
- [ ] T065 [P] [US2] Create status badge component in `frontend/src/components/StatusBadge.tsx` with color coding (Open=blue, In Progress=yellow, Completed=green, Closed=gray, On Hold=orange)
- [ ] T066 [P] [US2] Create due date display component in `frontend/src/components/DueDate.tsx` with "Due in X days" formatting
- [ ] T067 [P] [US2] Create test suite for action items UI in `frontend/tests/actionItems.test.tsx` (form validation, list display, filtering, pagination)

### Audit Logging

- [ ] T068 Create audit log record on action item create in `backend/src/services/auditService.ts` (entity_type=action_item, action=created)
- [ ] T069 [P] Create audit log record on action item update (status, owner, due_date) in `backend/src/services/auditService.ts`
- [ ] T070 [P] Create audit log record on action item completion in `backend/src/services/auditService.ts` (record completion timestamp)
- [ ] T071 [P] Create GET /api/v1/action-items/:id/history endpoint in `backend/src/routes/actionItems.ts` returning audit trail
- [ ] T072 [P] Create history display component in `frontend/src/components/ActionItemHistory.tsx` showing chronological change log
- [ ] T073 Create test suite for audit logging in `backend/tests/audit.test.ts` (all changes logged, timestamp accurate, immutable)

---

## Phase 2: Projects & Teams (Week 5)

**Goal**: Implement organizational structure (projects and teams) so action items can be scoped and filtered by project/team. Team-based filtering depends on this.

**User Story Delivered**:
- US6: Manage Projects and Teams

**Independent Test Criteria**:
- Create project with all fields (name, description, dates, PM)
- Create team under project (name, description, lead)
- Add/remove team members
- Project manager access control enforced
- Team filtering works in action item list
- Project filtering works in action item list
- Can be fully tested independent of notifications, dashboards, reports

### Backend - Projects & Teams

- [ ] T074 [US6] Create project service in `backend/src/services/projectService.ts` (create, read, update, list, archive)
- [ ] T075 [P] [US6] Create team service in `backend/src/services/teamService.ts` (create, read, update, list, addMember, removeMember)
- [ ] T076 [P] [US6] Create project validation in `backend/src/utils/projectValidation.ts` (name required, dates valid, PM exists)
- [ ] T077 [P] [US6] Create team validation in `backend/src/utils/teamValidation.ts` (name required, lead exists, members are users)
- [ ] T078 [P] [US6] Create projects route in `backend/src/routes/projects.ts` with POST, GET, PUT, PATCH endpoints
- [ ] T079 [P] [US6] Implement POST /api/v1/projects (create) with PM assignment and company isolation in `backend/src/routes/projects.ts`
- [ ] T080 [P] [US6] Implement GET /api/v1/projects (list) with pagination and filtering in `backend/src/routes/projects.ts`
- [ ] T081 [P] [US6] Implement GET /api/v1/projects/:id (detail) with teams and action items count in `backend/src/routes/projects.ts`
- [ ] T082 [P] [US6] Implement PUT /api/v1/projects/:id (update) with PM/Admin check in `backend/src/routes/projects.ts`
- [ ] T083 [P] [US6] Implement PATCH /api/v1/projects/:id/archive (archive/unarchive) in `backend/src/routes/projects.ts`
- [ ] T084 [P] [US6] Create teams route in `backend/src/routes/teams.ts` with POST, GET, PUT, DELETE endpoints
- [ ] T085 [P] [US6] Implement POST /api/v1/teams (create) with lead assignment in `backend/src/routes/teams.ts`
- [ ] T086 [P] [US6] Implement GET /api/v1/teams (list) with project filter and member count in `backend/src/routes/teams.ts`
- [ ] T087 [P] [US6] Implement POST /api/v1/teams/:id/members (add member) with validation in `backend/src/routes/teams.ts`
- [ ] T088 [P] [US6] Implement DELETE /api/v1/teams/:id/members/:uid (remove member) in `backend/src/routes/teams.ts`
- [ ] T089 [P] [US6] Create test suite for projects API in `backend/tests/projects.api.test.ts`
- [ ] T090 [P] [US6] Create test suite for teams API in `backend/tests/teams.api.test.ts`

### Frontend - Projects & Teams Management

- [ ] T091 [US6] Create project form component in `frontend/src/components/ProjectForm.tsx` (name, description, dates, PM dropdown)
- [ ] T092 [P] [US6] Create project list component in `frontend/src/pages/Projects.tsx` (table with archived indicator, action buttons)
- [ ] T093 [P] [US6] Create team form component in `frontend/src/components/TeamForm.tsx` (name, description, lead dropdown)
- [ ] T094 [P] [US6] Create team member list component in `frontend/src/components/TeamMembers.tsx` (add/remove member functionality)
- [ ] T095 [P] [US6] Create team management page in `frontend/src/pages/Teams.tsx` (team list, create, edit, members)
- [ ] T096 [P] [US6] Integrate project dropdown in action item form (populated from ProjectService)
- [ ] T097 [P] [US6] Integrate team dropdown in action item form (filtered by selected project)
- [ ] T098 [P] [US6] Create test suite for project/team UI in `frontend/tests/projects.test.tsx`

### Update Action Item Schema & Queries

- [ ] T099 Update action items list to populate project/team names from related tables in `backend/src/routes/actionItems.ts`
- [ ] T100 [P] Update action item detail to show project and team information in `backend/src/routes/actionItems.ts`

---

## Phase 3: Notifications & Escalations (Week 6)

**Goal**: Implement notification system (in-app + email) with background jobs for reminders and escalations. Addresses clarifications Q1 (email retry with exponential backoff).

**User Story Delivered**:
- US3: Receive Notifications and Escalations

**Independent Test Criteria**:
- Assignment notification sent to owner (in-app immediate, email within 5 min)
- Due-date reminder triggered 2 days before (in-app + email)
- Overdue escalation job runs daily, marks items overdue, notifies PM
- Escalation job is idempotent (no duplicate notifications)
- Email failures queued with retry (1min, 5min, 30min backoff)
- User preferences (opt-out email) respected
- Notification center shows read/unread
- Can be fully tested with action items existing

### Backend - Notification Services

- [ ] T101 [US3] Implement notification service in `backend/src/services/notificationService.ts` (create in-app notification, queue email, send immediately)
- [ ] T102 [P] [US3] Create email queue processor in `backend/src/jobs/emailQueue.ts` (process queue every 5 min, handle retries with backoff)
- [ ] T103 [P] [US3] Create escalation job in `backend/src/jobs/escalationJob.ts` (daily 8 AM, mark overdue, send escalation email, idempotent check)
- [ ] T104 [P] [US3] Create due-date reminder job in `backend/src/jobs/reminderJob.ts` (daily 9 AM, notify owners of items due in 2 days)
- [ ] T105 [P] [US3] Create notification preferences service in `backend/src/services/notificationPreferences.ts` (email opt-out, in-app only)
- [ ] T106 [P] [US3] Update action item creation to trigger assignment notification in `backend/src/services/actionItemService.ts`
- [ ] T107 [P] [US3] Update action item status change to trigger status change notification in `backend/src/services/actionItemService.ts`
- [ ] T108 [P] [US3] Update action item owner change to trigger reassignment notifications (old + new owner) in `backend/src/services/actionItemService.ts`
- [ ] T109 Create notification routes in `backend/src/routes/notifications.ts` with GET, PATCH endpoints
- [ ] T110 [P] Implement GET /api/v1/notifications (list unread) with pagination in `backend/src/routes/notifications.ts`
- [ ] T111 [P] Implement PATCH /api/v1/notifications/:id (mark read) in `backend/src/routes/notifications.ts`
- [ ] T112 [P] Create test suite for notification service in `backend/tests/notifications.test.ts` (in-app, email queue, preferences)
- [ ] T113 [P] Create test suite for escalation job in `backend/tests/escalation.test.ts` (idempotency, overdue marking, notification sent)

### Frontend - Notification Center

- [ ] T114 [US3] Create notification center component in `frontend/src/components/NotificationCenter.tsx` (list of unread, mark read, delete)
- [ ] T115 [P] [US3] Create notification badge in `frontend/src/components/NotificationBadge.tsx` (unread count, bell icon in header)
- [ ] T116 [P] [US3] Implement notification preferences page in `frontend/src/pages/NotificationPreferences.tsx` (email opt-out toggle)
- [ ] T117 [P] [US3] Create notification service client in `frontend/src/services/notificationClient.ts` (list, markRead)
- [ ] T118 [P] [US3] Implement polling for new notifications (check every 30 sec) in notification context
- [ ] T119 [P] Create test suite for notification UI in `frontend/tests/notifications.test.tsx`

---

## Phase 4: Audit & History (Week 7)

**Goal**: Implement immutable audit logging and historical view on action items. Addresses compliance and data integrity requirements.

**User Story Delivered**:
- US4: Track Action Item Status and History

**Independent Test Criteria**:
- All changes logged (creation, status, owner, due_date, completion)
- Audit records immutable and timestamped
- History view shows chronological change log
- System admin can view company audit logs
- Can be fully tested with action items and notifications existing

### Backend - Audit Trail

- [ ] T120 [US4] Enhance audit service in `backend/src/services/auditService.ts` to log all events (already partially done T051-T070)
- [ ] T121 [P] [US4] Create audit log queries in `backend/src/services/auditService.ts` (getHistory, getCompanyAuditLog)
- [ ] T122 [P] [US4] Log notification events in `backend/src/services/auditService.ts` (when notifications sent, status change)
- [ ] T123 [P] [US4] Log comment creation/updates in audit trail (future feature, placeholder)
- [ ] T124 Create audit routes in `backend/src/routes/audit.ts` (admin only)
- [ ] T125 [P] Implement GET /api/v1/audit-logs (system admin only) with pagination and filtering in `backend/src/routes/audit.ts`
- [ ] T126 [P] Implement GET /api/v1/action-items/:id/history (for any user to see item history) in `backend/src/routes/actionItems.ts` (already in T071)
- [ ] T127 Create test suite for audit system in `backend/tests/audit.test.ts`

### Frontend - History View

- [ ] T128 [US4] Create audit log viewer page in `frontend/src/pages/AuditLogs.tsx` (admin only)
- [ ] T129 [P] [US4] Enhance action item detail page to show history section with formatted changes in `frontend/src/pages/ActionItemDetail.tsx` (already in T064)
- [ ] T130 [P] [US4] Create change log component in `frontend/src/components/ChangeLog.tsx` (displays formatted audit entries with user/timestamp)
- [ ] T131 [P] Create test suite for history UI in `frontend/tests/history.test.tsx`

---

## Phase 5: Dashboards & Reports (Week 8)

**Goal**: Implement team and project dashboards with real-time metrics and on-demand reports. Addresses user story US5.

**User Story Delivered**:
- US5: Generate Dashboards and Reports

**Independent Test Criteria**:
- Team dashboard loads <3s, shows team metrics (items, completion %, by member)
- Project dashboard loads <3s, shows project metrics (completion rate, due items, overdue)
- Completion report calculated correctly ((Completed+Closed)/Total*100)
- Team productivity report shows items per member and turnaround time
- Export to Excel includes required columns
- Export to PDF includes charts (pie, bar)
- Filtering by date range recalculates metrics
- Can be fully tested with action items and teams existing

### Backend - Dashboard & Report Queries

- [ ] T132 [US5] Create dashboard service in `backend/src/services/dashboardService.ts` (my-items, team, project aggregation)
- [ ] T133 [P] [US5] Implement team dashboard queries (team items count, completion %, items by status) in `backend/src/services/dashboardService.ts`
- [ ] T134 [P] [US5] Implement project dashboard queries (project items, completion %, due items, overdue items) in `backend/src/services/dashboardService.ts`
- [ ] T135 [P] [US5] Create report service in `backend/src/services/reportService.ts` (completion, productivity, overdue)
- [ ] T136 [P] [US5] Implement completion report query (total, completed, rate, by status) in `backend/src/services/reportService.ts`
- [ ] T137 [P] [US5] Implement productivity report query (items per member, completion rate by member) in `backend/src/services/reportService.ts`
- [ ] T138 [P] [US5] Implement overdue report query (items past due, days overdue, owner) in `backend/src/services/reportService.ts`
- [ ] T139 Create dashboard routes in `backend/src/routes/dashboards.ts`
- [ ] T140 [P] Implement GET /api/v1/dashboards/my-items (user's assigned items with counts) in `backend/src/routes/dashboards.ts`
- [ ] T141 [P] Implement GET /api/v1/dashboards/team (team lead/PM only) in `backend/src/routes/dashboards.ts`
- [ ] T142 [P] Implement GET /api/v1/dashboards/project (PM only) in `backend/src/routes/dashboards.ts`
- [ ] T143 Create report routes in `backend/src/routes/reports.ts`
- [ ] T144 [P] Implement GET /api/v1/reports/completion (query-based report) in `backend/src/routes/reports.ts`
- [ ] T145 [P] Implement GET /api/v1/reports/productivity (query-based report) in `backend/src/routes/reports.ts`
- [ ] T146 [P] Implement GET /api/v1/reports/overdue (query-based report) in `backend/src/routes/reports.ts`
- [ ] T147 [P] Implement POST /api/v1/reports/export (Excel/PDF export with date range filter) in `backend/src/routes/reports.ts`
- [ ] T148 Create caching layer for dashboard queries (2 min Redis cache) in `backend/src/utils/cache.ts`
- [ ] T149 [P] Create test suite for dashboard queries in `backend/tests/dashboards.test.ts`
- [ ] T150 [P] Create test suite for report generation in `backend/tests/reports.test.ts`

### Frontend - Dashboard & Report UI

- [ ] T151 [US5] Create team dashboard page in `frontend/src/pages/TeamDashboard.tsx` (team metrics, items list, member breakdown)
- [ ] T152 [P] [US5] Create project dashboard page in `frontend/src/pages/ProjectDashboard.tsx` (project metrics, items list, status breakdown)
- [ ] T153 [P] [US5] Create dashboard metric card component in `frontend/src/components/MetricCard.tsx` (title, value, sparkline chart)
- [ ] T154 [P] [US5] Create pie chart component in `frontend/src/components/PieChart.tsx` (completion %, status distribution)
- [ ] T155 [P] [US5] Create bar chart component in `frontend/src/components/BarChart.tsx` (items by team member, items by status)
- [ ] T156 [P] [US5] Create report generation page in `frontend/src/pages/Reports.tsx` (report selector, filters, export buttons)
- [ ] T157 [P] [US5] Implement report service client in `frontend/src/services/reportClient.ts` (fetch reports, export Excel/PDF)
- [ ] T158 [P] [US5] Implement date range filter component in `frontend/src/components/DateRangeFilter.tsx` (start/end date pickers)
- [ ] T159 [P] [US5] Create test suite for dashboard UI in `frontend/tests/dashboards.test.tsx`
- [ ] T160 [P] Create test suite for report UI in `frontend/tests/reports.test.tsx`

---

## Phase 6: Testing & Optimization (Week 9)

**Goal**: Comprehensive testing (unit, integration, e2e), load testing, and performance optimization to meet SLA targets. Ensure 80%+ code coverage and <3s dashboard load.

**Independent Test Criteria**:
- Unit test coverage ≥80% (backend + frontend)
- All API endpoints tested with integration tests
- Load test shows <500ms p95 for /action-items list
- Dashboard loads <3s with 10,000+ items
- No SQL injection or XSS vulnerabilities
- RLS policies prevent cross-company data leakage
- All non-functional requirements validated

### Testing Tasks

- [ ] T161 Create comprehensive unit test suite for backend services in `backend/tests/services/` (80%+ coverage)
- [ ] T162 [P] Create integration tests for API endpoints in `backend/tests/api/` (all endpoints, all methods)
- [ ] T163 [P] Create end-to-end tests in `backend/tests/e2e/` (full workflow: create project → team → items → filter → report)
- [ ] T164 [P] Create security tests in `backend/tests/security/` (SQL injection, XSS, CSRF, RLS validation)
- [ ] T165 [P] Create comprehensive unit tests for frontend components in `frontend/tests/` (80%+ coverage)
- [ ] T166 [P] Create E2E tests for critical user workflows in `frontend/tests/e2e/` (using Playwright or Cypress)
- [ ] T167 Create load test suite in `backend/tests/load/` using k6 or Apache JMeter
- [ ] T168 [P] Run load test for GET /api/v1/action-items (target: 500ms p95 with 10,000 items)
- [ ] T169 [P] Run load test for dashboard queries (target: <3s with 10,000 items)
- [ ] T170 [P] Verify database indexes are being used in load tests (EXPLAIN ANALYZE queries)

### Optimization Tasks

- [ ] T171 Analyze database query performance using EXPLAIN ANALYZE in `backend/docs/query-analysis.md`
- [ ] T172 [P] Add missing indexes if load tests reveal slow queries (update `backend/migrations/004_indexes.sql`)
- [ ] T173 [P] Implement connection pooling (verify Supabase connection pool min=5, max=20) in `backend/src/db/connection.ts`
- [ ] T174 [P] Verify pagination is enforced (max 25 items per page) in all list endpoints
- [ ] T175 [P] Implement caching layer for dashboard queries (Redis, 2-min TTL) in `backend/src/utils/cache.ts`
- [ ] T176 [P] Add HTTP response caching headers to static assets in `backend/src/middleware/cache.ts`
- [ ] T177 [P] Optimize React components (useMemo, useCallback) in `frontend/src/components/` critical paths
- [ ] T178 [P] Enable code splitting and lazy loading in React Router in `frontend/src/App.tsx`
- [ ] T179 [P] Test with React DevTools Profiler to identify slow renders in `frontend/`
- [ ] T180 [P] Verify bundle size <500KB (gzip) in frontend build

### Coverage & Quality Gate

- [ ] T181 Run test coverage report for backend and enforce ≥80% in `backend/`
- [ ] T182 [P] Run test coverage report for frontend and enforce ≥80% in `frontend/`
- [ ] T183 [P] Run linting (ESLint/Prettier) and fix all issues
- [ ] T184 [P] Run TypeScript strict mode check on both backend and frontend
- [ ] T185 [P] Run security scanning (OWASP ZAP or Snyk) on API endpoints
- [ ] T186 Generate test coverage badge and add to README.md

---

## Phase 7: Deployment & Launch (Week 10)

**Goal**: Prepare for production launch including database backups, CI/CD pipeline, monitoring, and documentation.

**Independent Test Criteria**:
- Automated CI/CD pipeline runs tests and deploys successfully
- Backups scheduled and verified (RPO 24h)
- Monitoring and alerting configured
- Documentation is complete and accurate
- Production readiness checklist passed

### Infrastructure & DevOps

- [ ] T187 Create Dockerfile for backend in `backend/Dockerfile` (multi-stage, Node.js 18+)
- [ ] T188 [P] Create Dockerfile for frontend in `frontend/Dockerfile` (multi-stage, Nginx static hosting)
- [ ] T189 [P] Create docker-compose.yml for local development in `docker-compose.yml`
- [ ] T190 [P] Create deployment scripts for staging in `backend/scripts/deploy-staging.sh`
- [ ] T191 [P] Create deployment scripts for production in `backend/scripts/deploy-prod.sh`
- [ ] T192 [P] Set up CI/CD pipeline (GitHub Actions) in `.github/workflows/ci.yml` (lint, test, build, deploy on main)
- [ ] T193 [P] Configure automated backups for Supabase (daily, 7-day retention) via Supabase dashboard
- [ ] T194 [P] Configure backup verification job in `backend/scripts/verify-backup.sh` (runs weekly, checks restore)
- [ ] T195 [P] Set up monitoring and alerting (UptimeRobot, DataDog, or Sentry) for API health
- [ ] T196 [P] Configure error tracking and logging (Sentry or LogRocket) for both frontend and backend
- [ ] T197 [P] Set up performance monitoring (e.g., New Relic, DataDog APM) for API response times

### Documentation & Handoff

- [ ] T198 Create production deployment guide in `docs/DEPLOYMENT.md` (infrastructure, environment, CI/CD, backups)
- [ ] T199 [P] Create operational runbook in `docs/OPERATIONS.md` (common issues, troubleshooting, escalation)
- [ ] T200 [P] Create API documentation (OpenAPI 3.0 / Swagger) with examples in `docs/api-contract.md` (generate from code)
- [ ] T201 [P] Create database schema documentation in `docs/database-schema.md` (table descriptions, relationships, indexes)
- [ ] T202 [P] Create user documentation / help guide in `docs/USER_GUIDE.md` (features, workflows, FAQ)
- [ ] T203 [P] Create admin guide in `docs/ADMIN_GUIDE.md` (user management, roles, company setup, audit logs)
- [ ] T204 [P] Update README.md with project overview, tech stack, setup, and links to docs

### Pre-Launch Checklist

- [ ] T205 Production readiness checklist in `docs/PRODUCTION_CHECKLIST.md` (security, performance, reliability, compliance)
- [ ] T206 [P] Run security audit checklist (OWASP Top 10, RLS policies, authentication)
- [ ] T207 [P] Verify compliance requirements (GDPR data export, SOC 2 audit trail)
- [ ] T208 [P] Run final load test in production environment (staging) with prod data volume
- [ ] T209 [P] Conduct disaster recovery drill (backup restore, failover)
- [ ] T210 [P] Configure production monitoring and alerting thresholds
- [ ] T211 [P] Create incident response runbook in `docs/INCIDENT_RESPONSE.md`
- [ ] T212 [P] Train team on production deployment and operations
- [ ] T213 [P] Schedule post-launch retrospective (1 week after launch)
- [ ] T214 Deploy to production and monitor closely (first 24 hours)

---

## Dependency Graph & Execution Strategy

### Critical Path (Sequential Dependencies)

```
Phase 0 (Foundation)
    ↓
Phase 1 (Core Action Items) ← depends on Phase 0
    ↓
Phase 2 (Projects & Teams) ← depends on Phase 1
    ↓
Phase 3 (Notifications) ← depends on Phase 1 & 2
    ↓
Phase 4 (Audit) ← depends on Phase 1
    ↓
Phase 5 (Dashboards) ← depends on Phase 1, 2, 3
    ↓
Phase 6 (Testing & Optimization) ← depends on all prior phases
    ↓
Phase 7 (Deployment) ← depends on Phase 6
```

### Parallelizable Task Groups (Within Phase)

**Phase 0**: T003-T008 (project structure), T009-T015 (database), T017-T022 (auth), T023-T030 (API), T031-T038 (frontend), T039-T042 (docs) can run in parallel after T001-T002 complete

**Phase 1**: Backend endpoints (T043-T054) and frontend UI (T055-T067) can run in parallel; integration happens after both complete

**Phase 5**: Report service (T135-T147) and dashboard UI (T151-T160) can run in parallel after backend queries complete

**Phase 6**: Unit tests and E2E tests (T161-T166) can run in parallel; load tests (T167-T169) run after all tests pass

### User Story Completion Order (MVP Sequence)

1. **US1 + US2** (Phase 1): Create items, view/filter - **Core MVP, delivers immediate value**
2. **US6** (Phase 2): Projects & teams - **Enables organization, builds on US1/US2**
3. **US3** (Phase 3): Notifications - **Adds accountability, builds on US1 & US2**
4. **US4** (Phase 4): Audit & history - **Compliance, builds on US1**
5. **US5** (Phase 5): Dashboards & reports - **Analytics, builds on US1, US2, US6**

**MVP Completion**: After Phase 5 (Week 8) — all core user stories delivered.
**Production Launch**: After Phase 7 (Week 10) — with full testing, monitoring, and documentation.

---

## Task Summary

**Total Tasks**: 214  
**By Phase**:
- Phase 0 (Foundation): 42 tasks
- Phase 1 (Core Items): 31 tasks
- Phase 2 (Projects & Teams): 27 tasks
- Phase 3 (Notifications): 19 tasks
- Phase 4 (Audit & History): 14 tasks
- Phase 5 (Dashboards & Reports): 30 tasks
- Phase 6 (Testing & Optimization): 26 tasks
- Phase 7 (Deployment & Launch): 28 tasks

**Parallel Opportunities**: 
- ~40% of tasks can run in parallel (marked [P])
- Database setup and backend API scaffolding can overlap
- Frontend UI development can proceed independently after API contracts defined
- Report queries and dashboard UI can be built in parallel

**MVP Scope**: Tasks T001-T132 (Phases 0-5, all user stories, estimated 8 weeks)  
**Production Launch**: Tasks T001-T214 (all phases, estimated 10 weeks)

---

**Status**: Ready for sprint planning  
**Next Action**: Assign tasks to team members by phase and track progress in project management tool (GitHub Projects, Jira, etc.)
