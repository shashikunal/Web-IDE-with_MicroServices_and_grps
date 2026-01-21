import express from 'express';
import { config, redisClient, rabbitMQClient, asyncHandler } from '../../../common/src/index.js';

const router = express.Router();

const workspaceServiceUrl = `http://${config.services.workspace.host}:${config.services.workspace.port}`;

router.get('/', asyncHandler(async (req, res) => {
  const cacheKey = `workspaces:${req.user.userId}:list`;
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return res.json({ success: true, workspaces: cached.workspaces, total: cached.total, fromCache: true });
  }

  const response = await fetch(`${workspaceServiceUrl}/workspace/${req.user.userId}/list`);

  const data = await response.json();

  if (data.success) {
    await redisClient.set(cacheKey, { workspaces: data.workspaces, total: data.total }, config.redis.ttl.workspace);
  }

  res.status(response.status).json(data);
}));

router.get('/:workspaceId', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const cacheKey = `workspace:${req.user.userId}:${workspaceId}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return res.json({ success: true, workspace: cached, fromCache: true });
  }

  const response = await fetch(`${workspaceServiceUrl}/workspace/${workspaceId}`, {
    method: 'POST', // Service uses POST to fetch single workspace with userId in body
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();

  if (data.success) {
    await redisClient.set(cacheKey, data.workspace, config.redis.ttl.workspace);
  }

  res.status(response.status).json(data);
}));

router.post('/', asyncHandler(async (req, res) => {
  await redisClient.delete(`workspaces:${req.user.userId}:list`);

  const response = await fetch(`${workspaceServiceUrl}/workspace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, ...req.body })
  });

  const data = await response.json();

  if (data.success) {
    await rabbitMQClient.publishWorkspaceEvent('workspace.created', {
      workspaceId: data.workspace.id,
      userId: req.user.userId,
      templateId: data.workspace.templateId
    });
  }

  res.status(response.status).json(data);
}));

router.delete('/:workspaceId', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  await redisClient.delete(`workspaces:${req.user.userId}:list`);
  await redisClient.deletePattern(`workspace:${req.user.userId}:${workspaceId}:*`);

  const response = await fetch(`${workspaceServiceUrl}/workspace/${workspaceId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();

  if (data.success) {
    await rabbitMQClient.publishWorkspaceEvent('workspace.deleted', {
      workspaceId,
      userId: req.user.userId
    });
  }

  res.status(response.status).json(data);
  res.status(response.status).json(data);
}));

router.post('/:workspaceId/stop', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  await redisClient.delete(`workspaces:${req.user.userId}:list`);
  await redisClient.deletePattern(`workspace:${req.user.userId}:${workspaceId}:*`);

  const response = await fetch(`${workspaceServiceUrl}/workspace/${workspaceId}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.post('/:workspaceId/start', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  await redisClient.delete(`workspaces:${req.user.userId}:list`);
  await redisClient.deletePattern(`workspace:${req.user.userId}:${workspaceId}:*`);

  const response = await fetch(`${workspaceServiceUrl}/workspace/${workspaceId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.post('/:workspaceId/ensure-running', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  
  const response = await fetch(`${workspaceServiceUrl}/workspace/${workspaceId}/ensure-running`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();
  
  // If container was started/created, invalidate cache
  if (data.success) {
    await redisClient.delete(`workspaces:${req.user.userId}:list`);
    await redisClient.deletePattern(`workspace:${req.user.userId}:${workspaceId}:*`);
  }
  
  res.status(response.status).json(data);
}));

router.get('/:workspaceId/files', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { path = '.' } = req.query;
  const cacheKey = `workspace:${req.user.userId}:${workspaceId}:files:${Buffer.from(path).toString('base64')}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return res.json({ success: true, files: cached.files, currentPath: cached.currentPath, fromCache: true });
  }

  const response = await fetch(`${workspaceServiceUrl}/workspace/${workspaceId}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, path })
  });

  const data = await response.json();

  if (data.success) {
    await redisClient.set(cacheKey, { files: data.files, currentPath: data.currentPath }, 300);
  }

  res.status(response.status).json(data);
}));

router.get('/:workspaceId/file', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { path } = req.query;

  const response = await fetch(`${workspaceServiceUrl}/workspace/${workspaceId}/file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, filePath: path })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.post('/:workspaceId/file', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  await redisClient.deletePattern(`workspace:${req.user.userId}:${workspaceId}:*`);

  const response = await fetch(`${workspaceServiceUrl}/workspace/${workspaceId}/file`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, ...req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.post('/:workspaceId/directory', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  await redisClient.deletePattern(`workspace:${req.user.userId}:${workspaceId}:*`);

  const response = await fetch(`${workspaceServiceUrl}/workspace/${workspaceId}/directory`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, ...req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.delete('/:workspaceId/file', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  await redisClient.deletePattern(`workspace:${req.user.userId}:${workspaceId}:*`);

  const response = await fetch(`${workspaceServiceUrl}/workspace/${workspaceId}/file`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, ...req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.get('/:workspaceId/tree', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { path = '.' } = req.query;

  const response = await fetch(`${workspaceServiceUrl}/workspace/${workspaceId}/tree`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, rootPath: path })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.post('/:workspaceId/file/move', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { sourcePath, destinationPath } = req.body;
  await redisClient.deletePattern(`workspace:${req.user.userId}:${workspaceId}:*`);

  const response = await fetch(`${workspaceServiceUrl}/workspace/${workspaceId}/file/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, sourcePath, destinationPath })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.post('/:workspaceId/file/copy', asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { sourcePath, destinationPath } = req.body;
  await redisClient.deletePattern(`workspace:${req.user.userId}:${workspaceId}:*`);

  const response = await fetch(`${workspaceServiceUrl}/workspace/${workspaceId}/file/copy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, sourcePath, destinationPath })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

export default router;
