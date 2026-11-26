import { createSystemBuildRunEvent } from '../../data/system-build-run-events';
import type { CreateSystemBuildRunEventInput } from '../../model/system-build-run-event';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Appends to a run's log. A failed write is logged, never thrown: the log must not stop a build.
 */
export const recordSystemBuildEvent = async (
  client: CanonicalDataClient,
  input: Omit<CreateSystemBuildRunEventInput, 'step_id' | 'kind' | 'detail'> &
    Partial<Pick<CreateSystemBuildRunEventInput, 'step_id' | 'kind' | 'detail'>>,
): Promise<void> => {
  console.log(`📤 [system-build-runs] ${input.event_type}`, { run: input.run_id, kind: input.kind ?? null, message: input.message });
  try {
    await createSystemBuildRunEvent(client, { step_id: null, kind: null, detail: null, ...input });
  } catch (error) {
    console.error('❌ [system-build-runs] Could not record event', error instanceof Error ? error.message : error);
  }
};
