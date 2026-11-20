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

/** Waits before each retry of a stream that dropped mid-response (2 retries, 3 attempts total). */
const STREAM_RETRY_DELAYS_MS = [2_000, 5_000];

/** Socket-level error codes (Node / undici) that mean the connection closed under the stream. */
const DROPPED_CONNECTION_CODES = new Set([
  'ECONNRESET',
  'EPIPE',
  'UND_ERR_SOCKET',
  'UND_ERR_CLOSED',
  'UND_ERR_BODY_TIMEOUT',
]);

/** The error and its `cause` chain (at most 5 deep). */
const errorChain = (error: unknown): unknown[] => {
  const chain: unknown[] = [];
  let current: unknown = error;
  while (current && chain.length < 5) {
    chain.push(current);
    current = (current as { cause?: unknown }).cause;
  }
  return chain;
};

/**
 * True when the connection closed while the response was streaming (undici "terminated", socket
 * resets). The SDK's own retries only cover starting a request, not a stream that dies midway.
 * Timeouts and user aborts are not retried.
 */
const isDroppedConnection = (error: unknown): boolean => {
  if (error instanceof Anthropic.APIUserAbortError || error instanceof Anthropic.APIConnectionTimeoutError) {
    return false;
  }
  if (error instanceof Anthropic.APIConnectionError) return true;
  return errorChain(error).some(
    (item) =>
      item instanceof Error &&
      (item.message === 'terminated' || DROPPED_CONNECTION_CODES.has((item as { code?: string }).code ?? '')),
  );
};

/** "terminated: other side closed (UND_ERR_SOCKET)" — every distinct message in the cause chain. */
const describeErrorChain = (error: unknown): string => {
  const parts = errorChain(error).map((item) => {
    if (!(item instanceof Error)) return String(item);
    const code = (item as { code?: string }).code;
    return code ? `${item.message} (${code})` : item.message;
  });
  return [...new Set(parts)].join(': ');
};

/**
 * Generates a JSON completion constrained by a JSON Schema (`output_config.format`).
 * Streams the response (long outputs) and returns the final message. Adaptive thinking
 * is always on for Opus 5.5; `effort` sets the depth. `fallbacks: "default"` lets the API
 * re-run a policy-declined request on Anthropic's recommended fallback model.
 * Retries twice when the connection drops mid-stream (undici "terminated"), then throws with the cause.
 * Throws `StructuredCompletionError` on `max_tokens`, `refusal`, or invalid JSON.
 * Callers must still validate and normalize the result.
 */
export const generateStructuredCompletion = async <T>(
  client: Anthropic,
  options: StructuredCompletionOptions,
): Promise<StructuredCompletionResult<T>> => {
  const { systemPrompt, userMessage, model, maxTokens, effort, schema } = options;

  const streamFinalMessage = () =>
    client.beta.messages
      .stream({
        model,
        max_tokens: maxTokens,
        betas: [SERVER_SIDE_FALLBACK_BETA],
        fallbacks: 'default',
        thinking: { type: 'adaptive' },
        output_config: { effort, format: { type: 'json_schema', schema } },
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      })
      .finalMessage();

  let message: Awaited<ReturnType<typeof streamFinalMessage>>;
  for (let attempt = 1; ; attempt += 1) {
    try {
      message = await streamFinalMessage();
      break;
    } catch (error) {
      if (!isDroppedConnection(error)) throw error;
      const reason = describeErrorChain(error);
      const delay = STREAM_RETRY_DELAYS_MS[attempt - 1];
      if (delay === undefined) {
        throw Object.assign(
          new Error(`Connection to Anthropic dropped mid-response after ${attempt} attempts: ${reason}`),
          { cause: error },
        );
      }
      console.warn('⚠️ [ai] Stream dropped; retrying', { attempt, model, reason, retryInMs: delay });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

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
