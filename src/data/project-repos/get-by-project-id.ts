/**
 * Get all repos for a customer project
 */

import type { Pool } from 'pg';
import type { ProjectRepo } from './types';

/**
 * Loads repos for one project ordered by repo_type.
 */
export const getProjectReposByProjectId = async (
  pool: Pool,
  projectId: string
): Promise<ProjectRepo[]> => {
  try {
    const result = await pool.query<ProjectRepo>(
      `SELECT * FROM customer_project_repos WHERE project_id = $1 ORDER BY repo_type ASC`,
      [projectId]
    );
    return result.rows;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch customer project repos: ${message}`);
  }
};
