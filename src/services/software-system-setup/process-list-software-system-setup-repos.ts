import { getSoftwareSystemReposBySoftwareSystemId } from '../../data/software-system-repos';
import type { SoftwareSystemRepo } from '../../model/software-system-repo';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Lists repos linked to one project for the project setup screen.
 */
export const processListSoftwareSystemSetupRepos = async (
  client: CanonicalDataClient,
  projectId: string
): Promise<SoftwareSystemRepo[]> => getSoftwareSystemReposBySoftwareSystemId(client, projectId);
