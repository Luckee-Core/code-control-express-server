/**
 * Build prompt for the table names config task (SUPABASE_TABLE_NAMES).
 * Loads data entities assigned to the repo and substitutes into the task template.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { CrudApiTask } from '../../../data/crud-api-tasks';

export type BuildTableNamesConfigPromptInput = {
  supabase: SupabaseClient;
  task: CrudApiTask;
  projectId: string;
  repoId: string;
  repoName: string;
};

/**
 * Load entities for this project that are assigned to this repo; build ordered list of table names.
 */
export const buildTableNamesConfigPrompt = async (
  input: BuildTableNamesConfigPromptInput
): Promise<string> => {
  const { supabase, task, projectId, repoId, repoName } = input;

  const { data: entities, error } = await supabase
    .from('data_entity')
    .select('id, name, table_name, sort_order, assigned_repo_ids')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch data entities: ${error.message}`);
  }

  type EntityRow = { id: string; name: string; table_name?: string; sort_order: number; assigned_repo_ids?: string[] };
  const assignedToRepo = (entities || []).filter((e: EntityRow) => {
    const ids = e.assigned_repo_ids ?? [];
    return ids.length === 0 || ids.includes(repoId);
  });

  const tableNames = assignedToRepo.map((e: EntityRow) => {
    if (e.table_name?.trim()) return e.table_name.trim();
    return (e.name || '').toLowerCase().replace(/\s+/g, '_');
  });

  const outputPath = task.output_path_template;
  const tableNamesList =
    tableNames.length > 0
      ? tableNames.map((t) => `- ${t}`).join('\n')
      : '(No entities assigned to this repo yet; create an empty enum or const that can be extended later.)';

  let prompt = task.prompt_template
    .replace(/\{\{repo_name\}\}/g, repoName)
    .replace(/\{\{table_names_list\}\}/g, tableNamesList)
    .replace(/\{\{output_path\}\}/g, outputPath);

  return prompt;
};
