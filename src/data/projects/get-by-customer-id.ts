/**
 * Get customer projects by customer ID
 */

import type { Pool } from 'pg';
import type { Project } from './get-all';

/**
 * Loads projects for a customer ordered by created_at ascending.
 */
export const getProjectsByCustomerId = async (
  pool: Pool,
  customerId: string
): Promise<Project[]> => {
  try {
    const result = await pool.query<Project>(
      `SELECT * FROM customer_projects WHERE customer_id = $1 ORDER BY created_at ASC`,
      [customerId]
    );
    return result.rows;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch customer projects: ${message}`);
  }
};
