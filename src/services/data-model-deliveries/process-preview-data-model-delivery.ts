import { getSoftwareSystemReposBySoftwareSystemId } from '../../data/software-system-repos';
import type { DataModelDeliveryKind } from '../../model/data-model-delivery';
import type { CanonicalDataClient } from '../canonical-data-client';
import type { CodegenRole } from '../codegen';
import { ProposalRequestError } from '../data-model-proposals/proposal-request-error';
import { loadDeliveryInputs } from './load-delivery-inputs';
import { readRepoHead } from './read-repo-render-state';
import { renderDeliveryFiles } from './render-delivery-files';
import { resolveRoleRepo } from './resolve-role-repos';
import type { DeliveryPreview } from './types';

/**
 * Renders the files a delivery of `kind` would write to one role's repo, against its current
 * default branch, plus convention findings. Writes nothing.
 */
export const processPreviewDataModelDelivery = async (
  client: CanonicalDataClient,
  input: { proposalId: string; role: CodegenRole; kind: DataModelDeliveryKind },
): Promise<DeliveryPreview> => {
  const inputs = await loadDeliveryInputs(client, input.proposalId);
  const repos = await getSoftwareSystemReposBySoftwareSystemId(client, inputs.proposal.software_system_id);
  const repo = resolveRoleRepo(repos, input.role);
  if (!repo) {
    throw new ProposalRequestError(409, `This project has no ${input.role} repo yet`);
  }
  const head = await readRepoHead(repo);
  const { files, findings } = await renderDeliveryFiles({ kind: input.kind, role: input.role, inputs, head });
  return { role: input.role, repo_full_name: head.full_name, base_branch: head.base_branch, files, findings };
};
