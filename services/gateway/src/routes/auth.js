import express from 'express';
import jwt from 'jsonwebtoken';
import { config, redisClient, rabbitMQClient, asyncHandler } from '../../../common/src/index.js';

const router = express.Router();

const authServiceUrl = `http://${config.services.auth.host}:${config.services.auth.port}`;

router.post('/register', asyncHandler(async (req, res) => {
  const response = await fetch(`${authServiceUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body)
  });

  const data = await response.json();

  if (data.success && data.accessToken) {
    await redisClient.set(
      `session:${data.accessToken}`,
      { userId: data.user.id, role: data.user.role, email: data.user.email },
      config.redis.ttl.session
    );

    await rabbitMQClient.publishAuthEvent('user.registered', {
      userId: data.user.id,
      email: data.user.email,
      role: data.user.role
    });
  }

  res.status(response.status).json(data);
}));

router.post('/login', asyncHandler(async (req, res) => {
  const response = await fetch(`${authServiceUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body)
  });

  const data = await response.json();

  if (data.success && data.accessToken) {
    await redisClient.set(
      `session:${data.accessToken}`,
      { userId: data.user.id, role: data.user.role, email: data.user.email },
      config.redis.ttl.session
    );

    await rabbitMQClient.publishAuthEvent('user.login', {
      userId: data.user.id,
      email: data.user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  res.status(response.status).json(data);
}));

router.post('/logout', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    await redisClient.delete(`session:${token}`);
  }

  res.json({ success: true, message: 'Logged out successfully' });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const response = await fetch(`${authServiceUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  const data = await response.json();

  if (data.success && data.accessToken) {
    await redisClient.set(
      `session:${data.accessToken}`,
      { userId: data.user.id, role: data.user.role, email: data.user.email },
      config.redis.ttl.session
    );
  }

  res.status(response.status).json(data);
}));

router.get('/verify', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const cachedUser = await redisClient.get(`session:${token}`);
  if (cachedUser) {
    return res.json({
      success: true,
      valid: true,
      userId: cachedUser.userId,
      role: cachedUser.role,
      email: cachedUser.email
    });
  }

  const response = await fetch(`${authServiceUrl}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));
// Alias /me to verify logic for frontend compatibility
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const cachedUser = await redisClient.get(`session:${token}`);
  if (cachedUser) {
    return res.json({
      success: true,
      user: {
        _id: cachedUser.userId, // Map for frontend compatibility
        id: cachedUser.userId,
        email: cachedUser.email,
        role: cachedUser.role,
        roles: [cachedUser.role] // Map for frontend
      }
    });
  }

  // Fallback to calling verify on auth service
  const response = await fetch(`${authServiceUrl}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });

  const data = await response.json();
  if (data.success && data.valid) {
    // Map response to match what frontend expects from /me
    return res.json({
      success: true,
      user: {
        _id: data.userId,
        id: data.userId,
        email: data.email,
        role: data.role,
        roles: [data.role]
      }
    });
  }

  res.status(response.status).json(data);
}));

export default router;
