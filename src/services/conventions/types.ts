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

/** GET /api/data/conventions/:id response. */
export type ConventionDetail = {
  convention: Convention;
  roles: ConventionRole[];
  examples: ConventionExample[];
  sources: ConventionSource[];
};

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
