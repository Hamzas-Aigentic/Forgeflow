import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { config } from './config.js';
import { logger } from './logger.js';
import { createErrorRouter } from './error-router.js';
import { createFixApiRouter } from './fix-api.js';
import { handleWebSocketConnection } from './websocket-handler.js';
import { sessionManager } from './session-manager.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    sessions: sessionManager.getSessionCount(),
    timestamp: new Date().toISOString(),
  });
});

app.use(createErrorRouter());
app.use(createFixApiRouter());

const server = createServer(app);

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  handleWebSocketConnection(ws);
});

const cleanupInterval = setInterval(() => {
  sessionManager.cleanupStale();
}, 60000);

server.listen(config.PORT, () => {
  logger.info(`Forgeflow Bridge Server running on port ${config.PORT}`);
  logger.info(`WebSocket endpoint: ws://localhost:${config.PORT}/ws`);
  logger.info(`Health check: http://localhost:${config.PORT}/health`);
  logger.info(`Error callback: POST http://localhost:${config.PORT}/error-callback`);
  logger.info(`Fix API: POST http://localhost:${config.PORT}/api/fix`);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down...');
  clearInterval(cleanupInterval);
  wss.close();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down...');
  clearInterval(cleanupInterval);
  wss.close();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
