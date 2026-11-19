/** A request the ticket-build service rejects with a specific HTTP status (400/404/409/503). */
export class TicketBuildRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'TicketBuildRequestError';
    this.status = status;
  }
}
