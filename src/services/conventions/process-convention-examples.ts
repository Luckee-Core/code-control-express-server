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
import type { ConventionChangeContext } from '../../model/convention-change';
import type { CanonicalDataClient } from '../canonical-data-client';
import { scheduleTemplateSync } from '../agent-runs/sync-template-drafts';

/**
 * Adds an example to a convention; null when the convention does not exist.
 */
export const processCreateConventionExample = async (
  client: CanonicalDataClient,
  input: CreateConventionExampleInput,
  change: ConventionChangeContext = {},
): Promise<ConventionExample | null> => {
  const convention = await getConventionById(client, input.convention_id);
  if (!convention) return null;
  const example = await createConventionExample(client, input, change);
  scheduleTemplateSync(client);
  return example;
};

/**
 * Updates a convention example.
 */
export const processUpdateConventionExample = async (
  client: CanonicalDataClient,
  id: string,
  input: UpdateConventionExampleInput,
  change: ConventionChangeContext = {},
): Promise<ConventionExample> => {
  const example = await updateConventionExample(client, id, input, change);
  scheduleTemplateSync(client);
  return example;
};

/**
 * Deletes a convention example; false when it did not exist.
 */
export const processDeleteConventionExample = async (
  client: CanonicalDataClient,
  id: string,
  change: ConventionChangeContext = {},
): Promise<boolean> => {
  const { deleted } = await deleteConventionExample(client, id, change);
  if (deleted) scheduleTemplateSync(client);
  return deleted;
};
