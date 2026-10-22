/** Storage Express could not be reached (refused, DNS, or timed out). */
export class StorageUnavailableError extends Error {
  constructor(
    readonly baseUrl: string,
    readonly reason: 'unreachable' | 'timeout',
    readonly timeoutMs?: number,
  ) {
    super(
      reason === 'timeout'
        ? `Storage Express timed out after ${timeoutMs}ms at ${baseUrl}`
        : `Storage Express unreachable at ${baseUrl}. Start code-generator-storage-server.`,
    );
    this.name = 'StorageUnavailableError';
  }
}
