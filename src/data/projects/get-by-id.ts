/**
 * Get Customer Project By ID
 */

import type { Pool } from 'pg';
import type { Project } from './get-all';

/**
 * Loads one project by primary key.
 */
export const getProjectById = async (pool: Pool, id: string): Promise<Project | null> => {
  try {
    const result = await pool.query<Project>(`SELECT * FROM customer_projects WHERE id = $1`, [
      id,
    ]);
    return result.rows[0] ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch customer project: ${message}`);
  }
};
