import type { DataModelProposalContent } from '../../../model/data-model-proposal';
import type { CanonicalDataClient } from '../../canonical-data-client';
import { getDefaultBranchHead, getFileText, listTreePaths, type GithubRepoRef } from '../../github';
import { checkRenderedFiles, type FileCheckConvention } from '../check-rendered-files';
import type { CodegenRole, CodegenVocabulary, RenderFinding } from '../types';
import { buildCodegenContext } from './build-codegen-context';
import { loadTemplateSource } from './load-template-source';
import { CodegenTemplateError, renderMergePaths, renderWithTemplates, type EngineRenderedFile } from './render-with-templates';
import { resolveTemplateRepo } from './resolve-template-repo';
import type { CodegenKind, CodegenRepoState, TemplateSource } from './types';

/** The target repo at the commit generated code is rendered against. */
export type TargetRepoHead = { ref: GithubRepoRef; base_sha: string };

/** Which template commit to render with (default: the template repo's default branch head). */
export type TemplatePin = { ref: GithubRepoRef; sha: string };

export type RenderForRepoResult = {
  files: EngineRenderedFile[];
  findings: RenderFinding[];
  template: { repo: string; sha: string };
};

/** Resolves the template repo for a role and the commit to use. */
export const resolveTemplatePin = async (client: CanonicalDataClient, role: CodegenRole, pin?: TemplatePin): Promise<TemplatePin> => {
  if (pin) return pin;
  const ref = await resolveTemplateRepo(client, role);
  if (!ref) {
    throw new CodegenTemplateError(`No template repo for role "${role}": set the env var named by repo_roles.template_env_key`);
  }
  const head = await getDefaultBranchHead(ref);
  if (!head.ok) throw new CodegenTemplateError(`${ref.owner}/${ref.repo}: ${head.error}`);
  if (!head.head_sha) throw new CodegenTemplateError(`${ref.owner}/${ref.repo} has no commits`);
  return { ref, sha: head.head_sha };
};

/**
 * Reads what the manifest needs from the target repo: every path (writes vs updates, support
 * files only when missing, migration numbering) and the files it merges into.
 */
export const readCodegenRepoState = async (input: {
  source: TemplateSource;
  kind: CodegenKind;
  role: CodegenRole;
  content: DataModelProposalContent;
  vocabulary: CodegenVocabulary;
  version: number;
  head: TargetRepoHead | null;
}): Promise<CodegenRepoState> => {
  if (!input.head) return { paths: new Set(), files: {} };
  const paths = await listTreePaths(input.head.ref, input.head.base_sha);
  const probe = buildCodegenContext({ ...input, state: { paths: null, files: {} } });
  const unique = renderMergePaths(input.source, input.kind, probe);
  const contents = await Promise.all(
    unique.map((path) => (paths.has(path) ? getFileText(input.head!.ref, path, input.head!.base_sha) : Promise.resolve(null))),
  );
  return { paths, files: Object.fromEntries(unique.map((path, index) => [path, contents[index]])) };
};

/**
 * Renders one kind for one role with the role's template repo (or a pinned template commit),
 * against the target repo's current state, then runs the file/SQL convention checks.
 */
export const renderForRepo = async (input: {
  client: CanonicalDataClient;
  kind: CodegenKind;
  role: CodegenRole;
  content: DataModelProposalContent;
  vocabulary: CodegenVocabulary;
  version: number;
  checks: FileCheckConvention[];
  head: TargetRepoHead | null;
  template?: TemplatePin;
}): Promise<RenderForRepoResult> => {
  const pin = await resolveTemplatePin(input.client, input.role, input.template);
  const source = await loadTemplateSource(pin.ref, pin.sha);
  const state = await readCodegenRepoState({ ...input, source });
  const context = buildCodegenContext({ ...input, state });
  const rendered = renderWithTemplates({ source, kind: input.kind, role: input.role, context, state });
  return {
    files: rendered.files,
    findings: [...rendered.findings, ...checkRenderedFiles(rendered.files, input.checks)],
    template: { repo: `${pin.ref.owner}/${pin.ref.repo}`, sha: pin.sha },
  };
};
