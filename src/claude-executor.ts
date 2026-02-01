import { spawn } from 'child_process';
import type { Message, ClaudeExecutionResult } from './types.js';
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

export async function* executeClaudeCommand(
  history: Message[],
  newMessage: string
): AsyncGenerator<string, ClaudeExecutionResult, unknown> {
  const conversation = formatConversation(history, newMessage);

  logger.debug('Executing Claude command', { historyLength: history.length });

  const proc = spawn(config.CLAUDE_COMMAND, ['-p', '--verbose', '--output-format', 'stream-json', '--dangerously-skip-permissions'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  proc.stdin.write(conversation);
  proc.stdin.end();

  let fullResponse = '';
  let buffer = '';

  const processLine = (line: string): string | null => {
    if (!line.trim()) return null;

    try {
      const parsed = JSON.parse(line);

      if (parsed.type === 'assistant' && parsed.message?.content) {
        for (const block of parsed.message.content) {
          if (block.type === 'text' && block.text) {
            return block.text;
          }
        }
      }

      if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
        return parsed.delta.text;
      }

      if (parsed.type === 'message_delta' && parsed.delta?.text) {
        return parsed.delta.text;
      }
    } catch {
      logger.debug('Non-JSON line from Claude', { line });
    }

    return null;
  };

  const dataPromise = new Promise<string>((resolve, reject) => {
    const chunks: string[] = [];

    proc.stdout.on('data', (data: Buffer) => {
      chunks.push(data.toString());
    });

    proc.stderr.on('data', (data: Buffer) => {
      logger.warn('Claude stderr', { data: data.toString() });
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        logger.error('Claude process exited with error', { code });
      }
      resolve(chunks.join(''));
    });

    proc.on('error', reject);
  });

  const rawOutput = await dataPromise;
  buffer = rawOutput;

  const lines = buffer.split('\n');
  for (const line of lines) {
    const text = processLine(line);
    if (text) {
      fullResponse += text;
      yield text;
    }
  }

  const detectedWorkflowIds = parseWorkflowIds(fullResponse);

  return {
    response: fullResponse,
    detectedWorkflowIds,
  };
}
