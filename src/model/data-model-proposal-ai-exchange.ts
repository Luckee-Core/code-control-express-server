export type DataModelProposalAiPurpose = 'generate' | 'revise' | 'auto_fix';

export type DataModelProposalAiResponseStatus = 'ok' | 'error';

/** Input for recordDataModelProposalAiExchange (request + response + exchange in one transaction). */
export type RecordDataModelProposalAiExchangeInput = {
  proposal_id: string;
  purpose: DataModelProposalAiPurpose;
  model: string;
  system_prompt: string;
  user_message: string;
  output_schema: Record<string, unknown>;
  status: DataModelProposalAiResponseStatus;
  raw_text: string;
  parsed: unknown;
  stop_reason: string | null;
  served_by_model: string;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  error: string | null;
};

/** One AI call for a proposal, without the prompt bodies (list view). */
export type DataModelProposalAiExchangeSummary = {
  exchange_id: string;
  proposal_id: string;
  request_id: string;
  response_id: string;
  purpose: DataModelProposalAiPurpose;
  model: string;
  served_by_model: string;
  status: DataModelProposalAiResponseStatus;
  stop_reason: string | null;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  error: string | null;
  created_at: string;
};
