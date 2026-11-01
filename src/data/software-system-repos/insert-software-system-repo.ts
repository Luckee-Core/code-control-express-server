import type { InsertSoftwareSystemRepoInput } from '../../model/software-system-repo';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Inserts a software_system_repos row via Storage Express.
 */
export const insertSoftwareSystemRepo = async (
  client: CanonicalDataClient,
  input: InsertSoftwareSystemRepoInput
): Promise<{ id: string }> =>
  invokeCanonicalDataOperation<{ id: string }>(client, 'insertSoftwareSystemRepo', [input]);
