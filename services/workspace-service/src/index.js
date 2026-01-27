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

import templateConfigs from './templates/index.js';



// Helper to parse memory string (e.g., "512m", "2g") to bytes
function parseMemory(memStr) {
    if (!memStr) return 0;
    const match = memStr.toString().match(/^(\d+)([gGmMkK]?)$/);
    if (!match) return 0;
    const val = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    switch (unit) {
        case 'g': return val * 1024 * 1024 * 1024;
        case 'm': return val * 1024 * 1024;
        case 'k': return val * 1024;
        default: return val;
    }
}

async function ensureApplicationRunning(container, templateId, force = false) {
  const template = templateConfigs[templateId];
  if (!template || !template.startCommand) return;

  try {
    if (!force) {
        // Check if process is already running to avoid duplicates
        // Using a simple check with ps aux. 
        const execCheck = await container.exec({
          Cmd: ['sh', '-c', 'ps aux'],
          AttachStdout: true,
          AttachStderr: false
        });
        
        const stream = await execCheck.start({});
        let output = '';
        
        await new Promise((resolve, reject) => {
            stream.on('data', chunk => output += chunk.toString());
            stream.on('end', resolve);
            stream.on('error', reject);
        });

        // Debug output
        // console.log(`[Container] ps aux output: ${output}`);

        // Simple heuristic: check if the command string is present in ps output
        // "npm run" is too generic and might match artifacts.
        // We check for the specific command or common framework binaries
        if (output.includes(template.startCommand)) {
           console.log(`[Container] Application '${template.startCommand}' appears to be running.`);
           return;
        }
        
        // Specific checks for frameworks to detect actual running servers
        if (templateId === 'nextjs' && output.includes('next-server')) {
             console.log(`[Container] Next.js server appears to be running.`);
             return;
        }
        if (templateId === 'react-app' && output.includes('vite')) {
             console.log(`[Container] Vite server appears to be running.`);
             return;
        }
        if (templateId === 'angular' && (output.includes('ng serve') || output.includes('angular-cli'))) {
             console.log(`[Container] Angular server appears to be running.`);
             return;
        }
        if ((templateId === 'express-app' || templateId === 'node-hello') && (output.includes('node') || output.includes('nodemon'))) {
             console.log(`[Container] Node/Express server appears to be running.`);
             return;
        }

        if (templateId === 'django' && (output.includes('manage.py runserver') || output.includes('python manage.py'))) {
             console.log(`[Container] Django server appears to be running.`);
             return;
        }
    }

    console.log(`[Container] Starting application with: ${template.startCommand}`);
    // we use a detached exec so it runs in background
    const execStart = await container.exec({
        Cmd: ['sh', '-c', `${template.startCommand} > /tmp/app.log 2>&1 &`],
        AttachStdout: false,
        AttachStderr: false
    });
    await execStart.start({ Detach: true });
    console.log('[Container] Application server started in background.');
  } catch (err) {
    console.error(`[Container] Failed to ensure application running: ${err.message}`);
  }
}

