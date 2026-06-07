/**
 * Put Data Entity Operations - replace all operations for an entity
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type PutDataEntityOperationsInput = {
  entity_id: string;
  operation_keys: string[];
};

export const putDataEntityOperations = async (
  supabase: SupabaseClient,
  input: PutDataEntityOperationsInput
): Promise<void> => {
  const { entity_id, operation_keys } = input;

  const { error: deleteError } = await supabase
    .from('data_entity_operation')
    .delete()
    .eq('data_entity_id', entity_id);

  if (deleteError) {
    throw new Error(`Failed to delete existing operations: ${deleteError.message}`);
  }

  if (operation_keys.length === 0) return;

  const rows = operation_keys.map((operation_key) => ({
    data_entity_id: entity_id,
    operation_key,
  }));

  const { error: insertError } = await supabase
    .from('data_entity_operation')
    .insert(rows);

  if (insertError) {
    throw new Error(`Failed to insert operations: ${insertError.message}`);
  }
};
