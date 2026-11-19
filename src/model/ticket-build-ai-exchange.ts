export type TicketBuildAiPurpose = 'plan' | 'revise';

export type TicketBuildAiResponseStatus = 'ok' | 'error';

/** Input for recordTicketBuildAiExchange (request + response + exchange in one transaction). */
export type RecordTicketBuildAiExchangeInput = {
  ticket_build_id: string;
  purpose: TicketBuildAiPurpose;
  model: string;
  system_prompt: string;
  user_message: string;
  output_schema: Record<string, unknown>;
  status: TicketBuildAiResponseStatus;
  raw_text: string;
  parsed: unknown;
  stop_reason: string | null;
  served_by_model: string;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  error: string | null;
};

/** One AI call for a ticket build, without the prompt bodies (list view). */
export type TicketBuildAiExchangeSummary = {
  exchange_id: string;
  ticket_build_id: string;
  request_id: string;
  response_id: string;
  purpose: TicketBuildAiPurpose;
  model: string;
  served_by_model: string;
  status: TicketBuildAiResponseStatus;
  stop_reason: string | null;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  error: string | null;
  created_at: string;
};
