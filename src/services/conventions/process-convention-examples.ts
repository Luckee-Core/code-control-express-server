import {
  createConventionExample,
  deleteConventionExample,
  updateConventionExample,
} from '../../data/convention-examples';
import { getConventionById } from '../../data/conventions';
import type {
  ConventionExample,
  CreateConventionExampleInput,
  UpdateConventionExampleInput,
} from '../../model/convention-example';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Adds an example to a convention; null when the convention does not exist.
 */
export const processCreateConventionExample = async (
  client: CanonicalDataClient,
  input: CreateConventionExampleInput,
): Promise<ConventionExample | null> => {
  const convention = await getConventionById(client, input.convention_id);
  if (!convention) return null;
  return createConventionExample(client, input);
};

/**
 * Updates a convention example.
 */
export const processUpdateConventionExample = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateConventionExampleInput,
): Promise<ConventionExample> => updateConventionExample(client, id, input);

/**
 * Deletes a convention example; false when it did not exist.
 */
export const processDeleteConventionExample = async (
  client: CanonicalDataClient,
  id: string,
): Promise<boolean> => (await deleteConventionExample(client, id)).deleted;
