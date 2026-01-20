import express from 'express';
import mongoose from 'mongoose';
import grpc from '@grpc/grpc-js';
import Dockerode from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import {
  config, redisClient, rabbitMQClient, grpcHelper, logger, asyncHandler
} from '../../common/src/index.js';
import workspaceProto from './proto/workspace.js';
import Workspace from './models/Workspace.js';
import Template from './models/Template.js';

const app = express();
const PORT = config.services.workspace.port;
const GRPC_PORT = config.grpc.ports.workspace;

app.use(express.json());

let docker;
try {
  docker = new Dockerode();
} catch (error) {
  logger.warn('Docker not available, container operations will fail');
}

const TEMPLATES_DIR = path.resolve(process.cwd(), 'templates');
const CONTAINER_MEMORY_LIMIT = '2g';
const CONTAINER_CPU_LIMIT = 2.0;

const templateConfigs = {
  'node-hello': {
    image: 'node:20-alpine',
    language: 'javascript',
    entrypoint: 'sh',
    cmd: ['-c', 'tail -f /dev/null'],
    port: 3000,
    files: {
      'package.json': JSON.stringify({
        name: 'node-hello',
        version: '1.0.0',
        main: 'index.js',
        scripts: { start: 'node index.js' }
      }, null, 2),
      'index.js': 'const express = require("express");\nconst app = express();\napp.get("/", (req, res) => res.send("Hello from Node.js!"));\napp.listen(3000, "0.0.0.0", () => console.log("Server running on port 3000"));'
    }
  },
  'react-app': {
    image: 'node:20-alpine',
    language: 'typescript',
    entrypoint: 'sh',
    // Keep container running so we can exec commands
    cmd: ['-c', 'tail -f /dev/null'],
    port: 5173
  },
  'python-flask': {
    image: 'python:3.11-alpine',
    language: 'python',
    entrypoint: 'sh',
    cmd: ['-c', 'pip install flask && python app.py'],
    port: 5000,
    files: {
      'app.py': 'from flask import Flask\napp = Flask(__name__)\n@app.route("/")\ndef hello(): return "Hello from Python Flask!"\nif __name__ == "__main__": app.run(host="0.0.0.0", port=5000)'
    }
  },
  'go-api': {
    image: 'golang:1.21-alpine',
    language: 'go',
    entrypoint: 'sh',
    cmd: ['-c', 'go mod init app && go run main.go'],
    port: 8080,
    files: {
      'main.go': 'package main\nimport ("fmt"\n"net/http")\nfunc main() {\n    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {\n        fmt.Fprintf(w, "Hello from Go!")\n    })\n    http.ListenAndServe(":8080", nil)\n}'
    }
  },
  'cpp-hello': {
    image: 'gcc:12-alpine',
    language: 'cpp',
    entrypoint: 'sh',
    cmd: ['-c', 'g++ -o main main.cpp && ./main'],
    port: null,
    files: {
      'main.cpp': '#include <iostream>\nint main() { std::cout << "Hello from C++!" << std::endl; return 0; }',
      'Makefile': 'all:\n\tg++ -o main main.cpp\nclean:\n\trm -f main'
    }
  },
  'html-site': {
    image: 'nginx:alpine',
    language: 'html',
    entrypoint: 'sh',
    cmd: ['-c', 'cp -r /workspace/* /usr/share/nginx/html && nginx -g "daemon off;"'],
    port: 80,
    files: {
      'index.html': '<!DOCTYPE html><html><head><title>Static Site</title></head><body><h1>Hello from HTML!</h1></body></html>',
      'style.css': 'body { font-family: sans-serif; padding: 20px; }',
      'app.js': 'console.log("Hello from JavaScript!");'
    }
  }
};

