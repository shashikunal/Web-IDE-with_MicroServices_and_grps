import express from 'express';
import { config, redisClient, asyncHandler } from '../../../common/src/index.js';

const router = express.Router();

const snippetServiceUrl = `http://${config.services.snippet.host}:${config.services.snippet.port}`;

router.get('/', asyncHandler(async (req, res) => {
  const cacheKey = `snippets:${req.user.userId}:list`;
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return res.json({ success: true, snippets: cached.snippets, total: cached.total, fromCache: true });
  }

  const response = await fetch(`${snippetServiceUrl}/snippet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, page: 1, limit: 100 })
  });

  const data = await response.json();

  if (data.success) {
    await redisClient.set(cacheKey, { snippets: data.snippets, total: data.total }, config.redis.ttl.workspace);
  }

  res.status(response.status).json(data);
}));

router.get('/:snippetId', asyncHandler(async (req, res) => {
  const { snippetId } = req.params;
  const cacheKey = `snippet:${req.user.userId}:${snippetId}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return res.json({ success: true, snippet: cached, fromCache: true });
  }

  const response = await fetch(`${snippetServiceUrl}/snippet/${snippetId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();

  if (data.success) {
    await redisClient.set(cacheKey, data.snippet, config.redis.ttl.workspace);
  }

  res.status(response.status).json(data);
}));

router.post('/', asyncHandler(async (req, res) => {
  await redisClient.delete(`snippets:${req.user.userId}:list`);

  const response = await fetch(`${snippetServiceUrl}/snippet`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, ...req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.put('/:snippetId', asyncHandler(async (req, res) => {
  const { snippetId } = req.params;
  await redisClient.delete(`snippets:${req.user.userId}:list`);
  await redisClient.delete(`snippet:${req.user.userId}:${snippetId}`);

  const response = await fetch(`${snippetServiceUrl}/snippet/${snippetId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, ...req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.delete('/:snippetId', asyncHandler(async (req, res) => {
  const { snippetId } = req.params;
  await redisClient.delete(`snippets:${req.user.userId}:list`);
  await redisClient.delete(`snippet:${req.user.userId}:${snippetId}`);

  const response = await fetch(`${snippetServiceUrl}/snippet/${snippetId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

export default router;
