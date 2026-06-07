/**
 * Build ARD Generation Prompt
 * Fetches task definition, conventions, and builds the final prompt
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getARDTaskById } from '../../data/ard-tasks';

export type BuildARDPromptInput = {
  supabase: SupabaseClient;
  repoId: string;
  taskId: string;
  repoName: string;
  repoType: string;
  projectName: string;
};

/**
 * Build the prompt for ARD generation by fetching task definition and conventions
 */
export const buildARDPrompt = async (
  input: BuildARDPromptInput
): Promise<string> => {
  const { supabase, repoId, taskId, repoName, repoType, projectName } = input;

  console.log('🔍 buildARDPrompt: Looking up task ID:', taskId);
  const task = await getARDTaskById(taskId);
  if (!task) {
    console.error('❌ buildARDPrompt: Task not found:', taskId);
    throw new Error(`Task not found: ${taskId}`);
  }
  console.log('✅ buildARDPrompt: Task found:', task.name, task.task_type);

  // Get ARD build step for this repo type
  console.log('🔍 buildARDPrompt: Finding ARD step for repo type:', repoType);
  const { data: ardStep, error: ardStepError } = await supabase
    .from('build_steps')
    .select('id')
    .eq('name', 'ARD Documentation')
    .eq('repo_type', repoType)
    .maybeSingle();

  if (ardStepError || !ardStep) {
    console.error('❌ buildARDPrompt: ARD step not found for repo type:', repoType, ardStepError);
    throw new Error(`No ARD build step found for repo type: ${repoType}`);
  }
  console.log('✅ buildARDPrompt: Found ARD step:', ardStep.id);

  // Get task categories for ARD step
  console.log('🔍 buildARDPrompt: Getting task categories for ARD step');
  const { data: stepCategories, error: stepCategoriesError } = await supabase
    .from('step_task_categories')
    .select('task_category_id')
    .eq('build_step_id', ardStep.id);

  if (stepCategoriesError) {
    console.error('❌ buildARDPrompt: Error fetching task categories', stepCategoriesError);
    throw new Error(`Failed to fetch task categories: ${stepCategoriesError.message}`);
  }

  if (!stepCategories || stepCategories.length === 0) {
    console.error('❌ buildARDPrompt: No task categories found for ARD step');
    throw new Error(`No task categories found for ARD build step`);
  }

  const categoryIds = stepCategories.map((sc) => sc.task_category_id);
  console.log('✅ buildARDPrompt: Found', categoryIds.length, 'task categories');

  // Get conventions via categories
  console.log('🔍 buildARDPrompt: Fetching conventions for task categories');
  const { data: conventionMappings, error: conventionError } = await supabase
    .from('convention_task_categories')
    .select(`
      build_conventions (
        name,
        content
      )
    `)
    .in('task_category_id', categoryIds);

  if (conventionError) {
    console.error('❌ buildARDPrompt: Error fetching conventions', conventionError);
    throw new Error(`Failed to fetch conventions: ${conventionError.message}`);
  }

  const conventionsText = conventionMappings
    ?.map((cm: any) => {
      const conv = cm.build_conventions;
      return `## ${conv.name}\n\n${conv.content}`;
    })
    .join('\n\n') || 'No conventions available';

  console.log('✅ buildARDPrompt: Built conventions text with', conventionMappings?.length || 0, 'conventions');

  let prompt = task.prompt_template;
  prompt = prompt.replace(/\{\{repoName\}\}/g, repoName);
  prompt = prompt.replace(/\{\{stackType\}\}/g, repoType);
  prompt = prompt.replace(/\{\{projectName\}\}/g, projectName);
  prompt = prompt.replace(/\{\{conventions\}\}/g, conventionsText);

  return prompt;
};
