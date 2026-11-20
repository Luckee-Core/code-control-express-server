import type { Response } from 'express';
import { sendHandlerError } from '../../../utils/http/send-handler-error';
import { CodegenTemplateError } from '../../codegen';
import { ProposalRequestError } from '../../data-model-proposals/proposal-request-error';
import { AgentRequestError } from '../agent-request-error';

/**
 * Maps agent-run errors to responses: request errors keep their status, template problems are
 * 422, anything else is a logged 500.
 */
export const sendAgentError = (res: Response, label: string, error: unknown): void => {
  if (error instanceof AgentRequestError || error instanceof ProposalRequestError) {
    console.warn(`⚠️ ${label}: ${error.message}`);
    res.status(error.status).json({ success: false, error: error.message });
    return;
  }
  if (error instanceof CodegenTemplateError) {
    console.warn(`⚠️ ${label}: ${error.message}`);
    res.status(422).json({ success: false, error: error.message });
    return;
  }
  sendHandlerError(res, label, error);
};
