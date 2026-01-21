# Feature Specification: Action Item Tracker (AIT) MVP

**Feature Branch**: `001-ait-mvp`  
**Created**: 2026-01-21  
**Status**: Draft  
**Input**: Comprehensive enterprise requirements for SaaS action item management platform

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Action Items from Meetings (Priority: P1)

As a **Meeting Organizer or Project Manager**, I need to capture action items that arise during meetings and assign them to team members so that accountability is established and follow-ups are tracked.

**Why this priority**: Core MVP feature; without action item creation, the system has no purpose. Every user workflow depends on this.

**Independent Test**: Can be fully tested by: (1) scheduling a meeting, (2) recording action items during/after the meeting, (3) assigning owners and due dates, (4) verifying items appear in the system. Delivers immediate value: centralized action item capture.

**Acceptance Scenarios**:

1. **Given** a user has Project Manager or Team Lead role, **When** they create an action item from a meeting, **Then** the item is recorded with: title, description, linked meeting, assigned owner, priority level, due date, initial status (Open), creation timestamp
2. **Given** a user creates an action item without specifying an owner, **When** they save the item, **Then** the system requires an owner assignment before saving (error: "Owner required")
3. **Given** a user creates multiple action items from the same meeting, **When** they submit, **Then** all items are linked to that meeting and can be filtered by meeting ID
4. **Given** a user assigns an action item to another team member, **When** the item is saved, **Then** the assignee receives an in-app notification + email notification with item details
5. **Given** an owner is not available (leave, departed), **When** the Project Manager reassigns an item to another person, **Then** the old owner is notified of the change and the history is logged

---

### User Story 2 - View and Filter Action Items (Priority: P1)

As a **Team Member or Manager**, I need to see my assigned action items and filter by various criteria so that I can prioritize my work and stay on track.

**Why this priority**: Core feature; users must be able to quickly find their work. This is used daily.

**Independent Test**: Can be fully tested by: (1) creating diverse action items (different statuses, owners, projects), (2) applying individual filters (owner, status, due date), (3) verifying correct items appear. Delivers value: personal task management and situational awareness.

**Acceptance Scenarios**:

1. **Given** a user logs in, **When** they navigate to "My Action Items," **Then** they see all items assigned to them, sorted by due date (nearest first), status shown clearly (Open, In Progress, Completed, Closed, On Hold)
2. **Given** a user is viewing action items, **When** they filter by status "Overdue," **Then** the system shows only items where due_date < today and status != Completed
3. **Given** a user applies multiple filters (e.g., Project: "Q1 Planning" AND Status: "In Progress"), **When** they apply the filters, **Then** only items matching ALL criteria are displayed
4. **Given** a user's list has 50+ items, **When** they scroll, **Then** items load progressively (pagination) and the dashboard remains responsive under normal conditions
5. **Given** a user is viewing the Project Dashboard, **When** they access it, **Then** the page loads within 3 seconds with complete action item data visible
6. **Given** a user filters for items, **When** no items match the criteria, **Then** a clear message is shown: "No action items found matching your criteria" with option to clear filters

---

### User Story 3 - Receive Notifications and Escalations (Priority: P2)

As a **Action Item Owner or Project Manager**, I need to be notified of action items assigned to me, reminders for upcoming due dates, and escalations for overdue items so that I don't miss deadlines and managers can intervene.

**Why this priority**: Important for accountability; ensures items don't fall through cracks. Escalation is a key SaaS feature that adds business value.

**Independent Test**: Can be fully tested by: (1) assigning an item to a user, (2) verifying notification received, (3) advancing time to trigger due-date/overdue checks, (4) verifying escalation logic. Delivers value: proactive accountability and deadline management.

**Acceptance Scenarios**:

1. **Given** an action item is assigned to a user, **When** the assignment is saved, **Then** the assignee receives an in-app notification immediately and an email notification within 5 minutes
2. **Given** an action item has a due date, **When** it is 2 days before the due date, **Then** the owner receives a reminder notification (in-app + email): "Action Item '[title]' is due in 2 days"
3. **Given** an action item's due date has passed and status is not "Completed," **When** the daily escalation job runs, **Then** the item is marked as overdue and the Project Manager receives an escalation notification
4. **Given** a user receives a notification, **When** they click the notification link, **Then** they are taken directly to the action item detail view
5. **Given** an in-app notification exists, **When** a user marks it as read, **Then** it no longer appears in the "unread" count but history is preserved

