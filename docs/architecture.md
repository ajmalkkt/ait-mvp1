# Architecture Decision Record

**Document**: AIT MVP Architecture  
**Date**: 2026-01-21  
**Status**: Approved  

## Overview

This document records the key architectural decisions made for the AIT MVP and the rationale behind them.

## Decision 1: Supabase for Backend-as-a-Service

**Decision**: Use Supabase (PostgreSQL + Auth + RLS) for database, authentication, and data isolation.

**Rationale**:
- **Multi-tenancy Built-in**: Row Level Security (RLS) policies enforce company_id isolation at database level
- **Time-to-Market**: Managed PostgreSQL, Auth, and APIs reduce infrastructure setup
- **Cost-Effective**: Generous free tier for MVP; scales predictably with usage
- **Security**: Database-level isolation more robust than application-level
- **Audit Trail**: Immutable audit logs with PostgreSQL built-in features
- **Compliance**: GDPR and SOC 2-ready with managed backups and encryption

**Alternative Considered**: 
- AWS RDS + Cognito - more control but higher operational complexity
- Firebase/Firestore - not suitable for complex queries and reporting

**Trade-offs**:
- Vendor lock-in (acceptable for MVP; alternatives available for v2)
- RLS policy complexity (well-documented, learnable)

---

## Decision 2: React 18 + Vite for Frontend

**Decision**: Use React 18 with modern hooks, TypeScript, and Vite build tool.

**Rationale**:
- **Hooks-First**: Functional components with hooks align with Constitution (separate concerns)
- **Performance**: Vite enables fast HMR and optimized builds
- **Ecosystem**: Rich ecosystem for UI, routing, data fetching (TanStack Query)
- **Developer Experience**: TypeScript for type safety across codebase
- **Modern**: React 18 with Strict Mode catches rendering issues early

**Alternative Considered**:
- Vue.js - simpler syntax but smaller ecosystem for enterprise features
- Next.js - too heavyweight for MVP, adds opinionated patterns

**Trade-offs**:
- Learning curve for hooks (mitigated by clear documentation)
- Build complexity (Vite simplifies this)

---

## Decision 3: Express.js + Node.js for Backend

**Decision**: Use Express.js with TypeScript for REST API.

**Rationale**:
- **Simplicity**: Minimal framework, easy to understand and extend
- **Node.js Ecosystem**: npm ecosystem is largest, fast prototyping
- **TypeScript**: Type safety matches frontend, reduces bugs
- **Middleware Pattern**: Clean separation of concerns (auth, company isolation, error handling)
- **Performance**: Fast request handling suitable for dashboards and reports

**Alternative Considered**:
- NestJS - more opinionated, heavier framework
- Go/Rust - higher complexity, overkill for MVP

**Trade-offs**:
- Less structure than opinionated frameworks (mitigated by clear middleware)
- Node.js memory footprint (acceptable for MVP scale)

---

## Decision 4: Company-Based Multi-Tenancy

**Decision**: Enforce multi-tenancy at database level using company_id as primary isolation key.

**Rationale**:
- **Security**: Database-level enforcement impossible to bypass accidentally
- **Auditability**: All queries filtered by company_id; clear audit trail
- **Scalability**: company_id indexing enables fast querying
- **GDPR Compliance**: Per-company data extraction/deletion straightforward
- **Simplicity**: Single database, not database-per-tenant (reduces operational overhead)

**Implementation**:
- Every table has company_id foreign key
- RLS policies check company_id = get_user_company_id()
- All queries must filter by company_id (not optional)
- Application middleware validates company_id from JWT

**Alternative Considered**:
- Database-per-tenant - better isolation but operational complexity
- Row-based isolation without RLS - easier to bypass, less secure

**Trade-offs**:
- RLS policy complexity (well-documented)
- Schema duplication not needed (reduces storage)

---

## Decision 5: JWT Authentication

**Decision**: Use JWT tokens issued by Supabase Auth; verify in application middleware.

**Rationale**:
- **Stateless**: No session storage needed, scales horizontally
- **Standard**: JWT is industry standard for APIs
- **Claims-Based**: company_id and role embedded in token
- **Supabase Integration**: Seamless with Supabase Auth
- **Mobile-Ready**: JWT works well for mobile clients (future v2)

**Token Claims**:
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "company_id": "company-id",
  "role": "project_manager",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Alternative Considered**:
- Session-based with cookies - requires sticky sessions, harder to scale
- API keys - insufficient for RBAC

**Trade-offs**:
- Token revocation requires blacklist (acceptable for 24h expiry)
- Client must handle token refresh

---

## Decision 6: REST API Over GraphQL

**Decision**: Use REST API with standard HTTP methods and status codes.

**Rationale**:
- **Simplicity**: REST easier to understand and debug
- **Caching**: HTTP caching works naturally with REST
- **Standardization**: Consistent with industry practices
- **Pagination**: Straightforward with query parameters
- **Error Handling**: Standard HTTP status codes
- **MVP Scope**: GraphQL overhead not justified for current feature set

**API Design**:
- Resource-based URLs: `/api/v1/action-items`, `/api/v1/projects`
- Standard methods: GET (read), POST (create), PUT (update), PATCH (modify), DELETE (delete)
- Pagination: `page` and `pageSize` query parameters
- Filtering: Query parameters for each filter

**Alternative Considered**:
- GraphQL - powerful but complex for MVP

**Trade-offs**:
- Multiple requests for related data (mitigated with pagination and filtering)
- No query optimization (acceptable for MVP scale)