async function createContainer(userId, workspaceId, templateId, options = {}) {
  if (!docker) throw new Error('Docker not available');

  const template = templateConfigs[templateId];
  if (!template) throw new Error('Invalid template');

  const containerId = `cp-${workspaceId.slice(0, 8)}-${Date.now().toString(36)}`;
  const cpuLimit = options.cpu || 2.0;
  const memoryLimit = options.memory || '2g';
  const internalPort = options.port || template.port;

  try {
    try {
      await docker.getImage(template.image).inspect();
    } catch (error) {
      if (error.statusCode === 404) {
        logger.info(`Pulling image ${template.image}...`);
        const stream = await docker.pull(template.image);
        await new Promise((resolve, reject) => {
          docker.modem.followProgress(stream, (err, res) => err ? reject(err) : resolve(res));
        });
        logger.info(`Image ${template.image} pulled.`);
      } else {
        throw error;
      }
    }

    // ...
    // Create port bindings - map container port to a random host port
    const portBindings = {};
    if (internalPort) {
      portBindings[`${internalPort}/tcp`] = [{ HostPort: '0' }];
    }

    const container = await docker.createContainer({
      Image: template.image,
      Cmd: template.cmd,
      Entrypoint: template.entrypoint,
      Hostname: containerId,
      name: containerId,
      HostConfig: {
        NanoCpus: cpuLimit * 1000000000, 
        Memory: parseMemory(memoryLimit),
        AutoRemove: false,
        // Bind the specific workspace directory so npm install finds package.json
        Binds: [
          (() => {
            let hostPath;
            if (process.env.HOST_WORKSPACES_PATH) {
              hostPath = `${process.env.HOST_WORKSPACES_PATH}/${userId}/${workspaceId}`;
            } else {
              hostPath = path.resolve(process.cwd(), 'workspaces', userId, workspaceId);
            }
            // Normalize for Windows Docker: Replace backslashes with forward slashes
            let normalizedPath = hostPath.replace(/\\/g, '/');
            // Ensure drive letter is lowercased (e.g. C:/... -> c:/...) which is sometimes required by Docker Desktop
            if (normalizedPath.match(/^[A-Z]:/)) {
               normalizedPath = normalizedPath.charAt(0).toLowerCase() + normalizedPath.slice(1);
            }
            return `${normalizedPath}:/workspace`;
          })()
        ],
        PortBindings: portBindings
      },
      WorkingDir: '/workspace',
      ExposedPorts: internalPort ? {
        [`${internalPort}/tcp`]: {}
      } : {}
    });

    await container.start();
    console.log('[Container] Container started successfully');

    // Initialize Project & Install Dependencies
    const setupScript = template.setupScript;

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
  
    // Start the application server if a start command is defined
    await ensureApplicationRunning(container, templateId, true);

    // Inspect to get mapped port
    let publicPort = 0;
    if (internalPort) {
      const data = await container.inspect();
      const portKey = `${internalPort}/tcp`;
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
    await fs.appendFile('error.log', `[${new Date().toISOString()}] CreateContainer Error: ${error.message}\n${error.stack}\n`);
    throw error;
  }
}

app.post('/workspace', asyncHandler(async (req, res) => {
  const { userId, templateId = 'node-hello', language = 'javascript', title, description, cpu, memory, port } = req.body;

  console.log('=== WORKSPACE CREATION START ===');
  console.log('Request body:', { userId, templateId, language, title });

  const workspaceId = uuidv4();
  const workspacePath = path.resolve(process.cwd(), 'workspaces', userId, workspaceId);
  console.log('Workspace path:', workspacePath);
  
  await fs.mkdir(workspacePath, { recursive: true });
  console.log('Directory created successfully');

  // Write template files
  const template = templateConfigs[templateId];
  console.log('Template config:', { id: template?.id, hasFiles: !!template?.files, fileCount: Object.keys(template?.files || {}).length });
  
  if (template && template.files) {
    for (const [fileName, content] of Object.entries(template.files)) {
      const filePath = path.join(workspacePath, fileName);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content);
      console.log('File written:', fileName);
    }
  }

  let containerId = null;
  let publicPort = 0;

  // Only create container if template requires it (has a port or explicitly needs container)
  const needsContainer = template.port || template.requiresContainer;
  console.log('Needs container:', needsContainer);
  
  if (needsContainer) {
    try {
      console.log('Creating container for template:', templateId);
      const result = await createContainer(userId, workspaceId, templateId, { cpu, memory, port });
      containerId = result.containerId;
      publicPort = result.publicPort;
      console.log('Container created:', { containerId, publicPort });
    } catch (error) {
      console.error('Container creation failed:', error.message);
      logger.warn('Container creation failed (continuing without container):', error.message);
      // Continue without container - allows WASM languages to function
      containerId = null;
      publicPort = 0;
    }
  } else {
    console.log(`Template ${templateId} does not require container, skipping container creation`);
  }

  const workspace = new Workspace({
    userId,
    workspaceId,
    templateId,
    templateName: templateId, // This seems redundant or legacy, keeping it
    language,
    title: title || 'Untitled Workspace',
    description: description || '',
    cpu: cpu || 2.0,
    memory: memory || '2g',
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

app.post('/workspace/:workspaceId/stop', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId } = req.body;

  const workspace = await Workspace.findOne({ workspaceId, userId });
  if (!workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }

  if (workspace.containerId && docker) {
    try {
      const container = docker.getContainer(workspace.containerId);
      await container.stop();
      workspace.status = 'stopped';
      await workspace.save();
    } catch (error) {
      if (error.statusCode === 304) {
        // Container already stopped
        workspace.status = 'stopped';
        await workspace.save();
      } else if (error.statusCode === 404) {
        // Container not found, might have been removed
        workspace.status = 'stopped';
        workspace.containerId = null;
        await workspace.save();
      } else {
        throw error;
      }
    }
  } else {
    workspace.status = 'stopped';
    await workspace.save();
  }

  res.json({ success: true, message: 'Workspace stopped', status: 'stopped' });
}));

app.post('/workspace/:workspaceId/start', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId } = req.body;

  const workspace = await Workspace.findOne({ workspaceId, userId });
  if (!workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }

  if (workspace.containerId && docker) {
    try {
      const container = docker.getContainer(workspace.containerId);
      await container.start();
      await ensureApplicationRunning(container, workspace.templateId);
      workspace.status = 'running';
      await workspace.save();
    } catch (error) {
      if (error.statusCode === 304) {
         // Container already started
        await ensureApplicationRunning(container, workspace.templateId);
        workspace.status = 'running';
        await workspace.save();
      } else if (error.statusCode === 404) {
        // Container might be gone, try to recreate
        try {
             const result = await createContainer(userId, workspaceId, workspace.templateId);
             workspace.containerId = result.containerId;
             workspace.publicPort = result.publicPort;
             workspace.status = 'running';
             await workspace.save();
        } catch(createErr) {
             throw createErr;
        }
      } else {
        throw error;
      }
    }
  } else {
    // No container ID, create one
    try {
         const result = await createContainer(userId, workspaceId, workspace.templateId);
         workspace.containerId = result.containerId;
         workspace.publicPort = result.publicPort;
         workspace.status = 'running';
         await workspace.save();
    } catch(createErr) {
         throw createErr;
    }
  }

  res.json({ success: true, message: 'Workspace started', status: 'running', publicPort: workspace.publicPort });
}));

