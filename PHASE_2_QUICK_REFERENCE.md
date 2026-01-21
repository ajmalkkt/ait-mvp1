# Phase 2 Quick Reference Guide

## New Files Summary

### Backend (6 files, 1,080 lines)

**Services**:
- `projectService.ts` - Project CRUD, listing with filters, archive/unarchive
- `teamService.ts` - Team CRUD, member management, listing with filters

**Validation**:
- `projectValidation.ts` - Project field validators
- `teamValidation.ts` - Team field validators

**Routes**:
- `projects.ts` - 6 endpoints for project management
- `teams.ts` - 9 endpoints for team and member management

**Updated**:
- `routes/index.ts` - Added imports for projects/teams routers

### Frontend (16 files, 2,770 lines)

**Hooks**:
- `hooks/useProjects.ts` - 5 hooks for project queries/mutations
- `hooks/useTeams.ts` - 8 hooks for team queries/mutations

**Components**:
- `ProjectForm.tsx` - Form for creating/editing projects
- `ProjectList.tsx` - List container with grid layout
- `ProjectCard.tsx` - Individual project display
- `TeamForm.tsx` - Form for creating/editing teams
- `TeamList.tsx` - List container with grid layout
- `TeamCard.tsx` - Individual team display

**Pages**:
- `ProjectsPage.tsx` - Projects management page with filtering
- `TeamsPage.tsx` - Teams management page with filtering

**Styles** (8 files, 1,200+ lines):
- ProjectForm.css, ProjectList.css, ProjectCard.css, ProjectsPage.css
- TeamForm.css, TeamList.css, TeamCard.css, TeamsPage.css

## Database Tables

```sql
-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  pm_id UUID NOT NULL REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  archived_at TIMESTAMP
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  lead_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  archived_at TIMESTAMP
);

-- Team Members
CREATE TABLE user_team_members (
  id UUID PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES teams(id),
  user_id UUID NOT NULL REFERENCES users(id),
  joined_at TIMESTAMP
);
```

## API Endpoints

### Projects (6 endpoints)

```
POST   /api/v1/projects           Create project
GET    /api/v1/projects           List with pagination
GET    /api/v1/projects/:id       Get single project
PUT    /api/v1/projects/:id       Update project
PATCH  /api/v1/projects/:id/archive  Archive project
DELETE /api/v1/projects/:id       Delete (soft) project
```

### Teams (9 endpoints)

```
POST   /api/v1/teams              Create team
GET    /api/v1/teams              List with pagination
GET    /api/v1/teams/:id          Get single team
PUT    /api/v1/teams/:id          Update team
PATCH  /api/v1/teams/:id/archive  Archive team
DELETE /api/v1/teams/:id          Delete (soft) team
POST   /api/v1/teams/:id/members  Add member
GET    /api/v1/teams/:id/members  List members
DELETE /api/v1/teams/:id/members/:userId  Remove member
```

## React Query Hooks

### useProjects

```typescript
const { data, isLoading } = useProjects({ page, pageSize, search, pm_id })
const { mutateAsync: create } = useCreateProject()
const { mutateAsync: update } = useUpdateProject(projectId)
const { mutateAsync: archive } = useArchiveProject()
```

### useTeams

```typescript
const { data, isLoading } = useTeams({ page, pageSize, project_id, search })
const { data: members } = useTeamMembers(teamId, page)
const { mutateAsync: create } = useCreateTeam()
const { mutateAsync: update } = useUpdateTeam(teamId)
const { mutateAsync: archive } = useArchiveTeam()
const { mutateAsync: addMember } = useAddTeamMember(teamId)
const { mutateAsync: removeMember } = useRemoveTeamMember(teamId)
```

## Component Usage Examples

### ProjectForm

```typescript
<ProjectForm
  project={editingProject}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isLoading={false}
  projectManagers={managers}
/>
```

### ProjectList

```typescript
<ProjectList
  projects={projects}
  isLoading={isLoading}
  isEmpty={projects.length === 0}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### TeamForm

```typescript
<TeamForm
  team={editingTeam}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isLoading={false}
  projects={projects}
  teamLeads={users}
