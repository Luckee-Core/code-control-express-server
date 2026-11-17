import { createDataModelProposal } from '../../data/data-model-proposals';
import { getSoftwareSystemById } from '../../data/software-systems';
import type { DataModelProposal } from '../../model/data-model-proposal';
import { getManagedAnthropicClient, getModelConfig } from '../ai';
import type { CanonicalDataClient } from '../canonical-data-client';
import { DATA_MODEL_PROMPT_TYPE } from './config';
import { loadDataModelConventions } from './load-data-model-conventions';
import { ProposalRequestError } from './proposal-request-error';
import { startProposalGeneration } from './run-proposal-generation';
import { withoutSnapshot } from './settle-stale-proposal';

/**
 * Creates a new proposal version from the user's context text and starts AI generation
 * in the background. Returns the `running` proposal immediately.
 */
export const processCreateDataModelProposal = async (
  client: CanonicalDataClient,
  input: { softwareSystemId: string; contextText: string },
): Promise<DataModelProposal> => {
  const anthropic = getManagedAnthropicClient();
  if (!anthropic) {
    throw new ProposalRequestError(503, 'ANTHROPIC_API_KEY is not set on the Express server');
  }

  const softwareSystem = await getSoftwareSystemById(client, input.softwareSystemId);
  if (!softwareSystem) {
    throw new ProposalRequestError(404, 'Software system not found');
  }

  const conventions = await loadDataModelConventions(client);
  if (conventions.context.convention_count === 0) {
    throw new ProposalRequestError(400, 'No active data-model conventions; seed or activate them first');
  }

  const proposal = await createDataModelProposal(client, {
    software_system_id: softwareSystem.id,
    context_text: input.contextText,
    conventions_hash: conventions.context.hash,
    conventions_snapshot: conventions.context.snapshot as unknown as Record<string, unknown>,
    model: getModelConfig(DATA_MODEL_PROMPT_TYPE).model,
  });

  startProposalGeneration(client, anthropic, {
    proposal,
    softwareSystem,
    conventions,
    previousProposal: null,
  });
  return withoutSnapshot(proposal);
};
