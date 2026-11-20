import { getDataModelDeliveryById } from '../../data/data-model-deliveries';
import type { DataModelDelivery } from '../../model/data-model-delivery';
import { AgentRequestError } from '../agent-runs/agent-request-error';
import { MAX_PROMPT_FILE_CHARS } from '../agent-runs/config';
import type { CanonicalDataClient } from '../canonical-data-client';
import { getBranchHeadSha, getFileText, type GithubRepoRef } from '../github';
import { syncDeliveryPullRequest } from '../data-model-deliveries/sync-delivery-pull-request';

export type DeliveryPr = {
  delivery: DataModelDelivery;
  ref: GithubRepoRef;
  head_sha: string;
  /** Contents at the branch head of the PR's files (focus paths first), within the prompt budget. */
  files: Array<{ path: string; content: string }>;
  /** PR files left out of the prompt because of the size budget. */
  omitted: string[];
};

/**
 * Loads a delivery whose PR is still open, its branch head and the PR's files at that head.
 * `focusPaths` are read first so they always fit.
 */
export const readDeliveryPr = async (
  client: CanonicalDataClient,
  deliveryId: string,
  focusPaths: string[] = [],
): Promise<DeliveryPr> => {
  const stored = await getDataModelDeliveryById(client, deliveryId);
  if (!stored) throw new AgentRequestError(404, 'Delivery not found');
  const delivery = await syncDeliveryPullRequest(client, stored);
  if (!delivery.pr_number || delivery.status !== 'opened') {
    throw new AgentRequestError(409, `The PR for this delivery is ${delivery.status === 'merged' ? 'already merged' : delivery.status === 'closed' ? 'closed' : 'not open'}. Re-render or open it again first.`);
  }
  const [owner, repo] = delivery.repo_full_name.split('/');
  const ref = { owner, repo };
  const headSha = await getBranchHeadSha(ref, delivery.branch);
  if (!headSha) throw new AgentRequestError(409, `Branch ${delivery.branch} no longer exists in ${delivery.repo_full_name}`);

  const focus = new Set(focusPaths);
  const ordered = [...focusPaths.filter((path) => delivery.files.some((file) => file.path === path)), ...delivery.files.map((file) => file.path).filter((path) => !focus.has(path))];
  const contents = await Promise.all(ordered.map((path) => getFileText(ref, path, headSha)));

  const files: DeliveryPr['files'] = [];
  const omitted: string[] = [];
  let budget = MAX_PROMPT_FILE_CHARS;
  ordered.forEach((path, index) => {
    const content = contents[index];
    if (content === null) return;
    if (content.length > budget && !focus.has(path)) {
      omitted.push(path);
      return;
    }
    budget -= content.length;
    files.push({ path, content });
  });
  return { delivery, ref, head_sha: headSha, files, omitted };
};
