import type { Request } from 'express';
import type { ConventionChangeContext } from '../../model/convention-change';

const MAX_REASON_LENGTH = 2000;

/**
 * Reads the optional "why" for a convention edit from the Code Control UI: `change_reason` in the
 * JSON body, or `?reason=` (for DELETE). HTTP callers always record as `manual`; other sources
 * (delivery revisions, template changes, reviewers) pass their own context to the process functions.
 */
export const readChangeContext = (req: Request): ConventionChangeContext => {
  const body = req.body as Record<string, unknown> | undefined;
  const fromBody = typeof body?.change_reason === 'string' ? body.change_reason : undefined;
  const fromQuery = typeof req.query.reason === 'string' ? req.query.reason : undefined;
  const reason = (fromBody ?? fromQuery ?? '').trim().slice(0, MAX_REASON_LENGTH);
  return { source_type: 'manual', reason };
};
