import type { Response } from 'express';
import { logHandlerError } from './log-handler-error';

/**
 * Logs a handler failure and sends `500 { success: false, error }`.
 */
export const sendHandlerError = (res: Response, label: string, error: unknown): void => {
  logHandlerError(label, error);
  res.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error occurred',
  });
};