/>
```

## Integration Steps

### 1. Add Routes to App.tsx

```typescript
import ProjectsPage from './pages/ProjectsPage'
import TeamsPage from './pages/TeamsPage'

// In your router configuration:
<Route path="/projects" element={<ProjectsPage />} />
<Route path="/teams" element={<TeamsPage />} />
```

### 2. Update Navigation

```typescript
// Add to your navigation menu:
<Link to="/projects">Projects</Link>
<Link to="/teams">Teams</Link>
```

### 3. Update ActionItemForm (optional)

Add project and team select fields to the existing ActionItemForm:

```typescript
<select name="project_id" {...register('project_id')}>
  {projects.map(p => <option value={p.id}>{p.name}</option>)}
</select>

<select name="team_id" {...register('team_id')}>
  {teams.map(t => <option value={t.id}>{t.name}</option>)}
</select>
```

## Common Patterns

### Form with Validation

```typescript
const [formData, setFormData] = useState({})
const [errors, setErrors] = useState({})

const validateField = (name, value) => {
  const newErrors = { ...errors }
  if (!value) newErrors[name] = 'Field is required'
  else delete newErrors[name]
  setErrors(newErrors)
}

const handleSubmit = async (e) => {
  e.preventDefault()
  if (Object.keys(errors).length === 0) {
    await onSubmit(formData)
  }
}
```

### List with Pagination

```typescript
const [page, setPage] = useState(1)
const { data } = useProjects({ page, pageSize: 12 })

const items = data?.data || []
const pages = data?.pagination.pages || 1

<button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>
  Previous
</button>
<button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages}>
  Next
</button>
```

## Testing Checklist

### Backend Tests
- [ ] Project creation with all fields
- [ ] Project listing with filters
- [ ] Project update/archive
- [ ] Team creation/listing
- [ ] Team member add/remove
- [ ] Company isolation (RLS)
- [ ] Date validation
- [ ] Pagination limits

### Frontend Tests
- [ ] Form validation errors
- [ ] Submission and success
- [ ] Edit mode toggle
- [ ] Delete confirmation
- [ ] Search/filter functionality
- [ ] Pagination navigation
- [ ] Loading states
- [ ] Error handling (404, 400)

### Integration Tests
- [ ] Can create project
- [ ] Can create team under project
- [ ] Can add team members
- [ ] Can filter action items by project/team
- [ ] Soft deletes work correctly
- [ ] Archived items hidden by default

## Performance Notes

**Query Keys**:
- `projects` - All project queries
- `projects.list` - List views (paginated)
- `projects.detail` - Individual project
- `teams` - All team queries
- `teams.list` - List views (paginated)
- `teams.detail` - Individual team
- `teams.members` - Team member lists

**Invalidation Strategy**:
- Create/Update/Delete invalidates `*.list` and `*.detail`
- Member operations invalidate `teams.members`
- Prevents stale data, ensures consistency

**Optimization**:
- Stale time: 5 minutes (configurable)
- Cache size: ~100 items before pruning
- Pagination: max 100 items, default 12/25/50

## Common Issues & Solutions

### Issue: Form validation not clearing

**Solution**: Clear touched state when switching between create/edit
```typescript
const handleCancel = () => {
  setTouched({})
  setErrors({})
  setShowForm(false)
}
```

### Issue: Team not showing new members immediately

**Solution**: Invalidate team members query after add/remove
```typescript
queryClient.invalidateQueries({ 
  queryKey: teamKeys.membersList(teamId) 
})
```

### Issue: Project filter not working

**Solution**: Make sure to pass project_id as string, not object
```typescript
// ✅ Correct
setProjectFilter(project.id)

// ❌ Wrong
setProjectFilter(project)
```

## Next Phase: Phase 3

See PHASE_2_KICKOFF.md for recommendations on Phase 3:
- Notifications & Escalations
- Email queue setup
- Cron job configuration
- Escalation rules

---

**Created**: Phase 2 Complete
**Ready for**: Integration testing and deployment