---

### User Story 4 - Track Action Item Status and History (Priority: P2)

As a **Team Lead or Project Manager**, I need to see action item status changes, ownership changes, and due date modifications so that I can monitor progress and understand what's happening.

**Why this priority**: Essential for accountability and auditability. Enterprises require audit trails for compliance.

**Independent Test**: Can be fully tested by: (1) creating an item, (2) making changes (status, owner, due date), (3) viewing history, (4) verifying timestamps and change details. Delivers value: complete audit trail and change transparency.

**Acceptance Scenarios**:

1. **Given** an action item is created, **When** the item is viewed, **Then** the creation date, creator name, and initial status are recorded
2. **Given** an action item's status is changed, **When** the change is saved, **Then** the old status, new status, timestamp, and user who made the change are logged in the item's history
3. **Given** a user views the action item detail, **When** they scroll to "History," **Then** they see a chronological list of all changes with clear labels: "Status changed from Open to In Progress by [User] on [Date/Time]"
4. **Given** an action item's due date is modified, **When** the change is saved, **Then** a notification is sent to the current owner and the change is logged (old date → new date)
5. **Given** ownership is transferred, **When** the new owner is assigned, **Then** both old and new owners are notified and the history shows: "Owner changed from [Old] to [New] by [User] on [Date]"

---

### User Story 5 - Generate Dashboards and Reports (Priority: P2)

As a **Project Manager or Team Lead**, I need to see project-wide and team-wide dashboards showing completion rates, overdue trends, and team productivity so that I can identify bottlenecks and manage resources.

**Why this priority**: High-value feature for managers; enables data-driven decisions. Post-MVP enhancements can expand analytics.

**Independent Test**: Can be fully tested by: (1) creating action items with various statuses, (2) accessing dashboards, (3) verifying metrics are calculated correctly, (4) exporting a report. Delivers value: management visibility and performance metrics.

**Acceptance Scenarios**:

1. **Given** a user is a Project Manager, **When** they navigate to "Project Dashboard," **Then** they see: total action items, completed count, completion percentage, items due in next 7 days, overdue items count
2. **Given** a Project Dashboard is loaded, **When** the metrics are displayed, **Then** completion rate is calculated as (Completed + Closed) / Total * 100
3. **Given** a Team Lead views the Team Dashboard, **When** they view team productivity metrics, **Then** they see: items per team member, completion rate by member, average time-to-completion
4. **Given** a user is viewing a dashboard, **When** they export the view to Excel, **Then** a spreadsheet is generated with: project name, item title, owner, status, due date, completion date
5. **Given** a dashboard contains data for the current month, **When** the user filters by date range, **Then** metrics recalculate and display only items within the selected range

---

### User Story 6 - Manage Projects and Teams (Priority: P1)

As a **System Admin or Project Manager**, I need to create and manage projects, assign Project Managers, and map teams to projects so that the organizational structure is properly reflected in the system.

**Why this priority**: Foundational feature; required before any action items can be organized. Multi-tenancy and project scope depend on this.

**Independent Test**: Can be fully tested by: (1) creating a project, (2) assigning a Project Manager, (3) adding teams, (4) verifying organizational hierarchy. Delivers value: proper data isolation and role-based access.

**Acceptance Scenarios**:

1. **Given** a user has System Admin role, **When** they create a new project, **Then** the project is created with: name, description, start date, end date, assigned Project Manager, company association
2. **Given** a project is created with a Project Manager, **When** the project is saved, **Then** the Project Manager can immediately access and manage the project
3. **Given** a project has teams assigned, **When** a user views the project, **Then** they can only see action items from teams linked to that project
4. **Given** a Project Manager wants to add a team to a project, **When** they add the team, **Then** the team is linked and all team members inherit the project context for filtering
5. **Given** a project's end date passes, **When** a user views the project, **Then** it displays as "Completed" or "Archived" and action items are marked read-only

---

### Edge Cases

