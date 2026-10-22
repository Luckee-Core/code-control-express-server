/**
 * Get customer by ID
 */

import type { Pool } from 'pg';
import type { Customer } from './get-all';

/**
 * Loads one customer by primary key.
 */
export const getCustomerById = async (
  pool: Pool,
  id: string
): Promise<Customer | null> => {
  try {
    const result = await pool.query<Customer>(`SELECT * FROM customers WHERE id = $1`, [id]);
    return result.rows[0] ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch customer: ${message}`);
  }
};
