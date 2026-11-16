import { createConventionSnapshot, getConventionSnapshotByHash } from '../../data/convention-snapshots';
import { createConventionSnapshotUse } from '../../data/convention-snapshot-uses';
import type { CanonicalDataClient } from '../canonical-data-client';
import { processBuildAiContext } from './process-build-ai-context';
import type { AiContextSnapshotResult, CreateAiContextSnapshotRequest } from './types';

/**
 * Builds AI context, saves it as an immutable snapshot (reusing one with the same hash),
 * and records the use when a consumer is given. Workflows call this once at the start of a run
 * and keep the returned snapshot id on their run record.
 */
export const processCreateAiContextSnapshot = async (
  client: CanonicalDataClient,
  request: CreateAiContextSnapshotRequest
): Promise<AiContextSnapshotResult> => {
  const context = await processBuildAiContext(client, request);
  const existing = await getConventionSnapshotByHash(client, context.hash);
  const snapshot =
    existing ??
    (await createConventionSnapshot(client, {
      domain_key: context.domain_key,
      role_key: context.role_key,
      content_hash: context.hash,
      text: context.text,
      convention_keys: context.convention_keys,
      convention_count: context.convention_count,
      format_version: context.format_version,
    }));

  const use =
    request.consumer_type && request.consumer_id
      ? await createConventionSnapshotUse(client, {
          snapshot_id: snapshot.id,
          consumer_type: request.consumer_type,
          consumer_id: request.consumer_id,
          software_system_id: request.software_system_id ?? null,
        })
      : null;

  console.log(existing ? '✅ Reused convention snapshot' : '💾 Saved convention snapshot', { id: snapshot.id });
  return { snapshot, use, reused: Boolean(existing) };
};