- What happens when a user is removed from a team but still has assigned action items? (Action items remain assigned; Project Manager must manually reassign)
- How does the system handle bulk imports of 5,000+ action items? (Async job with progress tracking; items queued)
- What if a user attempts to create an action item with a past due date? (System rejects with error: "Due date must be in the future")
- How are deleted projects handled? (No hard deletes; archived projects remain read-only with full audit trail)
- What happens if the escalation job runs multiple times in one day? (Idempotent; checks if escalation already sent that day; prevents duplicate notifications)
- What if two users edit the same action item simultaneously? (Optimistic locking; second update fails with conflict message; user refreshes to see latest changes)

## Requirements *(mandatory)*

### Functional Requirements

#### 1. Multi-Tenant Organization & Data Isolation
- **FR1.1**: System MUST support multiple companies, each with complete data isolation (company_id enforced at database level)
- **FR1.2**: Users MUST belong to exactly one company; access to other companies' data is strictly forbidden
- **FR1.3**: All queries MUST filter by current user's company_id; no cross-company data visibility
- **FR1.4**: Each company has independent projects, teams, meetings, and action items

#### 2. User Management & RBAC
- **FR2.1**: System MUST support 6 roles: System Admin, Project Manager, Team Lead, Action Item Owner, Meeting Participant, Viewer (read-only)
- **FR2.2**: Permissions MUST be role-based and enforced at API level (not just UI level)
- **FR2.3**: System Admin: Full access to company settings, user management, and all data
- **FR2.4**: Project Manager: Can create/edit projects, assign action items, view team dashboards, escalate overdue items
- **FR2.5**: Team Lead: Can manage team membership, view team dashboards, comment on action items
- **FR2.6**: Action Item Owner: Can update status and completion of assigned items, add comments
- **FR2.7**: Meeting Participant: Can create action items from meetings they attended
- **FR2.8**: Viewer: Read-only access to action items and dashboards assigned to them or their teams

#### 3. Project Management
- **FR3.1**: Create project with name, description, start date, end date, Project Manager assignment
- **FR3.2**: Edit project details (except changing company association)
- **FR3.3**: Archive/unarchive projects; archived projects are read-only
- **FR3.4**: Project Manager MUST be a user in the same company
- **FR3.5**: Deleted projects MUST retain historical action items for audit purposes; they become read-only

#### 4. Team Management
- **FR4.1**: Create team under a project with name, description, and Team Lead assignment
- **FR4.2**: Add/remove team members; changes take effect immediately
- **FR4.3**: Team members MUST belong to the same company
- **FR4.4**: Teams can be assigned to multiple projects (team is reusable)
- **FR4.5**: Team Lead can manage team membership and view team-level action items

#### 5. Meeting Management
- **FR5.1**: Create meeting with title, date/time, type (in-person/virtual), location/link, description, and list of participants
- **FR5.2**: Associate meeting with one project and optional teams
- **FR5.3**: Record meeting notes and link action items created during the meeting
- **FR5.4**: Meeting participants MUST be users in the same company
- **FR5.5**: Edit meeting details; changes are logged for audit

#### 6. Action Item Management
- **FR6.1**: Create action item with required fields: title, description, linked meeting, project, team, assigned owner, priority (High/Medium/Low), status, due date
- **FR6.2**: Status workflow: Open → In Progress → Completed → Closed; also support On Hold state
- **FR6.3**: Owner MUST be a user; only the assigned owner or Project Manager can change status
- **FR6.4**: Due date MUST be in the future when created (prevent backdating)
- **FR6.5**: Support multiple action items per meeting; each item is independent
- **FR6.6**: Add comments/attachments to action items; only team members can view
- **FR6.7**: Once marked Completed, item requires a completion date (timestamp when marked Completed)
- **FR6.8**: Deletion: Action items cannot be deleted; only archived/closed; full audit trail retained

#### 7. Dashboards & Tracking
- **FR7.1**: "My Action Items" dashboard shows all items assigned to current user with filters: status, due date, project, priority
- **FR7.2**: "Team Action Items" dashboard (Team Lead/Project Manager only) shows all team items with same filters plus owner filter
- **FR7.3**: "Project Dashboard" (Project Manager only) shows project-wide metrics and action items
- **FR7.4**: All dashboards MUST load within 3 seconds under normal load (1000s of items per company)
- **FR7.5**: Dashboard MUST support pagination; default 25 items per page
- **FR7.6**: Overdue tracking: Items with due_date < today and status != Completed are marked "Overdue"
- **FR7.7**: Status aging: Display "Time in Current Status" for each item (helpful for identifying stuck items)

