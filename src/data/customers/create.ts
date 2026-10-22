/**
 * Create a customer
 */

import type { Pool } from 'pg';
import type { Customer } from './get-all';

export type CreateCustomerInput = {
  name: string;
  description?: string | null;
  stage?: Customer['stage'];
};

/**
 * Inserts a customer row. Defaults stage to discovery_call when omitted.
 */
export const createCustomer = async (
  pool: Pool,
  input: CreateCustomerInput
): Promise<Customer> => {
  const stage = input.stage ?? 'discovery_call';
  try {
    const result = await pool.query<Customer>(
      `INSERT INTO customers (name, description, stage)
       VALUES ($1, $2, $3::customer_stage)
       RETURNING *`,
      [input.name.trim(), input.description?.trim() ?? null, stage]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('Insert returned no row');
    }
    return row;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to create customer: ${message}`);
  }
};
