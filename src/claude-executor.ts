import { spawn } from 'child_process';
import { createInterface } from 'readline';
import type { Message, ClaudeExecutionResult, ExecutorYield, ActivityEvent } from './types.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { parseWorkflowIds } from './response-parser.js';

function formatConversation(history: Message[], newMessage: string): string {
  const parts: string[] = [];

  for (const msg of history) {
    if (msg.role === 'user') {
      parts.push(`Human: ${msg.content}`);
    } else {
      parts.push(`Assistant: ${msg.content}`);
    }
  }

  parts.push(`Human: ${newMessage}`);

  return parts.join('\n\n');
}

function generateActivityId(): string {
  return Math.random().toString(36).substring(2, 15);
}

interface ParsedLine {
  type: 'text' | 'activity' | 'none';
  content?: string;
  event?: ActivityEvent;
}

function processLine(line: string, currentToolId: { value: string | null }): ParsedLine {
  if (!line.trim()) return { type: 'none' };

  try {
    const parsed = JSON.parse(line);

    // Tool use start - content_block_start with tool_use type
    if (parsed.type === 'content_block_start' && parsed.content_block?.type === 'tool_use') {
      const toolName = parsed.content_block.name;
      const toolId = parsed.content_block.id;
      currentToolId.value = toolId;

      return {
        type: 'activity',
        event: {
          id: generateActivityId(),
          type: 'tool_start',
          timestamp: new Date(),
          toolName,
          toolId,
        },
      };
    }

    // Tool result
    if (parsed.type === 'result') {
      const event: ActivityEvent = {
        id: generateActivityId(),
        type: 'tool_result',
        timestamp: new Date(),
        toolId: currentToolId.value || undefined,
        result: {
          success: !parsed.is_error,
          error: parsed.is_error ? parsed.error : undefined,
        },
      };
      currentToolId.value = null;
      return { type: 'activity', event };
    }

    // Text content from assistant message
    if (parsed.type === 'assistant' && parsed.message?.content) {
      for (const block of parsed.message.content) {
        if (block.type === 'text' && block.text) {
          return { type: 'text', content: block.text };
        }
      }
    }

    // Streaming text delta
    if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
      return { type: 'text', content: parsed.delta.text };
    }

    // Message delta text
    if (parsed.type === 'message_delta' && parsed.delta?.text) {
      return { type: 'text', content: parsed.delta.text };
    }
  } catch {
    logger.debug('Non-JSON line from Claude', { line });
  }

  return { type: 'none' };
}

export async function* executeClaudeCommand(
  history: Message[],
  newMessage: string
): AsyncGenerator<ExecutorYield, ClaudeExecutionResult, unknown> {
  const conversation = formatConversation(history, newMessage);

  logger.debug('Executing Claude command', { historyLength: history.length });

  const proc = spawn(config.CLAUDE_COMMAND, ['-p', '--verbose', '--output-format', 'stream-json', '--dangerously-skip-permissions'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  proc.stdin.write(conversation);
  proc.stdin.end();

  let fullResponse = '';
  const currentToolId = { value: null as string | null };

  // Create readline interface for real-time line processing
  const rl = createInterface({
    input: proc.stdout,
    crlfDelay: Infinity,
  });

  // Process lines as they arrive
  for await (const line of rl) {
    const result = processLine(line, currentToolId);

    if (result.type === 'text' && result.content) {
      fullResponse += result.content;
      yield { type: 'text', content: result.content };
    } else if (result.type === 'activity' && result.event) {
      yield { type: 'activity', event: result.event };
    }
  }

  // Wait for process to complete
  await new Promise<void>((resolve, reject) => {
    proc.on('close', (code) => {
      if (code !== 0) {
        logger.error('Claude process exited with error', { code });
      }
      resolve();
    });
    proc.on('error', reject);
  });

  // Handle stderr
  proc.stderr.on('data', (data: Buffer) => {
    logger.warn('Claude stderr', { data: data.toString() });
  });

  const detectedWorkflowIds = parseWorkflowIds(fullResponse);

  return {
    response: fullResponse,
    detectedWorkflowIds,
  };
}