#### 8. Notifications & Escalations
- **FR8.1**: In-app notifications: Displayed in notification center; users can mark as read
- **FR8.2**: Email notifications: Sent for assignment, due-date reminder (2 days before), overdue escalation, status changes (optional preference)
- **FR8.3**: Due-date reminder: Triggered 2 days before due date for items still Open or In Progress
- **FR8.4**: Overdue escalation: Daily job (runs at 8 AM company timezone) marks items as overdue and notifies Project Manager
- **FR8.5**: Escalation notification includes item details and link to item; Project Manager can take action (reassign, extend due date)
- **FR8.6**: User notification preferences MUST be respected (opt-out of email but receive in-app)

#### 9. Audit & History
- **FR9.1**: Immutable audit log for all action item changes: creation, status changes, owner changes, due date changes, completion
- **FR9.2**: Each log entry records: action type, old value, new value, user who made change, timestamp
- **FR9.3**: History is accessible via "View History" on action item detail; chronologically ordered, most recent first
- **FR9.4**: Meetings and comments also logged with timestamps and user attribution
- **FR9.5**: Audit logs MUST NOT be deletable; retention required for compliance

#### 10. Reporting & Analytics
- **FR10.1**: Project Completion Report: Shows total items, completed count, completion percentage, items by status, average days-to-completion
- **FR10.2**: Team Productivity Report: Items per team member, completion rate by member, average turnaround time
- **FR10.3**: Overdue & Aging Report: Lists items over due, days overdue, owner, priority
- **FR10.4**: Export to Excel: Include columns: project, team, title, owner, status, priority, due date, created date, completion date
- **FR10.5**: Export to PDF: Formatted report with charts (pie charts for completion %, bar charts for items by status)
- **FR10.6**: Reports MUST respect user permissions: Team Lead sees only their team's data; Project Manager sees project data

### Non-Functional Requirements

#### Performance
- **NFR1.1**: Dashboard load time MUST be < 3 seconds for companies with up to 100,000 action items
- **NFR1.2**: Search (filter) MUST return results within 1 second for 10,000+ items
- **NFR1.3**: Notification delivery MUST occur within 5 minutes of action (SLA: 95% within 2 minutes)
- **NFR1.4**: API response time for standard queries (GET /action-items) MUST be < 500ms at p95

#### Reliability & Availability
- **NFR2.1**: Target availability: 99.5% uptime (max 3.6 hours downtime per month)
- **NFR2.2**: Automated daily backups required; recovery point objective (RPO): 24 hours
- **NFR2.3**: Database failover MUST occur automatically in case of primary node failure
- **NFR2.4**: Graceful degradation: If background jobs (notifications, escalations) are delayed, system remains operational

#### Security & Data Protection
- **NFR3.1**: All data in transit MUST be encrypted (HTTPS/TLS 1.2+)
- **NFR3.2**: All passwords MUST be bcrypt-hashed; no plaintext storage
- **NFR3.3**: API authentication MUST use JWT or session tokens; tokens expire after 24 hours
- **NFR3.4**: RBAC MUST be enforced at API level; no reliance on frontend-only checks
- **NFR3.5**: SQL injection, XSS, and CSRF protections MUST be implemented
- **NFR3.6**: Data at rest MUST be encrypted (database encryption enabled)

#### Scalability
- **NFR4.1**: System MUST support at least 10,000 action items per company without performance degradation
- **NFR4.2**: Horizontal scaling: Application layer (Node.js) MUST be stateless and scalable
- **NFR4.3**: Database MUST use connection pooling to handle concurrent requests (min 50 concurrent connections)
- **NFR4.4**: Bulk operations (e.g., import from CSV) MUST be asynchronous to avoid blocking UI

#### Data Consistency & Integrity
- **NFR5.1**: Foreign key constraints MUST enforce referential integrity (no orphaned action items)
- **NFR5.2**: Soft deletes (archive/close) instead of hard deletes for action items
- **NFR5.3**: Optimistic locking MUST prevent race conditions on concurrent updates
- **NFR5.4**: Transactions MUST ensure atomic operations (e.g., status change + notification sent together)

