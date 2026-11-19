import { getSoftwareSystemReposBySoftwareSystemId } from '../../data/software-system-repos';
import type { CanonicalDataClient } from '../canonical-data-client';
import { checkRenderedFiles, renderDataModelFiles, type CodegenRole } from '../codegen';
import { ProposalRequestError } from '../data-model-proposals/proposal-request-error';
import { loadDeliveryInputs } from './load-delivery-inputs';
import { readRepoRenderState } from './read-repo-render-state';
import { resolveRoleRepo } from './resolve-role-repos';
import type { DeliveryPreview } from './types';

/**
 * Renders the files a delivery would write to one role's repo, against its current default
 * branch, plus convention findings. Writes nothing.
 */
export const processPreviewDataModelDelivery = async (
  client: CanonicalDataClient,
  input: { proposalId: string; role: CodegenRole },
): Promise<DeliveryPreview> => {
  const inputs = await loadDeliveryInputs(client, input.proposalId);
  const repos = await getSoftwareSystemReposBySoftwareSystemId(client, inputs.proposal.software_system_id);
  const repo = resolveRoleRepo(repos, input.role);
  if (!repo) {
    throw new ProposalRequestError(409, `This project has no ${input.role} repo yet`);
  }
  const snapshot = await readRepoRenderState(repo, input.role);
  const files = renderDataModelFiles({
    role: input.role,
    content: inputs.content,
    vocabulary: inputs.vocabulary,
    version: inputs.proposal.version,
    state: snapshot.state,
  });
  return {
    role: input.role,
    repo_full_name: snapshot.full_name,
    base_branch: snapshot.base_branch,
    files,
    findings: checkRenderedFiles(files, inputs.checks),
  };
};
