import { listSetupPresets } from '../../data/setup-presets';
import type { SetupPreset } from '../../model/setup-preset';
import type { CanonicalDataClient } from '../canonical-data-client';

/**
 * Active project types for the create-project modal, in sort order.
 */
export const processListSetupPresets = async (client: CanonicalDataClient): Promise<SetupPreset[]> =>
  (await listSetupPresets(client)).filter((preset) => preset.is_active);