async function createContainer(userId, workspaceId, templateId) {
  if (!docker) throw new Error('Docker not available');

  const template = templateConfigs[templateId];
  if (!template) throw new Error('Invalid template');

  const containerId = `cp-${workspaceId.slice(0, 8)}-${Date.now().toString(36)}`;

  try {
    const image = await docker.getImage(template.image).inspect();
    if (!image) {
      await docker.pull(template.image);
    }

    // Create port bindings - map container port to a random host port
    const portBindings = {};
    if (template.port) {
      portBindings[`${template.port}/tcp`] = [{ HostPort: '0' }]; // '0' means Docker assigns a random available port
    }

    const container = await docker.createContainer({
      Image: template.image,
      Cmd: template.cmd,
      Entrypoint: template.entrypoint,
      Hostname: containerId,
      name: containerId,
      HostConfig: {
        CpuQuota: 200000,
        AutoRemove: false,
        // Bind the specific workspace directory so npm install finds package.json
        Binds: [
          (() => {
            if (process.env.HOST_WORKSPACES_PATH) {
              // Start with host path, normalize backslashes to forward slashes for Docker
              const root = process.env.HOST_WORKSPACES_PATH.replace(/\\/g, '/');
              return `${root}/${userId}/${workspaceId}:/workspace`;
            }
            return `${path.resolve(process.cwd(), 'workspaces', userId, workspaceId)}:/workspace`;
          })()
        ],
        PortBindings: portBindings
      },
      WorkingDir: '/workspace',
      ExposedPorts: template.port ? {
        [`${template.port}/tcp`]: {}
      } : {}
    });

    await container.start();

    // Initialize Project & Install Dependencies
    let setupScript = null;
    if (templateId === 'react-app') {
      setupScript = 'if [ ! -f package.json ]; then npm create vite@latest . -- --template react-ts --yes; fi && npm install';
    } else if (templateId === 'node-hello') {
      setupScript = 'npm install';
    }

    if (setupScript) {
      console.log(`[Container] Running setup for ${templateId}: ${setupScript}`);
      try {
        const exec = await container.exec({
          Cmd: ['sh', '-c', setupScript],
          AttachStdout: true,
          AttachStderr: true
        });
        const stream = await exec.start({});

        await new Promise((resolve, reject) => {
          stream.on('end', resolve);
          stream.on('error', reject);
          stream.resume();
        });
        console.log('[Container] Setup finished.');
      } catch (err) {
        console.error('[Container] Setup failed:', err);
      }
    }

    // Enforce Vite Config with Polling for React App
    if (templateId === 'react-app') {
      try {
        const workspacePath = path.resolve(process.cwd(), 'workspaces', userId, workspaceId);
        const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
      interval: 100,
      binaryInterval: 300
    }
  }
})
`;
        await fs.writeFile(path.join(workspacePath, 'vite.config.ts'), viteConfig);
        console.log('[Container] Enforced vite.config.ts with polling');
      } catch (err) {
        console.error('[Container] Failed to write vite.config.ts:', err);
      }
    }

    // Inspect to get mapped port
    let publicPort = 0;
    if (template.port) {
      const data = await container.inspect();
      const portKey = `${template.port}/tcp`;
      const bindings = data.NetworkSettings.Ports[portKey];
      const logMsg = `Inspecting container ${containerId}: PortKey=${portKey}, Bindings=${JSON.stringify(bindings)}`;
      logger.info(logMsg);
      console.log(logMsg);

      if (bindings && bindings.length > 0) {
        publicPort = parseInt(bindings[0].HostPort, 10);
      }
    }
    const createdMsg = `Container created: ${containerId}, Public Port: ${publicPort}`;
    logger.info(createdMsg);
    console.log(createdMsg);

    return { containerId: container.id, publicPort };
  } catch (error) {
    logger.error('Failed to create/start container:', error);
    throw error;
  }
}

app.post('/workspace', asyncHandler(async (req, res) => {
  const { userId, templateId = 'node-hello', language = 'javascript' } = req.body;

  const workspaceId = uuidv4();
  const workspacePath = path.resolve(process.cwd(), 'workspaces', userId, workspaceId);
  await fs.mkdir(workspacePath, { recursive: true });

  // Write template files
  const template = templateConfigs[templateId];
  if (template && template.files) {
    for (const [fileName, content] of Object.entries(template.files)) {
      const filePath = path.join(workspacePath, fileName);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content);
    }
  }

  let containerId = null;
  let publicPort = 0;

  try {
    const result = await createContainer(userId, workspaceId, templateId);
    containerId = result.containerId;
    publicPort = result.publicPort;
  } catch (error) {
    logger.warn('Container creation failed, continuing without container:', error.message);
  }

  const workspace = new Workspace({
    userId,
    workspaceId,
    templateId,
    templateName: templateId,
    language,
    containerId,
    publicPort,
    workspacePath,
    status: containerId ? 'running' : 'stopped'
  });

  await workspace.save();

  await rabbitMQClient.publishWorkspaceEvent('workspace.created', {
    workspaceId,
    userId,
    templateId,
    containerId
  });

  // Ensure publicPort is returned in the response
  res.status(201).json({ success: true, workspace });
}));

app.post('/workspace/:workspaceId', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId } = req.body;

  const workspace = await Workspace.findOne({ workspaceId, userId });
  if (!workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }

  res.json({ success: true, workspace });
}));

app.get('/workspace/:userId/list', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const workspaces = await Workspace.find({ userId }).sort({ createdAt: -1 });
  res.json({ success: true, workspaces, total: workspaces.length });
}));

app.delete('/workspace/:workspaceId', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId } = req.body;

  const workspace = await Workspace.findOne({ workspaceId, userId });
  if (!workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }

  if (workspace.containerId && docker) {
    try {
      const container = docker.getContainer(workspace.containerId);
      await container.stop({ t: 10 });
      await container.remove();
    } catch (error) {
      logger.warn('Failed to remove container:', error.message);
    }
  }

  await Workspace.findByIdAndDelete(workspace._id);

  await rabbitMQClient.publishWorkspaceEvent('workspace.deleted', {
    workspaceId,
    userId
  });

  res.json({ success: true, message: 'Workspace deleted' });
}));

app.post('/workspace/:workspaceId/files', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId, path: filePath } = req.body;

  const workspace = await Workspace.findOne({ workspaceId, userId });
  if (!workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }

  const fullPath = path.join(workspace.workspacePath, filePath || '.');

  try {
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      const files = await Promise.all(entries.map(async (entry) => {
        try {
          const entryPath = path.join(filePath || '.', entry.name);
          const absolutePath = path.join(fullPath, entry.name);
          let size = 0;
          let modifiedAt = new Date().toISOString();

          if (entry.isFile()) {
            const stat = await fs.stat(absolutePath);
            size = stat.size;
            modifiedAt = stat.mtime.toISOString();
          }

          return {
            id: entryPath,
            name: entry.name,
            path: entryPath,
            type: entry.isDirectory() ? 'directory' : 'file',
            isFolder: entry.isDirectory(),
            size,
            modifiedAt,
            children: [] // Always include children array for React
          };
        } catch (err) {
          console.error(`Error processing file ${entry.name}:`, err);
          return null;
        }
      }));

      const validFiles = files.filter(f => f !== null);
      res.json({ success: true, files: validFiles, currentPath: filePath || '.' });
    } else {
      res.json({
        success: true,
        files: [{
          id: filePath,
          name: path.basename(fullPath),
          path: filePath,
          type: 'file',
          isFolder: false,
          children: [] // Always include children array for React
        }],
        currentPath: path.dirname(filePath)
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.post('/workspace/:workspaceId/file', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId, filePath } = req.body;

  const workspace = await Workspace.findOne({ workspaceId, userId });
  if (!workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }

  try {
    const fullPath = path.join(workspace.workspacePath, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({ success: true, content });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.put('/workspace/:workspaceId/file', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId, path: filePath, content } = req.body;

  const workspace = await Workspace.findOne({ workspaceId, userId });
  if (!workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }

  try {
    const fullPath = path.join(workspace.workspacePath, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content || '');
    res.json({ success: true, message: 'File saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.put('/workspace/:workspaceId/directory', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId, path: dirPath } = req.body;

  const workspace = await Workspace.findOne({ workspaceId, userId });
  if (!workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }

  try {
    const fullPath = path.join(workspace.workspacePath, dirPath);
    await fs.mkdir(fullPath, { recursive: true });
    res.json({ success: true, message: 'Directory created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.delete('/workspace/:workspaceId/file', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId, path: filePath } = req.body;

  const workspace = await Workspace.findOne({ workspaceId, userId });
  if (!workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }

  try {
    const fullPath = path.join(workspace.workspacePath, filePath);
    const stats = await fs.stat(fullPath);

    if (stats.isDirectory()) {
      await fs.rm(fullPath, { recursive: true, force: true });
    } else {
      await fs.unlink(fullPath);
    }

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.post('/workspace/:workspaceId/tree', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId, rootPath = '.' } = req.body;

  const workspace = await Workspace.findOne({ workspaceId, userId });
  if (!workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }

  const buildTree = async (dirPath, relativePath = '') => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const children = [];

      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;

        const entryRelativePath = path.join(relativePath, entry.name);
        const entryAbsolutePath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          const subTree = await buildTree(entryAbsolutePath, entryRelativePath);
          children.push({
            name: entry.name,
            path: entryRelativePath,
            type: 'directory',
            isFolder: true,
            children: subTree
          });
        } else {
          const stats = await fs.stat(entryAbsolutePath);
          children.push({
            name: entry.name,
            path: entryRelativePath,
            type: 'file',
            isFolder: false,
            size: stats.size,
            children: [] // Always include children array, even for files
          });
        }
      }

      return children;
    } catch (error) {
      logger.error(`Error building tree for ${dirPath}:`, error);
      return [];
    }
  };

  try {
    const fullPath = path.join(workspace.workspacePath, rootPath);
    const tree = await buildTree(fullPath, rootPath === '.' ? '' : rootPath);

    res.json({
      success: true,
      root: {
        name: path.basename(workspace.workspacePath),
        path: '.',
        type: 'directory',
        isFolder: true,
        children: tree
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.post('/workspace/:workspaceId/file/move', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId, sourcePath, destinationPath } = req.body;

  const workspace = await Workspace.findOne({ workspaceId, userId });
  if (!workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }

  try {
    const sourceFullPath = path.join(workspace.workspacePath, sourcePath);
    const destFullPath = path.join(workspace.workspacePath, destinationPath);

    await fs.mkdir(path.dirname(destFullPath), { recursive: true });
    await fs.rename(sourceFullPath, destFullPath);

    res.json({ success: true, message: 'File moved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

app.post('/workspace/:workspaceId/file/copy', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId, sourcePath, destinationPath } = req.body;

  const workspace = await Workspace.findOne({ workspaceId, userId });
  if (!workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }

  try {
    const sourceFullPath = path.join(workspace.workspacePath, sourcePath);
    const destFullPath = path.join(workspace.workspacePath, destinationPath);

    const content = await fs.readFile(sourceFullPath);
    await fs.mkdir(path.dirname(destFullPath), { recursive: true });
    await fs.writeFile(destFullPath, content);

    res.json({ success: true, message: 'File copied successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

async function startServer() {
  try {
    const mongoUrl = `mongodb://${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.database}`;
    await mongoose.connect(mongoUrl, {
      user: config.mongodb.username,
      pass: config.mongodb.password
    });
    logger.info('Connected to MongoDB');

    await redisClient.connect();
    await rabbitMQClient.connect();

    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Workspace HTTP server running on port ${PORT}`);
    });

    const grpcServer = await grpcHelper.createServer(GRPC_PORT);
    grpcHelper.addServiceToServer(grpcServer, workspaceProto, 'WorkspaceService', {});
    await grpcHelper.startServer(grpcServer);
    logger.info(`Workspace gRPC server running on port ${GRPC_PORT}`);
  } catch (error) {
    logger.error('Failed to start Workspace Service:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down');
  await mongoose.connection.close();
  await redisClient.close();
  await rabbitMQClient.close();
  process.exit(0);
});

export default app;

