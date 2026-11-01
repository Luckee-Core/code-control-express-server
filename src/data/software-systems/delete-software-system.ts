import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Deletes a software_systems row via Storage Express.
 */
export const deleteSoftwareSystem = async (client: CanonicalDataClient, id: string): Promise<void> => {
  await invokeCanonicalDataOperation<null>(client, 'deleteSoftwareSystem', [id]);
};
