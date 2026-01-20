import express from 'express';
import { config, asyncHandler, AuthorizationError } from '../../../common/src/index.js';

const router = express.Router();

const adminServiceUrl = `http://${config.services.admin.host}:${config.services.admin.port}`;

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    throw new AuthorizationError('Admin access required');
  }
  next();
};

router.use(requireAdmin);

router.get('/users', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role, isActive } = req.query;

  const response = await fetch(`${adminServiceUrl}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      adminId: req.user.userId,
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined
    })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.get('/users/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const response = await fetch(`${adminServiceUrl}/admin/users/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId: req.user.userId })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.put('/users/:userId/roles', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { roles } = req.body;

  const response = await fetch(`${adminServiceUrl}/admin/users/${userId}/roles`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId: req.user.userId, userId, roles })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.put('/users/:userId/deactivate', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  const response = await fetch(`${adminServiceUrl}/admin/users/${userId}/deactivate`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId: req.user.userId, userId, reason })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.put('/users/:userId/activate', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const response = await fetch(`${adminServiceUrl}/admin/users/${userId}/activate`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId: req.user.userId, userId })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.post('/users/bulk-roles', asyncHandler(async (req, res) => {
  const { userIds, roles } = req.body;

  const response = await fetch(`${adminServiceUrl}/admin/users/bulk-roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId: req.user.userId, userIds, roles })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.get('/stats', asyncHandler(async (req, res) => {
  const response = await fetch(`${adminServiceUrl}/admin/stats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId: req.user.userId })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

router.get('/dashboard', asyncHandler(async (req, res) => {
  const { period = '7d' } = req.query;

  const response = await fetch(`${adminServiceUrl}/admin/dashboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId: req.user.userId, period })
  });

  const data = await response.json();
  res.status(response.status).json(data);
}));

export default router;
