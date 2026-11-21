import { getSoftwareSystemReposBySoftwareSystemId } from '../../data/software-system-repos';
import type { DataModelDeliveryKind } from '../../model/data-model-delivery';
import type { CanonicalDataClient } from '../canonical-data-client';
import type { CodegenRole } from '../codegen';
import { ProposalRequestError } from '../data-model-proposals/proposal-request-error';
import { loadDeliveryInputs } from './load-delivery-inputs';
import { screenshotPreview } from './publish-preview-image';
import { readRepoHead } from './read-repo-render-state';
import { renderDeliveryFiles } from './render-delivery-files';
import { resolveRoleRepo } from './resolve-role-repos';
import type { DeliveryScreenshot } from './types';

/**
 * Screenshot of what a delivery of `kind` would look like in one role's repo today: the
 * template's preview page rendered with the repo's current state. Writes nothing.
 */
export const processScreenshotDataModelDelivery = async (
  client: CanonicalDataClient,
  input: { proposalId: string; role: CodegenRole; kind: DataModelDeliveryKind },
): Promise<DeliveryScreenshot> => {
  const inputs = await loadDeliveryInputs(client, input.proposalId);
  const repos = await getSoftwareSystemReposBySoftwareSystemId(client, inputs.proposal.software_system_id);
  const repo = resolveRoleRepo(repos, input.role);
  if (!repo) {
    throw new ProposalRequestError(409, `This project has no ${input.role} repo yet`);
  }
  const head = await readRepoHead(repo);
  const { preview, template } = await renderDeliveryFiles({ client, kind: input.kind, role: input.role, inputs, head });
  if (!preview) {
    throw new ProposalRequestError(404, `${template.repo} declares no "${input.kind}" preview in codegen/manifest.json`);
  }
  const png = await screenshotPreview(preview);
  return {
    role: input.role,
    repo_full_name: head.full_name,
    base_branch: head.base_branch,
    template,
    width: preview.width,
    height: preview.height,
    png_base64: png ? png.toString('base64') : '',
  };
};
