/**
 * Get customer by ID
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Customer } from './get-all';

export const getCustomerById = async (
  supabase: SupabaseClient,
  id: string
): Promise<Customer | null> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch customer: ${error.message}`);
  }

  return data;
};
