import express from 'express';
import mongoose from 'mongoose';
import grpc from '@grpc/grpc-js';
import { config, redisClient, grpcHelper, logger, asyncHandler, AuthorizationError } from '../../common/src/index.js';
import adminProto from './proto/admin.js';
import User from './models/User.js';
import Workspace from './models/Workspace.js';
import Snippet from './models/Snippet.js';
import ApiHistory from './models/ApiHistory.js';

const app = express();
const PORT = config.services.admin.port;
const GRPC_PORT = config.grpc.ports.admin;

app.use(express.json());

const checkAdmin = async (adminId) => {
  const admin = await User.findById(adminId);
  if (!admin || admin.role !== 'admin') throw new AuthorizationError('Admin access required');
};

app.post('/users', asyncHandler(async (req, res) => {
  const { adminId, page = 1, limit = 20, search, role, isActive } = req.body;
  await checkAdmin(adminId);
  const query = {};
  if (search) query.$or = [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive;
  const skip = (page - 1) * limit;
  const users = await User.find(query).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 });
  const total = await User.countDocuments(query);
  res.json({ success: true, users, total, page, totalPages: Math.ceil(total / limit) });
}));

app.post('/users/:userId', asyncHandler(async (req, res) => {
  await checkAdmin(req.body.adminId);
  const user = await User.findById(req.params.userId).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user });
}));

app.put('/users/:userId/roles', asyncHandler(async (req, res) => {
  const { adminId, userId, roles } = req.body;
  await checkAdmin(adminId);
  await User.findByIdAndUpdate(userId, { role: roles[0] });
  res.json({ success: true, message: 'Roles updated' });
}));

app.put('/users/:userId/deactivate', asyncHandler(async (req, res) => {
  const { adminId, userId } = req.body;
  await checkAdmin(adminId);
  await User.findByIdAndUpdate(userId, { isActive: false });
  res.json({ success: true, message: 'User deactivated' });
}));

app.put('/users/:userId/activate', asyncHandler(async (req, res) => {
  const { adminId, userId } = req.body;
  await checkAdmin(adminId);
  await User.findByIdAndUpdate(userId, { isActive: true });
  res.json({ success: true, message: 'User activated' });
}));

app.post('/users/bulk-roles', asyncHandler(async (req, res) => {
  const { adminId, userIds, roles } = req.body;
  await checkAdmin(adminId);
  await User.updateMany({ _id: { $in: userIds } }, { role: roles[0] });
  res.json({ success: true, message: 'Bulk roles updated' });
}));

app.post('/stats', asyncHandler(async (req, res) => {
  await checkAdmin(req.body.adminId);
  const [totalUsers, activeUsers, admins, publishers, students, totalWorkspaces, totalSnippets] = await Promise.all([
    User.countDocuments(), User.countDocuments({ isActive: true }), User.countDocuments({ role: 'admin' }),
    User.countDocuments({ role: 'publisher' }), User.countDocuments({ role: 'student' }),
    Workspace.countDocuments(), Snippet.countDocuments()
  ]);
  res.json({ success: true, stats: { totalUsers, activeUsers, inactiveUsers: totalUsers - activeUsers, admins, publishers, students, totalWorkspaces, totalSnippets } });
}));

app.post('/dashboard', asyncHandler(async (req, res) => {
  await checkAdmin(req.body.adminId);
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [newUsers, activeSessions, requestsToday, requestsWeek] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    User.countDocuments({ lastLogin: { $gte: weekAgo } }),
    ApiHistory.countDocuments({ executedAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) } }),
    ApiHistory.countDocuments({ executedAt: { $gte: weekAgo } })
  ]);
  res.json({ success: true, stats: { newUsers, activeSessions, requestsToday, requestsWeek, avgResponseTime: 150 } });
}));

