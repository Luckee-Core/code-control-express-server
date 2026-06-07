/**
 * Update Code Generation Queue Item Status
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  CodeGenerationQueue,
  CodeGenerationQueueStatus,
} from './types';

export type UpdateQueueItemStatusInput = {
  status: CodeGenerationQueueStatus;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  cursor_exchange_id?: string | null;
};

export const updateQueueItemStatus = async (
  supabase: SupabaseClient,
  id: string,
  input: UpdateQueueItemStatusInput
): Promise<CodeGenerationQueue> => {
  const updateData: Record<string, unknown> = {
    status: input.status,
  };

  if (input.started_at !== undefined) {
    updateData.started_at = input.started_at;
  }

  if (input.completed_at !== undefined) {
    updateData.completed_at = input.completed_at;
  }

  if (input.error_message !== undefined) {
    updateData.error_message = input.error_message;
  }

  if (input.cursor_exchange_id !== undefined) {
    updateData.cursor_exchange_id = input.cursor_exchange_id;
  }

  const { data, error } = await supabase
    .from('code_generation_queue')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update queue item status: ${error.message}`);
  }

  return data;
};
