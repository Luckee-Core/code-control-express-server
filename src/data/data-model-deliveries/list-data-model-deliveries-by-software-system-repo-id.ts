import type { DataModelDelivery } from '../../model/data-model-delivery';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Lists every delivery made to one repo, newest first.
 */
export const listDataModelDeliveriesBySoftwareSystemRepoId = async (
  client: CanonicalDataClient,
  softwareSystemRepoId: string,
): Promise<DataModelDelivery[]> => invokeCanonicalDataOperation<DataModelDelivery[]>(client, 'listDataModelDeliveriesBySoftwareSystemRepoId', [softwareSystemRepoId]);
