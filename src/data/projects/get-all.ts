/**
 * Project type (matches customer_projects table; API route is /projects)
 */

import type { Pool } from 'pg';

export type Project = {
  id: string;
  customer_id: string;
  name: string;
  description: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Get all customer projects (for Projects table page)
 */
export const getAllProjects = async (pool: Pool): Promise<Project[]> => {
  try {
    const result = await pool.query<Project>(
      `SELECT * FROM customer_projects ORDER BY updated_at DESC`
    );
    return result.rows;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch customer projects: ${message}`);
  }
};
