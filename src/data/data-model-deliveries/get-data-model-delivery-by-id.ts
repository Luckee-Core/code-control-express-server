import type { DataModelDelivery } from '../../model/data-model-delivery';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Returns one delivery or null.
 */
export const getDataModelDeliveryById = async (
  client: CanonicalDataClient,
  id: string,
): Promise<DataModelDelivery | null> => invokeCanonicalDataOperation<DataModelDelivery | null>(client, 'getDataModelDeliveryById', [id]);
