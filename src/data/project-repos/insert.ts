/**
 * Insert a customer project repo (after creating from GitHub template)
 */

import type { Pool } from 'pg';
import type { RepoType } from './types';

export type InsertProjectRepoInput = {
  customer_id: string;
  project_id: string;
  repo_type: RepoType;
  name: string;
  repo_url: string;
  clone_url?: string | null;
};

/**
 * Inserts a customer_project_repos row.
 */
export const insertProjectRepo = async (
  pool: Pool,
  input: InsertProjectRepoInput
): Promise<{ id: string }> => {
  try {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO customer_project_repos (
         customer_id, project_id, repo_type, name, repo_url, clone_url
       ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        input.customer_id,
        input.project_id,
        input.repo_type,
        input.name,
        input.repo_url,
        input.clone_url ?? null,
      ]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Insert returned no row');
    }
    return row;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to insert customer project repo: ${message}`);
  }
};