// Ensure container is running - check status and start if needed
app.post('/workspace/:workspaceId/ensure-running', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { userId } = req.body;

  const workspace = await Workspace.findOne({ workspaceId, userId });
  if (!workspace) {
    return res.status(404).json({ success: false, message: 'Workspace not found' });
  }

  if (!workspace.containerId || !docker) {
    // No container, create one
    try {
      const result = await createContainer(userId, workspaceId, workspace.templateId);
      workspace.containerId = result.containerId;
      workspace.publicPort = result.publicPort;
      workspace.status = 'running';
      await workspace.save();
      return res.json({
        success: true,
        message: 'Container created and started',
        status: 'running',
        containerId: workspace.containerId,
        publicPort: workspace.publicPort
      });
    } catch(createErr) {
      logger.error('Failed to create container:', createErr);
      return res.status(500).json({ success: false, message: `Failed to create container: ${createErr.message}` });
    }
  }

  // Check container status
  try {
    const container = docker.getContainer(workspace.containerId);
    const containerInfo = await container.inspect();

    const isRunning = containerInfo.State.Running;
    const isPaused = containerInfo.State.Paused;
    
    // Get the actual port mapping from Docker
    const template = templateConfigs[workspace.templateId];
    let actualPublicPort = workspace.publicPort; // Default to stored value
    
    if (template && template.port) {
      const portKey = `${template.port}/tcp`;
      const bindings = containerInfo.NetworkSettings.Ports[portKey];
      if (bindings && bindings.length > 0) {
        actualPublicPort = parseInt(bindings[0].HostPort, 10);
        // Update the database if the port has changed
        if (actualPublicPort !== workspace.publicPort) {
          logger.info(`Updating publicPort from ${workspace.publicPort} to ${actualPublicPort} for workspace ${workspaceId}`);
          workspace.publicPort = actualPublicPort;
        }
      }
    }

    if (isPaused) {
      // Unpause the container
      await container.unpause();
      workspace.status = 'running';
      await workspace.save();
      logger.info(`Container ${workspace.containerId} unpaused`);
      return res.json({
        success: true,
        message: 'Container unpaused',
        status: 'running',
        containerId: workspace.containerId,
        publicPort: workspace.publicPort
      });
    }

    if (!isRunning) {
      // Start the container
      await container.start();
      await ensureApplicationRunning(container, workspace.templateId);
      workspace.status = 'running';
      await workspace.save();
      logger.info(`Container ${workspace.containerId} started`);
      return res.json({
        success: true,
        message: 'Container started',
        status: 'running',
        containerId: workspace.containerId,
        publicPort: workspace.publicPort 
      });
    }
    
    // Container is already running - save any port updates
    await ensureApplicationRunning(container, workspace.templateId);
    workspace.status = 'running';
    await workspace.save();
    return res.json({ 
      success: true, 
      message: 'Container already running', 
      status: 'running',
      containerId: workspace.containerId,
      publicPort: workspace.publicPort 
    });
    
  } catch (error) {
    if (error.statusCode === 404) {
      // Container doesn't exist, create a new one
      logger.warn(`Container ${workspace.containerId} not found, creating new one`);
      try {
        const result = await createContainer(userId, workspaceId, workspace.templateId);
        workspace.containerId = result.containerId;
        workspace.publicPort = result.publicPort;
        workspace.status = 'running';
        await workspace.save();
        return res.json({ 
          success: true, 
          message: 'Container recreated and started', 
          status: 'running',
          containerId: workspace.containerId,
          publicPort: workspace.publicPort 
        });
      } catch(createErr) {
        logger.error('Failed to recreate container:', createErr);
        return res.status(500).json({ success: false, message: `Failed to recreate container: ${createErr.message}` });
      }
    } else if (error.statusCode === 304) {
      // Container already started
      const container = docker.getContainer(workspace.containerId);
      await ensureApplicationRunning(container, workspace.templateId);
      workspace.status = 'running';
      await workspace.save();
      return res.json({ 
        success: true, 
        message: 'Container already running', 
        status: 'running',
        containerId: workspace.containerId,
        publicPort: workspace.publicPort 
      });
    } else {
      logger.error('Error checking container status:', error);
      return res.status(500).json({ success: false, message: `Error checking container: ${error.message}` });
    }
  }
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
        if (entry.name === '.git') continue;

        const entryRelativePath = path.join(relativePath, entry.name);
        const entryAbsolutePath = path.join(dirPath, entry.name);

        if (entry.name === 'node_modules') {
          children.push({
            name: entry.name,
            path: entryRelativePath,
            type: 'directory',
            isFolder: true,
            children: []
          });
          continue;
        }

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
    // Normalize paths to be relative (remove leading slashes/backslashes)
    const safeSource = sourcePath.replace(/^[\/\\]+/, '');
    const safeDest = destinationPath.replace(/^[\/\\]+/, '');

    const sourceFullPath = path.join(workspace.workspacePath, safeSource);
    const destFullPath = path.join(workspace.workspacePath, safeDest);

    logger.info(`Attempting to move file from ${sourceFullPath} to ${destFullPath}`);

    await fs.mkdir(path.dirname(destFullPath), { recursive: true });
    
    try {
      await fs.rename(sourceFullPath, destFullPath);
    } catch (renameErr) {
      if (renameErr.code === 'EXDEV') {
        // Fallback for cross-device moves
        await fs.copyFile(sourceFullPath, destFullPath);
        await fs.unlink(sourceFullPath);
      } else {
        throw renameErr;
      }
    }

    res.json({ success: true, message: 'File moved successfully' });
  } catch (error) {
    logger.error(`Move file error: ${error.message}`, error);
    res.status(500).json({ success: false, message: `Move failed: ${error.message}` });
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

