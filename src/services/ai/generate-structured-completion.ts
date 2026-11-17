import Anthropic from '@anthropic-ai/sdk';

export type StructuredCompletionOptions = {
  systemPrompt: string;
  userMessage: string;
  model: string;
  maxTokens: number;
  effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
  /** JSON Schema the response must satisfy (`additionalProperties: false` on objects). */
  schema: Record<string, unknown>;
};

export type StructuredCompletionUsage = { input_tokens: number; output_tokens: number };

export type StructuredCompletionResult<T> = {
  json: T;
  rawText: string;
  usage: StructuredCompletionUsage;
  stopReason: string | null;
  /** Model that produced the answer (differs from the requested one when a fallback ran). */
  servedByModel: string;
};

/** Thrown when the model stops early, refuses, or returns unparseable JSON. */
export class StructuredCompletionError extends Error {
  readonly stopReason: string | null;
  readonly rawText: string;
  readonly usage: StructuredCompletionUsage | null;
  readonly servedByModel: string;

  constructor(
    message: string,
    stopReason: string | null,
    rawText: string,
    usage: StructuredCompletionUsage | null,
    servedByModel: string,
  ) {
    super(message);
    this.name = 'StructuredCompletionError';
    this.stopReason = stopReason;
    this.rawText = rawText;
    this.usage = usage;
    this.servedByModel = servedByModel;
  }
}

const SERVER_SIDE_FALLBACK_BETA = 'server-side-fallback-2026-07-01';

/**
 * Generates a JSON completion constrained by a JSON Schema (`output_config.format`).
 * Streams the response (long outputs) and returns the final message. Adaptive thinking
 * is always on for Opus 5.5; `effort` sets the depth. `fallbacks: "default"` lets the API
 * re-run a policy-declined request on Anthropic's recommended fallback model.
 * Throws `StructuredCompletionError` on `max_tokens`, `refusal`, or invalid JSON.
 * Callers must still validate and normalize the result.
 */
export const generateStructuredCompletion = async <T>(
  client: Anthropic,
  options: StructuredCompletionOptions,
): Promise<StructuredCompletionResult<T>> => {
  const { systemPrompt, userMessage, model, maxTokens, effort, schema } = options;

  const stream = client.beta.messages.stream({
    model,
    max_tokens: maxTokens,
    betas: [SERVER_SIDE_FALLBACK_BETA],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: { effort, format: { type: 'json_schema', schema } },
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });
  const message = await stream.finalMessage();

  const usage = {
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
  };
  const stopReason = message.stop_reason ?? null;
  const servedByModel = message.model;
  const rawText = message.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  if (stopReason === 'refusal') {
    throw new StructuredCompletionError('AI declined the request', stopReason, rawText, usage, servedByModel);
  }
  if (stopReason === 'max_tokens') {
    throw new StructuredCompletionError('AI output hit max_tokens', stopReason, rawText, usage, servedByModel);
  }

  try {
    return { json: JSON.parse(rawText) as T, rawText, usage, stopReason, servedByModel };
  } catch {
    throw new StructuredCompletionError('AI returned invalid JSON', stopReason, rawText, usage, servedByModel);
  }
};
