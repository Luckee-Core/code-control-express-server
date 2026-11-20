/**
 * An agent-run request the caller can fix (bad state, missing data). Handlers map `status` to the
 * HTTP response; anything else is a 500.
 */
export class AgentRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AgentRequestError';
    this.status = status;
  }
}
