/**
 * Generate Data Model File
 * Calls Cursor API to generate TypeScript model file
 */

import { getManagedSupabaseClient } from '../../db/supabase-client';
import { getCursorClient } from '../cursor';
import { buildModelPrompt } from './build-model-prompt';
import { pollAgentStatus } from '../code-generation/shared/poll-agent-status';
import { sanitizeBranchName } from '../../utils/git';
import { randomUUID } from 'crypto';

export type GenerateModelFileInput = {
  projectId: string;
  repoId: string;
  entityId: string;
};

export type GenerateModelFileResult = {
  success: boolean;
  cursorExchangeId: string;
  agentId: string;
  fileContent?: string;
};

/**
 * Generate a model file using Cursor API
 */
export const generateModelFile = async (
  input: GenerateModelFileInput
): Promise<GenerateModelFileResult> => {
  const { projectId, repoId, entityId } = input;
  const supabase = getManagedSupabaseClient();
  const cursorClient = getCursorClient();
  let requestId: string | undefined;
  let exchangeId: string | undefined;

  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  try {
    console.log('🚀 generateModelFile: Starting generation', {
      projectId,
      repoId,
      entityId,
    });

    // Fetch repo details
    const { data: repo, error: repoError } = await supabase
      .from('project_repos')
      .select('*')
      .eq('id', repoId)
      .single();

    if (repoError || !repo) {
      throw new Error(`Repo not found: ${repoId}`);
    }

    // Fetch entity for file naming
    const { data: entity, error: entityError } = await supabase
      .from('data_entity')
      .select('name')
      .eq('id', entityId)
      .single();

    if (entityError || !entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }

    // Build prompt
    const prompt = await buildModelPrompt({
      supabase,
      entityId,
      repoName: repo.name,
    });

    console.log('📝 generateModelFile: Prompt built, length:', prompt.length);

    // Create cursor generation request record
    requestId = randomUUID();
    await supabase.from('cursor_generation_requests').insert({
      id: requestId,
      project_id: projectId,
      repo_id: repoId,
      prompt_text: prompt,
      status: 'pending',
    });

    console.log('✅ generateModelFile: Request record created:', requestId);

    // Prepare repository URL and branch name
    const repoUrl = repo.clone_url || repo.repo_url;
    const repoMatch = repoUrl.match(/github\.com\/([^/]+\/[^/]+)/);
    const repository = repoMatch ? repoMatch[1] : repoUrl;
    const sanitizedEntityName = sanitizeBranchName(entity.name);
    const branchName = `data-model/${sanitizedEntityName}-${Date.now()}`;

    console.log(`🚀 Launching Cursor agent for ${entity.name} model file (branch: ${branchName})`);

    // Launch Cursor agent
    const agent = await cursorClient.launchAgent({
      prompt: {
        text: prompt,
      },
      source: {
        repository: repoUrl,
      },
      target: {
        autoCreatePr: true,
        branchName,
      },
    });

    const agentId = agent.id;
    console.log(`🤖 Cursor agent created: ${agentId}`);

    // Create cursor generation exchange record
    exchangeId = randomUUID();
    await supabase.from('cursor_generation_exchanges').insert({
      id: exchangeId,
      request_id: requestId,
      agent_id: agentId,
      repository,
      branch_ref: 'main',
      status: 'running',
      model_used: 'claude-sonnet-4',
    });

    console.log('✅ generateModelFile: Exchange record created:', exchangeId);

    // Poll for agent completion
    const finalAgent = await pollAgentStatus(cursorClient, agentId);

    if (finalAgent.status === 'FAILED') {
      throw new Error(finalAgent.summary || 'Agent failed');
    }

    console.log(`✅ Model file generated successfully: ${entity.name}`);

    return {
      success: true,
      cursorExchangeId: exchangeId,
      agentId,
    };
  } catch (error) {
    console.error(`❌ Error generating model file:`, error);

    if (exchangeId) {
      await supabase
        .from('cursor_generation_exchanges')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', exchangeId);
    }

    throw error;
  }
};
