import Anthropic from '@anthropic-ai/sdk';

let managedClient: Anthropic | null = null;
let initialized = false;

/**
 * Returns the managed Anthropic client, or null when ANTHROPIC_API_KEY is not set.
 * Created once on first use.
 */
export const getManagedAnthropicClient = (): Anthropic | null => {
  if (initialized) {
    return managedClient;
  }
  initialized = true;
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    console.warn('⚠️ [ai] ANTHROPIC_API_KEY is not set; AI features are disabled');
    managedClient = null;
    return null;
  }
  // Long structured generations stream; allow up to 10 minutes per call.
  managedClient = new Anthropic({ apiKey, timeout: 10 * 60 * 1000 });
  console.log('✅ [ai] Anthropic client initialized');
  return managedClient;
};
