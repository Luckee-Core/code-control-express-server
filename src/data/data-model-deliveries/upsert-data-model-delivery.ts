import type { CreateDataModelDeliveryInput, DataModelDelivery } from '../../model/data-model-delivery';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Creates the delivery for (proposal, repo), or resets the existing one to pending.
 */
export const upsertDataModelDelivery = async (
  client: CanonicalDataClient,
  input: CreateDataModelDeliveryInput,
): Promise<DataModelDelivery> => invokeCanonicalDataOperation<DataModelDelivery>(client, 'upsertDataModelDelivery', [input]);
