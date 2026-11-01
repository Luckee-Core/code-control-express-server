import type { CreateSoftwareSystemInput, SoftwareSystem } from '../../model/software-system';
import { invokeCanonicalDataOperation, type CanonicalDataClient } from '../../services/canonical-data-client';

/**
 * Inserts a software_systems row via Storage Express.
 */
export const createSoftwareSystem = async (
  client: CanonicalDataClient,
  input: CreateSoftwareSystemInput
): Promise<SoftwareSystem> => invokeCanonicalDataOperation<SoftwareSystem>(client, 'createSoftwareSystem', [input]);
