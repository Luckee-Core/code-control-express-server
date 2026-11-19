import type { Response } from 'express';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { TicketBuildRequestError } from '../ticket-build-request-error';

/**
 * Sends a TicketBuildRequestError with its status, anything else as 500.
 */
export const sendTicketBuildError = (res: Response, label: string, error: unknown): void => {
  if (error instanceof TicketBuildRequestError) {
    console.warn(`⚠️ ${label}: ${error.message}`);
    res.status(error.status).json({ success: false, error: error.message });
    return;
  }
  sendHandlerError(res, label, error);
};
