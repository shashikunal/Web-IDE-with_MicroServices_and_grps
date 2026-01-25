import express from 'express';
import grpc from '@grpc/grpc-js';
import { WebSocketServer } from 'ws';
import pty from 'node-pty';
import { v4 as uuidv4 } from 'uuid';
import Docker from 'dockerode';
import { config, redisClient, grpcHelper, logger } from '../../common/src/index.js';
import terminalProto from './proto/terminal.js';

const app = express();
const PORT = config.services.terminal.port;
const GRPC_PORT = config.grpc.ports.terminal;
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

app.use(express.json());

const sessions = new Map();

app.post('/session', (req, res) => {
  const { userId, workspaceId, containerId, cols = 80, rows = 24 } = req.body;
  const sessionId = uuidv4();
  sessions.set(sessionId, { userId, workspaceId, containerId, cols, rows, exec: null, status: 'created' });
  res.json({ success: true, sessionId, websocketUrl: `ws://localhost:${PORT}/ws/${sessionId}` });
});

app.get('/sessions/:userId', (req, res) => {
  const userSessions = [];
  for (const [sessionId, session] of sessions) {
    if (session.userId === req.params.userId) {
      userSessions.push({ sessionId, ...session, exec: undefined });
    }
  }
  res.json({ success: true, sessions: userSessions });
});

app.delete('/sessions/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (session) {
    sessions.delete(req.params.sessionId);
    res.json({ success: true, message: 'Session killed' });
  } else {
    res.status(404).json({ success: false, message: 'Session not found' });
  }
});

// WebSocket setup for docker exec terminals
const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', async (ws, req) => {
    const url = new URL(req.url, `http://localhost:${PORT + 1}`);
    const sessionId = url.pathname.split('/').pop();

    // Extract containerId from query params
    const containerId = url.searchParams.get('containerId');

    let session = sessions.get(sessionId);

    // Update containerId if provided
    if (session && containerId) {
      session.containerId = containerId;
    }

    // Auto-create session if it doesn't exist
    if (!session) {
      logger.info(`Auto-creating session for ${sessionId}, container: ${containerId}`);
      session = {
        userId: 'auto',
        workspaceId: 'auto',
        containerId: containerId || null,
        cols: 80,
        rows: 24,
        exec: null,
        status: 'created'
      };
      sessions.set(sessionId, session);
    }

    session.status = 'connected';
    session.ws = ws;

    if (!session.containerId) {
      logger.error(`No container ID for session ${sessionId}`);
      ws.send('\r\n\x1b[1;31mError: No container specified\x1b[0m\r\n');
      ws.close();
      return;
    }

    try {
      const startupCmd = (sessionId === 'main')
        ? ['/bin/sh', '-c', 'if [ -f /tmp/app.log ]; then echo -e "\\r\\n\\033[38;5;39m●\\033[0m \\033[1mDevelopment Server Active\\033[0m"; echo -e "\\033[90m  Streaming logs. Press Ctrl+C to use terminal.\\033[0m\\r\\n"; trap : INT; tail -f /tmp/app.log; trap - INT; fi; exec /bin/sh']
        : ['/bin/sh'];

      // Arguments for docker exec
      // -it: interactive tty
      // -w: working directory
      // -e: environment variables for color support
      const args = [
        'exec',
        '-it',
        '-w', '/workspace',
        '-e', 'TERM=xterm-256color',
        '-e', 'COLORTERM=truecolor',
        session.containerId,
        ...startupCmd
      ];

      logger.info(`Spawning PTY with args: ${args.join(' ')}`);

      const ptyProcess = pty.spawn('docker', args, {
        name: 'xterm-256color',
        cols: session.cols || 80,
        rows: session.rows || 24,
        cwd: process.env.HOME,
        env: process.env
      });

      session.pty = ptyProcess;

      // Send data from PTY to WebSocket
      ptyProcess.on('data', (data) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(data);
        }
      });

      // Send data from WebSocket to PTY
      ws.on('message', (message) => {
        try {
          const msgStr = message.toString();
          // Check for JSON resize message
          if (msgStr.trim().startsWith('{')) {
            const msg = JSON.parse(msgStr);
            if (msg.type === 'resize') {
              ptyProcess.resize(msg.cols, msg.rows);
              return;
            }
          }
          // Otherwise write to terminal
          ptyProcess.write(msgStr);
        } catch (e) {
          // Fallback just in case
          console.error(e);
          ptyProcess.write(message.toString());
        }
      });

      // Handle cleanup
      ws.on('close', () => {
        logger.info(`WebSocket closed for session ${sessionId}`);
        ptyProcess.kill();
        sessions.delete(sessionId);
      });

      ptyProcess.on('exit', (code) => {
        logger.info(`PTY exited with code ${code} for session ${sessionId}`);
        ws.close();
      });

      logger.info(`Terminal session ${sessionId} connected to container ${session.containerId} via node-pty`);

    } catch (error) {
      logger.error('Failed to start node-pty:', error);
      ws.send(`\r\n\x1b[1;31mError: ${error.message}\x1b[0m\r\n`);
      ws.close(1011, 'Failed to start terminal');
    }
  });
};

