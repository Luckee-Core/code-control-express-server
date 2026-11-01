import type { SoftwareSystem, UpdateSoftwareSystemInput } from '../../model/software-system';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Updates a software_systems row via Storage Express.
 */
export const updateSoftwareSystem = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateSoftwareSystemInput
): Promise<SoftwareSystem> => invokeCanonicalDataOperation<SoftwareSystem>(client, 'updateSoftwareSystem', [id, input]);
