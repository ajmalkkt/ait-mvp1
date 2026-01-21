# Phase 5: Dashboards & Reports Implementation Plan

## Overview

Phase 5 adds comprehensive dashboard analytics and reporting functionality to the AIT system, enabling users to visualize team performance, project metrics, and generate on-demand reports.

**Scope**: 30 tasks
- Dashboard aggregation queries
- Report generation queries
- API endpoints for dashboards and reports
- Frontend dashboard pages
- Chart visualization components
- Report export functionality
- Caching layer for performance
- Comprehensive testing

**User Story Delivered**: US5 - Generate Dashboards and Reports

---

## Architecture

### Backend Services

#### Dashboard Service (`dashboardService.ts`)
Aggregates data for dashboard views with real-time metrics.

**Functions**:
1. `getMyItemsDashboard(userId, companyId)` - User's assigned items overview
   - Total assigned items
   - Items by status (pending, in_progress, completed)
   - Overdue items count
   - Due today items
   - Completion rate

2. `getTeamDashboard(teamId, companyId)` - Team lead/PM view
   - Team metrics: total items, completion rate, active members
   - Items by status breakdown
   - Items by member (count per team member)
   - Team velocity (items completed per week)
   - Member productivity ranking

3. `getProjectDashboard(projectId, companyId)` - Project manager view
   - Project metrics: total items, completion rate, due items, overdue items
   - Items by status distribution
   - Items by priority
   - Timeline: items due this week/month
   - Risk indicators: overdue, high-priority pending items

#### Report Service (`reportService.ts`)
Generates on-demand reports with historical data.

**Functions**:
1. `generateCompletionReport(companyId, filters)` - Overall completion metrics
   - Total items created
   - Total completed items
   - Total closed items
   - Completion rate % (Completed + Closed) / Total
   - Average time to completion
   - By status breakdown
   - By team breakdown

2. `generateProductivityReport(companyId, filters)` - Team member productivity
   - Items per member
   - Completion rate by member
   - Average turnaround time per member
   - Member ranking by items completed
   - Member ranking by items created

3. `generateOverdueReport(companyId, filters)` - Risk assessment
   - Total overdue items
   - Overdue items by owner
   - Days overdue (distribution)
   - Overdue by priority (critical, high, medium, low)
   - Overdue by team
   - Overdue by project

4. `exportToExcel(report, options)` - Excel export
   - Formats data into Excel workbook
   - Multiple sheets (summary, details, trends)
   - Charts embedded
   - Professional styling

5. `exportToPDF(report, options)` - PDF export
   - Formats report as PDF
   - Includes pie and bar charts
   - Page breaks for readability
   - Header/footer with timestamp

### API Endpoints

#### Dashboard Routes (`dashboards.ts`)

```
GET /api/v1/dashboards/my-items
  Query Params:
    - company_id (required)
  Response:
    {
      total_items: number
      items_by_status: { pending: n, in_progress: n, completed: n }
      overdue_items: number
      due_today: number
      completion_rate: number (0-1)
      recent_items: ActionItem[]
    }

GET /api/v1/dashboards/team/:team_id
  Query Params:
    - company_id (required)
  Response:
    {
      team_id: string
      team_name: string
      total_items: number
      completion_rate: number
      items_by_status: { pending: n, in_progress: n, completed: n }
      members: [
        { member_id: string, name: string, item_count: number, completion_rate: number }
      ]
      team_velocity: { week: date, completed_items: number }[]
      overdue_items: number
    }

GET /api/v1/dashboards/project/:project_id
  Query Params:
    - company_id (required)
  Response:
    {
      project_id: string
      project_name: string
      total_items: number
      completion_rate: number
      items_by_status: { pending: n, in_progress: n, completed: n }
      items_by_priority: { critical: n, high: n, medium: n, low: n }
      due_this_week: number
      due_this_month: number
      overdue_items: number
      at_risk_items: number
    }
```

#### Report Routes (`reports.ts`)

```
GET /api/v1/reports/completion
  Query Params:
    - company_id (required)
    - start_date (optional, default: 90 days ago)
    - end_date (optional, default: today)
  Response: CompletionReport

GET /api/v1/reports/productivity
  Query Params:
    - company_id (required)
    - team_id (optional)
    - start_date (optional)
    - end_date (optional)
  Response: ProductivityReport

GET /api/v1/reports/overdue
  Query Params:
    - company_id (required)
    - start_date (optional)
    - end_date (optional)
  Response: OverdueReport

POST /api/v1/reports/export
  Body:
    {
      report_type: 'completion' | 'productivity' | 'overdue'
      format: 'excel' | 'pdf'
      filters: {
        start_date: string
        end_date: string
        team_id?: string
      }
    }
  Response: { download_url: string, filename: string }
```

