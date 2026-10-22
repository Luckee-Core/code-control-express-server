/**
 * Update Customer Project
 */

import type { Pool } from 'pg';
import type { Project } from './get-all';

export type UpdateProjectInput = {
  name?: string;
  description?: string | null;
};

/**
 * Updates a customer_projects row and sets updated_at in application code.
 */
export const updateProject = async (
  pool: Pool,
  id: string,
  input: UpdateProjectInput
): Promise<Project> => {
  const sets: string[] = ['updated_at = NOW()'];
  const values: unknown[] = [];
  let param = 1;

  if (input.name !== undefined) {
    sets.push(`name = $${param}`);
    values.push(input.name.trim());
    param += 1;
  }
  if (input.description !== undefined) {
    sets.push(`description = $${param}`);
    values.push(input.description?.trim() ?? null);
    param += 1;
  }

  values.push(id);

  try {
    const result = await pool.query<Project>(
      `UPDATE customer_projects SET ${sets.join(', ')} WHERE id = $${param} RETURNING *`,
      values
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Customer project not found');
    }
    return row;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update customer project: ${message}`);
  }
};
