import { createConventionSource, deleteConventionSource } from '../../data/convention-sources';
import { getConventionById } from '../../data/conventions';
import type { ConventionSource, CreateConventionSourceInput } from '../../model/convention-source';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Adds a source to a convention; null when the convention does not exist.
 */
export const processCreateConventionSource = async (
  client: CanonicalDataClient,
  input: CreateConventionSourceInput,
): Promise<ConventionSource | null> => {
  const convention = await getConventionById(client, input.convention_id);
  if (!convention) return null;
  return createConventionSource(client, input);
};

/**
 * Deletes a convention source; false when it did not exist.
 */
export const processDeleteConventionSource = async (
  client: CanonicalDataClient,
  id: string,
): Promise<boolean> => (await deleteConventionSource(client, id)).deleted;
