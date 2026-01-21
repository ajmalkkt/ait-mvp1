# Next Steps: Phase 2 Kickoff Guide

**Phase 1 Status**: ✅ COMPLETE (25/25 tasks, 16 files)  
**Recommended Next**: Phase 2 - Projects & Teams (19 tasks, 1 week)  
**Alternative**: Complete Phase 0 optional tasks (CI/CD, tests)  

---

## Phase 1 Deliverables Summary

### What's Ready
- ✅ Create action items with validation
- ✅ List, filter, paginate action items
- ✅ Update items with optimistic locking
- ✅ Status workflow (Open → In Progress → Completed → Closed)
- ✅ Conflict detection (409 on concurrent edits)
- ✅ Inline field validation errors
- ✅ Audit logging for all changes
- ✅ History/timeline view
- ✅ Soft deletes (archive)
- ✅ Company isolation (multi-tenant)

### What's NOT Included
- ❌ Project management (needed for filtering)
- ❌ Team management (needed for assignments)
- ❌ Notifications (owner assignment email)
- ❌ Escalations (daily overdue job)
- ❌ Dashboards (management views)
- ❌ Reports (analytics)

---

## Three Options for Next Session

### Option 1: Phase 2 - Projects & Teams (RECOMMENDED)

**Why**: Unlocks filtering by project/team, enables Phase 3 notifications, needed for MVP launch

**Scope** (19 tasks):
- Backend: Create/read/update/archive projects
- Backend: Create/read/update/list teams
- Backend: Add/remove team members
- Backend: RBAC enforcement (PM can edit own projects)
- Frontend: Project form and list page
- Frontend: Team form and member list page
- Frontend: Integrate project/team dropdowns in action item form

**Estimated Time**: 1 week (20 hours)

**Then Proceed To**: Phase 3 (Notifications & Escalations)

### Option 2: Complete Phase 0 (Optional Infrastructure)

**Why**: Adds CI/CD, test automation, deployment pipeline

**Scope** (6 tasks):
- T008: GitHub Actions CI/CD workflow (.github/workflows/ci.yml)
- T015: Supabase initialization script (backend/scripts/init-supabase.sh)
- T016: Run migrations on Supabase
- T022: Auth middleware tests (backend/tests/auth.test.ts)
- T030: Express initialization tests (backend/tests/setup.test.ts)
- T038: React initialization tests (frontend/tests/setup.test.ts)

**Estimated Time**: 1-2 days (8 hours)

**Then Proceed To**: Phase 2 or Phase 3

### Option 3: Phase 3 - Notifications & Escalations

**Why**: Enables user engagement, addresses spec clarification Q1

**Scope** (24 tasks):
- Email notification queue with retry logic
- Daily escalation job (mark overdue, notify PM)
- Due-date reminder job (2 days before)
- Notification preferences (email opt-out)
- In-app notification center
- Integration with action item creation/status changes

**Estimated Time**: 1 week (25 hours)

**Blockers**: Requires Phase 2 (team assignment notifications) for full functionality

---

## Recommended Path Forward

```
Session 2: Phase 0 + Phase 1 ✅ COMPLETE
                    ↓
Session 3: Phase 2 (Projects & Teams) [RECOMMENDED]
                    ↓
Session 4: Phase 3 (Notifications & Escalations)
                    ↓
Session 5: Phase 5 (Dashboards & Reports) [skip Phase 4 for MVP]
                    ↓
Session 6: Phase 6 (Testing & Optimization)
                    ↓
Session 7: Phase 7 (Deployment & Launch)
```

**MVP Minimum** (Phases 0-2):
- Action items ✅
- Projects & teams
- Basic filtering

**MVP Launch** (Phases 0-3):
- Action items ✅
- Projects & teams
- Notifications
- Escalations

---

## To Start Phase 2

### Step 1: Verify Phase 1 Works
```bash
# Build backend
cd backend
npm run build

# Run backend
npm run dev

# Test API in curl/Postman
curl -X GET http://localhost:3000/health
curl -X GET "http://localhost:3000/api/v1/action-items" \
  -H "Authorization: Bearer {jwt}"

# Build frontend
cd ../frontend
npm run build

# Run frontend
npm run dev
```

### Step 2: Create Feature Branch
```bash
git checkout -b "002-ait-projects-teams"
```

### Step 3: Start Task Breakdown
Update tasks.md with Phase 2 tasks:
- T074: Create project service
- T075: Create team service
- ... (19 tasks total)

### Step 4: Implement Projects Service
```bash
# Create backend/src/services/projectService.ts
# with CRUD operations

# Create backend/src/utils/projectValidation.ts
# with field validators

# Create backend/src/routes/projects.ts
# with RESTful endpoints
```

### Step 5: Implement Teams Service
Similar structure to projects

### Step 6: Frontend Components
- ProjectForm.tsx
- ProjectList.tsx
- TeamForm.tsx
- TeamMembers.tsx

### Step 7: Integration
- Update action item form to include project/team dropdowns
- Update action item list to show project/team
- Update filtering to include project/team

### Step 8: Testing
- API tests for projects/teams endpoints
- Frontend component tests
- Integration tests with action items

---

## Key Files to Reference

### For Phase 2 Development

**Action Items Template** (copy & adapt for projects):
- `backend/src/services/actionItemService.ts` → projectService.ts
- `backend/src/utils/actionItemValidation.ts` → projectValidation.ts
- `backend/src/routes/actionItems.ts` → projects.ts
- `frontend/src/components/ActionItemForm.tsx` → ProjectForm.tsx
- `frontend/src/hooks/useActionItems.ts` → useProjects.ts

