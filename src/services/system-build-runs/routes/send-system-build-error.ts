import type { Response } from 'express';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { SystemBuildRequestError } from '../system-build-request-error';

/**
 * Sends a SystemBuildRequestError with its status, anything else as 500.
 */
export const sendSystemBuildError = (res: Response, label: string, error: unknown): void => {
  if (error instanceof SystemBuildRequestError) {
    console.warn(`⚠️ ${label}: ${error.message}`);
    res.status(error.status).json({ success: false, error: error.message });
    return;
  }
  sendHandlerError(res, label, error);
};
