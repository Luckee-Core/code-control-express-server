import type { CursorApiClient, Agent } from '../../services/cursor';

/**
 * Poll Cursor agent status until completion or timeout
 * 
 * @param cursorClient - Cursor API client
 * @param agentId - Agent ID to poll
 * @param maxWaitMs - Maximum time to wait in milliseconds (default: 5 minutes)
 * @param pollIntervalMs - Interval between polls in milliseconds (default: 5 seconds)
 * @returns Final agent state
 * @throws Error if timeout or agent fails
 */
export const pollAgentStatus = async (
  cursorClient: CursorApiClient,
  agentId: string,
  maxWaitMs: number = 5 * 60 * 1000, // 5 minutes
  pollIntervalMs: number = 5000 // 5 seconds
): Promise<Agent> => {
  const startTime = Date.now();
  
  while (true) {
    const agent = await cursorClient.getAgent(agentId);
    
    console.log(`🔍 Agent ${agentId} status: ${agent.status}`);
    
    if (agent.status === 'FINISHED') {
      console.log(`✅ Agent ${agentId} finished successfully`);
      return agent;
    }
    
    if (agent.status === 'FAILED') {
      const errorMsg = agent.summary || 'Agent failed without error message';
      console.error(`❌ Agent ${agentId} failed: ${errorMsg}`);
      throw new Error(`Code generation failed: ${errorMsg}`);
    }
    
    if (agent.status === 'STOPPED') {
      console.error(`⏸️ Agent ${agentId} was stopped`);
      throw new Error('Code generation was stopped');
    }
    
    // Check timeout
    const elapsed = Date.now() - startTime;
    if (elapsed >= maxWaitMs) {
      console.error(`⏱️ Agent ${agentId} timed out after ${elapsed}ms`);
      throw new Error(`Code generation timed out after ${Math.round(elapsed / 1000)}s`);
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
};
