-- Migration: 004_indexes.sql
-- Purpose: Performance-critical indexes for queries
-- Created: 2026-01-21

-- Composite indexes for action items filtering (most critical queries)
CREATE INDEX IF NOT EXISTS idx_action_items_company_status_due 
  ON action_items(company_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_action_items_company_owner_due 
  ON action_items(company_id, owner_id, due_date);

CREATE INDEX IF NOT EXISTS idx_action_items_company_team_due 
  ON action_items(company_id, team_id, due_date);

CREATE INDEX IF NOT EXISTS idx_action_items_company_project_due 
  ON action_items(company_id, project_id, due_date);

-- Overdue items query index
CREATE INDEX IF NOT EXISTS idx_action_items_overdue 
  ON action_items(company_id, due_date) 
  WHERE due_date < CURRENT_DATE AND status != 'completed' AND status != 'closed';

-- Meetings query indexes
CREATE INDEX IF NOT EXISTS idx_meetings_company_project_date 
  ON meetings(company_id, project_id, meeting_date);

-- Projects and teams query indexes
CREATE INDEX IF NOT EXISTS idx_projects_company_archived 
  ON projects(company_id) 
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_teams_company_archived 
  ON teams(company_id) 
  WHERE archived_at IS NULL;

-- Notifications performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_date 
  ON notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_queue_pending 
  ON notifications_queue(status, created_at) 
  WHERE status = 'pending' OR status = 'retried';
