import {
  listDataModelDeliveriesByProposalId,
  listDataModelDeliveriesBySoftwareSystemRepoId,
  updateDataModelDelivery,
  upsertDataModelDelivery,
} from '../../data/data-model-deliveries';
import { getSoftwareSystemReposBySoftwareSystemId } from '../../data/software-system-repos';
import type { DataModelDelivery, DataModelDeliveryKind } from '../../model/data-model-delivery';
import type { SoftwareSystemRepo } from '../../model/software-system-repo';
import { parseGithubRepoUrl } from '../../utils/parse-github-repo-url';
import type { CanonicalDataClient } from '../canonical-data-client';
import type { CodegenRole } from '../codegen';
import {
  commitFilesToBranch,
  createPullRequest,
  deleteBranch,
  findOpenPullRequest,
  listTreePaths,
  mergePullRequest,
  updatePullRequestBody,
} from '../github';
import { ProposalRequestError } from '../data-model-proposals/proposal-request-error';
import { buildPullRequestBody } from './build-pull-request-body';
import { publishPreviewImage } from './publish-preview-image';
import { deliveryBranchName, deliveryRolesForKind, isRedeliverableKind } from './config';
import { loadDeliveryInputs, type DeliveryInputs } from './load-delivery-inputs';
import { readRepoHead } from './read-repo-render-state';
import { renderDeliveryFiles } from './render-delivery-files';
import { resolveRoleRepo } from './resolve-role-repos';
import { syncDeliveryPullRequest } from './sync-delivery-pull-request';
import type { DeliveryTarget } from './types';

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** owner/repo from the repo URL (falls back to the repo name). */
const repoFullName = (repo: SoftwareSystemRepo): string => {
  const parsed = parseGithubRepoUrl(repo.repo_url);
  return parsed.success ? `${parsed.owner}/${parsed.repo}` : repo.name;
};

/**
 * Renders, commits and opens (or updates) the PR for one repo. Failures are stored on the
 * delivery row instead of thrown, so one repo never blocks the others.
 */
