<!-- 
=== SYNC IMPACT REPORT ===
Version bump: 1.0.0 (initial constitution)
Ratification: 2026-01-21
New principles: 5 (Architecture, Security & Access, Performance & Reliability, Quality & Process, Non-Goals)
Modified sections: Governance section added for amendment procedures
Templates requiring updates: plan-template.md (Constitution Check gate), spec-template.md, tasks-template.md
Status: All templates reviewed; no critical updates required for MVP
=== END SYNC IMPACT REPORT ===
-->

# AIT (Action Item Tracker) Constitution

## Core Principles

### I. Architecture-First Design
The system MUST be architected for multi-tenancy, scalability, and clear technology boundaries from inception.

- Frontend MUST use React with modern best practices: functional components, hooks, strict separation of concerns
- Backend MUST be Node.js with a clearly defined and documented API boundary
- Database and authentication infrastructure MUST leverage Supabase for managed security and scalability
- Architecture MUST enforce strict multi-tenancy with per-company data isolation at the database level
- System MUST be horizontally scalable with no single points of failure
- Rationale: Enterprise SaaS requires robust, trustworthy architecture that scales reliably and maintains strict data separation

### II. Security & Access Control (NON-NEGOTIABLE)
Unauthorized access and data breaches are unacceptable; security is enforced in code and database.

- Role-Based Access Control (RBAC) is mandatory for all features
- Six roles are defined and enforced: System Admin, Project Manager, Team Lead, Action Item Owner, Meeting Participant, Viewer
- Data isolation between companies MUST be enforced at the database level, not just application logic
- Audit logging MUST be enabled for all critical actions (user management, data modifications, access events)
- No exceptions to multi-tenancy isolation; shared queries across companies are forbidden
- Rationale: Enterprise customers require auditability and guaranteed data separation to meet compliance obligations

### III. Performance & Reliability
System MUST be reliable and responsive under production load to meet enterprise SLA expectations.

- System MUST reliably support at least 10,000 action items per company without performance degradation
- Dashboard views MUST load within 3 seconds under normal production load
- Target availability MUST be 99.5% uptime (monthly downtime cap: ~3.6 hours)
- Automated backups are mandatory and tested regularly
- Database queries MUST be optimized for pagination and indexed appropriately
- Rationale: Enterprises depend on AIT for operational continuity; slowness or downtime impacts business decisions

### IV. Quality & Development Discipline
Code quality is built in through specification-first development and mandatory testing.

- Specifications are the source of truth; code changes without accompanying spec updates are forbidden
- All user-facing features MUST include explicit, testable acceptance criteria before implementation begins
- Backend logic MUST have automated test coverage; critical paths require integration tests
- APIs MUST be documented (endpoint signatures, request/response schemas, error codes)
- No undocumented or hidden APIs; contract compliance is enforced in reviews
- Rationale: Specs-first prevents rework and ensures features are delivered as intended; tests catch regressions

### V. Product Scope & Non-Goals
Clear boundaries define what AIT delivers in MVP and what is deferred.

- Native mobile applications (iOS/Android) are out of scope for MVP; web-responsive design is sufficient
- Third-party calendar integrations (Google Calendar, Outlook, etc.) are out of scope for MVP
- Focus is on core action item lifecycle, team collaboration, and accountability within AIT
- Rationale: Focused scope enables faster MVP delivery; integrations can be added in v2 post-launch

## Implementation Standards

**Specs-Driven Development**: Every feature starts with a spec documenting user stories and acceptance criteria. Code review MUST verify spec compliance.

**Testing Requirements**: Backend logic requires unit and integration tests. Test coverage for critical paths (auth, data isolation, API contracts) is mandatory.

**API Documentation**: All endpoints MUST be documented with signatures, response codes, and example payloads. Documentation updates are part of feature completion.

**Multi-Tenancy Enforcement**: Database schemas MUST include `company_id` or equivalent tenant identifier on all data-bearing tables. Queries MUST filter by current tenant; shared queries are a security violation.

## Governance

**Amendment Procedure**: Constitutional amendments require:
1. Documented rationale explaining the change
2. Impact assessment (affected systems, templates, existing code)
3. Migration plan if breaking existing guidance
4. Team review and approval before implementation
5. Version number increment following semantic versioning (MAJOR.MINOR.PATCH)

**Compliance Verification**: Pull requests are reviewed for constitution adherence by designated reviewers. Violations (spec-less code, missing tests, ignored acceptance criteria) trigger request for changes before merge.

**Version Policy**: 
- MAJOR: Removal or redefinition of principles, backward-incompatible constraints
- MINOR: New principles, expanded security/performance guidance, new role definitions
- PATCH: Clarifications, wording refinements, non-semantic corrections

**Rationale**: Constitution is the covenant between the team and users; amendments must be traceable and understood by all.

---

**Version**: 1.0.0 | **Ratified**: 2026-01-21 | **Last Amended**: 2026-01-21
