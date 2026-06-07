/**
 * Core entity code generation logic - can be called from HTTP handler or queue processor.
 * Fetches task definition from data_entity_generation_tasks and dynamically builds
 * the prompt based on task_type, prompt_template, conventions, and examples.
 */

import { randomUUID } from 'crypto';
import { getManagedSupabaseClient } from '../../../db/supabase-client';
import { sanitizeBranchName } from '../../../utils/sanitize-branch-name';
import { getCursorClient } from '../../cursor';
import { getDataEntityGenerationTaskById } from '../../../data/data-entity-generation-tasks';
import { updateDataEntitySelectedTask } from '../../../data/data-entity-selected-tasks';
import { buildEntityPrompt } from './build-entity-prompt';
import { pollAgentStatus } from '../shared/poll-agent-status';

export type RunEntityGenerationInput = {
  projectId: string;
  repoId: string;
  entityId: string;
  taskId: string;
  selectedTaskId: string;
};

export type RunEntityGenerationResult = {
  success: true;
  prUrl?: string;
  cursorExchangeId: string;
  agentId: string;
  summary?: string;
};

/**
 * Execute code generation for an entity. The task definition (from data_entity_generation_tasks)
 * determines what gets generated - model file, migration, etc. - via prompt_template and
 * output_path_template.
 */
export const runEntityGeneration = async (
  input: RunEntityGenerationInput
): Promise<RunEntityGenerationResult> => {
  const { projectId, repoId, entityId, taskId, selectedTaskId } = input;
  let requestId: string | undefined;
  let exchangeId: string | undefined;

  const supabase = getManagedSupabaseClient();
  const cursorClient = getCursorClient();

  try {
    const { data: repo, error: repoError } = await supabase
      .from('project_repos')
      .select('*')
      .eq('id', repoId)
      .single();

    if (repoError || !repo) {
      throw new Error(`Repo not found: ${repoError?.message}`);
    }

    const { data: entity, error: entityError } = await supabase
      .from('data_entity')
      .select('*')
      .eq('id', entityId)
      .single();

    if (entityError || !entity) {
      throw new Error(`Entity not found: ${entityError?.message}`);
    }

    const assignedRepoIds = (entity.assigned_repo_ids ?? []) as string[];
    if (assignedRepoIds.length > 0 && !assignedRepoIds.includes(repoId)) {
      throw new Error(
        `Entity "${entity.name}" is not assigned to this repo. Assign the entity to the repo in the guided pathway before generating.`
      );
    }

    const { data: fields, error: fieldsError } = await supabase
      .from('data_entity_field')
      .select('*')
      .eq('entity_id', entityId)
      .order('sort_order', { ascending: true });

    if (fieldsError) {
      throw new Error(`Failed to fetch entity fields: ${fieldsError.message}`);
    }

    const task = await getDataEntityGenerationTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    let conventions: Array<{ name: string; content: string }> = [];
    if (task.required_conventions_tags && task.required_conventions_tags.length > 0) {
      const { data: convData } = await supabase
        .from('build_conventions')
        .select('name, content')
        .overlaps('tags', task.required_conventions_tags);
      if (convData) conventions = convData;
    }

    let examples: Array<{ name: string; code: string }> = [];
    if (task.required_examples_tags && task.required_examples_tags.length > 0) {
      const { data: exData } = await supabase
        .from('build_examples')
        .select('name, code')
        .overlaps('tags', task.required_examples_tags);
      if (exData) examples = exData;
    }

    let outputPath = task.output_path_template
      .replace(/\{\{entityName\}\}/g, entity.name)
      .replace(/\{\{entityNameLower\}\}/g, entity.name.toLowerCase())
      .replace(/\{\{tableName\}\}/g, entity.table_name)
      .replace(/\{\{timestamp\}\}/g, Date.now().toString());

    const prompt = buildEntityPrompt({
      promptTemplate: task.prompt_template,
      entityName: entity.name,
      tableName: entity.table_name,
      fields: fields || [],
      conventions,
      examples,
      outputPath,
    });

    requestId = randomUUID();
    const { error: requestInsertError } = await supabase
      .from('cursor_generation_requests')
      .insert({
        id: requestId,
        project_id: projectId,
        repo_id: repoId,
        entity_id: entityId,
        task_id: taskId,
        selected_task_id: selectedTaskId,
        prompt_text: prompt,
        status: 'pending',
      });

    if (requestInsertError) {
      throw new Error(`Failed to record request: ${requestInsertError.message}`);
    }

    await updateDataEntitySelectedTask(selectedTaskId, { status: 'generating' });

    const repoMatch = repo.repo_url.match(/github\.com\/([^/]+\/[^/]+)/);
    const repositoryIdentifier = repoMatch ? repoMatch[1] : repo.repo_url;

    const entityPart = sanitizeBranchName(entity.name.toLowerCase());
    const taskPart = sanitizeBranchName(task.task_type);
    const branchName = `feature/add-${entityPart}-${taskPart}-${Date.now()}`;

    const agent = await cursorClient.launchAgent({
      prompt: { text: prompt },
      source: { repository: repositoryIdentifier, ref: 'main' },
      target: {
        autoCreatePr: true,
        branchName,
      },
    });

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

    await updateDataEntitySelectedTask(selectedTaskId, {
      agent_id: agent.id,
      cursor_exchange_id: exchangeId,
    });

    const finalAgent = await pollAgentStatus(
      cursorClient,
      agent.id,
      5 * 60 * 1000,
      30000
    );

    const durationSeconds = Math.round((Date.now() - exchangeStartTime) / 1000);
    const apiCallsCount =
      1 + Math.max(1, Math.ceil(durationSeconds / 30));
    const costEstimate = apiCallsCount * 0.01;

    const responseId = randomUUID();
    await supabase.from('cursor_generation_responses').insert({
      id: responseId,
      pr_url: finalAgent.target.prUrl || null,
      branch_name: finalAgent.target.branchName || null,
      agent_summary: finalAgent.summary || null,
    });

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

    await supabase
      .from('cursor_generation_requests')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    await updateDataEntitySelectedTask(selectedTaskId, {
      status: 'completed',
      pr_url: finalAgent.target.prUrl || null,
      cursor_exchange_id: exchangeId,
    });

    return {
      success: true,
      prUrl: finalAgent.target.prUrl,
      cursorExchangeId: exchangeId,
      agentId: agent.id,
      summary: finalAgent.summary,
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

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
      await updateDataEntitySelectedTask(selectedTaskId, {
        status: 'failed',
        error_message: err.message,
      });
    } catch (updateError) {
      console.error('Failed to update status on error:', updateError);
    }

    throw err;
  }
};
