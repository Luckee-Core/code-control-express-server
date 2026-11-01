import type { Request, Response } from 'express';
import { requestOpsTrackerDeleteCustomer } from '../../ops-tracker-client/request-ops-tracker-delete-customer';

const CUSTOMER_PATH =
  /^\/customers\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/** Forwards DELETE /customers/:id to my-ops storage invoke (deleteCustomer). */
export const proxyDeleteHandler = async (req: Request, res: Response): Promise<void> => {
  console.log('📥 [crm-proxy] proxyDeleteHandler');
  const rawParam = req.params.customerId;
  const paramId = typeof rawParam === 'string' ? rawParam.trim() : rawParam?.[0]?.trim();
  const path = (req.path || req.url || '/').split('?')[0] || '/';
  const match = paramId ? null : path.match(CUSTOMER_PATH);
  const customerId = paramId ?? match?.[1];

  if (!customerId) {
    res.status(404).json({ success: false, error: `Unsupported CRM DELETE path: ${path}` });
    return;
  }

  try {
    const result = await requestOpsTrackerDeleteCustomer(customerId);
    if (!result.success) {
      const status = result.status >= 400 && result.status < 600 ? result.status : 502;
      res.status(status).json({ success: false, error: result.error });
      return;
    }
    console.log('📤 [crm-proxy] proxyDeleteHandler ok');
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ proxyDeleteHandler error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete customer',
    });
  }
};
