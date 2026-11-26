import type { DataModelDeliveryKind } from '../../model/data-model-delivery';
import type { SetupPreset } from '../../model/setup-preset';
import type { SoftwareSystemRepo } from '../../model/software-system-repo';
import type { CreateSystemBuildRunStepInput } from '../../model/system-build-run-step';
import { deliveryRolesForKind } from '../data-model-deliveries/config';
import { resolveRoleRepo } from '../data-model-deliveries/resolve-role-repos';
import { BUILD_STEPS } from './config';

/** Roles the build attaches itself (the shared main gateway repo is linked during the dispatcher step). */
const LINKED_DURING_DELIVERY = new Set(['gateway']);

/**
 * One step per delivery kind, in order. A kind is skipped when the project type has no dispatcher
 * (same rule as the Dispatcher tab) or when none of its roles has a repo.
 */
export const planSystemBuildSteps = (
  runId: string,
  repos: SoftwareSystemRepo[],
  preset: SetupPreset | undefined,
): CreateSystemBuildRunStepInput[] => {
  const hidesDispatcher = Boolean(preset && preset.role_keys.length > 0 && !preset.role_keys.includes('dispatcher'));
  return BUILD_STEPS.map(({ kind }, position) => {
    const skip = skipReason(kind, repos, hidesDispatcher);
    return { run_id: runId, kind, position, status: skip ? 'skipped' : 'pending', note: skip };
  });
};

const skipReason = (kind: DataModelDeliveryKind, repos: SoftwareSystemRepo[], hidesDispatcher: boolean): string | null => {
  if (kind === 'dispatcher' && hidesDispatcher) return 'This project type has no dispatcher.';
  const roles = deliveryRolesForKind(kind).filter((role) => !LINKED_DURING_DELIVERY.has(role));
  if (roles.some((role) => resolveRoleRepo(repos, role))) return null;
  return `No ${roles.join(' or ')} repo (Repositories tab).`;
};