---

## Decision 7: PostgreSQL Indexes Strategy

**Decision**: Create composite indexes on frequently-queried columns (company_id + filter columns).

**Rationale**:
- **Query Performance**: Dashboard and list queries use company_id + status + due_date
- **Composite Indexes**: Single index covers filtering and sorting
- **Maintenance**: Limited number of indexes keeps maintenance overhead low
- **Isolation**: company_id first in index enables RLS policy efficiency

**Key Indexes**:
```sql
idx_action_items_company_status_due (company_id, status, due_date)
idx_action_items_company_owner_due (company_id, owner_id, due_date)
idx_action_items_company_team_due (company_id, team_id, due_date)
```

**Target Performance**:
- 10,000 items: Dashboard load <3s
- 1000+ items: Filtering <1s
- Concurrent: 500+ users

**Alternative Considered**:
- Single-column indexes - less efficient for composite queries
- No indexes - unacceptable performance

**Trade-offs**:
- Write performance slightly slower (acceptable for action item workload)
- Storage overhead (minimal for MVP scale)

---

## Decision 8: Soft Deletes Over Hard Deletes

**Decision**: Never delete data; use archived_at timestamp for logical deletion.

**Rationale**:
- **Audit Trail**: Historical data preserved for compliance
- **Undo Capability**: Can restore archived items
- **Referential Integrity**: No orphaned records
- **Recovery**: Easier to recover from accidental deletion
- **GDPR**: Clear audit trail for data export/deletion requests

**Implementation**:
- archived_at field on action_items, projects, teams
- Queries filter archived_at IS NULL by default
- Delete endpoints set archived_at to CURRENT_TIMESTAMP
- Never execute DELETE FROM in application code

**Alternative Considered**:
- Hard deletes - violates audit trail requirement

**Trade-offs**:
- Slightly larger database (acceptable for MVP)
- Queries must always filter archived_at (enforced by queries)

---

## Decision 9: Optimistic Locking for Concurrent Edits

**Decision**: Use version field for optimistic locking; return 409 Conflict on mismatch.

**Rationale**:
- **Distributed**: No database locks needed; scales horizontally
- **User Experience**: Inform user of conflict; let them refresh and retry
- **Simplicity**: No deadlock risk or transaction complexity
- **Specification Compliance**: Addresses clarification Q2 (field-level errors + modal)

**Implementation**:
```typescript
// Update requires version match
UPDATE action_items 
SET title = $1, version = version + 1
WHERE id = $2 AND version = $3 AND company_id = $4
```

**Error Response** (409):
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "This item was modified. Refresh to see the latest version."
  }
}
```

**Alternative Considered**:
- Pessimistic locking - blocks other users, doesn't scale
- Last-write-wins - loses changes silently (unacceptable)

**Trade-offs**:
- User must refresh on conflict (acceptable; rare scenario)
- Version field adds one INT column (negligible storage)

---

## Decision 10: Async Email with Retry Queue

**Decision**: Queue email notifications; process asynchronously with exponential backoff retry (addresses clarification Q1).

**Rationale**:
- **Reliability**: Email failures don't block action item operations
- **User Experience**: Immediate response (item created), email sent asynchronously
- **Retry Logic**: Exponential backoff (1min, 5min, 30min) handles transient failures
- **Monitoring**: Failed emails logged for ops team review
- **SLA**: 95% delivery within 2 minutes

**Implementation**:
1. Insert into notifications_queue (status: pending)
2. Background job processes queue every 5 minutes
3. On failure: retry_count++, last_retry_at = now()
4. Max 3 retries with backoff
5. Failed emails logged for ops team

**Queue Table**:
```sql
CREATE TABLE notifications_queue (
  id UUID PRIMARY KEY,
  status VARCHAR(50), -- pending, sent, failed, retried
  retry_count INT,
  last_retry_at TIMESTAMP,
  error_message TEXT,
  ...
)
```

**In-App Notification**: Always sent immediately (status: not pending)

**Alternative Considered**:
- Synchronous email - blocks requests, poor UX on failures
- Fire-and-forget - no retry, unreliable

**Trade-offs**:
- Background job complexity (manageable, well-tested pattern)
- Email delivery delay <2min (acceptable per spec)

---

## Summary Table

| Decision | Choice | Confidence | Risk Level |
|----------|--------|------------|-----------|
| Backend-as-a-Service | Supabase | High | Low |
| Frontend Framework | React 18 + Vite | High | Low |
| API Server | Express.js + Node.js | High | Low |
| Multi-Tenancy | company_id at DB level | Very High | Very Low |
| Authentication | JWT (Supabase Auth) | High | Low |
| API Style | REST | High | Very Low |
| Indexing | Composite (company_id + filter) | High | Very Low |
| Data Deletion | Soft deletes (archived_at) | Very High | Very Low |
| Concurrent Edits | Optimistic locking (version) | High | Low |
| Email Delivery | Async queue with retry | High | Low |

---

## Future Considerations (v2+)

- **Real-time subscriptions**: WebSocket/SSE for dashboard updates
- **Mobile app**: React Native; JWT auth carries over
- **Mobile calendar integration**: Sync with iOS/Android calendars
- **File uploads**: Document attachments to action items
- **Advanced analytics**: Cube.js for data warehouse
- **Internationalization**: i18n for multi-language support
- **Dark mode**: Theme provider in React

---

**Review Status**: ✅ Approved by architecture team  
**Last Updated**: 2026-01-21  
**Next Review**: Week 6 (mid-project)
