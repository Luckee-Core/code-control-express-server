/**
 * Core CRUD API generation logic - generates individual CRUD operation files
 * Fetches task definition from crud_api_tasks and builds the prompt based on
 * conventions from task categories.
 */

import { randomUUID } from 'crypto';
import { getManagedSupabaseClient } from '../../../db/supabase-client';
import { sanitizeBranchName } from '../../../utils/sanitize-branch-name';
import { getCursorClient } from '../../cursor';
import { getAllCrudApiTasks } from '../../../data/crud-api-tasks';
import { buildCrudPrompt } from './build-crud-prompt';
import { pollAgentStatus } from '../shared/poll-agent-status';

export type RunCrudApiGenerationInput = {
  projectId: string;
  repoId: string;
  entityId: string;
  taskId: string;
  operationKey: string;
  filePath: string;
};

export type RunCrudApiGenerationResult = {
  success: true;
  prUrl?: string;
  cursorExchangeId: string;
  agentId: string;
  summary?: string;
};

/**
 * Execute CRUD API generation for a single operation file.
 * The task definition (from crud_api_tasks) determines what gets generated
 * via prompt_template and output_path_template.
 */
export const runCrudApiGeneration = async (
  input: RunCrudApiGenerationInput
): Promise<RunCrudApiGenerationResult> => {
  const { projectId, repoId, entityId, taskId, operationKey, filePath } = input;
  let requestId: string | undefined;
  let exchangeId: string | undefined;

  const supabase = getManagedSupabaseClient();
  const cursorClient = getCursorClient();

  try {
    // Fetch repo
    const { data: repo, error: repoError } = await supabase
      .from('project_repos')
      .select('*')
      .eq('id', repoId)
      .single();

    if (repoError || !repo) {
      throw new Error(`Repo not found: ${repoError?.message}`);
    }

    // Fetch entity
    const { data: entity, error: entityError } = await supabase
      .from('data_entity')
      .select('*')
      .eq('id', entityId)
      .single();

    if (entityError || !entity) {
      throw new Error(`Entity not found: ${entityError?.message}`);
    }

    // Fetch entity fields for {{entity_fields}} and {{input_fields}} in templates
    const { data: fieldRows } = await supabase
      .from('data_entity_field')
      .select('name, type, nullable')
      .eq('entity_id', entityId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    const entityFields = (fieldRows || []).map((f: { name: string; type: string; nullable?: boolean }) => ({
      name: f.name,
      type: f.type,
      nullable: f.nullable,
    }));

    // Fetch task
    const allTasks = await getAllCrudApiTasks(supabase);
    const task = allTasks.find((t) => t.id === taskId);
    
    if (!task) {
      throw new Error('CRUD API task not found');
    }

    // Fetch conventions via task categories
    // 1. Find the CRUD API build step (build_steps uses repo_type, not repo_type_id)
    const repoType = (repo as { repo_type?: string }).repo_type ?? 'express';
    const { data: buildSteps, error: buildStepsError } = await supabase
      .from('build_steps')
      .select('*')
      .eq('name', 'CRUD API')
      .eq('repo_type', repoType);

    if (buildStepsError) {
      throw new Error(`Failed to fetch build steps: ${buildStepsError.message}`);
    }

    const crudApiStep = buildSteps?.[0];
    
    let conventions: Array<{ name: string; content: string }> = [];
    
    if (crudApiStep) {
      // 2. Get task category IDs for this step
      const { data: stepCategories, error: stepCategoriesError } = await supabase
        .from('step_task_categories')
        .select('task_category_id')
        .eq('build_step_id', crudApiStep.id);

      if (stepCategoriesError) {
        console.warn('Failed to fetch step task categories:', stepCategoriesError);
      } else if (stepCategories && stepCategories.length > 0) {
        const taskCategoryIds = stepCategories.map((sc) => sc.task_category_id);

        // 3. Get convention IDs from convention_task_categories
        const { data: conventionCategories, error: convCategoriesError } = await supabase
          .from('convention_task_categories')
          .select('convention_id')
          .in('task_category_id', taskCategoryIds);

        if (convCategoriesError) {
          console.warn('Failed to fetch convention task categories:', convCategoriesError);
        } else if (conventionCategories && conventionCategories.length > 0) {
          const conventionIds = conventionCategories.map((cc) => cc.convention_id);

          // 4. Fetch the actual conventions
          const { data: convData, error: convError } = await supabase
            .from('build_conventions')
            .select('name, content')
            .in('id', conventionIds);

          if (convError) {
            console.warn('Failed to fetch conventions:', convError);
          } else if (convData) {
            conventions = convData;
          }
        }
      }
    }

    // Fetch examples (currently empty, but prepared for future use)
    let examples: Array<{ name: string; code: string }> = [];

    const prompt = buildCrudPrompt({
      promptTemplate: task.prompt_template,
      entityName: entity.name,
      tableName: entity.table_name,
      filePath: filePath,
      operationKey: operationKey,
      conventions,
      examples,
      entityFields,
    });

    // Create cursor generation request record
    requestId = randomUUID();
    const { error: requestInsertError } = await supabase
      .from('cursor_generation_requests')
      .insert({
        id: requestId,
        project_id: projectId,
        repo_id: repoId,
        entity_id: entityId,
        task_id: taskId,
        selected_task_id: null,
        prompt_text: prompt,
        status: 'pending',
      });

    if (requestInsertError) {
      throw new Error(`Failed to record request: ${requestInsertError.message}`);
    }

    // Prepare branch name
    const repoMatch = repo.repo_url.match(/github\.com\/([^/]+\/[^/]+)/);
    const repositoryIdentifier = repoMatch ? repoMatch[1] : repo.repo_url;

    const entitySlug = sanitizeBranchName(entity.name.toLowerCase());
    const operationSlug = sanitizeBranchName(operationKey);
    const branchName = `feature/crud-${entitySlug}-${operationSlug}-${Date.now()}`;

    // Launch Cursor agent
    const agent = await cursorClient.launchAgent({
      prompt: { text: prompt },
      source: { repository: repositoryIdentifier, ref: 'main' },
      target: {
        autoCreatePr: true,
        branchName,
      },
    });

    // Create exchange record
    exchangeId = randomUUID();
    const exchangeStartTime = Date.now();

    await supabase.from('cursor_generation_exchanges').insert({
      id: exchangeId,
      request_id: requestId,
      agent_id: agent.id,
      repository: repositoryIdentifier,
      branch_ref: 'main',
      status: 'running',
    });

    // Poll for completion (15 min timeout; poll every 30s)
    const finalAgent = await pollAgentStatus(
      cursorClient,
      agent.id,
      15 * 60 * 1000,
      30000
    );

    // Calculate costs
    const durationSeconds = Math.round((Date.now() - exchangeStartTime) / 1000);
    const apiCallsCount = 1 + Math.max(1, Math.ceil(durationSeconds / 30));
    const costEstimate = apiCallsCount * 0.01;

    // Record response
    const responseId = randomUUID();
    await supabase.from('cursor_generation_responses').insert({
      id: responseId,
      pr_url: finalAgent.target.prUrl || null,
      branch_name: finalAgent.target.branchName || null,
      agent_summary: finalAgent.summary || null,
    });

    // Update exchange with response
    await supabase
      .from('cursor_generation_exchanges')
      .update({
        response_id: responseId,
        duration_seconds: durationSeconds,
        api_calls_count: apiCallsCount,
        cost_estimate: costEstimate,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', exchangeId);

    // Update request status
    await supabase
      .from('cursor_generation_requests')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    return {
      success: true,
      prUrl: finalAgent.target.prUrl,
      cursorExchangeId: exchangeId,
      agentId: agent.id,
      summary: finalAgent.summary,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // Update records on failure
    try {
      if (exchangeId) {
        await supabase
          .from('cursor_generation_exchanges')
          .update({
            status: 'failed',
            error_message: err.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', exchangeId);
      }
      if (requestId) {
        await supabase
          .from('cursor_generation_requests')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', requestId);
      }
    } catch (updateError) {
      console.error('Failed to update status on error:', updateError);
    }

    throw err;
  }
};
