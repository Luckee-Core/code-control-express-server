import type { Pool } from 'pg';
import type { ProjectRepo } from './types';

/**
 * Loads every customer_project_repos row.
 */
export const getAllProjectRepos = async (pool: Pool): Promise<ProjectRepo[]> => {
  try {
    const result = await pool.query<ProjectRepo>(
      `SELECT * FROM customer_project_repos ORDER BY created_at DESC`
    );
    return result.rows;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Error fetching all customer project repos:', message);
    throw error;
  }
};
