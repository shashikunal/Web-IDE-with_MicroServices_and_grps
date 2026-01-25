import express from 'express';
import { config, redisClient, asyncHandler } from '../../../common/src/index.js';

const router = express.Router();

const workspaceServiceUrl = `http://${process.env.WORKSPACE_HOST || 'localhost'}:${config.services.workspace.port}`;

router.post('/move', asyncHandler(async (req, res) => {
  const { userId, sourcePath, destinationPath } = req.body;

  if (!userId || !sourcePath || !destinationPath) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const workspaceId = req.body.workspaceId;
  if (!workspaceId) {
    return res.status(400).json({ success: false, message: 'workspaceId is required' });
  }

  const response = await fetch(`${workspaceServiceUrl}/workspace/${workspaceId}/file/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, sourcePath, destinationPath })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.post('/copy', asyncHandler(async (req, res) => {
  const { userId, sourcePath, destinationPath } = req.body;

  if (!userId || !sourcePath || !destinationPath) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const workspaceId = req.body.workspaceId;
  if (!workspaceId) {
    return res.status(400).json({ success: false, message: 'workspaceId is required' });
  }

  const response = await fetch(`${workspaceServiceUrl}/workspace/${workspaceId}/file/copy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, sourcePath, destinationPath })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

export default router;