const terminalServiceImpl = {
  CreateSession: async (call, callback) => {
    try {
      const { userId, workspaceId, containerId, cols = 80, rows = 24 } = call.request;
      const sessionId = uuidv4();
      sessions.set(sessionId, { userId, workspaceId, containerId, cols, rows, exec: null, status: 'created' });
      callback(null, {
        success: true,
        session: { sessionId, userId, workspaceId, status: 'created', cols, rows },
        websocketUrl: `ws://localhost:${PORT}/ws/${sessionId}`
      });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },
  ExecuteCommand: async (call, callback) => {
    try {
      const { userId, sessionId, command, timeout = 10000 } = call.request;
      const session = sessions.get(sessionId);
      if (!session || session.userId !== userId) {
        return callback(null, { success: false, message: 'Session not found' });
      }

      callback(null, { success: false, message: 'Use WebSocket for command execution' });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },
  GetActiveSessions: async (call, callback) => {
    try {
      const { userId } = call.request;
      const userSessions = [];
      for (const [sessionId, session] of sessions) {
        if (session.userId === userId) {
          userSessions.push({ sessionId, userId, workspaceId: session.workspaceId, status: session.status, cols: session.cols, rows: session.rows });
        }
      }
      callback(null, { success: true, sessions: userSessions });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },
  KillSession: async (call, callback) => {
    try {
      const { userId, sessionId } = call.request;
      const session = sessions.get(sessionId);
      if (!session || session.userId !== userId) {
        return callback(null, { success: false, message: 'Session not found' });
      }
      if (session.stream) {
        session.stream.end();
      }
      sessions.delete(sessionId);
      callback(null, { success: true, message: 'Session killed' });
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  },
  ResizeTerminal: async (call, callback) => {
    try {
      const { sessionId, cols, rows } = call.request;
      const session = sessions.get(sessionId);
      if (session && session.exec) {
        await session.exec.resize({ h: rows, w: cols });
        callback(null, { success: true, message: 'Terminal resized' });
      } else {
        callback(null, { success: false, message: 'Session not found' });
      }
    } catch (error) {
      callback(null, { success: false, message: error.message });
    }
  }
};

async function startServer() {
  try {
    await redisClient.connect();
    const server = app.listen(PORT, '0.0.0.0', () => logger.info(`Terminal HTTP & WS running on ${PORT}`));
    setupWebSocket(server);
    const grpcServer = await grpcHelper.createServer(GRPC_PORT);
    grpcHelper.addServiceToServer(grpcServer, terminalProto, 'TerminalService', terminalServiceImpl);
    await grpcHelper.startServer(grpcServer);
    logger.info(`Terminal gRPC running on ${GRPC_PORT}`);
  } catch (error) {
    logger.error('Failed to start Terminal Service:', error);
    process.exit(1);
  }
}

startServer();
process.on('SIGTERM', async () => {
  for (const session of sessions.values()) {
    if (session.stream) session.stream.end();
  }
  await redisClient.close();
  process.exit(0);
});
export default app;
