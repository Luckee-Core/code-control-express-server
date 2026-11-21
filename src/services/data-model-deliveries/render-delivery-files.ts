import type { DataModelDeliveryKind } from '../../model/data-model-delivery';
import type { CanonicalDataClient } from '../canonical-data-client';
import { renderForRepo, type CodegenRole, type RenderForRepoResult, type TemplatePin } from '../codegen';
import type { DeliveryInputs } from './load-delivery-inputs';
import type { RepoHead } from './read-repo-render-state';

/**
 * Renders one delivery kind for one role against the repo's default branch with the role's
 * template repo (codegen/ at its default branch head, or a pinned commit) and runs the
 * convention checks: model = migrations + src/model; crud = data-access layer; layout = web app
 * shell (sidebar, breadcrumbs, routes).
 */
export const renderDeliveryFiles = async (input: {
  client: CanonicalDataClient;
  kind: DataModelDeliveryKind;
  role: CodegenRole;
  inputs: DeliveryInputs;
  head: RepoHead;
  template?: TemplatePin;
}): Promise<RenderForRepoResult> =>
  renderForRepo({
    client: input.client,
    kind: input.kind,
    role: input.role,
    content: input.inputs.content,
    vocabulary: input.inputs.vocabulary,
    version: input.inputs.proposal.version,
    checks: input.inputs.checks,
    head: { ref: input.head.ref, base_sha: input.head.base_sha },
    template: input.template,
    app: input.inputs.app,
  });
