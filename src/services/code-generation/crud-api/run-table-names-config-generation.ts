/**
 * Run CRUD "table names config" task: generate SUPABASE_TABLE_NAMES file from data entities.
 * Repo-level task (no entity). Uses same Cursor launch/poll flow as runCrudApiGeneration.
 */

import { randomUUID } from 'crypto';
import { getManagedSupabaseClient } from '../../../db/supabase-client';
import { getCursorClient } from '../../cursor';
import { getAllCrudApiTasks } from '../../../data/crud-api-tasks';
import { buildTableNamesConfigPrompt } from './build-table-names-config-prompt';
import { pollAgentStatus } from '../shared/poll-agent-status';

export type RunTableNamesConfigGenerationInput = {
  projectId: string;
  repoId: string;
  taskId: string;
  filePath: string;
};

export type RunTableNamesConfigGenerationResult = {
  success: true;
  prUrl?: string;
  cursorExchangeId: string;
  agentId: string;
  summary?: string;
};

export const runTableNamesConfigGeneration = async (
  input: RunTableNamesConfigGenerationInput
): Promise<RunTableNamesConfigGenerationResult> => {
  const { projectId, repoId, taskId, filePath } = input;
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

    const allTasks = await getAllCrudApiTasks(supabase);
    const task = allTasks.find((t) => t.id === taskId);
    if (!task) {
      throw new Error('CRUD API task not found');
    }

    const repoName = (repo as { name?: string }).name ?? 'repository';
    const prompt = await buildTableNamesConfigPrompt({
      supabase,
      task,
      projectId,
      repoId,
      repoName,
    });

    requestId = randomUUID();
    await supabase.from('cursor_generation_requests').insert({
      id: requestId,
      project_id: projectId,
      repo_id: repoId,
      entity_id: null,
      task_id: taskId,
      selected_task_id: null,
      prompt_text: prompt,
      status: 'pending',
    });

    const repoMatch = (repo.repo_url || '').match(/github\.com\/([^/]+\/[^/]+)/);
    const repositoryIdentifier = repoMatch ? repoMatch[1] : repo.repo_url;
    const branchName = `feature/table-names-config-${Date.now()}`;

    const agent = await cursorClient.launchAgent({
      prompt: { text: prompt },
      source: { repository: repositoryIdentifier, ref: 'main' },
      target: { autoCreatePr: true, branchName },
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
      15 * 60 * 1000,
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
