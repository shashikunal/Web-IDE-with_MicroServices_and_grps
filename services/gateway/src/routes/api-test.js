import express from 'express';
import { config, redisClient, asyncHandler } from '../../../common/src/index.js';

const router = express.Router();

const apiTestServiceUrl = `http://${config.services.apitest.host}:${config.services.apitest.port}`;

// Collections - List all collections for authenticated user
router.get('/collections', asyncHandler(async (req, res) => {
  const cacheKey = `apitest:${req.user.userId}:collections`;
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return res.json({ success: true, collections: cached.collections || [], requests: cached.requests || [], fromCache: true });
  }

  const response = await fetch(`${apiTestServiceUrl}/collections/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();

  if (data.success) {
    // Also fetch requests for these collections
    const reqResponse = await fetch(`${apiTestServiceUrl}/requests/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: req.user.userId })
    });
    const reqData = await reqResponse.json();
    
    const result = {
      collections: data.collections || [],
      requests: reqData.requests || []
    };
    
    await redisClient.set(cacheKey, result, 600);
    return res.json({ success: true, ...result });
  }

  res.status(response.status).json(data);
}));

// Collections - Create new collection
router.post('/collections', asyncHandler(async (req, res) => {
  await redisClient.delete(`apitest:${req.user.userId}:collections`);

  const response = await fetch(`${apiTestServiceUrl}/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, ...req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

// Collections - Update collection
router.put('/collections/:id', asyncHandler(async (req, res) => {
  await redisClient.delete(`apitest:${req.user.userId}:collections`);

  const response = await fetch(`${apiTestServiceUrl}/collections/${req.params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, ...req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

// Collections - Delete collection
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

// Requests - List requests (optionally filtered by collection)
router.get('/requests', asyncHandler(async (req, res) => {
  const { collectionId } = req.query;

  const response = await fetch(`${apiTestServiceUrl}/requests/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, collectionId })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

// Requests - Create new request
router.post('/requests', asyncHandler(async (req, res) => {
  await redisClient.delete(`apitest:${req.user.userId}:collections`);

  const response = await fetch(`${apiTestServiceUrl}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, request: req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

// Requests - Update request
router.put('/requests/:id', asyncHandler(async (req, res) => {
  await redisClient.delete(`apitest:${req.user.userId}:collections`);

  const response = await fetch(`${apiTestServiceUrl}/requests/${req.params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, ...req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

// Requests - Delete request
router.delete('/requests/:id', asyncHandler(async (req, res) => {
  await redisClient.delete(`apitest:${req.user.userId}:collections`);

  const response = await fetch(`${apiTestServiceUrl}/requests/${req.params.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

// Environments - List environments
router.get('/environments', asyncHandler(async (req, res) => {
  const cacheKey = `apitest:${req.user.userId}:environments`;
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return res.json({ success: true, environments: cached, fromCache: true });
  }

  const response = await fetch(`${apiTestServiceUrl}/environments/list`, {
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

// Environments - Create new environment
router.post('/environments', asyncHandler(async (req, res) => {
  await redisClient.delete(`apitest:${req.user.userId}:environments`);

  const response = await fetch(`${apiTestServiceUrl}/environments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, environment: req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

// Environments - Update environment
router.put('/environments/:id', asyncHandler(async (req, res) => {
  await redisClient.delete(`apitest:${req.user.userId}:environments`);

  const response = await fetch(`${apiTestServiceUrl}/environments/${req.params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, ...req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

// Environments - Delete environment
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

// History - List history
router.get('/history', asyncHandler(async (req, res) => {
  const response = await fetch(`${apiTestServiceUrl}/history/list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, limit: 100 })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

// History - Add to history
router.post('/history', asyncHandler(async (req, res) => {
  const response = await fetch(`${apiTestServiceUrl}/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, history: req.body })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

// Execute - Run API request
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
