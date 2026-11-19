import type { DataModelDeliveryKind } from '../../model/data-model-delivery';
import { checkRenderedFiles, renderCrudFiles, renderDataModelFiles, type CodegenRole, type RenderedFile, type RenderFinding } from '../codegen';
import type { DeliveryInputs } from './load-delivery-inputs';
import { readCrudRenderState, readModelRenderState, type RepoHead } from './read-repo-render-state';

/**
 * Renders one delivery kind for one role against the repo's default branch and runs the
 * convention checks: model = migrations + src/model; crud = data-access layer.
 */
export const renderDeliveryFiles = async (input: {
  kind: DataModelDeliveryKind;
  role: CodegenRole;
  inputs: DeliveryInputs;
  head: RepoHead;
}): Promise<{ files: RenderedFile[]; findings: RenderFinding[] }> => {
  const { kind, role, inputs, head } = input;
  if (kind === 'model') {
    const state = await readModelRenderState(head, role);
    const files = renderDataModelFiles({ role, content: inputs.content, vocabulary: inputs.vocabulary, version: inputs.proposal.version, state });
    return { files, findings: checkRenderedFiles(files, inputs.checks) };
  }
  const state = await readCrudRenderState(head, role);
  const rendered = renderCrudFiles({ role, content: inputs.content, vocabulary: inputs.vocabulary, state });
  return { files: rendered.files, findings: [...rendered.findings, ...checkRenderedFiles(rendered.files, inputs.checks)] };
};