### Frontend Components

#### Pages
1. **TeamDashboard.tsx** - Team overview with metrics and member breakdown
2. **ProjectDashboard.tsx** - Project overview with status and timeline
3. **Reports.tsx** - Report generator with filters and export options

#### Components
1. **MetricCard.tsx** - Card component for KPI display
   - Title, value, unit
   - Sparkline chart
   - Trend indicator (↑/↓)
   - Optional icon

2. **PieChart.tsx** - Pie chart for distribution data
   - Status distribution (pending/in_progress/completed)
   - Priority distribution
   - Responsive sizing

3. **BarChart.tsx** - Bar chart for comparative data
   - Items by team member
   - Items by status over time
   - Completion rate by team

4. **DateRangeFilter.tsx** - Date range selector
   - Start and end date inputs
   - Quick range buttons (Last 7/30/90 days)
   - Today button

#### Hooks
1. **useDashboard()** - Get dashboard data
2. **useTeamDashboard()** - Get team dashboard
3. **useProjectDashboard()** - Get project dashboard
4. **useReport()** - Get report data
5. **useExportReport()** - Export report to Excel/PDF

### Caching Strategy

**Cache Layer** (`cache.ts`)
- Redis cache for dashboard queries
- TTL: 2 minutes (configurable)
- Cache keys: `dashboard:{type}:{id}:{company_id}`
- Invalidation on action updates

**Cached Queries**:
- Dashboard metrics (2 min TTL)
- Report summaries (5 min TTL)
- User's my-items dashboard (1 min TTL)

---

## Database Queries

### Dashboard Queries

**Team Dashboard Query**:
```sql
SELECT 
  COUNT(*) as total_items,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
FROM action_items
WHERE team_id = $1 AND company_id = $2
```

**Team Member Breakdown**:
```sql
SELECT 
  assigned_to,
  COUNT(*) as item_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_items
FROM action_items
WHERE team_id = $1 AND company_id = $2
GROUP BY assigned_to
```

**Project Dashboard Query**:
```sql
SELECT 
  COUNT(*) as total_items,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 END) as overdue
FROM action_items
WHERE project_id = $1 AND company_id = $2
```

### Report Queries

**Completion Report**:
```sql
SELECT 
  COUNT(*) as total_items,
  COUNT(CASE WHEN status IN ('completed', 'closed') THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_count,
  EXTRACT(EPOCH FROM (AVG(
    CASE WHEN status IN ('completed', 'closed') 
    THEN completed_at - created_at 
    END
  ))) / 86400 as avg_days_to_completion
FROM action_items
WHERE company_id = $1 
  AND created_at >= $2 
  AND created_at <= $3
```

**Productivity Report**:
```sql
SELECT 
  created_by,
  COUNT(*) as items_created,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as items_completed,
  COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / 
    COUNT(*) as completion_rate
FROM action_items
WHERE company_id = $1 
  AND created_at >= $2 
  AND created_at <= $3
GROUP BY created_by
ORDER BY items_completed DESC
```

**Overdue Report**:
```sql
SELECT 
  ai.*,
  EXTRACT(EPOCH FROM (NOW() - due_date)) / 86400 as days_overdue
FROM action_items ai
WHERE company_id = $1 
  AND due_date < NOW() 
  AND status != 'completed'
ORDER BY days_overdue DESC
```

---

## File Structure

