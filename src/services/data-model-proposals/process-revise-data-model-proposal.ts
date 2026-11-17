import { createDataModelProposal, getDataModelProposalById } from '../../data/data-model-proposals';
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
 * Creates the next version from an existing proposal plus the user's feedback (same context
 * text, current conventions) and starts AI generation in the background.
 */
export const processReviseDataModelProposal = async (
  client: CanonicalDataClient,
  input: { proposalId: string; feedback: string },
): Promise<DataModelProposal> => {
  const anthropic = getManagedAnthropicClient();
  if (!anthropic) {
    throw new ProposalRequestError(503, 'ANTHROPIC_API_KEY is not set on the Express server');
  }

  const parent = await getDataModelProposalById(client, input.proposalId);
  if (!parent) {
    throw new ProposalRequestError(404, 'Proposal not found');
  }
  if (parent.status === 'running') {
    throw new ProposalRequestError(409, 'This proposal is still generating');
  }
  if (!parent.proposal) {
    throw new ProposalRequestError(409, 'This version has no tables to revise; generate a new one instead');
  }

  const softwareSystem = await getSoftwareSystemById(client, parent.software_system_id);
  if (!softwareSystem) {
    throw new ProposalRequestError(404, 'Software system not found');
  }

  const conventions = await loadDataModelConventions(client);
  const proposal = await createDataModelProposal(client, {
    software_system_id: parent.software_system_id,
    parent_proposal_id: parent.id,
    context_text: parent.context_text,
    feedback: input.feedback,
    conventions_hash: conventions.context.hash,
    conventions_snapshot: conventions.context.snapshot as unknown as Record<string, unknown>,
    model: getModelConfig(DATA_MODEL_PROMPT_TYPE).model,
  });

  startProposalGeneration(client, anthropic, {
    proposal,
    softwareSystem,
    conventions,
    previousProposal: parent.proposal,
  });
  return withoutSnapshot(proposal);
};
