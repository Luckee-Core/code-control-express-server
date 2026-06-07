/**
 * Normalize n8n "Respond to Webhook" shapes: top-level object, or [ { data: [ item ] } ], or [ item ].
 */

export const unwrapN8nWebhookPayload = (parsed: unknown): Record<string, unknown> | null => {
  if (!parsed || typeof parsed !== 'object') return null;
  if (!Array.isArray(parsed)) return parsed as Record<string, unknown>;
  if (parsed.length === 0) return null;
  const first = parsed[0] as Record<string, unknown>;
  const data = first?.data;
  if (Array.isArray(data) && data.length > 0 && data[0] && typeof data[0] === 'object') {
    return data[0] as Record<string, unknown>;
  }
  return first;
};
