/**
 * Get All Code Generation Queue Items
 * Retrieves queue items with optional filters
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CodeGenerationQueue } from './types';

export type GetAllCodeGenerationQueueFilters = {
  status?: CodeGenerationQueue['status'];
  project_id?: string;
  entity_id?: string;
  task_id?: string;
  limit?: number;
  offset?: number;
};

export const getAllQueueItems = async (
  supabase: SupabaseClient,
  filters?: GetAllCodeGenerationQueueFilters
): Promise<CodeGenerationQueue[]> => {
  let query = supabase
    .from('code_generation_queue')
    .select(`
      *,
      cursor_generation_exchanges!cursor_exchange_id (
        response_id,
        cursor_generation_responses!response_id (
          pr_url
        )
      )
    `)
    .order('scheduled_at', { ascending: true })
    .order('created_at', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.project_id) {
    query = query.eq('project_id', filters.project_id);
  }

  if (filters?.entity_id) {
    query = query.eq('entity_id', filters.entity_id);
  }

  if (filters?.task_id) {
    query = query.eq('task_id', filters.task_id);
  }

  if (filters?.limit !== undefined) {
    if (filters?.offset !== undefined && filters.offset > 0) {
      query = query.range(
        filters.offset,
        filters.offset + filters.limit - 1
      );
    } else {
      query = query.limit(filters.limit);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch queue items: ${error.message}`);
  }

  if (!data) return [];

  return data.map((item: any) => ({
    id: item.id,
    project_id: item.project_id,
    repo_id: item.repo_id,
    entity_id: item.entity_id,
    task_id: item.task_id,
    selected_task_id: item.selected_task_id,
    status: item.status,
    scheduled_at: item.scheduled_at,
    started_at: item.started_at,
    completed_at: item.completed_at,
    error_message: item.error_message,
    cursor_exchange_id: item.cursor_exchange_id,
    created_at: item.created_at,
    updated_at: item.updated_at,
    pr_url: item.cursor_generation_exchanges?.cursor_generation_responses?.pr_url || null,
  }));
};
