/** A request the proposal service rejects with a specific HTTP status (400/404/409/503). */
export class ProposalRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ProposalRequestError';
    this.status = status;
  }
}