**Database Schema** (extend with projects/teams):
- `backend/migrations/002_action_items_schema.sql`
  - Already has projects, teams, user_team_members tables
  - May need to add user_project_members table

**Documentation**:
- `PHASE_1_API_REFERENCE.md` - format for Phase 2 API docs
- `PHASE_1_SUMMARY.md` - structure for Phase 2 summary

---

## Common Pitfalls to Avoid

### Backend
- ❌ Forgetting to add company_id filtering to queries
- ❌ Not enforcing RBAC (check user role before allowing changes)
- ❌ Missing validation for required fields
- ❌ Not logging changes to audit_logs
- ✅ Copy patterns from actionItemService.ts

### Frontend
- ❌ Not using React Query hooks for caching
- ❌ Forgetting to handle loading/error states
- ❌ Not displaying validation error messages
- ❌ Breaking mobile responsiveness
- ✅ Copy patterns from useActionItems hook

### Testing
- ❌ Testing without mocking dependencies
- ❌ Not covering error cases (400, 404, 409, 500)
- ❌ Missing RBAC permission tests
- ✅ Copy test structure from actionItems.test.ts

---

## Code Examples

### Backend Pattern (Copy from actionItemService)

```typescript
// backend/src/services/projectService.ts
export async function createProject(
  companyId: string,
  data: ProjectInput
): Promise<Project> {
  // Validate
  // Insert
  // Return
}

export async function listProjects(
  companyId: string,
  options: ListOptions = {}
): Promise<{ items: Project[]; total: number }> {
  // Filter by company_id
  // Apply other filters
  // Paginate
  // Return with total count
}

export async function updateProject(
  companyId: string,
  projectId: string,
  data: Partial<ProjectInput>,
  version: number // optimistic locking
): Promise<Project | null> {
  // Update with version check
  // Return null if version mismatch (409)
}
```

### Frontend Pattern (Copy from useActionItems)

```typescript
// frontend/src/hooks/useProjects.ts
export function useProjects(options: ListOptions = {}) {
  return useQuery({
    queryKey: ['projects', options],
    queryFn: async () => {
      const response = await apiClient.get('/projects', { params: options })
      return response.data
    }
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/projects', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}
```

### Component Pattern (Copy from ActionItemForm)

```typescript
// frontend/src/components/ProjectForm.tsx
export function ProjectForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: ProjectFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    pm_id: initialData?.pm_id || '',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form logic (copy from ActionItemForm.tsx)
}
```

---

## Success Metrics for Phase 2

### Functionality
- ✅ Create projects with all fields (name, description, PM, dates)
- ✅ List projects with pagination and filtering
- ✅ Edit projects with optimistic locking
- ✅ Archive projects (soft delete)
- ✅ Create teams under projects
- ✅ Add/remove team members
- ✅ Filter action items by project and team

### Code Quality
- ✅ 80%+ test coverage
- ✅ TypeScript strict mode (0 errors)
- ✅ No type assertions (except necessary)
- ✅ Consistent error handling

### Performance
- ✅ Project list loads in <1 second (100+ projects)
- ✅ Team member list loads in <500ms
- ✅ Action item filtering by project/team works smoothly

### UX
- ✅ Form validation matches backend
- ✅ Error messages display inline
- ✅ Conflict modal shows on 409
- ✅ Loading states visible
- ✅ Mobile responsive

---

## When Ready to Proceed

Use this command to generate Phase 2 task list:

```bash
# Run task generator (when available)
/speckit.tasks --phase 2
```

Or manually create tasks.md updates for Phase 2:
- T074-T090: Backend projects & teams (17 tasks)
- T091-T098: Frontend projects & teams (8 tasks)
- T099-T100: Integration with action items (2 tasks)

---

## Questions to Answer Before Starting

1. **Database**: Do we deploy Supabase first, or use local PostgreSQL?
2. **RBAC**: Should Project Managers be able to manage teams, or only Project Owner?
3. **Team Members**: Can team members have different roles (lead, member, viewer)?
4. **Timeline**: Are we aiming for Phase 2 in next session or later?
5. **Testing**: Should we add E2E tests (Playwright) for action items first?

---

## Resources

### Files to Study
- `PHASE_1_SUMMARY.md` - Architecture patterns used
- `PHASE_1_API_REFERENCE.md` - API design patterns
- `backend/src/services/actionItemService.ts` - Backend service template
- `frontend/src/hooks/useActionItems.ts` - Frontend hook template
- `backend/tests/actionItems.test.ts` - Testing patterns

### External References
- PostgreSQL docs: https://www.postgresql.org/docs/
- React Query: https://tanstack.com/query/v5
- TypeScript: https://www.typescriptlang.org/docs/
- Express.js: https://expressjs.com/

---

## Ready to Begin Phase 2?

**Action Items**:
1. ✅ Review Phase 1 implementation (you're here!)
2. ⬜ Verify Phase 1 builds and runs locally
3. ⬜ Create feature branch `002-ait-projects-teams`
4. ⬜ Generate Phase 2 task list
5. ⬜ Start with projectService.ts

**Estimated Start**: Next session
**Estimated Completion**: 1 week (5 days @ 4-5 hours/day)

Let me know when you're ready to kick off Phase 2! 🚀
