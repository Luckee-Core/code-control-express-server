import { listConventionRoles } from '../../data/convention-roles';
import { listConventions } from '../../data/conventions';
import type { CanonicalDataClient } from '../canonical-data-client';
import type { FileCheckConvention } from '../codegen';

/** The active file_path / sql conventions with their roles (deterministic checks on agent output). */
export const loadFileChecks = async (client: CanonicalDataClient): Promise<FileCheckConvention[]> => {
  const [conventions, roles] = await Promise.all([listConventions(client, { status: 'active' }), listConventionRoles(client, null)]);
  return conventions
    .filter((convention) => convention.check_kind === 'file_path' || convention.check_kind === 'sql')
    .map((convention) => ({
      key: convention.key,
      severity: convention.severity,
      check_kind: convention.check_kind,
      check_config: convention.check_config,
      role_keys: roles.filter((link) => link.convention_id === convention.id).map((link) => link.role_key),
    }));
};
