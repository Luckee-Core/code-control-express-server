import { getDataModelProposalById } from '../../data/data-model-proposals';
import { listSetupPresets } from '../../data/setup-presets';
import { getSoftwareSystemReposBySoftwareSystemId } from '../../data/software-system-repos';
import { getSoftwareSystemById } from '../../data/software-systems';
import { createSystemBuildRun, getActiveSystemBuildRunBySoftwareSystemId } from '../../data/system-build-runs';
import { createSystemBuildRunSteps } from '../../data/system-build-run-steps';
import type { CanonicalDataClient } from '../canonical-data-client';
import { resolveDispatcherPlan } from '../data-model-deliveries/resolve-dispatcher-plan';
import { loadSystemBuildRunDetail } from './load-system-build-run-detail';
import { planSystemBuildSteps } from './plan-system-build-steps';
import { recordSystemBuildEvent } from './record-system-build-event';
import { startSystemBuildRun } from './run-system-build';
import { SystemBuildRequestError } from './system-build-request-error';
import type { SystemBuildRunDetail } from './types';

/**
 * Starts "Build all" for an approved data model: checks what would stop it before anything is
 * delivered (approval, one run at a time, the dispatcher plan), creates the run and its steps,
 * and runs it in the background.
 */
export const processCreateSystemBuildRun = async (
  client: CanonicalDataClient,
  proposalId: string,
): Promise<SystemBuildRunDetail> => {
  const proposal = await getDataModelProposalById(client, proposalId);
  if (!proposal) throw new SystemBuildRequestError(404, 'Data model version not found');
  if (proposal.status !== 'approved' || !proposal.proposal) {
    throw new SystemBuildRequestError(409, 'Approve this data model version first (Data model tab).');
  }
  const systemId = proposal.software_system_id;
  const [system, active, repos, presets] = await Promise.all([
    getSoftwareSystemById(client, systemId),
    getActiveSystemBuildRunBySoftwareSystemId(client, systemId),
    getSoftwareSystemReposBySoftwareSystemId(client, systemId),
    listSetupPresets(client),
  ]);
  if (!system) throw new SystemBuildRequestError(404, 'Software system not found');
  if (active) throw new SystemBuildRequestError(409, 'A build is already running for this project. Continue or cancel it first.');

  const preset = system.setup_preset_key ? presets.find((item) => item.key === system.setup_preset_key) : undefined;
  const planned = planSystemBuildSteps('', repos, preset);
  if (planned.some((step) => step.kind === 'dispatcher' && step.status === 'pending')) {
    const plan = await resolveDispatcherPlan(client, systemId);
    if (plan.problems.length > 0) {
      throw new SystemBuildRequestError(409, `Dispatcher tab: ${plan.problems.join(' ')}`);
    }
  }

  const run = await createSystemBuildRun(client, { software_system_id: systemId, proposal_id: proposal.id });
  await createSystemBuildRunSteps(client, planned.map((step) => ({ ...step, run_id: run.id })));
  await recordSystemBuildEvent(client, { run_id: run.id, event_type: 'run_started', message: `Building data model v${proposal.version} through every tab.` });
  console.log('🚀 [system-build-runs] Started', { run: run.id, system: systemId, version: proposal.version });
  startSystemBuildRun(client, run.id);
  return loadSystemBuildRunDetail(client, run);
};
