import type Anthropic from '@anthropic-ai/sdk';
import { recordDataModelProposalAiExchange } from '../../data/data-model-proposal-ai-exchanges';
import { updateDataModelProposal } from '../../data/data-model-proposals';
import type {
  DataModelProposal,
  DataModelProposalContent,
  ProposalWarning,
} from '../../model/data-model-proposal';
import type { DataModelProposalAiPurpose } from '../../model/data-model-proposal-ai-exchange';
import type { SoftwareSystem } from '../../model/software-system';
import { generateStructuredCompletion, getModelConfig, StructuredCompletionError } from '../ai';
import type { CanonicalDataClient } from '../canonical-data-client';
import { buildProposalSchema } from './build-proposal-schema';
import { buildSystemPrompt } from './build-system-prompt';
import { buildUserMessage } from './build-user-message';
import { DATA_MODEL_PROMPT_TYPE, MAX_AUTO_FIX_PASSES } from './config';
import { lintProposal } from './lint-proposal';
import type { LoadedDataModelConventions } from './load-data-model-conventions';
import { normalizeProposal } from './normalize-proposal';

export type RunProposalGenerationInput = {
  proposal: DataModelProposal;
  softwareSystem: SoftwareSystem;
  conventions: LoadedDataModelConventions;
  /** Content of the version being revised; null for a fresh generation. */
  previousProposal: DataModelProposalContent | null;
};

type Attempt = { content: DataModelProposalContent; warnings: ProposalWarning[]; servedByModel: string };

/** Proposal ids generating in this process (used to tell live runs from interrupted ones). */
export const activeProposalRuns = new Set<string>();

const errorCount = (warnings: ProposalWarning[]): number =>
  warnings.filter((warning) => warning.severity === 'error').length;

const recordExchangeSafely = async (
  client: CanonicalDataClient,
  input: Parameters<typeof recordDataModelProposalAiExchange>[1],
): Promise<void> => {
  try {
    await recordDataModelProposalAiExchange(client, input);
  } catch (error) {
    console.error('❌ [data-model-proposals] Failed to record AI exchange', {
      proposal_id: input.proposal_id,
      error: error instanceof Error ? error.message : error,
    });
  }
};

/**
 * Calls the AI for a proposal, normalizes and lints the answer, and runs one auto-fix pass
 * when MUST/NEVER rules are broken. Every call is written to the AI ledger. Keeps the attempt
 * with the fewest errors and stores it on the proposal (status ready), or marks it failed.
 */
const runProposalGeneration = async (
  client: CanonicalDataClient,
  anthropic: Anthropic,
  input: RunProposalGenerationInput,
): Promise<void> => {
  const { proposal, softwareSystem, conventions } = input;
  const modelConfig = getModelConfig(DATA_MODEL_PROMPT_TYPE);
  const schema = buildProposalSchema(conventions.vocabulary);
  const systemPrompt = buildSystemPrompt(conventions.context.text);

  let previous = input.previousProposal;
  let violations: ProposalWarning[] = [];
  let purpose: DataModelProposalAiPurpose = input.previousProposal ? 'revise' : 'generate';
  let best: Attempt | null = null;
  let inputTokens = 0;
  let outputTokens = 0;
  let lastError: unknown = null;

  for (let pass = 0; pass <= MAX_AUTO_FIX_PASSES; pass += 1) {
    const userMessage = buildUserMessage({
      softwareSystem,
      contextText: proposal.context_text,
      previousProposal: previous,
      feedback: pass === 0 ? proposal.feedback : '',
      violations,
    });
    const startedAt = Date.now();
    console.log('🤖 [data-model-proposals] AI call', { proposal_id: proposal.id, purpose, model: modelConfig.model });

    try {
      const result = await generateStructuredCompletion<Partial<DataModelProposalContent>>(anthropic, {
        systemPrompt,
        userMessage,
        model: modelConfig.model,
        maxTokens: modelConfig.maxTokens,
        effort: modelConfig.effort,
        schema,
      });
      inputTokens += result.usage.input_tokens;
      outputTokens += result.usage.output_tokens;

      const content = normalizeProposal(result.json, conventions.vocabulary);
      const warnings = lintProposal(content, conventions.rules, conventions.vocabulary);
      await recordExchangeSafely(client, {
        proposal_id: proposal.id,
        purpose,
        model: modelConfig.model,
        system_prompt: systemPrompt,
        user_message: userMessage,
        output_schema: schema,
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

      if (!best || errorCount(warnings) < errorCount(best.warnings)) {
        best = { content, warnings, servedByModel: result.servedByModel };
      }
      const errors = warnings.filter((warning) => warning.severity === 'error');
      console.log('✅ [data-model-proposals] AI answer', {
        proposal_id: proposal.id,
        tables: content.tables.length,
        errors: errors.length,
        warnings: warnings.length - errors.length,
      });
      if (errors.length === 0) break;
      previous = content;
      violations = errors;
      purpose = 'auto_fix';
    } catch (error) {
      lastError = error;
      const completionError = error instanceof StructuredCompletionError ? error : null;
      if (completionError?.usage) {
        inputTokens += completionError.usage.input_tokens;
        outputTokens += completionError.usage.output_tokens;
      }
      await recordExchangeSafely(client, {
        proposal_id: proposal.id,
        purpose,
        model: modelConfig.model,
        system_prompt: systemPrompt,
        user_message: userMessage,
        output_schema: schema,
        status: 'error',
        raw_text: completionError?.rawText ?? '',
        parsed: null,
        stop_reason: completionError?.stopReason ?? null,
        served_by_model: completionError?.servedByModel ?? '',
        input_tokens: completionError?.usage?.input_tokens ?? 0,
        output_tokens: completionError?.usage?.output_tokens ?? 0,
        duration_ms: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error('❌ [data-model-proposals] AI call failed', {
        proposal_id: proposal.id,
        purpose,
        error: error instanceof Error ? error.message : error,
      });
      break;
    }
  }

  if (!best) {
    await updateDataModelProposal(client, proposal.id, {
      status: 'failed',
      error: lastError instanceof Error ? lastError.message : 'AI generation failed',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    });
    return;
  }

  await updateDataModelProposal(client, proposal.id, {
    status: 'ready',
    proposal: best.content,
    warnings: best.warnings,
    model: best.servedByModel,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    error: null,
  });
};

/**
 * Starts generation in the background (the HTTP request returns 202 right away).
 * Any unexpected failure marks the proposal failed so it never stays `running`.
 */
export const startProposalGeneration = (
  client: CanonicalDataClient,
  anthropic: Anthropic,
  input: RunProposalGenerationInput,
): void => {
  activeProposalRuns.add(input.proposal.id);
  void runProposalGeneration(client, anthropic, input)
    .catch(async (error) => {
      console.error('❌ [data-model-proposals] Generation crashed', {
        proposal_id: input.proposal.id,
        error: error instanceof Error ? error.message : error,
      });
      try {
        await updateDataModelProposal(client, input.proposal.id, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Generation failed',
        });
      } catch (updateError) {
        console.error('❌ [data-model-proposals] Could not mark proposal failed', updateError);
      }
    })
    .finally(() => {
      activeProposalRuns.delete(input.proposal.id);
    });
};
