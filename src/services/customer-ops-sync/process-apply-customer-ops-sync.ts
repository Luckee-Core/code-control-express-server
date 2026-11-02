import { listLegacyLocalCustomers, remapCustomerIdForStudio } from '../../data/studio-migration';
import type { CanonicalDataClient } from '../canonical-data-client/types';
import {
  readOpsTrackerGatewayConfig,
  requestOpsTracker,
  requestOpsTrackerInvoke,
} from '../ops-tracker-client';
import { mapCustomerStageToOpsStatus } from './utils/map-customer-stage-to-ops-status';
import { normalizeCustomerName } from './utils/normalize-customer-name';
import type {
  CustomerOpsSyncApplyPayload,
  CustomerOpsSyncApplyRequest,
  CustomerOpsSyncApplyRowResult,
  OpsCustomer,
} from './types';

/**
 * Applies customer link/create decisions and remaps project/repo customer ids.
 */
export const processApplyCustomerOpsSync = async (
  client: CanonicalDataClient,
  body: CustomerOpsSyncApplyRequest,
): Promise<CustomerOpsSyncApplyPayload> => {
  const localCustomers = await listLegacyLocalCustomers(client);
  const localById = new Map(localCustomers.map((c) => [c.id, c]));

  if (body.decisions.length !== localCustomers.length) {
    throw new Error(
      `Expected ${localCustomers.length} decisions for local customers, got ${body.decisions.length}`,
    );
  }

  const seenLocal = new Set<string>();
  const linkTargets = new Set<string>();
  for (const decision of body.decisions) {
    if (seenLocal.has(decision.localCustomerId)) {
      throw new Error(`Duplicate decision for local customer ${decision.localCustomerId}`);
    }
    seenLocal.add(decision.localCustomerId);
    if (!localById.has(decision.localCustomerId)) {
      throw new Error(`Unknown local customer id ${decision.localCustomerId}`);
    }
    if (decision.action === 'link') {
      if (!decision.opsCustomerId?.trim()) {
        throw new Error(`link action requires opsCustomerId for ${decision.localCustomerId}`);
      }
      if (linkTargets.has(decision.opsCustomerId)) {
        throw new Error(`Cannot link two local customers to the same Ops id ${decision.opsCustomerId}`);
      }
      linkTargets.add(decision.opsCustomerId);
    }
    if (decision.action === 'create' && decision.opsCustomerId) {
      throw new Error(`create action must not include opsCustomerId for ${decision.localCustomerId}`);
    }
  }

  const opsResult = await requestOpsTracker<OpsCustomer[]>('/customers');
  if (!opsResult.success) {
    throw new Error(opsResult.error);
  }
  const opsIds = new Set((opsResult.data ?? []).map((c) => c.id));

  const gatewayConfig = readOpsTrackerGatewayConfig();
  if (!gatewayConfig) {
    throw new Error('CRM gateway not configured');
  }

  const results: CustomerOpsSyncApplyRowResult[] = [];
  let ok = 0;
  let failed = 0;
  let skipped = 0;
  let totalProjectsUpdated = 0;
  let totalReposUpdated = 0;

  for (const decision of body.decisions) {
    const local = localById.get(decision.localCustomerId)!;
    try {
      let opsCustomerId: string;

      if (decision.action === 'link') {
        opsCustomerId = decision.opsCustomerId!.trim();
        if (!opsIds.has(opsCustomerId)) {
          throw new Error(`Ops customer ${opsCustomerId} not found in latest CRM list`);
        }
      } else {
        const normalizedLocal = normalizeCustomerName(local.name);
        const nameMatches = (opsResult.data ?? []).filter(
          (ops) => normalizeCustomerName(ops.name) === normalizedLocal,
        );
        if (nameMatches.length === 1) {
          opsCustomerId = nameMatches[0].id;
          if (!opsIds.has(opsCustomerId)) {
            throw new Error(`Ops customer ${opsCustomerId} not found in latest CRM list`);
          }
        } else if (nameMatches.length > 1) {
          throw new Error(
            `Multiple Ops customers match "${local.name}" — use link and pick one explicitly`,
          );
        } else {
          const createResult = await requestOpsTrackerInvoke<OpsCustomer>(gatewayConfig, 'createCustomer', [
            {
              user_id: null,
              name: local.name,
              status: mapCustomerStageToOpsStatus(local.stage ?? 'discovery_call'),
            },
          ]);
          if (!createResult.success) {
            throw new Error(createResult.error);
          }
          opsCustomerId = createResult.data.id;
          opsIds.add(opsCustomerId);
        }
      }

      const remap = await remapCustomerIdForStudio(client, decision.localCustomerId, opsCustomerId);
      if (remap.projectsUpdated === 0 && remap.reposUpdated === 0) {
        const stillLocal = localById.has(decision.localCustomerId);
        if (!stillLocal) {
          results.push({
            localCustomerId: decision.localCustomerId,
            action: decision.action,
            opsCustomerId,
            projectsUpdated: 0,
            reposUpdated: 0,
            status: 'skipped',
          });
          skipped += 1;
          continue;
        }
      }

      totalProjectsUpdated += remap.projectsUpdated;
      totalReposUpdated += remap.reposUpdated;
      results.push({
        localCustomerId: decision.localCustomerId,
        action: decision.action,
        opsCustomerId,
        projectsUpdated: remap.projectsUpdated,
        reposUpdated: remap.reposUpdated,
        status: 'ok',
      });
      ok += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Apply failed';
      results.push({
        localCustomerId: decision.localCustomerId,
        action: decision.action,
        opsCustomerId: decision.opsCustomerId ?? null,
        projectsUpdated: 0,
        reposUpdated: 0,
        status: 'error',
        error: message,
      });
      failed += 1;
    }
  }

  return {
    results,
    summary: {
      ok,
      failed,
      skipped,
      totalProjectsUpdated,
      totalReposUpdated,
    },
  };
};
