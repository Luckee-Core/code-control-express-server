/**
 * Create Customer Project
 */

import type { Pool } from 'pg';
import type { Project } from './get-all';

export type CreateProjectInput = {
  customer_id: string;
  name: string;
  description?: string | null;
};

/**
 * Inserts a customer_projects row.
 */
export const createProject = async (pool: Pool, input: CreateProjectInput): Promise<Project> => {
  try {
    const result = await pool.query<Project>(
      `INSERT INTO customer_projects (customer_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [input.customer_id, input.name.trim(), input.description?.trim() ?? null]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Insert returned no row');
    }
    return row;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create customer project: ${message}`);
  }
};
