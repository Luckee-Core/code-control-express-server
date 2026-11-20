/**
 * AI model configuration per prompt type.
 *
 * Claude Opus 5.5 always uses adaptive thinking; depth is controlled with `effort`.
 * Sampling parameters are intentionally absent; output shape is constrained by structured outputs.
 */
export type ModelConfig = {
  model: string;
  maxTokens: number;
  effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
};

export const DEFAULT_CLAUDE_MODEL = 'claude-opus-5-5';

const CONFIGS: Record<string, ModelConfig> = {
  data_model_proposal: {
    model: DEFAULT_CLAUDE_MODEL,
    maxTokens: 64000,
    effort: 'high',
  },
  /** Ticket build plan: shared contract + per-repo plans (ticket builds ADR). */
  ticket_build_plan: {
    model: DEFAULT_CLAUDE_MODEL,
    maxTokens: 32000,
    effort: 'high',
  },
  /** PR agent: edits to one project PR from feedback. */
  pr_agent: {
    model: DEFAULT_CLAUDE_MODEL,
    maxTokens: 64000,
    effort: 'high',
  },
  /** Convention agent: proposed convention changes from an approved PR change. */
  convention_agent: {
    model: DEFAULT_CLAUDE_MODEL,
    maxTokens: 32000,
    effort: 'high',
  },
  /** Template agent, pass 1: which template repo files it needs to read. */
  template_agent_select: {
    model: DEFAULT_CLAUDE_MODEL,
    maxTokens: 8000,
    effort: 'medium',
  },
  /** Template agent, pass 2: edits to codegen templates, scaffold and ADRs. */
  template_agent: {
    model: DEFAULT_CLAUDE_MODEL,
    maxTokens: 64000,
    effort: 'high',
  },
};

/**
 * Get model config for a prompt type.
 */
export const getModelConfig = (messageType: string): ModelConfig => {
  const config = CONFIGS[messageType];
  if (!config) {
    throw new Error(`Unknown message type: ${messageType}`);
  }
  return config;
};