const adminServiceImpl = {
  GetAllUsers: async (call, callback) => {
    try {
      const { adminId, page = 1, limit = 20, search, role, isActive } = call.request;
      await checkAdmin(adminId);
      const query = {};
      if (search) query.$or = [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
      if (role) query.role = role;
      if (isActive !== undefined) query.isActive = isActive;
      const skip = (page - 1) * limit;
      const users = await User.find(query).select('-password').skip(skip).limit(limit).sort({ createdAt: -1 });
      const total = await User.countDocuments(query);
      callback(null, { success: true, users: users.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role, isActive: u.isActive, lastLogin: u.lastLogin?.toISOString() || '', createdAt: u.createdAt?.toISOString() || '' })), total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  GetUserDetails: async (call, callback) => {
    try {
      const { adminId, userId } = call.request;
      await checkAdmin(adminId);
      const user = await User.findById(userId).select('-password');
      if (!user) return callback(null, { success: false, message: 'User not found' });
      callback(null, { success: true, user: { id: user.id, username: user.username, email: user.email, role: user.role, isActive: user.isActive, lastLogin: user.lastLogin?.toISOString() || '', createdAt: user.createdAt?.toISOString() || '' } });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  UpdateUserRoles: async (call, callback) => {
    try {
      const { adminId, userId, roles } = call.request;
      await checkAdmin(adminId);
      await User.findByIdAndUpdate(userId, { role: roles[0] });
      callback(null, { success: true, message: 'Roles updated' });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  DeactivateUser: async (call, callback) => {
    try {
      const { adminId, userId } = call.request;
      await checkAdmin(adminId);
      await User.findByIdAndUpdate(userId, { isActive: false });
      callback(null, { success: true, message: 'User deactivated' });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  ActivateUser: async (call, callback) => {
    try {
      const { adminId, userId } = call.request;
      await checkAdmin(adminId);
      await User.findByIdAndUpdate(userId, { isActive: true });
      callback(null, { success: true, message: 'User activated' });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  BulkUpdateRoles: async (call, callback) => {
    try {
      const { adminId, userIds, roles } = call.request;
      await checkAdmin(adminId);
      await User.updateMany({ _id: { $in: userIds } }, { role: roles[0] });
      callback(null, { success: true, message: 'Bulk roles updated' });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  GetSystemStats: async (call, callback) => {
    try {
      const { adminId } = call.request;
      await checkAdmin(adminId);
      const [totalUsers, activeUsers, admins, publishers, students, totalWorkspaces, totalSnippets] = await Promise.all([
        User.countDocuments(), User.countDocuments({ isActive: true }), User.countDocuments({ role: 'admin' }),
        User.countDocuments({ role: 'publisher' }), User.countDocuments({ role: 'student' }),
        Workspace.countDocuments(), Snippet.countDocuments()
      ]);
      callback(null, { success: true, stats: { totalUsers, activeUsers, inactiveUsers: totalUsers - activeUsers, admins, publishers, students, totalWorkspaces, totalSnippets, cpuUsage: 45, memoryUsage: 62, diskUsage: 38 } });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  },
  GetDashboardStats: async (call, callback) => {
    try {
      const { adminId, period } = call.request;
      await checkAdmin(adminId);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const [newUsers, activeSessions, requestsToday] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: weekAgo } }),
        User.countDocuments({ lastLogin: { $gte: weekAgo } }),
        ApiHistory.countDocuments({ executedAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) } })
      ]);
      callback(null, { success: true, stats: { newUsers, activeSessions, requestsToday, avgResponseTime: 150, dailyStats: [], topUsers: [] } });
    } catch (error) { callback(null, { success: false, message: error.message }); }
  }
};

async function startServer() {
  try {
    const mongoUrl = `mongodb://${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.database}`; await mongoose.connect(mongoUrl, { user: config.mongodb.username, pass: config.mongodb.password });
    logger.info('Connected to MongoDB');
    await redisClient.connect();
    app.listen(PORT, '0.0.0.0', () => logger.info(`Admin HTTP running on ${PORT}`));
    const grpcServer = await grpcHelper.createServer(GRPC_PORT);
    grpcHelper.addServiceToServer(grpcServer, adminProto, 'AdminService', adminServiceImpl);
    await grpcHelper.startServer(grpcServer);
    logger.info(`Admin gRPC running on ${GRPC_PORT}`);
  } catch (error) {
    logger.error('Failed to start Admin Service:', error);
    process.exit(1);
  }
}

startServer();
process.on('SIGTERM', async () => { await mongoose.connection.close(); await redisClient.close(); process.exit(0); });
export default app;
