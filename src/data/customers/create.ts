/**
 * Create a customer
 */

import { SupabaseClient } from '@supabase/supabase-js';
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
  supabase: SupabaseClient,
  input: CreateCustomerInput
): Promise<Customer> => {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      stage: input.stage ?? 'discovery_call',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create customer: ${error.message}`);
  }

  return data as Customer;
};