#### Compliance & Audit
- **NFR6.1**: GDPR compliance: Users MUST be able to request and delete their data (within company constraints)
- **NFR6.2**: SOC 2 readiness: Audit logs maintained; access controls documented
- **NFR6.3**: Data retention: Completed action items retained for minimum 7 years for audit purposes

## Success Criteria *(mandatory)*

### Acceptance Metrics

1. **Action Item Creation Success Rate**: 100% of action items created with required fields are successfully saved without errors (acceptance: 99.9% success rate over 30 days)

2. **Dashboard Load Time**: 95% of dashboard requests load within 3 seconds, measured across all dashboard types (My Items, Team, Project)

3. **Notification Delivery**: 95% of notifications delivered within 2 minutes of triggering event (assignment, due-date reminder, escalation)

4. **Data Isolation Compliance**: Zero instances of data leakage between companies in 90-day production period (verified via audit logs)

5. **User Adoption**: 80% of assigned team members log in and use AIT at least once per week (adoption metric)

6. **Overdue Escalation Accuracy**: 100% of items past due date are flagged as overdue within 24 hours; escalation notifications sent 100% of the time

7. **System Availability**: 99.5% uptime measured over 30-day rolling window (max 3.6 hours unplanned downtime)

8. **Report Generation Time**: Project and team reports generated and exported to Excel/PDF within 10 seconds for 10,000 items

9. **Concurrent User Capacity**: System handles at least 500 concurrent users per company without performance degradation (p95 response time < 2s)

10. **Data Accuracy**: Historical audit trail 100% accurate; all status changes, owner changes, and completion dates correctly recorded and timestamped

11. **API Contract Compliance**: 100% of API responses conform to documented schema; no breaking changes without versioning

12. **Search/Filter Performance**: Filter operations return results within 1 second for 10,000+ item datasets (p95)

---

## Scope & Non-Goals

### In Scope (MVP)

✅ Multi-tenant SaaS with company-level data isolation  
✅ User authentication and role-based access control (6 roles)  
✅ Create/view/update action items with full lifecycle (Open → Closed)  
✅ Meeting capture and action item linking  
✅ Project and team management  
✅ Action item dashboards with filters (My Items, Team, Project)  
✅ Notifications (in-app + email) for assignment, due-date, overdue, status changes  
✅ Overdue escalation to Project Managers  
✅ Audit logging for compliance  
✅ Basic reporting (completion rates, team metrics, overdue analysis)  
✅ Export to Excel and PDF  

### Out of Scope (Post-MVP)

❌ Native mobile apps (iOS/Android); web-responsive design sufficient  
❌ Third-party calendar integrations (Google Calendar, Outlook)  
❌ Slack/Teams integrations  
❌ Advanced analytics (predictive analytics, machine learning)  
❌ Collaboration features beyond comments (real-time co-editing of action items)  
❌ Custom workflows or approval chains  
❌ Templated action items or action item templates  
❌ Recurring action items  
❌ Time tracking or effort estimation  
❌ Budget tracking or cost allocation  

---

## Key Entities & Data Model

### Core Entities

1. **Company**: Represents a customer organization; provides data isolation boundary
   - company_id (PK), name, subscription_plan, created_date, archived_date

2. **User**: Represents a person in a company
   - user_id (PK), company_id (FK), email, password_hash, first_name, last_name, role, created_date

3. **Project**: Represents a project within a company
   - project_id (PK), company_id (FK), name, description, start_date, end_date, project_manager_id (FK to User), status (active/archived), created_date

4. **Team**: Represents a team within a project
   - team_id (PK), company_id (FK), project_id (FK), name, description, team_lead_id (FK to User), created_date

5. **Meeting**: Represents a meeting where action items originate
   - meeting_id (PK), company_id (FK), project_id (FK), team_id (FK), title, date_time, type, location, notes, created_by (FK to User), created_date

6. **ActionItem**: Core entity representing an action item
   - action_item_id (PK), company_id (FK), project_id (FK), team_id (FK), meeting_id (FK), title, description, owner_id (FK to User), priority, status, due_date, created_date, created_by (FK to User), completion_date

