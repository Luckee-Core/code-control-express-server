/** A request the build-run service rejects with a specific HTTP status (400/404/409). */
export class SystemBuildRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'SystemBuildRequestError';
    this.status = status;
  }
}
