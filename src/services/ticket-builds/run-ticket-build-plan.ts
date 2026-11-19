import type Anthropic from '@anthropic-ai/sdk';
import { recordTicketBuildAiExchange } from '../../data/ticket-build-ai-exchanges';
import { listTicketBuildReposByBuildId, updateTicketBuildRepo } from '../../data/ticket-build-repos';
import { updateTicketBuild } from '../../data/ticket-builds';
import type { TicketBuild } from '../../model/ticket-build';
import type { TicketBuildAiPurpose } from '../../model/ticket-build-ai-exchange';
import type { TicketBuildRepo } from '../../model/ticket-build-repo';
import { generateStructuredCompletion, getModelConfig, StructuredCompletionError } from '../ai';
import type { CanonicalDataClient } from '../canonical-data-client';
import { buildTicketBuildPlanSystemPrompt } from './build-plan-system-prompt';
import { buildTicketBuildPlanUserMessage } from './build-plan-user-message';
import { TICKET_BUILD_PROMPT_TYPE } from './config';
import { loadTicketBuildContext } from './load-ticket-build-context';
import { normalizeTicketBuildPlan } from './normalize-plan';
import { TICKET_BUILD_PLAN_SCHEMA } from './plan-schema';

/** Build ids planning in this process (tells live runs from interrupted ones). */
export const activeTicketBuildPlans = new Set<string>();

type RunInput = {
  build: TicketBuild;
  purpose: TicketBuildAiPurpose;
  /** Revise only: feedback plus the current (edited) repo plans. */
  revise: { feedback: string; repos: TicketBuildRepo[] } | null;
};

const recordSafely = async (
  client: CanonicalDataClient,
  input: Parameters<typeof recordTicketBuildAiExchange>[1],
): Promise<void> => {
  try {
    await recordTicketBuildAiExchange(client, input);
  } catch (error) {
    console.error('❌ [ticket-builds] Failed to record AI exchange', { build: input.ticket_build_id, error });
  }
};

/**
 * Plans a ticket build: loads repo context, asks Claude for the shared contract and per-repo plans,
 * normalizes the answer, stores it (status plan_ready) and records the call in the AI ledger.
 */
const runTicketBuildPlan = async (client: CanonicalDataClient, anthropic: Anthropic, input: RunInput): Promise<void> => {
  const { build } = input;
  const repos = await listTicketBuildReposByBuildId(client, build.id);
  const context = await loadTicketBuildContext(client, build, repos);
  const config = getModelConfig(TICKET_BUILD_PROMPT_TYPE);
  const systemPrompt = buildTicketBuildPlanSystemPrompt();
  const userMessage = buildTicketBuildPlanUserMessage(context, input.revise);
  const startedAt = Date.now();
  const ledger = {
    ticket_build_id: build.id,
    purpose: input.purpose,
    model: config.model,
    system_prompt: systemPrompt,
    user_message: userMessage,
    output_schema: TICKET_BUILD_PLAN_SCHEMA,
  };

  console.log('🤖 [ticket-builds] Planning', { build: build.id, repos: context.repos.length, chars: userMessage.length });
  try {
    const result = await generateStructuredCompletion<unknown>(anthropic, {
      systemPrompt,
      userMessage,
      model: config.model,
      maxTokens: config.maxTokens,
      effort: config.effort,
      schema: TICKET_BUILD_PLAN_SCHEMA,
    });
    const plan = normalizeTicketBuildPlan(result.json, repos);
    await recordSafely(client, {
      ...ledger,
      status: 'ok',
      raw_text: result.rawText,
      parsed: result.json,
      stop_reason: result.stopReason,
      served_by_model: result.servedByModel,
      input_tokens: result.usage.input_tokens,
      output_tokens: result.usage.output_tokens,
      duration_ms: Date.now() - startedAt,
      error: null,
    });
    for (const repo of plan.repos) {
      await updateTicketBuildRepo(client, repo.id, {
        included: repo.included,
        plan_text: repo.planText,
        status: repo.included ? 'pending' : 'skipped',
      });
    }
    await updateTicketBuild(client, build.id, {
      status: 'plan_ready',
      summary: plan.summary,
      contract_text: plan.contract,
      missing_roles_note: plan.missingRolesNote,
      research_used: context.research !== null,
      model: result.servedByModel,
      input_tokens: build.input_tokens + result.usage.input_tokens,
      output_tokens: build.output_tokens + result.usage.output_tokens,
      error: null,
    });
    console.log('✅ [ticket-builds] Plan ready', { build: build.id, fixes: plan.notes });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Planning failed';
    const failure = error instanceof StructuredCompletionError ? error : null;
    await recordSafely(client, {
      ...ledger,
      status: 'error',
      raw_text: failure?.rawText ?? '',
      parsed: null,
      stop_reason: failure?.stopReason ?? null,
      served_by_model: failure?.servedByModel ?? config.model,
      input_tokens: failure?.usage?.input_tokens ?? 0,
      output_tokens: failure?.usage?.output_tokens ?? 0,
      duration_ms: Date.now() - startedAt,
      error: message,
    });
    throw error;
  }
};

/**
 * Starts planning in the background; failures mark the build plan_failed.
 */
export const startTicketBuildPlan = (client: CanonicalDataClient, anthropic: Anthropic, input: RunInput): void => {
  activeTicketBuildPlans.add(input.build.id);
  void runTicketBuildPlan(client, anthropic, input)
    .catch(async (error) => {
      console.error('❌ [ticket-builds] Planning failed', { build: input.build.id, error: error instanceof Error ? error.message : error });
      try {
        await updateTicketBuild(client, input.build.id, {
          status: 'plan_failed',
          error: error instanceof Error ? error.message : 'Planning failed',
        });
      } catch (updateError) {
        console.error('❌ [ticket-builds] Could not mark build plan_failed', updateError);
      }
    })
    .finally(() => activeTicketBuildPlans.delete(input.build.id));
};
