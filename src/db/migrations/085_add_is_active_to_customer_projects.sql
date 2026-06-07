-- =====================================================
-- Migration: 085_add_is_active_to_projects.sql
-- Description: Add is_active column to projects table
-- Date: 2026-03-02
-- =====================================================

-- Add is_active column with default true
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for filtering by is_active
CREATE INDEX IF NOT EXISTS idx_projects_is_active 
ON projects(is_active);

-- Add comment
COMMENT ON COLUMN projects.is_active IS 
'Indicates if the project is currently active. Inactive projects are hidden from most queries.';
