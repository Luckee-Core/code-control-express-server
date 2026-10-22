/**
 * Get all customers, optionally filtered by stage
 */

import type { Pool } from 'pg';

export type Customer = {
  id: string;
  name: string;
  description: string | null;
  stage: 'discovery_call' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type GetAllCustomersParams = {
  stage?: string;
};

/**
 * Loads customers ordered by created_at descending.
 */
export const getAllCustomers = async (
  pool: Pool,
  params?: GetAllCustomersParams
): Promise<Customer[]> => {
  try {
    if (params?.stage) {
      const result = await pool.query<Customer>(
        `SELECT * FROM customers WHERE stage = $1::customer_stage ORDER BY created_at DESC`,
        [params.stage]
      );
      return result.rows;
    }

    const result = await pool.query<Customer>(
      `SELECT * FROM customers ORDER BY created_at DESC`
    );
    return result.rows;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch customers: ${message}`);
  }
};
