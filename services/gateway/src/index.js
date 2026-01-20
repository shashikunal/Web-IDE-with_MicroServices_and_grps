import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import {
  config, redisClient, rabbitMQClient, logger, asyncHandler, AuthenticationError, AuthorizationError
} from '../../common/src/index.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import workspaceRoutes from './routes/workspace.js';
import containerRoutes from './routes/container.js';
import snippetRoutes from './routes/snippet.js';
import apiTestRoutes from './routes/api-test.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = config.services.gateway.port;

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  req.startTime = Date.now();
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const cachedUser = await redisClient.get(`session:${token}`);
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        throw new AuthenticationError('Invalid token');
      }
      req.user = decoded;
      next();
    });
  } catch (error) {
    next(error);
  }
};

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/workspaces', authenticateToken, workspaceRoutes);
app.use('/api/container', authenticateToken, containerRoutes);
app.use('/api/snippets', authenticateToken, snippetRoutes);
app.use('/api/apitest', authenticateToken, apiTestRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

app.use('/ws/terminal', (req, res) => {
  const userId = req.query.userId;
  const workspaceId = req.query.workspaceId;

  if (!userId || !workspaceId) {
    return res.status(400).json({ error: 'userId and workspaceId required' });
  }

  const wsUrl = `ws://localhost:${config.services.terminal.port}`;
  res.json({ websocketUrl: wsUrl, userId, workspaceId });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      redis: redisClient.isConnected ? 'connected' : 'disconnected',
      rabbitmq: rabbitMQClient.isConnected ? 'connected' : 'disconnected'
    }
  });
});

app.use((err, req, res, next) => {
  logger.error(`[${req.requestId}] Error:`, err);

  if (err instanceof AuthenticationError) {
    return res.status(401).json({
      success: false,
      message: err.message,
      code: err.code
    });
  }

  if (err instanceof AuthorizationError) {
    return res.status(403).json({
      success: false,
      message: err.message,
      code: err.code
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    code: err.code || 'INTERNAL_ERROR'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    code: 'NOT_FOUND'
  });
});

async function startServer() {
  try {
    await redisClient.connect();
    await rabbitMQClient.connect();

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`API Gateway running on port ${PORT}`);
    });
    server.setTimeout(300000); // 5 minutes timeout

    // WebSocket proxy for terminal connections
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', async (request, socket, head) => {
      const url = new URL(request.url, `http://${request.headers.host}`);

      // Handle terminal WebSocket connections
      if (url.pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, async (ws) => {
          const userId = url.searchParams.get('userId');
          const termId = url.searchParams.get('termId');
          const containerId = url.searchParams.get('containerId');

          if (!userId || !termId) {
            ws.close(1008, 'Missing userId or termId');
            return;
          }

          logger.info(`WebSocket connection for user ${userId}, terminal ${termId}, container ${containerId}`);

          // Connect to terminal service
          const WebSocket = (await import('ws')).default;
          // Forward containerId if present
          const terminalWsUrl = `ws://terminal-service:${config.services.terminal.port}/ws/${termId}${containerId ? `?containerId=${containerId}` : ''}`;
          const terminalWs = new WebSocket(terminalWsUrl);

          terminalWs.on('open', () => {
            logger.info(`Connected to terminal service for ${termId}`);
          });

          // Proxy messages between frontend and terminal service
          ws.on('message', (data) => {
            if (terminalWs.readyState === 1) { // OPEN
              terminalWs.send(data);
            }
          });

          terminalWs.on('message', (data) => {
            if (ws.readyState === 1) { // OPEN
              ws.send(data);
            }
          });

          ws.on('close', () => {
            logger.info(`Frontend WebSocket closed for ${termId}`);
            terminalWs.close();
          });

          terminalWs.on('close', () => {
            logger.info(`Terminal service WebSocket closed for ${termId}`);
            ws.close();
          });

          ws.on('error', (err) => {
            logger.error('Frontend WebSocket error:', err);
            terminalWs.close();
          });

          terminalWs.on('error', (err) => {
            logger.error('Terminal service WebSocket error:', err);
            ws.close();
          });
        });
      } else {
        socket.destroy();
      }
    });

  } catch (error) {
    logger.error('Failed to start API Gateway:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await redisClient.close();
  await rabbitMQClient.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await redisClient.close();
  await rabbitMQClient.close();
  process.exit(0);
});

export default app;
