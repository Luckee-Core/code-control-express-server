import type { Response } from 'express';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { ProposalRequestError } from '../proposal-request-error';

/**
 * Sends a ProposalRequestError with its status, anything else as 500.
 */
export const sendProposalError = (res: Response, label: string, error: unknown): void => {
  if (error instanceof ProposalRequestError) {
    console.warn(`⚠️ ${label}: ${error.message}`);
    res.status(error.status).json({ success: false, error: error.message });
    return;
  }
  sendHandlerError(res, label, error);
};