```
backend/
├── src/
│   ├── services/
│   │   ├── dashboardService.ts (new)
│   │   └── reportService.ts (new)
│   ├── routes/
│   │   ├── dashboards.ts (new)
│   │   ├── reports.ts (new)
│   │   └── index.ts (updated)
│   ├── utils/
│   │   └── cache.ts (new)
│   └── middleware/
│       └── cache.ts (new - HTTP caching headers)
└── tests/
    ├── dashboards.test.ts (new)
    └── reports.test.ts (new)

frontend/
├── src/
│   ├── pages/
│   │   ├── TeamDashboard.tsx (new)
│   │   ├── ProjectDashboard.tsx (new)
│   │   └── Reports.tsx (new)
│   ├── components/
│   │   ├── MetricCard.tsx (new)
│   │   ├── PieChart.tsx (new)
│   │   ├── BarChart.tsx (new)
│   │   ├── DateRangeFilter.tsx (new)
│   │   └── Dashboard/
│   │       ├── TeamMetrics.tsx (new)
│   │       └── ProjectMetrics.tsx (new)
│   ├── hooks/
│   │   ├── useDashboard.ts (new)
│   │   └── useReport.ts (new)
│   └── services/
│       └── reportClient.ts (new)
└── tests/
    ├── dashboards.test.tsx (new)
    └── reports.test.tsx (new)
```

---

## Implementation Tasks

### Phase 5A: Backend Dashboard Service (6 tasks)
1. Create dashboardService with my-items aggregation
2. Implement team dashboard queries
3. Implement project dashboard queries
4. Create dashboard routes (GET /dashboards/*)
5. Integrate cache layer (2 min TTL)
6. Create dashboard test suite

### Phase 5B: Backend Report Service (6 tasks)
1. Create reportService with report generators
2. Implement completion report
3. Implement productivity report
4. Implement overdue report
5. Create report routes (GET /reports/*, POST /reports/export)
6. Create report test suite

### Phase 5C: Frontend Dashboard Pages (6 tasks)
1. Create TeamDashboard page with team metrics
2. Create ProjectDashboard page with project metrics
3. Create MetricCard component
4. Create PieChart component
5. Create BarChart component
6. Create DateRangeFilter component

### Phase 5D: Frontend Report Page (6 tasks)
1. Create Reports page with report selector
2. Implement completion report UI
3. Implement productivity report UI
4. Implement overdue report UI
5. Create reportClient service for exports
6. Create report test suite

### Phase 5E: Integration & Optimization (6 tasks)
1. Add dashboard routes to App.tsx
2. Add report routes to App.tsx
3. Create useReport hooks
4. Create useDashboard hooks
5. Add HTTP caching headers
6. Performance testing and optimization

---

## Success Criteria

### Performance
- [ ] Team dashboard loads <3s
- [ ] Project dashboard loads <3s
- [ ] Reports generate <5s
- [ ] Export to Excel/PDF <10s

### Data Accuracy
- [ ] Completion rate = (Completed + Closed) / Total * 100%
- [ ] Team metrics account for all team members
- [ ] Overdue items correctly filtered (due_date < NOW AND status != completed)
- [ ] Productivity rate per member accurate

### UI/UX
- [ ] Dashboards display all required metrics
- [ ] Charts render correctly on all screen sizes
- [ ] Export formats are correct (Excel with formatting, PDF with charts)
- [ ] Date range filters work correctly
- [ ] No N+1 queries

### Testing
- [ ] 80%+ code coverage for services
- [ ] All endpoints tested (happy path + error cases)
- [ ] Export functionality tested
- [ ] Cache invalidation tested

---

## Dependencies

**Requires**: Phases 0-4 complete
- Action items, projects, teams, users, notifications, audit

**Enables**: Phase 6 (Testing & Optimization)

---

## Timeline

Estimated: 3-4 hours for complete implementation
- Phase 5A (Dashboard Service): 1 hour
- Phase 5B (Report Service): 1 hour
- Phase 5C (Dashboard UI): 1.5 hours
- Phase 5D (Report UI): 1.5 hours
- Phase 5E (Integration): 0.5 hours

---

## Phase 5 Task Breakdown (30 Tasks)

### Backend (18 tasks)
1. Dashboard service base structure
2. Team dashboard queries
3. Project dashboard queries
4. My-items dashboard queries
5. Dashboard routes (3 endpoints)
6. Report service base structure
7. Completion report query
8. Productivity report query
9. Overdue report query
10. Report routes (3 endpoints + export)
11. Excel export functionality
12. PDF export functionality
13. Cache layer (Redis)
14. HTTP cache middleware
15. Dashboard tests
16. Report tests
17. Export tests
18. Performance optimization

### Frontend (12 tasks)
1. TeamDashboard page
2. ProjectDashboard page
3. Reports page
4. MetricCard component
5. PieChart component
6. BarChart component
7. DateRangeFilter component
8. useDashboard hook
9. useTeamDashboard hook
10. useProjectDashboard hook
11. useReport hook
12. Dashboard/Report tests
