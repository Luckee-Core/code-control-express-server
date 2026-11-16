import { createHash } from 'crypto';

/**
 * Returns the sha256 hex digest of AI context text.
 */
export const hashAiContext = (text: string): string => createHash('sha256').update(text, 'utf8').digest('hex');
