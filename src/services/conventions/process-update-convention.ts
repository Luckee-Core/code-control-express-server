import { updateConvention } from '../../data/conventions';
import type { Convention, UpdateConventionInput } from '../../model/convention';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Updates a convention for PATCH /api/data/conventions/:id.
 */
export const processUpdateConvention = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateConventionInput
): Promise<Convention> => updateConvention(client, id, input);