const deliverToRepo = async (
  client: CanonicalDataClient,
  inputs: DeliveryInputs,
  role: CodegenRole,
  repo: SoftwareSystemRepo,
  autoMerge: boolean,
  kind: DataModelDeliveryKind,
): Promise<DataModelDelivery> => {
  const { proposal, content } = inputs;
  const branch = deliveryBranchName(kind, proposal.version);
  const delivery = await upsertDataModelDelivery(client, {
    proposal_id: proposal.id,
    kind,
    software_system_id: proposal.software_system_id,
    software_system_repo_id: repo.id,
    role,
    repo_full_name: repoFullName(repo),
    branch,
  });

  if ((delivery.kind ?? 'model') !== kind) {
    // Storage before migration 105 ignores `kind` and would overwrite the model delivery row.
    throw new ProposalRequestError(
      409,
      'Studio storage is older than migration 105 (delivery kinds). Pull code-generator-storage-server on the studio, run `npm run db:apply-migrations -- 105` and restart storage, then try again.',
    );
  }

  const fail = async (error: string): Promise<DataModelDelivery> =>
    (await updateDataModelDelivery(client, delivery.id, { status: 'failed', error })) ?? delivery;

  try {
    const history = await listDataModelDeliveriesBySoftwareSystemRepoId(client, repo.id);
    if (kind === 'crud') {
      // CRUD files import the models, so this version's model PR must be merged in this repo first.
      const model = history.find((item) => item.proposal_id === proposal.id && (item.kind ?? 'model') === 'model');
      const synced = model ? await syncDeliveryPullRequest(client, model) : null;
      if (synced?.status !== 'merged') {
        return fail(`Merge the data model PR for ${repo.name} first (Data model tab). The API files import those models.`);
      }
    }
    if (kind === 'list') {
      // List pages call the API thunks and dumps, and add sidebar links: the API and layout PRs come first.
      const required: Array<{ kind: DataModelDeliveryKind; tab: string; why: string }> = [
        { kind: 'crud', tab: 'API', why: 'The pages load rows with its fetch thunks and dumps.' },
        { kind: 'layout', tab: 'Layout', why: 'The pages live in its (app) route group and add links to its sidebar.' },
      ];
      for (const need of required) {
        const prior = history.find((item) => item.proposal_id === proposal.id && (item.kind ?? 'model') === need.kind);
        const synced = prior ? await syncDeliveryPullRequest(client, prior) : null;
        if (synced?.status !== 'merged') {
          return fail(`Merge the ${need.tab} PR for ${repo.name} first (${need.tab} tab). ${need.why}`);
        }
      }
    }
    const merged =
      kind === 'model'
        ? history.find((item) => item.status === 'merged' && item.proposal_id !== proposal.id && (item.kind ?? 'model') === 'model')
        : undefined;
    if (merged) {
      return fail(
        `${repo.name} already merged an earlier data-model version (${merged.branch}). Changing a merged schema needs ALTER migrations, which Code Control does not generate yet.`,
      );
    }

    const snapshot = await readRepoHead(repo);
    if (kind === 'crud') {
      // CRUD files import the models: every table's model file must already be on the default branch.
      const paths = await listTreePaths(snapshot.ref, snapshot.base_sha);
      const missing = content.tables.filter((table) => !paths.has(`src/model/${table.entity}/index.ts`));
      if (missing.length > 0) {
        return fail(
          `${repo.name} ${snapshot.base_branch} is missing ${missing.length} model file(s) (e.g. src/model/${missing[0].entity}/index.ts). Merge the data model PR first (Data model tab).`,
        );
      }
    }
    const { files, findings, template, preview } = await renderDeliveryFiles({ client, kind, role, inputs, head: snapshot });
    const errors = findings.filter((finding) => finding.severity === 'error');
    if (errors.length > 0) {
      return fail(`Rendered files break ${errors.length} MUST/NEVER rules: ${errors.map((finding) => `${finding.path} (${finding.convention_key})`).join('; ')}`);
    }

    const title =
      kind === 'model'
        ? `Data model v${proposal.version}: ${content.tables.length} tables`
        : kind === 'crud'
          ? `Data access v${proposal.version}: CRUD for ${content.tables.length} tables`
          : kind === 'list'
            ? `List pages v${proposal.version}: tables, search and filters`
            : `App layout v${proposal.version}: sidebar, breadcrumbs and routes`;
    console.log('🚀 [data-model-deliveries] Committing', { repo: snapshot.full_name, branch, files: files.length });
    const commitSha = await commitFilesToBranch({
      ref: snapshot.ref,
      baseSha: snapshot.base_sha,
      branch,
      message: `${title}\n\nGenerated by Code Control from approved data model v${proposal.version}.`,
      files: files.map((file) => ({ path: file.path, content: file.content })),
    });

    // Screenshot of the template's preview page (layout), linked from the PR body.
    const previewImageUrl = await publishPreviewImage({
      ref: snapshot.ref,
      preview,
      role,
      name: `${kind}-v${proposal.version}`,
      commitSha,
    });
    const body = buildPullRequestBody({ kind, proposal, content, role, files, previewImageUrl });
    const existing = await findOpenPullRequest(snapshot.ref, branch);
    if (existing && previewImageUrl) {
      // Re-render: refresh the body so the screenshot matches the new commit.
      await updatePullRequestBody(snapshot.ref, existing.number, body).catch((error: unknown) =>
        console.warn('⚠️ [data-model-deliveries] Could not update PR body', { pr: existing.number, error: errorMessage(error) }),
      );
    }
    const pullRequest =
      existing ??
      (await createPullRequest({
        ref: snapshot.ref,
        head: branch,
        base: snapshot.base_branch,
        title,
        body,
      }));
    console.log('✅ [data-model-deliveries] PR ready', { repo: snapshot.full_name, pr: pullRequest.html_url });

    // Rule errors already stopped delivery above, so a PR reaching here passed every MUST/NEVER check.
    let status: DataModelDelivery['status'] = 'opened';
    let note: string | null = null;
    if (autoMerge) {
      const merged = await mergePullRequest({ ref: snapshot.ref, number: pullRequest.number, title });
      if (merged.ok) {
        status = 'merged';
        await deleteBranch(snapshot.ref, branch);
        console.log('✅ [data-model-deliveries] Auto-merged', { repo: snapshot.full_name, pr: pullRequest.number });
      } else {
        note = `Auto-merge did not go through, so the PR is still open: ${merged.error}`;
        console.warn('⚠️ [data-model-deliveries] Auto-merge failed', { repo: snapshot.full_name, error: merged.error });
      }
    }

    return (
      (await updateDataModelDelivery(client, delivery.id, {
        base_branch: snapshot.base_branch,
        commit_sha: commitSha,
        pr_number: pullRequest.number,
        pr_url: pullRequest.html_url,
        status,
        files: files.map((file) => ({ path: file.path, action: file.action })),
        error: note,
        template_repo: template.repo,
        template_sha: template.sha,
        convergence: null,
        convergence_detail: null,
        convergence_checked_at: null,
      })) ?? delivery
    );
  } catch (error) {
    console.error('❌ [data-model-deliveries] Delivery failed', { repo: repo.name, error: errorMessage(error) });
    return fail(errorMessage(error));
  }
};

