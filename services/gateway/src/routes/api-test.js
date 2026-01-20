import express from 'express';
import { config, redisClient, asyncHandler } from '../../../common/src/index.js';

const router = express.Router();

const apiTestServiceUrl = `http://${config.services.apitest.host}:${config.services.apitest.port}`;

router.get('/collections', asyncHandler(async (req, res) => {
  const cacheKey = `apitest:${req.user.userId}:collections`;
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return res.json({ success: true, collections: cached, fromCache: true });
  }

  const response = await fetch(`${apiTestServiceUrl}/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();

  if (data.success) {
    await redisClient.set(cacheKey, data.collections, 600);
  }

  res.status(response.status).json(data);
}));

router.post('/collections', asyncHandler(async (req, res) => {
  await redisClient.delete(`apitest:${req.user.userId}:collections`);

  const response = await fetch(`${apiTestServiceUrl}/collections`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, ...req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.delete('/collections/:id', asyncHandler(async (req, res) => {
  await redisClient.delete(`apitest:${req.user.userId}:collections`);

  const response = await fetch(`${apiTestServiceUrl}/collections/${req.params.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.get('/requests', asyncHandler(async (req, res) => {
  const { collectionId } = req.query;

  const response = await fetch(`${apiTestServiceUrl}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, collectionId })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.post('/requests', asyncHandler(async (req, res) => {
  const response = await fetch(`${apiTestServiceUrl}/requests`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, ...req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.delete('/requests/:id', asyncHandler(async (req, res) => {
  const response = await fetch(`${apiTestServiceUrl}/requests/${req.params.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.get('/environments', asyncHandler(async (req, res) => {
  const cacheKey = `apitest:${req.user.userId}:environments`;
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return res.json({ success: true, environments: cached, fromCache: true });
  }

  const response = await fetch(`${apiTestServiceUrl}/environments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();

  if (data.success) {
    await redisClient.set(cacheKey, data.environments, 600);
  }

  res.status(response.status).json(data);
}));

router.post('/environments', asyncHandler(async (req, res) => {
  await redisClient.delete(`apitest:${req.user.userId}:environments`);

  const response = await fetch(`${apiTestServiceUrl}/environments`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, ...req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.delete('/environments/:id', asyncHandler(async (req, res) => {
  await redisClient.delete(`apitest:${req.user.userId}:environments`);

  const response = await fetch(`${apiTestServiceUrl}/environments/${req.params.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.get('/history', asyncHandler(async (req, res) => {
  const response = await fetch(`${apiTestServiceUrl}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, limit: 100 })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.post('/execute', asyncHandler(async (req, res) => {
  const response = await fetch(`${apiTestServiceUrl}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, ...req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

export default router;
