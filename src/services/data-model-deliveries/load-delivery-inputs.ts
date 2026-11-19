import { listColumnTypes } from '../../data/column-types';
import { listConventionRoles } from '../../data/convention-roles';
import { listConventions } from '../../data/conventions';
import { getDataModelProposalById } from '../../data/data-model-proposals';
import { listLifecycleOptions } from '../../data/lifecycle-options';
import { listStandardColumns } from '../../data/standard-columns';
import type { DataModelProposal, DataModelProposalContent } from '../../model/data-model-proposal';
import type { CanonicalDataClient } from '../canonical-data-client';
import type { CodegenVocabulary, FileCheckConvention } from '../codegen';
import { ProposalRequestError } from '../data-model-proposals/proposal-request-error';

export type DeliveryInputs = {
  proposal: DataModelProposal;
  content: DataModelProposalContent;
  vocabulary: CodegenVocabulary;
  checks: FileCheckConvention[];
};

const snapshotVocabulary = (snapshot: Record<string, unknown> | null | undefined): CodegenVocabulary | null => {
  const columnTypes = snapshot?.column_types;
  const standardColumns = snapshot?.standard_columns;
  const lifecycleOptions = snapshot?.lifecycle_options;
  if (!Array.isArray(columnTypes) || !Array.isArray(standardColumns) || !Array.isArray(lifecycleOptions)) return null;
  if (columnTypes.length === 0 || standardColumns.length === 0) return null;
  return {
    column_types: columnTypes,
    standard_columns: standardColumns,
    lifecycle_options: lifecycleOptions,
  } as CodegenVocabulary;
};

/**
 * Loads an approved proposal, the vocabulary it was approved with (its conventions snapshot,
 * or today's rows for older proposals), and the active file/SQL check conventions with roles.
 */
export const loadDeliveryInputs = async (client: CanonicalDataClient, proposalId: string): Promise<DeliveryInputs> => {
  const proposal = await getDataModelProposalById(client, proposalId);
  if (!proposal) {
    throw new ProposalRequestError(404, 'Proposal not found');
  }
  if (proposal.status !== 'approved' || !proposal.proposal) {
    throw new ProposalRequestError(409, 'Only the approved data-model version can be delivered');
  }

  const [conventions, conventionRoles, liveVocabulary] = await Promise.all([
    listConventions(client, { status: 'active' }),
    listConventionRoles(client, null),
    snapshotVocabulary(proposal.conventions_snapshot)
      ? Promise.resolve(null)
      : Promise.all([listColumnTypes(client), listStandardColumns(client), listLifecycleOptions(client)]),
  ]);

  const vocabulary =
    snapshotVocabulary(proposal.conventions_snapshot) ??
    ({
      column_types: liveVocabulary![0].filter((type) => type.is_active),
      standard_columns: liveVocabulary![1],
      lifecycle_options: liveVocabulary![2],
    } satisfies CodegenVocabulary);

  const checks: FileCheckConvention[] = conventions
    .filter((convention) => convention.check_kind === 'file_path' || convention.check_kind === 'sql')
    .map((convention) => ({
      key: convention.key,
      severity: convention.severity,
      check_kind: convention.check_kind,
      check_config: convention.check_config,
      role_keys: conventionRoles.filter((link) => link.convention_id === convention.id).map((link) => link.role_key),
    }));

  return { proposal, content: proposal.proposal, vocabulary, checks };
};
