import { updateSoftwareSystem } from '../../data/software-systems';
import type { SoftwareSystem, UpdateSoftwareSystemInput } from '../../model/software-system';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Updates a project for PATCH /api/data/software-systems/:id.
 */
export const processUpdateSoftwareSystem = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateSoftwareSystemInput
): Promise<SoftwareSystem> => updateSoftwareSystem(client, id, input);
