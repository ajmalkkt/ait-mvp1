# Phase 4: Audit & History Implementation Plan

## Overview

Phase 4 adds comprehensive audit logging and change history tracking to the AIT system.

**Scope**: 6 tasks
- Activity logging for all operations
- Audit trail with timestamps
- Change history tracking
- Audit log viewer UI
- Export functionality
- Compliance reporting

---

## Architecture

### Database Schema

#### audit_logs table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50), -- 'create', 'update', 'delete', 'read'
  resource_type VARCHAR(50), -- 'action_item', 'project', 'team', etc
  resource_id UUID,
  resource_name VARCHAR(255),
  changes JSONB, -- { field: { old: value, new: value } }
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20), -- 'success', 'error'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

#### change_history table
```sql
CREATE TABLE change_history (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  resource_type VARCHAR(50),
  resource_id UUID,
  resource_name VARCHAR(255),
  change_type VARCHAR(20), -- 'create', 'update', 'delete'
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  previous_values JSONB,
  current_values JSONB,
  fields_changed TEXT[], -- array of field names
  description TEXT
);

CREATE INDEX idx_change_history_company_id ON change_history(company_id);
CREATE INDEX idx_change_history_resource_id ON change_history(resource_id);
CREATE INDEX idx_change_history_changed_at ON change_history(changed_at DESC);
```

### Backend Services

#### auditLogService.ts
- logAction(companyId, userId, action, resource, changes)
- getAuditLogs(companyId, filters)
- getAuditLog(companyId, logId)
- getActivitySummary(companyId, dateRange)
- exportAuditLogs(companyId, format)

#### changeHistoryService.ts
- trackChange(companyId, resource, changeType, changes)
- getChangeHistory(companyId, resourceId)
- getResourceTimeline(companyId, resourceId)
- getChangesSince(companyId, date)

#### complianceService.ts
- generateComplianceReport(companyId, dateRange)
- getUserActivityReport(companyId, userId)
- getAccessReport(companyId)
- generateDataRetentionReport(companyId)

### Middleware

#### auditMiddleware.ts
- Auto-capture all requests
- Extract changes from request body
- Log user ID, IP, user agent
- Track success/error
- Attach to request.audit

### API Routes

#### GET /api/v1/audit-logs
List audit logs with pagination

#### GET /api/v1/audit-logs/:id
Get single audit log

#### GET /api/v1/audit-logs/export
Export audit logs (CSV, JSON, PDF)

#### GET /api/v1/change-history/:resourceId
Get change history for resource

#### GET /api/v1/compliance/report
Generate compliance report

#### GET /api/v1/compliance/activity
Get user activity summary

---

## Frontend Components

### Hooks
- useAuditLogs(filters) - Fetch audit logs
- useChangeHistory(resourceId) - Get resource changes
- useExportAuditLogs() - Export functionality
- useComplianceReport() - Generate reports

### Components
- AuditLogViewer - List of audit logs
- AuditLogDetail - Single audit log details
- ChangeTimeline - Visual timeline of changes
- ComplianceReportGenerator - Report builder
- ActivitySummary - User activity overview

### Pages
- AuditPage - Full audit log management
- CompliancePage - Compliance reports

---

## Tasks

1. **Backend Audit Service** (1 task)
   - Create auditLogService.ts
   - Create changeHistoryService.ts
   - Create auditMiddleware.ts

2. **Backend Compliance** (1 task)
   - Create complianceService.ts
   - Reports generation

3. **Backend Routes** (1 task)
   - Create audit-logs routes (4 endpoints)
   - Create change-history routes
   - Create compliance routes

4. **Frontend Hooks** (1 task)
   - useAuditLogs
   - useChangeHistory
   - useExportAuditLogs
   - useComplianceReport

5. **Frontend Components** (1 task)
   - AuditLogViewer
   - ChangeTimeline
   - ComplianceReportGenerator

6. **Frontend Pages & Integration** (1 task)
   - AuditPage
   - CompliancePage
   - Add to App.tsx routes

---

## Success Criteria

✅ All audit actions logged
✅ Change history tracked
✅ Audit logs queryable and filterable
✅ Reports exportable
✅ Compliance reports generated
✅ UI for viewing audits
✅ RLS enforced on audit data
✅ Performance optimized

