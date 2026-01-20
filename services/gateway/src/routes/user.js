import express from 'express';
import { config, redisClient, asyncHandler, AuthorizationError } from '../../../common/src/index.js';

const router = express.Router();

const userServiceUrl = `http://${config.services.user.host}:${config.services.user.port}`;

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AuthorizationError(`Required role: ${roles.join(' or ')}`);
    }
    next();
  };
};

router.get('/profile', asyncHandler(async (req, res) => {
  const cacheKey = `user:${req.user.userId}:profile`;
  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return res.json({ success: true, profile: cached, fromCache: true });
  }

  const response = await fetch(`${userServiceUrl}/user/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();

  if (data.success) {
    await redisClient.set(cacheKey, data.profile, config.redis.ttl.user);
  }

  res.status(response.status).json(data);
}));

router.put('/profile', asyncHandler(async (req, res) => {
  await redisClient.delete(`user:${req.user.userId}:profile`);

  const response = await fetch(`${userServiceUrl}/user/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId, ...req.body })
  });

  const data = await response.json();

  if (data.success) {
    await redisClient.set(`user:${req.user.userId}:profile`, data.profile, config.redis.ttl.user);
  }

  res.status(response.status).json(data);
}));

router.get('/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const cacheKey = `user:${userId}`;

  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return res.json({ success: true, user: cached, fromCache: true });
  }

  const response = await fetch(`${userServiceUrl}/user/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: req.user.userId })
  });

  const data = await response.json();

  if (data.success) {
    await redisClient.set(cacheKey, data.user, config.redis.ttl.user);
  }

  res.status(response.status).json(data);
}));

export default router;
