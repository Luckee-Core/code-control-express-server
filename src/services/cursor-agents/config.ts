/** CURSOR_API_KEY, or null when unset (ticket builds can't start without it). */
export const readCursorApiKey = (): string | null => process.env.CURSOR_API_KEY?.trim() || null;

/** Cloud agent model (CURSOR_AGENT_MODEL, default composer-2.5). */
export const getCursorAgentModelId = (): string => process.env.CURSOR_AGENT_MODEL?.trim() || 'composer-2.5';
