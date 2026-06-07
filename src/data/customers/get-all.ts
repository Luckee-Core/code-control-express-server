/**
 * Get all customers, optionally filtered by stage
 */

import { SupabaseClient } from '@supabase/supabase-js';

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

export const getAllCustomers = async (
  supabase: SupabaseClient,
  params?: GetAllCustomersParams
): Promise<Customer[]> => {
  let query = supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (params?.stage) {
    query = query.eq('stage', params.stage);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch customers: ${error.message}`);
  }

  return data || [];
};
