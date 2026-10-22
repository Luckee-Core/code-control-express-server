import { StorageUnavailableError } from '../../services/storage-client';

/**
 * One line for storage outages; full error (stack) for anything unexpected.
 */
export const logHandlerError = (label: string, error: unknown): void => {
  if (error instanceof StorageUnavailableError) {
    console.error(`❌ ${label}: ${error.message}`);
    return;
  }
  console.error(`❌ ${label}:`, error);
};
