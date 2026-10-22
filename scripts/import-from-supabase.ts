/**
 * One-time copy of Code Control CRM tables from Supabase into local Postgres.
 *
 * Requires:
 * - DATABASE_URL (target; run db:apply-migrations first)
 * - SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (source)
 *
 * Usage: npm run db:import-from-supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

type CustomerRow = {
  id: string;
  name: string;
  description: string | null;
  stage: string;
  created_at: string;
  updated_at: string;
};

type ProjectRow = {
  id: string;
  customer_id: string;
  name: string;
  description: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
};

type RepoRow = {
  id: string;
  customer_id: string;
  project_id: string;
  repo_type: string;
  name: string;
  repo_url: string;
  clone_url: string | null;
  created_at: string;
  updated_at: string;
};

const run = async (): Promise<void> => {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is required');
    process.exit(1);
  }
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for import');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('📥 Fetching customers from Supabase...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, description, stage, created_at, updated_at');
    if (customersError) throw customersError;

    console.log('📥 Fetching projects from Supabase...');
    const { data: projects, error: projectsError } = await supabase
      .from('customer_projects')
      .select('id, customer_id, name, description, is_active, created_at, updated_at');
    if (projectsError) throw projectsError;

    console.log('📥 Fetching project repos from Supabase...');
    const { data: repos, error: reposError } = await supabase
      .from('customer_project_repos')
      .select(
        'id, customer_id, project_id, repo_type, name, repo_url, clone_url, created_at, updated_at'
      );
    if (reposError) throw reposError;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      console.log('💾 Importing customers...');
      for (const row of (customers ?? []) as CustomerRow[]) {
        await client.query(
          `INSERT INTO customers (id, name, description, stage, created_at, updated_at)
           VALUES ($1, $2, $3, $4::customer_stage, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             stage = EXCLUDED.stage,
             updated_at = EXCLUDED.updated_at`,
          [row.id, row.name, row.description, row.stage, row.created_at, row.updated_at]
        );
      }

      console.log('💾 Importing projects...');
      for (const row of (projects ?? []) as ProjectRow[]) {
        await client.query(
          `INSERT INTO customer_projects (
             id, customer_id, name, description, is_active, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, COALESCE($5, true), $6, $7)
           ON CONFLICT (id) DO UPDATE SET
             customer_id = EXCLUDED.customer_id,
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             is_active = EXCLUDED.is_active,
             updated_at = EXCLUDED.updated_at`,
          [
            row.id,
            row.customer_id,
            row.name,
            row.description,
            row.is_active ?? true,
            row.created_at,
            row.updated_at,
          ]
        );
      }

      console.log('💾 Importing project repos...');
      for (const row of (repos ?? []) as RepoRow[]) {
        await client.query(
          `INSERT INTO customer_project_repos (
             id, customer_id, project_id, repo_type, name, repo_url, clone_url, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             customer_id = EXCLUDED.customer_id,
             project_id = EXCLUDED.project_id,
             repo_type = EXCLUDED.repo_type,
             name = EXCLUDED.name,
             repo_url = EXCLUDED.repo_url,
             clone_url = EXCLUDED.clone_url,
             updated_at = EXCLUDED.updated_at`,
          [
            row.id,
            row.customer_id,
            row.project_id,
            row.repo_type,
            row.name,
            row.repo_url,
            row.clone_url,
            row.created_at,
            row.updated_at,
          ]
        );
      }

      await client.query('COMMIT');
      console.log(
        `✅ Import complete: ${customers?.length ?? 0} customers, ${projects?.length ?? 0} projects, ${repos?.length ?? 0} repos`
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

void run();
