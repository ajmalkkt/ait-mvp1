-- Migration: 005_rls_policies.sql
-- Purpose: Row Level Security policies for multi-tenant data isolation
-- Created: 2026-01-21

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- Companies RLS policies (admin only can see own company)
CREATE POLICY companies_select ON companies
  FOR SELECT
  USING (id = get_user_company_id() OR auth.uid()::text = 'system_admin');

CREATE POLICY companies_update ON companies
  FOR UPDATE
  USING (id = get_user_company_id())
  WITH CHECK (id = get_user_company_id());

-- Users RLS policies (users see only their company)
CREATE POLICY users_select ON users
  FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY users_update ON users
  FOR UPDATE
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY users_insert ON users
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

-- Projects RLS policies
CREATE POLICY projects_select ON projects
  FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY projects_insert ON projects
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY projects_update ON projects
  FOR UPDATE
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

-- Teams RLS policies
CREATE POLICY teams_select ON teams
  FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY teams_insert ON teams
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY teams_update ON teams
  FOR UPDATE
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

-- Team members RLS policies
CREATE POLICY team_members_select ON user_team_members
  FOR SELECT
  USING (team_id IN (SELECT id FROM teams WHERE company_id = get_user_company_id()));

CREATE POLICY team_members_insert ON user_team_members
  FOR INSERT
  WITH CHECK (team_id IN (SELECT id FROM teams WHERE company_id = get_user_company_id()));

CREATE POLICY team_members_delete ON user_team_members
  FOR DELETE
  USING (team_id IN (SELECT id FROM teams WHERE company_id = get_user_company_id()));

-- Meetings RLS policies
CREATE POLICY meetings_select ON meetings
  FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY meetings_insert ON meetings
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY meetings_update ON meetings
  FOR UPDATE
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

-- Action items RLS policies (most critical)
CREATE POLICY action_items_select ON action_items
  FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY action_items_insert ON action_items
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY action_items_update ON action_items
  FOR UPDATE
  USING (company_id = get_user_company_id())
  WITH CHECK (company_id = get_user_company_id());

-- Audit logs RLS policies (read-only, company-specific)
CREATE POLICY audit_logs_select ON audit_logs
  FOR SELECT
  USING (company_id = get_user_company_id());

CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

-- Notifications RLS policies
CREATE POLICY notifications_select ON notifications
  FOR SELECT
  USING (company_id = get_user_company_id() AND (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM users WHERE role = 'system_admin' AND company_id = get_user_company_id())));

CREATE POLICY notifications_insert ON notifications
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id());

CREATE POLICY notifications_update ON notifications
  FOR UPDATE
  USING (company_id = get_user_company_id() AND user_id = auth.uid())
  WITH CHECK (company_id = get_user_company_id());

-- Notification queue RLS policies (service role only for background jobs)
CREATE POLICY notifications_queue_all ON notifications_queue
  FOR ALL
  USING (company_id = get_user_company_id() OR auth.role() = 'service_role');

-- Notification preferences RLS policies
CREATE POLICY notification_preferences_select ON notification_preferences
  FOR SELECT
  USING (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY notification_preferences_update ON notification_preferences
  FOR UPDATE
  USING (company_id = get_user_company_id() AND user_id = auth.uid())
  WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid());

CREATE POLICY notification_preferences_insert ON notification_preferences
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id() AND user_id = auth.uid());
