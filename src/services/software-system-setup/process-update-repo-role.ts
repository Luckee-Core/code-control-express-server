import { getSoftwareSystemReposBySoftwareSystemId, updateSoftwareSystemRepoRole } from '../../data/software-system-repos';
import type { SoftwareSystemRepo } from '../../model/software-system-repo';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Tags one of a project's repos with a role (or clears it). A role belongs to one repo per
 * project, so any other repo holding it is cleared. Null when the repo is not in the project.
 */
export const processUpdateRepoRole = async (
  client: CanonicalDataClient,
  input: { projectId: string; repoId: string; role: string | null },
): Promise<SoftwareSystemRepo | null> => {
  const repos = await getSoftwareSystemReposBySoftwareSystemId(client, input.projectId);
  if (!repos.some((repo) => repo.id === input.repoId)) {
    return null;
  }
  if (input.role) {
    const holders = repos.filter((repo) => repo.role === input.role && repo.id !== input.repoId);
    for (const holder of holders) {
      await updateSoftwareSystemRepoRole(client, holder.id, null);
    }
  }
  return updateSoftwareSystemRepoRole(client, input.repoId, input.role);
};