/** A merged layout / list-pages delivery is stale when rendering against the repo today would change files. */
const hasNewFiles = async (
  client: CanonicalDataClient,
  inputs: DeliveryInputs,
  kind: DataModelDeliveryKind,
  role: CodegenRole,
  repo: SoftwareSystemRepo,
): Promise<boolean> => {
  try {
    const head = await readRepoHead(repo);
    const { files } = await renderDeliveryFiles({ client, kind, role, inputs, head });
    return files.length > 0;
  } catch (error) {
    console.warn('⚠️ [data-model-deliveries] Re-render check failed', { repo: repo.name, kind, error: errorMessage(error) });
    return false;
  }
};

/**
 * Delivers one kind (model files, the CRUD layer or the web app layout) of the approved data model to each requested role's repo
 * (default: storage, express, web; layout: web only) as one PR per repo, optionally squash-merging each one. Roles without a repo come back
 * with a null delivery; repos whose PR for this version is already merged are skipped unchanged.
 */
export const processDeliverDataModel = async (
  client: CanonicalDataClient,
  input: { proposalId: string; roles?: CodegenRole[]; autoMerge?: boolean; kind: DataModelDeliveryKind },
): Promise<DeliveryTarget[]> => {
  const inputs = await loadDeliveryInputs(client, input.proposalId);
  const [repos, existing] = await Promise.all([
    getSoftwareSystemReposBySoftwareSystemId(client, inputs.proposal.software_system_id),
    listDataModelDeliveriesByProposalId(client, input.proposalId),
  ]);
  const roles = deliveryRolesForKind(input.kind).filter((role) => !input.roles || input.roles.includes(role));

  const targets: DeliveryTarget[] = [];
  for (const role of roles) {
    const repo = resolveRoleRepo(repos, role);
    if (!repo) {
      targets.push({ role, repo, delivery: null });
      continue;
    }
    // A PR merged (or closed) on GitHub since we last looked counts too.
    const current = existing.find((item) => item.software_system_repo_id === repo.id && (item.kind ?? 'model') === input.kind);
    const synced = current ? await syncDeliveryPullRequest(client, current) : null;
    const merged = synced?.status === 'merged' ? synced : null;
    if (merged && isRedeliverableKind(input.kind) && (await hasNewFiles(client, inputs, input.kind, role, repo))) {
      // Layout and list pages grow with the repo (routes, links and pages for new tables): deliver again.
      targets.push({ role, repo, delivery: await deliverToRepo(client, inputs, role, repo, input.autoMerge === true, input.kind) });
      continue;
    }
    if (merged) {
      console.log('⏭️ [data-model-deliveries] Already merged, skipping', { repo: repo.name, pr: merged.pr_number });
      targets.push({ role, repo, delivery: merged });
      continue;
    }
    targets.push({ role, repo, delivery: await deliverToRepo(client, inputs, role, repo, input.autoMerge === true, input.kind) });
  }
  return targets;
};