7. **AuditLog**: Immutable log of all changes
   - audit_log_id (PK), company_id (FK), action_item_id (FK), action_type, old_value, new_value, user_id (FK), timestamp

8. **Notification**: In-app notifications
   - notification_id (PK), company_id (FK), user_id (FK), message, action_item_id (FK), read, created_date

9. **UserTeamMember**: Junction table for team membership
   - team_id (FK), user_id (FK), added_date

### Data Isolation Strategy
- Every data-bearing table includes `company_id` as a foreign key
- All queries filter by current user's company_id
- Database-level constraints enforce referential integrity within company

---

## Error Scenarios & Edge Cases

### Error Handling

1. **Concurrent Modifications**: If two users attempt to update the same action item simultaneously
   - Solution: Optimistic locking using version field; second update fails with conflict message

2. **Invalid Owner Assignment**: User attempts to assign item to a user not in the company/team
   - Solution: API rejects with 400 Bad Request; error message: "Owner must be a member of the assigned team"

3. **Notification Delivery Failure**: Email service is down when notification is triggered
   - Solution: Queue notification in database; retry up to 3 times with exponential backoff; after 3 failures, alert ops team

4. **Overdue Escalation Spam**: What if escalation job runs multiple times?
   - Solution: Idempotent escalation job; check if escalation notification already sent for item on that date; prevent duplicate notifications

5. **Dashboard Timeout**: Large company with 100,000+ action items tries to load dashboard
   - Solution: Mandatory pagination; default 25 items; client must request next page. Implement database indexes on company_id, status, due_date

6. **Deleted Project with Orphaned Items**: Project is archived but action items still reference it
   - Solution: No hard deletes; archived projects remain in database. Items remain viewable in read-only mode for audit.

7. **User Removal from Team**: User removed from team but has assigned action items
   - Solution: Action items remain assigned; owner receives notification. Project Manager must reassign manually.

### Edge Cases

1. **Leap Year & Daylight Saving Time**: Due dates near DST boundaries
   - Solution: Store all dates in UTC; client displays in user's timezone

2. **Bulk Import of Action Items**: CSV import with 5,000 items
   - Solution: Async job; provide progress tracking; items added to queue; UI shows "Import in progress"

3. **User with Multiple Roles**: Can a user be both Team Lead and Project Manager?
   - Solution: Yes; roles are not mutually exclusive. User has highest permission set of assigned roles.

4. **Empty Team Dashboard**: Team has no action items
   - Solution: Show message: "No action items for this team. Create one to get started." with link to create form

5. **Timezone Handling**: Users across multiple timezones in same company
   - Solution: Store all dates/times in UTC in database. Frontend renders in user's browser timezone.

6. **Notification Preferences Not Set**: New user hasn't set notification preferences
   - Solution: Default to in-app only (no email) until user opts in

7. **Status Workflow Violation**: User attempts to transition item directly from Open to Closed (skipping In Progress)
   - Solution: Allow if Project Manager/owner; log as anomaly in audit trail. Enforce strict workflow only if business logic requires.

---

## Assumptions

- **Authentication**: Supabase Auth is used for user authentication; JWT tokens for API calls
- **Timezone**: All system times stored in UTC; displayed in user's browser timezone
- **Email Service**: Third-party email provider (SendGrid, AWS SES) used for notifications
- **Database**: PostgreSQL on Supabase; inherits PostgreSQL reliability and security
- **Bulk Operations**: Async processing acceptable; no real-time updates required for bulk imports
- **Reporting**: Reports are generated on-demand (not pre-computed); acceptable latency is 10-30 seconds
- **Data Retention**: Completed action items retained indefinitely; soft deletes used (never hard delete)
- **User Onboarding**: System Admin invites users; users set password via email link
- **Meeting Data**: Meetings imported from external calendars not in MVP; manual entry or copy-paste notes acceptable
- **Access Control**: API-level RBAC enforced; frontend UI reflects permissions but is not the security boundary

---

**Specification Status**: Draft - Ready for clarification questions and validation  
**Next Step**: Execute `/speckit.clarify` if needed, or proceed directly to `/speckit.plan` for technical design
