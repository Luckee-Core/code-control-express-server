/**
 * Logs handler failures (message only for known Error; full value otherwise).
 */
export const logHandlerError = (label: string, error: unknown): void => {
  if (error instanceof Error) {
    console.error(`❌ ${label}: ${error.message}`);
    return;
  }
  console.error(`❌ ${label}:`, error);
};
