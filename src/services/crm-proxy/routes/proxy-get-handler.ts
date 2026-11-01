import type { Request, Response } from 'express';
import { requestOpsTracker } from '../../ops-tracker-client';

/** Forwards GET to my-ops storage via main gateway (CRM proxy). */
export const proxyGetHandler = async (req: Request, res: Response): Promise<void> => {
  const path = (req.path || req.url || '/').split('?')[0] || '/';
  const result = await requestOpsTracker<unknown>(path);
  if (!result.success) {
    res.status(result.status).json({ success: false, error: result.error });
    return;
  }
  res.status(200).json({ success: true, data: result.data });
};
