# Code Playground - Phase 1

A VS Code-like playground with Docker code execution and node-pty terminals.

## Features

- ✨ Monaco Editor (VS Code's editor)
- 🖥️ **node-pty** terminal (proper pseudo-terminal with full ANSI support)
- 🐳 **Per-user Docker containers** via node-pty.spawn()
- 📦 JavaScript, Python, C++, Go support
- 💾 MongoDB snippet persistence
- 🎨 Dark theme IDE layout

## Quick Start

### Docker Compose

```bash
docker-compose up --build
```

Open http://localhost:3000

### Local Development

```bash
# Start MongoDB
mongod --dbpath ./data

# Backend
cd backend && npm install && npm start

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

## node-pty Integration

```javascript
const pty = require('node-pty');

// Create pseudo-terminal
const ptyProcess = pty.spawn('docker', ['run', '-it', '--rm', 'node:18-alpine', 'sh'], {
  name: 'xterm-color',
  cols: 80,
  rows: 24,
  env: { TERM: 'xterm-256color' }
});

// PTY → WebSocket
ptyProcess.onData((data) => {
  ws.send(data);
});

// WebSocket → PTY
ws.on('message', (msg) => {
  ptyProcess.write(msg);
});

// Cleanup
ws.on('close', () => {
  ptyProcess.kill('SIGTERM');
});
```

## Architecture

```
Browser
    │
    ├─ HTTP ──▶ Express API (Snippets, /execute)
    │
    └─ WS ──▶ node-pty.spawn() ──▶ Docker run -it node:18-alpine sh
                   │
                   └─ Full PTY with ANSI escape codes
                   └─ Interactive commands
                   └─ Proper cursor/color control
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/execute | Execute code once |
| GET | /api/snippets | List snippets |
| POST | /api/snippets | Save snippet |
| DELETE | /api/snippets/:id | Delete snippet |
| WS | /ws | Interactive node-pty terminal |

## Environment Variables

```
MONGODB_URI=mongodb://localhost:27017/codedamn
PORT=3000
```
