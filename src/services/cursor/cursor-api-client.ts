/**
 * Cursor Cloud Agents API Client
 * 
 * Provides methods to interact with Cursor's Cloud Agents API for programmatic code generation.
 * 
 * @see https://cursor.com/docs/cloud-agent/api/endpoints
 */

export type AgentStatus = 'CREATING' | 'RUNNING' | 'FINISHED' | 'STOPPED' | 'FAILED';

export type LaunchAgentRequest = {
  prompt: {
    text: string;
    images?: Array<{
      data: string;
      dimension: {
        width: number;
        height: number;
      };
    }>;
  };
  source: {
    repository: string;
    ref?: string;
  };
  target?: {
    autoCreatePr?: boolean;
    openAsCursorGithubApp?: boolean;
    skipReviewerRequest?: boolean;
    branchName?: string;
  };
  model?: string;
  webhook?: {
    url: string;
    secret?: string;
  };
};

export type Agent = {
  id: string;
  status: AgentStatus;
  source: {
    repository: string;
    ref?: string;
  };
  target: {
    branchName?: string;
    url?: string;
    prUrl?: string;
    autoCreatePr?: boolean;
    openAsCursorGithubApp?: boolean;
    skipReviewerRequest?: boolean;
  };
  summary?: string;
  createdAt: string;
};

export type AgentConversation = {
  id: string;
  messages: Array<{
    id: string;
    type: 'user_message' | 'assistant_message';
    text: string;
  }>;
};

export class CursorApiClient {
  private baseUrl = 'https://api.cursor.com';
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Cursor API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Get Basic Auth header
   */
  private getAuthHeader(): string {
    const encoded = Buffer.from(`${this.apiKey}:`).toString('base64');
    return `Basic ${encoded}`;
  }

  /**
   * Make authenticated request to Cursor API
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: this.getAuthHeader(),
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMessage = `Cursor API request failed with status ${response.status}`;
      try {
        const errorData = await response.json() as any;
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // Ignore JSON parse errors
      }

      if (response.status === 429) {
        throw new Error(`Rate limit exceeded: ${errorMessage}`);
      } else if (response.status === 401) {
        throw new Error(`Authentication failed: ${errorMessage}`);
      } else if (response.status === 403) {
        throw new Error(`Forbidden: ${errorMessage}`);
      } else if (response.status === 404) {
        throw new Error(`Not found: ${errorMessage}`);
      } else {
        throw new Error(errorMessage);
      }
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  /**
   * Launch a new code generation agent
   * 
   * @param request - Agent configuration
   * @returns Agent details including ID for polling
   */
  async launchAgent(request: LaunchAgentRequest): Promise<Agent> {
    return this.request<Agent>('POST', '/v0/agents', request);
  }

  /**
   * Get agent status and details
   * 
   * @param id - Agent ID
   * @returns Agent details including status and PR URL
   */
  async getAgent(id: string): Promise<Agent> {
    return this.request<Agent>('GET', `/v0/agents/${id}`);
  }

  /**
   * Get agent conversation history
   * 
   * @param id - Agent ID
   * @returns Conversation messages
   */
  async getAgentConversation(id: string): Promise<AgentConversation> {
    return this.request<AgentConversation>('GET', `/v0/agents/${id}/conversation`);
  }

  /**
   * Stop a running agent
   * 
   * @param id - Agent ID
   * @returns Agent ID
   */
  async stopAgent(id: string): Promise<{ id: string }> {
    return this.request<{ id: string }>('POST', `/v0/agents/${id}/stop`);
  }

  /**
   * Delete an agent
   * 
   * @param id - Agent ID
   * @returns Agent ID
   */
  async deleteAgent(id: string): Promise<{ id: string }> {
    return this.request<{ id: string }>('DELETE', `/v0/agents/${id}`);
  }
}
