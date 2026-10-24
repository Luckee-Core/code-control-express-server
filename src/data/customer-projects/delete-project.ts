import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Deletes a customer_projects row via Storage Express.
 */
export const deleteProject = async (client: CanonicalDataClient, id: string): Promise<void> => {
  await invokeCanonicalDataOperation<null>(client, 'deleteProject', [id]);
};
