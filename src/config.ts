export const config = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  SESSION_TIMEOUT_MS: parseInt(process.env.SESSION_TIMEOUT_MS || String(60 * 60 * 1000), 10),
  CLAUDE_COMMAND: process.env.CLAUDE_COMMAND || 'claude',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
} as const;
