import type { Router, Request, Response } from 'express';
import { Router as createRouter } from 'express';
import type { FixRequest, FixResponse } from './types.js';
import { executeClaudeCommand } from './claude-executor.js';
import { logger } from './logger.js';

const FIX_PROMPT_TEMPLATE = `[AUTO-FIX REQUEST]

A workflow has failed and needs to be fixed automatically.

Workflow ID: {workflowId}
Workflow Name: {workflowName}
Failed Node: {failedNode}
Error Message: {errorMessage}
Execution ID: {executionId}

INSTRUCTIONS:
1. Use the n8n-mcp tool "n8n_get_workflow" to retrieve the full workflow configuration
2. Analyze the workflow structure and the error to diagnose the root cause
3. Fix the workflow using "n8n_update_partial_workflow" or "n8n_update_full_workflow"
4. After fixing, provide a summary

IMPORTANT: At the end of your response, include a JSON block with this exact format:
\`\`\`json
{
  "diagnosis": "Brief description of what caused the error",
  "fixApplied": "Description of the changes made to fix it",
  "summary": "One sentence summary of the fix"
}
\`\`\`

Now proceed to diagnose and fix the workflow.`;

function buildFixPrompt(request: FixRequest): string {
  return FIX_PROMPT_TEMPLATE
    .replace('{workflowId}', request.workflowId)
    .replace('{workflowName}', request.workflowName || 'Unknown')
    .replace('{failedNode}', request.failedNode || 'Unknown')
    .replace('{errorMessage}', request.errorMessage)
    .replace('{executionId}', request.executionId || 'Unknown');
}

function parseFixSummary(response: string): { diagnosis: string; fixApplied: string; summary: string } {
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        diagnosis: parsed.diagnosis || 'Unable to determine diagnosis',
        fixApplied: parsed.fixApplied || 'Fix details not provided',
        summary: parsed.summary || 'Fix applied',
      };
    } catch {
      logger.warn('Failed to parse fix summary JSON from response');
    }
  }

  return {
    diagnosis: 'See full response for details',
    fixApplied: 'See full response for details',
    summary: 'Fix attempted - check full response',
  };
}

export function createFixApiRouter(): Router {
  const router = createRouter();

  router.post('/api/fix', async (req: Request, res: Response) => {
    const request = req.body as FixRequest;

    if (!request.workflowId || !request.errorMessage) {
      logger.warn('Fix request missing required fields', { body: req.body });
      res.status(400).json({
        success: false,
        error: 'workflowId and errorMessage are required',
      } as Partial<FixResponse>);
      return;
    }

    logger.info('Processing fix request', {
      workflowId: request.workflowId,
      workflowName: request.workflowName,
      failedNode: request.failedNode,
    });

    try {
      const prompt = buildFixPrompt(request);

      let fullResponse = '';
      const generator = executeClaudeCommand([], prompt);

      let result = await generator.next();
      while (!result.done) {
        fullResponse += result.value;
        result = await generator.next();
      }

      const executionResult = result.value;
      fullResponse = executionResult.response;

      const { diagnosis, fixApplied, summary } = parseFixSummary(fullResponse);

      logger.info('Fix request completed', {
        workflowId: request.workflowId,
        summary,
      });

      const response: FixResponse = {
        success: true,
        workflowId: request.workflowId,
        diagnosis,
        fixApplied,
        summary,
        fullResponse,
      };

      res.json(response);
    } catch (error) {
      logger.error('Fix request failed', {
        workflowId: request.workflowId,
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        success: false,
        workflowId: request.workflowId,
        diagnosis: 'Fix process failed',
        fixApplied: 'None',
        summary: 'Error occurred during fix attempt',
        error: error instanceof Error ? error.message : 'Unknown error',
      } as FixResponse);
    }
  });

  return router;
}
