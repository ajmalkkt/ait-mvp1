-- Migration: 001_init_schema.sql
-- Purpose: Initialize base tables for companies and users
-- Created: 2026-01-21

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Companies table (multi-tenant root)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  plan VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP WITH TIME ZONE
);

-- Users table (belongs to company)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email CITEXT NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'viewer' CHECK (role IN (
    'system_admin',
    'project_manager',
    'team_lead',
    'owner',
    'participant',
    'viewer'
  )),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(company_id, email)
);

-- Create indexes on frequently queried fields
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_company_email ON users(company_id, email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_companies_created_at ON companies(created_at);

-- Add audit columns comment
COMMENT ON TABLE companies IS 'Root tenant table - each company has isolated data';
COMMENT ON TABLE users IS 'Users belong to exactly one company; enforced at RLS level';
