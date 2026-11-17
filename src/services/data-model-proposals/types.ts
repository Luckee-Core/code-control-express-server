import type { Convention } from '../../model/convention';
import type { DataModelProposal } from '../../model/data-model-proposal';
import type { DataModelProposalAiExchangeSummary } from '../../model/data-model-proposal-ai-exchange';

/** Keys the AI output schema and the linter accept. */
export type DataModelVocabulary = {
  column_type_keys: string[];
  lifecycle_keys: string[];
  archetype_keys: string[];
  standard_column_names: string[];
};

/** Active proposal-checkable conventions (check_kind = proposal). */
export type ProposalRuleConvention = Pick<Convention, 'key' | 'severity' | 'check_config'>;

/** GET /api/data/data-model-proposals/:id */
export type DataModelProposalDetail = {
  proposal: DataModelProposal;
  exchanges: DataModelProposalAiExchangeSummary[];
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };
