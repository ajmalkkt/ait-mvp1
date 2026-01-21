# Local Development Setup Guide

**Last Updated**: 2026-01-21

## Prerequisites

- Node.js 18+ ([download](https://nodejs.org/))
- PostgreSQL 14+ or Supabase account ([sign up](https://supabase.com/))
- Git
- IDE: VS Code recommended

## 1. Environment Setup

### Clone repository

```bash
git clone <repository-url>
cd ait
git checkout 001-ait-mvp
```

### Backend Setup

1. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

2. **Create `.env` file** from template:
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables**:
   
   **Option A: Using Supabase** (recommended)
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql://postgres:password@localhost:5432/ait_dev
   
   JWT_SECRET=your-jwt-secret-key
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

   **Option B: Using Local PostgreSQL**
   ```bash
   # Install PostgreSQL
   # Create database
   createdb ait_dev
   
   # Set DATABASE_URL
   DATABASE_URL=postgresql://postgres:password@localhost:5432/ait_dev
   ```

4. **Run migrations**:
   ```bash
   npm run migrate
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

   Server should be running at `http://localhost:3000`

6. **Verify health check**:
   ```bash
   curl http://localhost:3000/health
   ```

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables**:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_BASE_URL=http://localhost:3000/api
   VITE_ENV=development
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

   Frontend should be running at `http://localhost:5173`

## 2. Database Setup (Supabase)

1. **Sign up for Supabase**: https://supabase.com/
2. **Create new project**
3. **Run migrations**:
   ```bash
   # In backend directory
   npm run migrate
   ```
4. **Verify RLS policies**:
   - Go to Supabase dashboard
   - SQL Editor
   - Run: `SELECT * FROM pg_policies;`
   - Should see policies for all tables

## 3. Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run integration tests only
npm run test:integration

# Watch mode
npm run test:watch
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch

# E2E tests (if Playwright configured)
npm run test:e2e
```

## 4. Code Quality

### Linting

```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

### Formatting

```bash
# Backend
cd backend && npm run format

# Frontend
cd frontend && npm run format
```

### Type Checking

```bash
# Backend (automatic with TypeScript)
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

## 5. Database Migrations

### Create new migration

```bash
# Backend migrations use SQL files
# Create new file: backend/migrations/00X_description.sql
# Run migrations with: npm run migrate
```

### Rollback migration

```bash
npm run migrate:rollback
```

### View migration status

```bash
# Check Supabase UI or query:
SELECT * FROM _supabase_migrations;
```

## 6. API Testing

### Using cURL

```bash
# Health check (no auth required)
curl http://localhost:3000/health

# Get action items (requires token)
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/v1/action-items
```

### Using Postman

1. Import [API contract](./api-contract.md)
2. Set Postman environment:
   ```
   base_url: http://localhost:3000/api/v1
   token: <your-jwt-token>
   ```
3. Make requests

### Using VS Code REST Client

Create `requests.http`:

```http
### Health check
GET http://localhost:3000/health

### List action items
GET http://localhost:3000/api/v1/action-items
Authorization: Bearer <token>
```

## 7. Debugging

### Backend Debugging

```bash
# Start with inspector
node --inspect-brk dist/server.js

# Or use VSCode debugger (F5)
# See .vscode/launch.json
```

### Frontend Debugging

- Open DevTools: F12
- React DevTools browser extension recommended
- React Query DevTools for API debugging

### Database Debugging

**Supabase SQL Editor**:
1. Go to Supabase dashboard
2. SQL Editor
3. Run queries to inspect data

**Local PostgreSQL**:
```bash
psql -U postgres -d ait_dev

# List tables
\dt

# View RLS policies
SELECT * FROM pg_policies;

# Query data
SELECT * FROM action_items LIMIT 10;
```

## 8. Common Issues

### "DATABASE_URL is not set"
- Check `.env` file exists
- Verify DATABASE_URL is correctly formatted
- For Supabase: Use PostgreSQL connection string, not HTTP API URL

### Port 3000 already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### CORS errors
- Check backend CORS config in `src/app.ts`
- Verify FRONTEND_URL in `.env` matches actual frontend URL
- Check browser console for exact error

### RLS policy blocking queries
- Verify user company_id in JWT claims
- Check RLS policies in Supabase UI
- Ensure migrations ran successfully

### Slow migrations
- First run may take longer as indexes are created
- Check Supabase dashboard for progress
- Verify database connection is stable

## 9. Docker (Optional)

### Local Development with Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432

## 10. Useful Commands

```bash
# Full development workflow
cd backend && npm run migrate && npm run dev &
cd ../frontend && npm run dev

# Run full test suite
cd backend && npm test && cd ../frontend && npm test

# Format all code
cd backend && npm run format && cd ../frontend && npm run format

# Clean builds
cd backend && rm -rf dist node_modules && npm install
cd ../frontend && rm -rf dist node_modules && npm install
```

## Next Steps

- Read [API Contract](./api-contract.md) for endpoint specifications
- Check [Database Schema](./database-schema.md) for data model
- Review [Architecture](./architecture.md) for system design
- Start implementing Phase 1 tasks from tasks.md

---

**Support**: Check README.md for additional resources
