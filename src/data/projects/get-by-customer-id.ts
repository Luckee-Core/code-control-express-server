/**
 * Get customer projects by customer ID
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Project } from './get-all';

export const getProjectsByCustomerId = async (
  supabase: SupabaseClient,
  customerId: string
): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('customer_projects')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch customer projects: ${error.message}`);
  }

  return data || [];
};
