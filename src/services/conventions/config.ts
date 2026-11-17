import type { ConventionCheckKind, ConventionSeverity, ConventionStatus } from '../../model/convention';
import type { ConventionExampleKind, ConventionExampleLanguage } from '../../model/convention-example';

/** Dotted lowercase keys, e.g. `dm.mig.no_functions_triggers`. */
export const CONVENTION_KEY_PATTERN = /^[a-z0-9_]+(\.[a-z0-9_]+)+$/;

export const CONVENTION_SEVERITIES: readonly ConventionSeverity[] = ['must', 'should', 'avoid', 'never'];
export const CONVENTION_STATUSES: readonly ConventionStatus[] = ['draft', 'active', 'deprecated'];
export const CONVENTION_CHECK_KINDS: readonly ConventionCheckKind[] = ['none', 'proposal', 'sql', 'file_path'];
export const EXAMPLE_KINDS: readonly ConventionExampleKind[] = ['correct', 'incorrect'];
export const EXAMPLE_LANGUAGES: readonly ConventionExampleLanguage[] = ['sql', 'ts', 'tsx', 'json', 'text'];

/** Severity labels used in the rendered AI context. */
export const SEVERITY_LABELS: Record<ConventionSeverity, string> = {
  must: 'MUST',
  never: 'NEVER',
  should: 'SHOULD',
  avoid: 'AVOID',
};
