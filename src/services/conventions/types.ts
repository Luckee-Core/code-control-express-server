import type { ColumnType } from '../../model/column-type';
import type { Convention } from '../../model/convention';
import type { ConventionDomain } from '../../model/convention-domain';
import type { ConventionExample } from '../../model/convention-example';
import type { ConventionRole } from '../../model/convention-role';
import type { ConventionSnapshot } from '../../model/convention-snapshot';
import type { ConventionSnapshotUse } from '../../model/convention-snapshot-use';
import type { ConventionSource } from '../../model/convention-source';
import type { ConventionTopic } from '../../model/convention-topic';
import type { LifecycleOption } from '../../model/lifecycle-option';
import type { RepoRole } from '../../model/repo-role';
import type { StandardColumn } from '../../model/standard-column';
import type { TableArchetype } from '../../model/table-archetype';

/** GET /api/data/conventions/:id */
export type ConventionDetail = {
  convention: Convention;
  role_keys: string[];
  examples: ConventionExample[];
  sources: ConventionSource[];
};

/** GET /api/data/conventions/catalog — lookups for filters, forms and vocabulary pages. */
export type ConventionsCatalog = {
  domains: ConventionDomain[];
  topics: ConventionTopic[];
  repo_roles: RepoRole[];
  /** Every convention ↔ role link, for client-side role filtering. */
  convention_roles: ConventionRole[];
  column_types: ColumnType[];
  standard_columns: StandardColumn[];
  lifecycle_options: LifecycleOption[];
  table_archetypes: TableArchetype[];
};

/** Exact rows rendered into an AI context (stored with proposals for reproducibility). */
export type ConventionsContextSnapshot = {
  domain_key: string;
  role_key: string | null;
  conventions: Array<Convention & { examples: ConventionExample[] }>;
  topics: ConventionTopic[];
  column_types: ColumnType[];
  standard_columns: StandardColumn[];
  lifecycle_options: LifecycleOption[];
  table_archetypes: TableArchetype[];
};

/** GET /api/data/conventions/context */
export type ConventionsContext = {
  domain_key: string;
  role_key: string | null;
  /** Rendered markdown for an AI system prompt; byte-stable for the same rows. */
  text: string;
  /** sha256 of `text`. */
  hash: string;
  convention_count: number;
  snapshot: ConventionsContextSnapshot;
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** GET /api/data/conventions/options response (dropdown lists). */
export type ConventionOptions = {
  domains: ConventionDomain[];
  topics: ConventionTopic[];
  repo_roles: RepoRole[];
};

/** GET /api/data/conventions/vocabulary response. */
export type ConventionVocabulary = {
  column_types: ColumnType[];
  standard_columns: StandardColumn[];
  lifecycle_options: LifecycleOption[];
  table_archetypes: TableArchetype[];
};

/** Input for building AI context. */
export type AiContextRequest = {
  domain_key: string;
  role_key: string;
};

/** Built AI context (not saved). */
export type AiContext = {
  domain_key: string;
  role_key: string;
  text: string;
  hash: string;
  convention_keys: string[];
  convention_count: number;
  format_version: number;
};

/** Input for POST /api/data/conventions/ai-context/snapshots. */
export type CreateAiContextSnapshotRequest = AiContextRequest & {
  consumer_type?: string;
  consumer_id?: string;
  software_system_id?: string | null;
};

/** Saved (or reused) snapshot plus the recorded use, if a consumer was given. */
export type AiContextSnapshotResult = {
  snapshot: ConventionSnapshot;
  use: ConventionSnapshotUse | null;
  reused: boolean;
};

/** Keys to leave out when a consumer (e.g. the data-model proposal step) needs only part of a domain. */
export type ConventionsContextExclusions = {
  topic_keys?: string[];
  convention_keys?: string[];
  archetype_keys?: string[];
};
