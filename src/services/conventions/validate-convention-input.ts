import type {
  ConventionCheckKind,
  ConventionSeverity,
  ConventionStatus,
  CreateConventionInput,
  ListConventionsFilter,
  UpdateConventionInput,
} from '../../model/convention';
import type {
  ConventionExampleKind,
  ConventionExampleLanguage,
  CreateConventionExampleInput,
  UpdateConventionExampleInput,
} from '../../model/convention-example';
import type { CreateConventionSourceInput } from '../../model/convention-source';
import {
  CONVENTION_CHECK_KINDS,
  CONVENTION_KEY_PATTERN,
  CONVENTION_SEVERITIES,
  CONVENTION_STATUSES,
  EXAMPLE_KINDS,
  EXAMPLE_LANGUAGES,
} from './config';
import type { ValidationResult } from './types';

type Body = Record<string, unknown>;

const isObject = (value: unknown): value is Body =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readText = (body: Body, field: string, required: boolean): string | undefined | Error => {
  const value = body[field];
  if (value === undefined || value === null) {
    return required ? new Error(`${field} is required`) : undefined;
  }
  if (typeof value !== 'string') return new Error(`${field} must be a string`);
  if (required && !value.trim()) return new Error(`${field} is required`);
  return value;
};

const readEnum = <T extends string>(
  body: Body,
  field: string,
  allowed: readonly T[],
): T | undefined | Error => {
  const value = body[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    return new Error(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return value as T;
};

const readInteger = (body: Body, field: string): number | undefined | Error => {
  const value = body[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isInteger(value)) return new Error(`${field} must be an integer`);
  return value;
};

const readCheckConfig = (body: Body): Record<string, unknown> | null | undefined | Error => {
  if (!('check_config' in body)) return undefined;
  const value = body.check_config;
  if (value === null) return null;
  if (!isObject(value)) return new Error('check_config must be an object or null');
  return value;
};

/**
 * Reads optional role_keys (array of non-empty strings) from a request body.
 */
export const readRoleKeys = (body: unknown): ValidationResult<string[] | undefined> => {
  if (!isObject(body) || body.role_keys === undefined) return { ok: true, value: undefined };
  const value = body.role_keys;
  if (!Array.isArray(value) || value.some((key) => typeof key !== 'string' || !key.trim())) {
    return { ok: false, error: 'role_keys must be an array of role keys' };
  }
  return { ok: true, value: value as string[] };
};

const firstError = (values: unknown[]): string | null => {
  const error = values.find((value) => value instanceof Error);
  return error instanceof Error ? error.message : null;
};

/**
 * Validates a POST /api/data/conventions body.
 */
export const validateCreateConvention = (body: unknown): ValidationResult<CreateConventionInput> => {
  if (!isObject(body)) return { ok: false, error: 'Request body must be an object' };
  const key = readText(body, 'key', true);
  const domainKey = readText(body, 'domain_key', true);
  const topicKey = readText(body, 'topic_key', true);
  const title = readText(body, 'title', true);
  const statement = readText(body, 'statement', true);
  const rationale = readText(body, 'rationale', false);
  const severity = readEnum<ConventionSeverity>(body, 'severity', CONVENTION_SEVERITIES);
  const status = readEnum<ConventionStatus>(body, 'status', CONVENTION_STATUSES);
  const checkKind = readEnum<ConventionCheckKind>(body, 'check_kind', CONVENTION_CHECK_KINDS);
  const checkConfig = readCheckConfig(body);
  const sortOrder = readInteger(body, 'sort_order');

  const error = firstError([key, domainKey, topicKey, title, statement, rationale, severity, status, checkKind, checkConfig, sortOrder]);
  if (error) return { ok: false, error };
  if (!CONVENTION_KEY_PATTERN.test((key as string).trim())) {
    return { ok: false, error: 'key must be dotted lowercase, e.g. dm.table.snake_plural' };
  }

  return {
    ok: true,
    value: {
      key: (key as string).trim(),
      domain_key: domainKey as string,
      topic_key: topicKey as string,
      title: title as string,
      statement: statement as string,
      rationale: rationale as string | undefined,
      severity: severity as ConventionSeverity | undefined,
      status: status as ConventionStatus | undefined,
      check_kind: checkKind as ConventionCheckKind | undefined,
      check_config: checkConfig as Record<string, unknown> | null | undefined,
      sort_order: sortOrder as number | undefined,
    },
  };
};

/**
 * Validates a PATCH /api/data/conventions/:id body (only provided fields change).
 */
export const validateUpdateConvention = (body: unknown): ValidationResult<UpdateConventionInput> => {
  if (!isObject(body)) return { ok: false, error: 'Request body must be an object' };
  const topicKey = readText(body, 'topic_key', false);
  const title = readText(body, 'title', false);
  const statement = readText(body, 'statement', false);
  const rationale = readText(body, 'rationale', false);
  const severity = readEnum<ConventionSeverity>(body, 'severity', CONVENTION_SEVERITIES);
  const status = readEnum<ConventionStatus>(body, 'status', CONVENTION_STATUSES);
  const checkKind = readEnum<ConventionCheckKind>(body, 'check_kind', CONVENTION_CHECK_KINDS);
  const checkConfig = readCheckConfig(body);
  const sortOrder = readInteger(body, 'sort_order');

  const error = firstError([topicKey, title, statement, rationale, severity, status, checkKind, checkConfig, sortOrder]);
  if (error) return { ok: false, error };
  if (typeof title === 'string' && !title.trim()) return { ok: false, error: 'title cannot be empty' };
  if (typeof statement === 'string' && !statement.trim()) return { ok: false, error: 'statement cannot be empty' };

  return {
    ok: true,
    value: {
      topic_key: topicKey as string | undefined,
      title: typeof title === 'string' ? title.trim() : undefined,
      statement: typeof statement === 'string' ? statement.trim() : undefined,
      rationale: typeof rationale === 'string' ? rationale.trim() : undefined,
      severity: severity as ConventionSeverity | undefined,
      status: status as ConventionStatus | undefined,
      check_kind: checkKind as ConventionCheckKind | undefined,
      check_config: checkConfig as Record<string, unknown> | null | undefined,
      sort_order: sortOrder as number | undefined,
    },
  };
};

/**
 * Reads GET /api/data/conventions query filters.
 */
export const readListConventionsFilter = (query: Record<string, unknown>): ValidationResult<ListConventionsFilter> => {
  const pick = (name: string): string | undefined =>
    typeof query[name] === 'string' && (query[name] as string).trim() ? (query[name] as string).trim() : undefined;
  const status = pick('status');
  const severity = pick('severity');
  if (status && !CONVENTION_STATUSES.includes(status as ConventionStatus)) {
    return { ok: false, error: `status must be one of: ${CONVENTION_STATUSES.join(', ')}` };
  }
  if (severity && !CONVENTION_SEVERITIES.includes(severity as ConventionSeverity)) {
    return { ok: false, error: `severity must be one of: ${CONVENTION_SEVERITIES.join(', ')}` };
  }
  return {
    ok: true,
    value: {
      domain_key: pick('domain_key'),
      topic_key: pick('topic_key'),
      role_key: pick('role_key'),
      status: status as ConventionStatus | undefined,
      severity: severity as ConventionSeverity | undefined,
    },
  };
};

/**
 * Validates a POST /api/data/conventions/:id/examples body.
 */
export const validateCreateConventionExample = (
  conventionId: string,
  body: unknown,
): ValidationResult<CreateConventionExampleInput> => {
  if (!isObject(body)) return { ok: false, error: 'Request body must be an object' };
  const title = readText(body, 'title', true);
  const code = readText(body, 'code', true);
  const pathHint = readText(body, 'path_hint', false);
  const note = readText(body, 'note', false);
  const kind = readEnum<ConventionExampleKind>(body, 'kind', EXAMPLE_KINDS);
  const language = readEnum<ConventionExampleLanguage>(body, 'language', EXAMPLE_LANGUAGES);
  const sortOrder = readInteger(body, 'sort_order');
  const error = firstError([title, code, pathHint, note, kind, language, sortOrder]);
  if (error) return { ok: false, error };
  if (!kind) return { ok: false, error: 'kind is required' };
  if (!language) return { ok: false, error: 'language is required' };
  return {
    ok: true,
    value: {
      convention_id: conventionId,
      title: title as string,
      code: code as string,
      kind: kind as ConventionExampleKind,
      language: language as ConventionExampleLanguage,
      path_hint: pathHint as string | undefined,
      note: note as string | undefined,
      sort_order: sortOrder as number | undefined,
    },
  };
};

/**
 * Validates a PATCH /api/data/conventions/examples/:exampleId body.
 */
export const validateUpdateConventionExample = (body: unknown): ValidationResult<UpdateConventionExampleInput> => {
  if (!isObject(body)) return { ok: false, error: 'Request body must be an object' };
  const title = readText(body, 'title', false);
  const code = readText(body, 'code', false);
  const pathHint = readText(body, 'path_hint', false);
  const note = readText(body, 'note', false);
  const kind = readEnum<ConventionExampleKind>(body, 'kind', EXAMPLE_KINDS);
  const language = readEnum<ConventionExampleLanguage>(body, 'language', EXAMPLE_LANGUAGES);
  const sortOrder = readInteger(body, 'sort_order');
  const error = firstError([title, code, pathHint, note, kind, language, sortOrder]);
  if (error) return { ok: false, error };
  return {
    ok: true,
    value: {
      title: title as string | undefined,
      code: code as string | undefined,
      path_hint: 'path_hint' in body ? ((pathHint as string | undefined) ?? null) : undefined,
      note: note as string | undefined,
      kind: kind as ConventionExampleKind | undefined,
      language: language as ConventionExampleLanguage | undefined,
      sort_order: sortOrder as number | undefined,
    },
  };
};

/**
 * Validates a POST /api/data/conventions/:id/sources body.
 */
export const validateCreateConventionSource = (
  conventionId: string,
  body: unknown,
): ValidationResult<CreateConventionSourceInput> => {
  if (!isObject(body)) return { ok: false, error: 'Request body must be an object' };
  const repo = readText(body, 'repo', true);
  const adrPath = readText(body, 'adr_path', true);
  const excerpt = readText(body, 'excerpt', false);
  const copyCount = readInteger(body, 'copy_count');
  const variantCount = readInteger(body, 'variant_count');
  const error = firstError([repo, adrPath, excerpt, copyCount, variantCount]);
  if (error) return { ok: false, error };
  return {
    ok: true,
    value: {
      convention_id: conventionId,
      repo: repo as string,
      adr_path: adrPath as string,
      excerpt: excerpt as string | undefined,
      copy_count: copyCount as number | undefined,
      variant_count: variantCount as number | undefined,
    },
  };
};
