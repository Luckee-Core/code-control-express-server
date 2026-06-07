/**
 * Core ARD generation logic - generates .cursor/ documentation files
 * Fetches task definition from data_entity_generation_tasks and builds
 * the prompt based on conventions and examples.
 */

import { randomUUID } from 'crypto';
import { getManagedSupabaseClient } from '../../../db/supabase-client';
import { sanitizeBranchName } from '../../../utils/sanitize-branch-name';
import { getCursorClient } from '../../cursor';
import { getARDTaskById } from '../../../data/ard-tasks';
import { buildARDPrompt } from './build-ard-prompt';
import { pollAgentStatus } from '../shared/poll-agent-status';

export type RunARDGenerationInput = {
  projectId: string;
  repoId: string;
  taskId: string;
};

export type RunARDGenerationResult = {
  success: true;
  prUrl?: string;
  cursorExchangeId: string;
  agentId: string;
  summary?: string;
};

/**
 * Execute ARD generation. The task definition (from data_entity_generation_tasks)
 * determines what gets generated - AGENTS.md, architecture README, etc. - via
 * prompt_template and output_path_template.
 */
export const runARDGeneration = async (
  input: RunARDGenerationInput
): Promise<RunARDGenerationResult> => {
  const { projectId, repoId, taskId } = input;
  let requestId: string | undefined;
  let exchangeId: string | undefined;

  const supabase = getManagedSupabaseClient();
  const cursorClient = getCursorClient();

  try {
    const { data: repo, error: repoError } = await supabase
      .from('customer_project_repos')
      .select('*')
      .eq('id', repoId)
      .single();

    if (repoError || !repo) {
      throw new Error(`Repo not found: ${repoError?.message}`);
    }

    const task = await getARDTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (!task.task_type.startsWith('ard_')) {
      throw new Error(`Invalid task type for ARD generation: ${task.task_type}`);
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

    const repoMatch = repo.repo_url.match(/github\.com\/([^/]+\/[^/]+)/);
    const repoName = repoMatch ? repoMatch[1].split('/')[1] : 'repo';
    const stackType = repo.repo_type || 'express';

    const outputPath = task.output_path_template;

    const prompt = buildARDPrompt({
      promptTemplate: task.prompt_template,
      repoName,
      stackType,
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
        entity_id: null,
        task_id: taskId,
        selected_task_id: null,
        prompt_text: prompt,
        status: 'pending',
      });

    if (requestInsertError) {
      throw new Error(`Failed to record request: ${requestInsertError.message}`);
    }

    const repositoryIdentifier = repoMatch ? repoMatch[1] : repo.repo_url;

    const taskPart = sanitizeBranchName(task.task_type);
    const branchName = `feature/ard-${taskPart}-${Date.now()}`;

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

    const finalAgent = await pollAgentStatus(
      cursorClient,
      agent.id,
      5 * 60 * 1000,
      30000
    );

    const durationSeconds = Math.round((Date.now() - exchangeStartTime) / 1000);
    const apiCallsCount = 1 + Math.max(1, Math.ceil(durationSeconds / 30));
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
    } catch (updateError) {
      console.error('Failed to update status on error:', updateError);
    }

    throw err;
  }
};
