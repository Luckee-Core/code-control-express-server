/**
 * Delete Customer Project
 */

import type { Pool } from 'pg';

/**
 * Deletes a customer_projects row by id.
 */
export const deleteProject = async (pool: Pool, id: string): Promise<void> => {
  try {
    const result = await pool.query(`DELETE FROM customer_projects WHERE id = $1`, [id]);
    if ((result.rowCount ?? 0) === 0) {
      throw new Error('Customer project not found');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete customer project: ${message}`);
  }
};
