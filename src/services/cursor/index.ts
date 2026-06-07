/**
 * Cursor API service exports
 */

export * from './cursor-api-client';

import { CursorApiClient } from './cursor-api-client';

/**
 * Get Cursor API client instance
 * 
 * @returns Cursor API client
 * @throws Error if CURSOR_API_KEY is not set
 */
export const getCursorClient = (): CursorApiClient => {
  const apiKey = process.env.CURSOR_API_KEY;
  
  if (!apiKey) {
    throw new Error('CURSOR_API_KEY environment variable is not set');
  }
  
  return new CursorApiClient(apiKey);
};
