import type Anthropic from '@anthropic-ai/sdk';
import { recordAiExchange } from '../../data/ai-exchanges';
import { getAgentRunById, updateAgentRun } from '../../data/agent-runs';
import { generateStructuredCompletion, getManagedAnthropicClient, getModelConfig, StructuredCompletionError } from '../ai';
import type { CanonicalDataClient } from '../canonical-data-client';
import { AgentRequestError } from './agent-request-error';

/** Anthropic client or a clear error when AI is not configured. */
export const requireAnthropic = (): Anthropic => {
  const anthropic = getManagedAnthropicClient();
  if (!anthropic) throw new AgentRequestError(503, 'ANTHROPIC_API_KEY is not set on the Express server');
  return anthropic;
};

/**
 * One structured AI call for an agent run: records the request and response in ai_exchanges
 * (also on failure) and adds the tokens and duration to the run. Throws on failure.
 */
export const callAgentAi = async <T>(
  client: CanonicalDataClient,
  input: {
    runId: string;
    purpose: string;
    configKey: string;
    systemPrompt: string;
    userMessage: string;
    schema: Record<string, unknown>;
  },
): Promise<T> => {
  const anthropic = requireAnthropic();
  const config = getModelConfig(input.configKey);
  const started = Date.now();
  let usage = { input_tokens: 0, output_tokens: 0 };

  const record = async (fields: {
    status: 'ok' | 'error';
    raw_text: string;
    parsed: unknown;
    stop_reason: string | null;
    served_by_model: string;
    error: string | null;
  }): Promise<void> => {
    const duration = Date.now() - started;
    try {
      await recordAiExchange(client, {
        run_id: input.runId,
        purpose: input.purpose,
        model: config.model,
        system_prompt: input.systemPrompt,
        user_message: input.userMessage,
        output_schema: input.schema,
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        duration_ms: duration,
        ...fields,
      });
      const run = await getAgentRunById(client, input.runId);
      if (run) {
        await updateAgentRun(client, input.runId, {
          model: fields.served_by_model || config.model,
          input_tokens: run.input_tokens + usage.input_tokens,
          output_tokens: run.output_tokens + usage.output_tokens,
          duration_ms: run.duration_ms + duration,
        });
      }
    } catch (error) {
      console.warn('⚠️ [agent-runs] Could not record AI exchange', { runId: input.runId, error: error instanceof Error ? error.message : error });
    }
  };

  console.log('🤖 [agent-runs] AI call', { runId: input.runId, purpose: input.purpose, model: config.model });
  try {
    const result = await generateStructuredCompletion<T>(anthropic, {
      systemPrompt: input.systemPrompt,
      userMessage: input.userMessage,
      model: config.model,
      maxTokens: config.maxTokens,
      effort: config.effort,
      schema: input.schema,
    });
    usage = result.usage;
    await record({
      status: 'ok',
      raw_text: result.rawText,
      parsed: result.json,
      stop_reason: result.stopReason,
      served_by_model: result.servedByModel,
      error: null,
    });
    return result.json;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof StructuredCompletionError) {
      usage = error.usage ?? usage;
      await record({ status: 'error', raw_text: error.rawText, parsed: null, stop_reason: error.stopReason, served_by_model: error.servedByModel, error: message });
    } else {
      await record({ status: 'error', raw_text: '', parsed: null, stop_reason: null, served_by_model: '', error: message });
    }
    throw error;
  }
};
