import type { SoftwareSystemRepo } from '../../model/software-system-repo';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Sets (or clears) a repo's role via Storage Express; null when not found.
 */
export const updateSoftwareSystemRepoRole = async (
  client: CanonicalDataClient,
  id: string,
  role: string | null,
): Promise<SoftwareSystemRepo | null> =>
  invokeCanonicalDataOperation<SoftwareSystemRepo | null>(client, 'updateSoftwareSystemRepoRole', [id, role]);
