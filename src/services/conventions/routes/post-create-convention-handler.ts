import type { Request, Response } from 'express';
import { logHandlerError } from '../../../utils/http/log-handler-error';
import { requireDataClient } from '../../../utils/http/require-data-client';
import { processCreateConvention } from '../process-create-convention';

/**
 * Handles POST /api/data/conventions.
 */
export const postCreateConventionHandler = async (req: Request, res: Response): Promise<void> => {
  const client = requireDataClient(res);
  if (!client) return;

  const { key, domain_key, topic_key, title, statement, rationale, severity, status, check_kind, check_config, sort_order } =
    req.body ?? {};
  const required = { key, domain_key, topic_key, title, statement };
  const missing = Object.entries(required)
    .filter(([, value]) => typeof value !== 'string' || !value.trim())
    .map(([name]) => name);
  if (missing.length) {
    res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(', ')}` });
    return;
  }

  console.log('📥 POST /api/data/conventions', { key });
  try {
    const convention = await processCreateConvention(client, {
      key: key.trim(),
      domain_key: domain_key.trim(),
      topic_key: topic_key.trim(),
      title: title.trim(),
      statement: statement.trim(),
      ...(rationale !== undefined && { rationale }),
      ...(severity !== undefined && { severity }),
      ...(status !== undefined && { status }),
      ...(check_kind !== undefined && { check_kind }),
      ...(check_config !== undefined && { check_config }),
      ...(sort_order !== undefined && { sort_order }),
    });
    res.status(201).json({ success: true, data: convention });
  } catch (error) {
    logHandlerError('Error in POST /api/data/conventions', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
};
