/**
 * Get Data Entity Fields By Entity ID
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type DataEntityField = {
  id: string;
  entity_id: string;
  name: string;
  type: string;
  nullable: boolean;
  default_value: string | null;
  sort_order: number;
  references_entity_id: string | null;
  created_at: string;
  updated_at: string;
};

export const getDataEntityFieldsByEntityId = async (
  supabase: SupabaseClient,
  entityId: string
): Promise<DataEntityField[]> => {
  const { data, error } = await supabase
    .from('data_entity_field')
    .select('*')
    .eq('entity_id', entityId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch data entity fields: ${error.message}`);
  }

  return (data || []) as DataEntityField[];
};
