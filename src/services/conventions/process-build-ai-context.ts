import { listConventions } from '../../data/conventions';
import { listConventionExamples } from '../../data/convention-examples';
import type { CanonicalDataClient } from '../canonical-data-client';
import { AI_CONTEXT_FORMAT_VERSION } from './config';
import { formatAiContext } from './format-ai-context';
import { hashAiContext } from './hash-ai-context';
import { processGetConventionOptions } from './process-get-convention-options';
import { processGetConventionVocabulary } from './process-get-convention-vocabulary';
import type { AiContext, AiContextRequest } from './types';

const DATA_MODEL_DOMAIN = 'data_model';

/**
 * Builds AI context text + hash from the active conventions for one domain and repo role (nothing is saved).
 */
export const processBuildAiContext = async (
  client: CanonicalDataClient,
  request: AiContextRequest
): Promise<AiContext> => {
  const { domain_key, role_key } = request;
  const [options, conventions, examples, vocabulary] = await Promise.all([
    processGetConventionOptions(client),
    listConventions(client, { status: 'active', domain_key, role_key }),
    listConventionExamples(client),
    domain_key === DATA_MODEL_DOMAIN ? processGetConventionVocabulary(client) : Promise.resolve(null),
  ]);

  const domain = options.domains.find((d) => d.key === domain_key);
  if (!domain) throw new Error(`Unknown domain_key: ${domain_key}`);
  const role = options.repo_roles.find((r) => r.key === role_key);
  if (!role) throw new Error(`Unknown role_key: ${role_key}`);

  const ids = new Set(conventions.map((c) => c.id));
  const text = formatAiContext({
    domain,
    role,
    topics: options.topics,
    conventions,
    examples: examples.filter((e) => ids.has(e.convention_id)),
    vocabulary,
    formatVersion: AI_CONTEXT_FORMAT_VERSION,
  });

  console.log('🤖 Built AI context', { domain_key, role_key, count: conventions.length });
  return {
    domain_key,
    role_key,
    text,
    hash: hashAiContext(text),
    convention_keys: conventions.map((c) => c.key),
    convention_count: conventions.length,
    format_version: AI_CONTEXT_FORMAT_VERSION,
  };
};
