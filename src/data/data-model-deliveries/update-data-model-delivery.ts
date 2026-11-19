import type { DataModelDelivery, UpdateDataModelDeliveryInput } from '../../model/data-model-delivery';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Updates a delivery; null when not found.
 */
export const updateDataModelDelivery = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateDataModelDeliveryInput,
): Promise<DataModelDelivery | null> => invokeCanonicalDataOperation<DataModelDelivery | null>(client, 'updateDataModelDelivery', [id, input]);
